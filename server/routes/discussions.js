const express = require("express");
const Discussion = require("../models/Discussion");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/discussions — replaces localStorage.getItem("campusCartDiscussions")
// ?search=term&category=academic|housing|projects
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    let discussions = await Discussion.find().sort({ createdAt: -1 });

    // Mirrors Discussion.jsx filteredDiscussions logic
    if (search) {
      const s = search.toLowerCase();
      discussions = discussions.filter(
        (d) =>
          d.content.toLowerCase().includes(s) ||
          d.author.toLowerCase().includes(s)
      );
    }
    if (category && category !== "all") {
      discussions = discussions.filter((d) => {
        if (category === "academic") return d.content.toLowerCase().includes("notes");
        if (category === "housing") return d.content.toLowerCase().includes("roommate");
        if (category === "projects") return !!d.image;
        return true;
      });
    }

    res.json({ success: true, discussions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/discussions — replaces setDiscussions([discussion, ...discussions])
router.post("/", protect, async (req, res) => {
  try {
    const { content, image, file } = req.body;
    if (!content?.trim() && !image) {
      return res.status(400).json({ success: false, message: "Content or image required" });
    }

    const discussion = await Discussion.create({
      authorId: req.user._id,
      author: req.user.name,
      content: content?.trim() || "",
      image: image || null,
      file: file || null,
    });

    res.status(201).json({ success: true, discussion });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/discussions/:id/reply — replaces handleReply()
router.post("/:id/reply", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Reply content required" });
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: "Discussion not found" });

    discussion.replies.push({
      authorId: req.user._id,
      author: req.user.name,
      content: content.trim(),
    });

    await discussion.save();
    res.json({ success: true, discussion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/discussions/:id/like — replaces toggleLike()
router.put("/:id/like", protect, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: "Discussion not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = discussion.likedBy.map(String).includes(userId);

    if (alreadyLiked) {
      discussion.likedBy = discussion.likedBy.filter((id) => id.toString() !== userId);
      discussion.likes = Math.max(0, discussion.likes - 1);
    } else {
      discussion.likedBy.push(req.user._id);
      discussion.likes += 1;
    }

    await discussion.save();
    res.json({ success: true, discussion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/discussions/:id/reply/:replyId/like
router.put("/:id/reply/:replyId/like", protect, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: "Discussion not found" });

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ success: false, message: "Reply not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = reply.likedBy.map(String).includes(userId);

    if (alreadyLiked) {
      reply.likedBy = reply.likedBy.filter((id) => id.toString() !== userId);
      reply.likes = Math.max(0, reply.likes - 1);
    } else {
      reply.likedBy.push(req.user._id);
      reply.likes += 1;
    }

    await discussion.save();
    res.json({ success: true, discussion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
