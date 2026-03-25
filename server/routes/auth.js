const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

const userResponse = (user) => ({
  _id: user._id,
  id: user._id, // keep id alias for compatibility with original code using user.id
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  whatsapp: user.whatsapp,
  isBlocked: user.isBlocked,
  createdAt: user.createdAt,
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, whatsapp } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
     const userRole = email === "admin@campuscart.com" ? "admin" : role || "buyer";
    const user = await User.create({ name, email, password, role:userRole, phone, whatsapp });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: userResponse(user),
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account blocked. Contact admin." });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: userResponse(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: userResponse(req.user) });
});

// PUT /api/auth/me
router.put("/me", protect, async (req, res) => {
  try {
    const { name, phone, whatsapp } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, whatsapp },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: userResponse(user) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
