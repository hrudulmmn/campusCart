const express = require("express");
const User = require("../models/User");
const Item = require("../models/Item");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(protect, authorize("admin"));

// GET /api/admin/users — replaces localStorage.getItem("campusCartUsers")
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/analytics — replaces computed analytics in Admin.jsx useEffect
router.get("/analytics", async (req, res) => {
  try {
    const [allUsers, allItems] = await Promise.all([
      User.find(),
      Item.find(),
    ]);

    const categoryCounts = ["Education", "Hostel", "Electronics", "Free"].map((name) => {
      const count = allItems.filter((i) => i.category === name).length;
      return {
        name,
        count,
        percentage: allItems.length > 0 ? (count / allItems.length) * 100 : 0,
      };
    });

    res.json({
      success: true,
      analytics: {
        users: {
          total: allUsers.length,
          buyers: allUsers.filter((u) => u.role === "buyer").length,
          sellers: allUsers.filter((u) => u.role === "seller").length,
          admins: allUsers.filter((u) => u.role === "admin").length,
        },
        inventory: {
          total: allItems.length,
          active: allItems.filter((i) => !i.isOutOfStock).length,
          outOfStock: allItems.filter((i) => i.isOutOfStock).length,
        },
        categories: categoryCounts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/block — replaces blockUser() in AuthContext
router.put("/users/:id/block", async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true, blockReason: reason || "Blocked by admin" },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/unblock — replaces unblockUser() in AuthContext
router.put("/users/:id/unblock", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false, blockReason: null },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/items/:id — replaces handleDeleteItem in Admin.jsx
router.delete("/items/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
