const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: ["Education", "Hostel", "Electronics", "Free"],
    },
    price: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    description: { type: String, trim: true, default: "" },

    images: [{ type: String }],

    whatsappQrCode: { type: String, default: null },

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


itemSchema.pre("save", function (next) {
  this.isOutOfStock = this.quantity <= 0;
  next();
});


itemSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Item", itemSchema);
