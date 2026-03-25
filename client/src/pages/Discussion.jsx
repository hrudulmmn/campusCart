import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Discussion = () => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDiscussion, setNewDiscussion] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");

  const fileInputRef = useRef(null);
  const fileAttachmentInputRef = useRef(null);
  const discussionsEndRef = useRef(null);

  const scrollToBottom = () =>
    discussionsEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Fetch discussions from MongoDB ────────────────────────────────────────
  const fetchDiscussions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterCategory !== "all") params.category = filterCategory;
      const res = await api.get("/discussions", { params });
      setDiscussions(res.data.discussions);
    } catch (err) {
      console.error("Failed to fetch discussions:", err);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [searchTerm, filterCategory]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  // ── Image / file handlers (unchanged from original) ───────────────────────
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileAttachment = (event) => {
    const file = event.target.files[0];
    if (file) setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileAttachmentInputRef.current) fileAttachmentInputRef.current.value = "";
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Post new discussion — replaces setDiscussions([discussion, ...]) ───────
  const handleSubmitDiscussion = async (e) => {
    e.preventDefault();
    if (!newDiscussion.trim() && !selectedImage) return;

    try {
      // File URL: in a real deployment, upload to S3/Cloudinary.
      // For now we send the filename as a placeholder URL.
      const filePayload = selectedFile
        ? { name: selectedFile.name, url: URL.createObjectURL(selectedFile) }
        : null;

      const res = await api.post("/discussions", {
        content: newDiscussion.trim(),
        image: imagePreview || null,   // base64 string
        file: filePayload,
      });

      // Prepend the new discussion (matches original behaviour)
      setDiscussions((prev) => [res.data.discussion, ...prev]);
      setNewDiscussion("");
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post discussion");
    }
  };

  // ── Reply — replaces local setDiscussions map ─────────────────────────────
  const handleReply = async (discussionId) => {
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/discussions/${discussionId}/reply`, {
        content: replyText,
      });
      setDiscussions((prev) =>
        prev.map((d) => (d._id === discussionId ? res.data.discussion : d))
      );
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post reply");
    }
  };

  // ── Like toggle — replaces local likes increment ──────────────────────────
  const toggleLike = async (discussionId, replyId = null) => {
    try {
      let res;
      if (replyId) {
        res = await api.put(`/discussions/${discussionId}/reply/${replyId}/like`);
      } else {
        res = await api.put(`/discussions/${discussionId}/like`);
      }
      setDiscussions((prev) =>
        prev.map((d) => (d._id === discussionId ? res.data.discussion : d))
      );
    } catch (err) {
      // Not logged in — fallback to silent fail
      console.error("Like failed:", err.response?.data?.message);
    }
  };

  const openImageModal = (src) => { setModalImageSrc(src); setIsImageModalOpen(true); };
  const closeImageModal = () => { setIsImageModalOpen(false); setModalImageSrc(""); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 py-10 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">Campus Discussions</h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Connect with fellow students, share insights, ask questions, and engage in meaningful conversations.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Topics</option>
              <option value="academic">Academic</option>
              <option value="housing">Housing</option>
              <option value="projects">Projects</option>
            </select>
          </div>
        </div>

        {/* New Discussion Form */}
        {user ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Start a Discussion</h3>
            <form onSubmit={handleSubmitDiscussion} className="space-y-4">
              <textarea
                value={newDiscussion}
                onChange={(e) => setNewDiscussion(e.target.value)}
                placeholder="Share your thoughts, ask questions, or start a conversation..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-gray-500"
                rows="4"
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-gray-200" />
                  <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">×</button>
                </div>
              )}

              {/* File attachment preview */}
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xl">📄</span>
                  <span className="text-sm text-gray-700 flex-1">{selectedFile.name}</span>
                  <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-700 text-xl">✕</button>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Image upload */}
                <label className="cursor-pointer p-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 text-lg" title="Upload image">
                  📷
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {/* File upload */}
                <label className="cursor-pointer p-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 text-lg" title="Attach file">
                  📎
                  <input ref={fileAttachmentInputRef} type="file" onChange={handleFileAttachment} className="hidden" />
                </label>

                <button
                  type="submit"
                  disabled={!newDiscussion.trim() && !selectedImage && !selectedFile}
                  className="ml-auto px-6 py-3 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Post Discussion
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10 border border-gray-200 text-center text-gray-600">
            Please <strong>log in</strong> to post discussions.
          </div>
        )}

        {/* Discussions List */}
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading discussions...</div>
        ) : (
          <div className="space-y-6">
            {discussions.map((discussion) => (
              <div key={discussion._id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xl font-bold">
                      {discussion.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{discussion.author}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(discussion.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{discussion.content}</p>

                  {discussion.image && (
                    <div className="mt-5">
                      <img
                        src={discussion.image}
                        alt="Discussion"
                        className="max-w-xs max-h-48 object-cover rounded-lg shadow cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openImageModal(discussion.image)}
                      />
                    </div>
                  )}

                  {discussion.file && (
                    <div className="mt-5 flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-2xl text-green-600">📄</span>
                      <a href={discussion.file.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
                        {discussion.file.name}
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => toggleLike(discussion._id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors font-medium"
                    >
                      <span className="text-xl">👍</span>
                      <span>{discussion.likes} Likes</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === discussion._id ? null : discussion._id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors font-medium"
                    >
                      <span className="text-xl">💬</span>
                      <span>{discussion.replies.length} Replies</span>
                    </button>
                  </div>
                </div>

                {/* Reply Form */}
                {replyingTo === discussion._id && (
                  <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-gray-500"
                      rows="3"
                    />
                    <div className="flex gap-3 mt-3 justify-end">
                      <button onClick={() => setReplyingTo(null)} className="px-5 py-2 border border-gray-300 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
                      <button
                        onClick={() => handleReply(discussion._id)}
                        disabled={!replyText.trim()}
                        className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {discussion.replies.length > 0 && (
                  <div className="bg-gray-50 p-6 border-t border-gray-200">
                    <h5 className="font-bold text-gray-800 mb-4">Replies ({discussion.replies.length})</h5>
                    <div className="space-y-4">
                      {discussion.replies.map((reply) => (
                        <div key={reply._id} className="flex items-start gap-3">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">
                            {reply.author.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-800">{reply.author}</span>
                                <span className="text-sm text-gray-500">{new Date(reply.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-gray-700 text-sm">{reply.content}</p>
                              <button
                                onClick={() => toggleLike(discussion._id, reply._id)}
                                className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors mt-3"
                              >
                                <span className="text-base">👍</span>
                                <span className="text-sm">{reply.likes} Likes</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div ref={discussionsEndRef} />

        {/* Image Modal */}
        {isImageModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={closeImageModal}>
            <div className="relative bg-white rounded-xl p-6 max-w-3xl max-h-[90vh] w-full overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeImageModal} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
              <img src={modalImageSrc} alt="Full size" className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg shadow" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discussion;
