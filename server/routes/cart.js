const express = require("express");
const Cart = require("../models/Cart");
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// GET /api/cart — replaces Cart.#loadFromStorage()
router.get("/", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.json({ success: true, cart: { items: [], total: 0, tax: 0, finalTotal: 0 } });
    }
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/add — replaces Cart.addItem()
router.post("/add", async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    if (item.isOutOfStock) {
      return res.status(400).json({ success: false, message: "Item is out of stock" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

    const existing = cart.items.find((i) => i.itemId.toString() === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        itemId: item._id,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        images: item.images,
        sellerName: item.sellerName,
        quantity,
      });
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cart/update/:itemId — replaces Cart.updateQuantity()
router.put("/update/:itemId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    if (quantity <= 0) {
      // Mirrors Cart.updateQuantity behavior: qty<=0 removes the item
      cart.items = cart.items.filter((i) => i.itemId.toString() !== req.params.itemId);
    } else {
      const item = cart.items.find((i) => i.itemId.toString() === req.params.itemId);
      if (!item) return res.status(404).json({ success: false, message: "Item not in cart" });
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/remove/:itemId — replaces Cart.removeItem()
router.delete("/remove/:itemId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.itemId.toString() !== req.params.itemId);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/clear — replaces Cart.clearCart()
router.delete("/clear", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) { cart.items = []; await cart.save(); }
    res.json({ success: true, cart: { items: [], total: 0, tax: 0, finalTotal: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
