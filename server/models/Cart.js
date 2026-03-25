const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    // Denormalized fields so cart renders without extra fetches
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String },
    description: { type: String },
    images: [{ type: String }],
    sellerName: { type: String },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
    },
    items: [cartItemSchema],
    // Computed totals — kept in sync by pre-save hook
    total: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Mirrors Cart.js #updateTotals() logic
cartSchema.pre("save", function (next) {
  this.total = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  this.tax = this.total * 0.18;
  this.finalTotal = this.total + this.tax;
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
