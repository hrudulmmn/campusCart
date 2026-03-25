import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Sell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    category: "Education",
    price: "",
    quantity: "1",
    description: "",
    whatsapp: "",
    phone: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [whatsappQrCode, setWhatsappQrCode] = useState(null);

  const categories = ["Education", "Hostel", "Electronics", "Free"];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
        <div className="max-w-md mx-auto px-4 w-full">
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <div className="text-6xl mb-6 text-purple-500">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Login Required</h2>
            <p className="text-gray-600 mb-8 text-lg">You need to be logged in to sell items.</p>
            <button onClick={() => navigate("/")} className="px-6 py-3 rounded-lg text-white bg-purple-600 hover:bg-purple-700">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "buyer") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
        <div className="max-w-md mx-auto px-4 w-full">
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <div className="text-6xl mb-6 text-red-500">🚫</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Seller Account Required</h2>
            <p className="text-gray-600 mb-8 text-lg">You need a seller account to list items.</p>
            <button onClick={() => navigate("/browse")} className="px-6 py-3 rounded-lg text-white bg-purple-600 hover:bg-purple-700">
              Browse Items Instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert File to base64 string for DB storage
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
  };

  const handleWhatsappQrCodeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setWhatsappQrCode(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeWhatsappQrCode = () => setWhatsappQrCode(null);

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.description || !formData.price) {
        throw new Error("Please fill in all required fields");
      }
      if (parseFloat(formData.price) < 0) {
        throw new Error("Price cannot be negative");
      }

      // Convert image files to base64 for MongoDB storage
      const imageBase64s = await Promise.all(
        selectedFiles
          .filter((f) => f.type.startsWith("image/"))
          .map(fileToBase64)
      );

      // POST to /api/items — replaces localStorage.setItem("listedItems", ...)
      await api.post("/items", {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        description: formData.description,
        images: imageBase64s,
        whatsappQrCode: whatsappQrCode || null,
      });

      alert("Item listed successfully!");
      navigate("/browse");
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 md:py-12 rounded-3xl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            List Your Item
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Fill out the form below to list your item for sale or share within the campus community.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-black rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Advanced Mathematics Textbook"
              />
            </div>

            {/* Category + Price + Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-black rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-black rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0 for free"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border border-black rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-black rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Describe your item in detail..."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Upload Images (Max 4, up to 10MB each)
              </label>
              <div className="border-2 border-dashed border-black rounded-lg p-6 text-center bg-gray-50">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="text-5xl mb-3 text-gray-400">📁</div>
                  <p className="text-lg font-medium text-purple-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-700">PNG, JPG, PDF, DOCX, TXT up to 10MB</p>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6 bg-gray-100 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Selected Files:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative bg-white rounded-lg shadow-sm overflow-hidden border border-black p-2">
                        {file.type.startsWith("image/") ? (
                          <img src={previewImages[index]} alt={file.name} className="w-full h-24 object-cover rounded-md mb-2" />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 rounded-md flex items-center justify-center mb-2">
                            <span className="text-3xl">📄</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-0 right-0 m-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 z-10"
                        >
                          ×
                        </button>
                        <p className="text-xs text-gray-800 mt-1 truncate font-medium">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp QR Code */}
            <div>
              <label htmlFor="whatsapp-qr-upload" className="block text-sm font-medium text-gray-800 mb-2">
                WhatsApp QR Code Image (Optional)
              </label>
              <div className="border-2 border-dashed border-black rounded-lg p-6 text-center bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWhatsappQrCodeUpload}
                  className="hidden"
                  id="whatsapp-qr-upload"
                />
                <label htmlFor="whatsapp-qr-upload" className="cursor-pointer block">
                  {whatsappQrCode ? (
                    <img src={whatsappQrCode} alt="WhatsApp QR Code" className="max-h-40 h-auto mx-auto mb-3 rounded-lg shadow-md border border-black" />
                  ) : (
                    <div className="text-5xl mb-3 text-blue-700 bg-gray-100 rounded-lg p-4">📷</div>
                  )}
                  <p className="text-lg font-medium text-purple-700 mb-1">Click to upload WhatsApp QR code</p>
                  <p className="text-sm text-gray-700">PNG, JPG up to 5MB</p>
                </label>
                {whatsappQrCode && (
                  <button type="button" onClick={removeWhatsappQrCode} className="mt-4 px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-600 bg-transparent hover:bg-red-50">
                    Remove QR Code
                  </button>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-8 border-t border-black mt-8">
              <button type="button" onClick={() => navigate("/browse")} className="px-6 py-3 border border-black text-base font-medium rounded-lg text-gray-800 bg-white hover:bg-gray-100">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 text-lg font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 shadow-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? "Listing Item..." : "List Item"}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-10 bg-white rounded-xl p-8 border border-black">
          <h3 className="text-xl font-bold text-purple-700 mb-4">💡 Tips for Better Listings</h3>
          <ul className="text-gray-900 text-base space-y-2 list-disc pl-5">
            <li>Use clear, descriptive titles that accurately reflect your item.</li>
            <li>Include high-quality images from multiple angles.</li>
            <li>Provide detailed descriptions including condition and features.</li>
            <li>Set competitive prices that reflect the item's value.</li>
            <li>Keep your contact information updated.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sell;
