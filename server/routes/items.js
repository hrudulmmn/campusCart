const express = require("express");
const Item = require("../models/Item");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// GET /api/items — public, used by Browse.jsx
// Supports: ?category=Education&search=notes&sort=name|price-low|price-high|newest
router.get("/", async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const query = {};

    if (category && category !== "All") query.category = category;
    if (search) query.$text = { $search: search };

    const sortMap = {
      name: { name: 1 },
      "price-low": { price: 1 },
      "price-high": { price: -1 },
      newest: { createdAt: -1 },
    };
    const sortQuery = sortMap[sort] || { name: 1 };

    const items = await Item.find(query).sort(sortQuery);
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/items/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("sellerId", "name email phone whatsapp");
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/items — replaces localStorage.setItem("listedItems", ...) in Sell.jsx
// Only sellers and admins can list items
router.post("/", protect, authorize("seller", "admin"), async (req, res) => {
  try {
    const {
      name, category, price, quantity, description,
      images, whatsappQrCode,
    } = req.body;

    const item = await Item.create({
      name,
      category,
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity) || 1,
      description,
      images: images || [],
      whatsappQrCode: whatsappQrCode || null,
      sellerId: req.user._id,
      sellerName: req.user.name,
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/items/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const isOwner = item.sellerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/items/:id — used by Admin.jsx handleDeleteItem
router.delete("/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const isOwner = item.sellerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await item.deleteOne();
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
