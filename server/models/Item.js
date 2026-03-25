const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Matches Item.getCategories() from the original class
    category: {
      type: String,
      required: true,
      enum: ["Education", "Hostel", "Electronics", "Free"],
    },
    price: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    description: { type: String, trim: true, default: "" },
    // Images stored as base64 strings or URLs (matches how Sell.jsx uploads)
    images: [{ type: String }],
    // WhatsApp QR code as base64 or URL
    whatsappQrCode: { type: String, default: null },
    // Seller reference
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerName: { type: String },
    isOutOfStock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-set isOutOfStock when quantity hits 0
itemSchema.pre("save", function (next) {
  this.isOutOfStock = this.quantity <= 0;
  next();
});

// Text index for search (used in Browse.jsx)
itemSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Item", itemSchema);
