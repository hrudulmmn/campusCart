const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { protect } = require("../middleware/auth");
const Payment = require("../models/reciept");
const router = express.Router();

// Initialise Razorpay with your key_id and key_secret from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
// Creates a Razorpay order and returns the order_id + key_id to the client
router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees (we convert to paise below)

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `cc_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        userName: req.user.name,
        userEmail: req.user.email,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID, // sent to frontend to open the checkout
    });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
});

// POST /api/payment/verify
// Verifies the payment signature after Razorpay calls the handler
router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature mismatch",
      });
    }

    // Save payment to DB
    const payment = await Payment.create({
      user: req.user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: req.body.amount, // add this
      status: "success",
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment_id: payment.paymentId,
    });

  } catch (err) {
    console.error("Razorpay verify error:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

module.exports = router;
