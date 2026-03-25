const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const discussionSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, required: true },
    content: { type: String, default: "" },
    // Image stored as base64 string (matches Discussion.jsx reader.readAsDataURL)
    image: { type: String, default: null },
    // File attachment metadata
    file: {
      name: { type: String },
      url: { type: String },
    },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [replySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discussion", discussionSchema);
