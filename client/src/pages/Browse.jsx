import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import api from "../services/api";

const Browse = () => {
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [isLoading, setIsLoading] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState("");

  const categories = ["All", "Education", "Hostel", "Electronics", "Free"];

  // ── Fetch items from MongoDB instead of localStorage ──────────────────────
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/items");
        setItems(res.data.items);
        console.log("Backend response:", res.data);
      } catch (err) {
        console.error("Failed to fetch items:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // ── Filter + sort (identical logic to original) ───────────────────────────
  useEffect(() => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":        return a.name.localeCompare(b.name);
        case "price-low":   return a.price - b.price;
        case "price-high":  return b.price - a.price;
        case "newest":      return new Date(b.createdAt) - new Date(a.createdAt);
        default:            return 0;
      }
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory, sortBy]);

  const handleAddToCart = (item) => {
    addToCart(item);  // CartContext now calls POST /api/cart/add
    alert(`${item.name} added to cart!`);
  };

  const handleWhatsAppContact = (item) => {
    if (item.whatsappQrCode) {
      setCurrentQrCode(item.whatsappQrCode);
      setIsQrModalOpen(true);
    } else {
      alert("No WhatsApp QR code available for this seller.");
    }
  };

  const handleDownload = (item) => {
    if (item.category === "Free") alert(`Downloading ${item.name}...`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 md:py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Discover Campus Resources
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Find, buy, sell, or share academic materials, hostel essentials, and
            more within your university community.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-10 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-8">
          <p className="text-gray-700 text-lg font-medium">
            Showing{" "}
            <span className="font-bold text-purple-600">{filteredItems.length}</span>{" "}
            of <span className="font-bold text-purple-600">{items.length}</span> items
          </p>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500 text-xl">Loading items...</div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="h-full w-full object-contain rounded-md"
                    />
                  ) : (
                    <div className="text-4xl">
                      {item.category === "Education" && "📚"}
                      {item.category === "Hostel" && "🏠"}
                      {item.category === "Electronics" && "💻"}
                      {item.category === "Free" && "🆓"}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                      {item.category}
                    </span>
                    {item.isOutOfStock && (
                      <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">By: {item.sellerName || "N/A"}</p>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-purple-700">
                      {item.price === 0 ? "Free" : `₹${item.price}`}
                    </span>
                    <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                  </div>

                  <div className="space-y-2">
                    {item.category === "Free" ? (
                      <button
                        onClick={() => handleDownload(item)}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg text-black bg-green-600 hover:bg-green-700"
                      >
                        📥 Download Free
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={item.isOutOfStock}
                        className={`w-full px-4 py-2 text-sm font-medium rounded-lg text-white ${
                          item.isOutOfStock
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        🛒 Add to Cart
                      </button>
                    )}
                    <button
                      onClick={() => handleWhatsAppContact(item)}
                      className="w-full px-4 py-2 border border-purple-600 text-sm font-medium rounded-lg text-purple-600 bg-transparent hover:bg-purple-50"
                    >
                      💬 Contact Seller
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4 text-gray-400">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No items found</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters.
            </p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
              className="px-6 py-3 text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12 bg-gray-100 rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-purple-600">{items.length}</div>
              <div className="text-sm text-gray-700 mt-1">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-green-600">
                {items.filter((i) => i.category === "Free").length}
              </div>
              <div className="text-sm text-gray-700 mt-1">Free Resources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-indigo-600">
                {items.filter((i) => i.category === "Education").length}
              </div>
              <div className="text-sm text-gray-700 mt-1">Education Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-orange-600">
                {items.filter((i) => i.category === "Electronics").length}
              </div>
              <div className="text-sm text-gray-700 mt-1">Electronics</div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Scan for WhatsApp</h3>
            <img
              src={currentQrCode}
              alt="WhatsApp QR Code"
              className="max-w-full h-auto mx-auto rounded-md border border-gray-200"
            />
            <p className="text-center text-gray-600 text-sm mt-4">Scan this QR code to chat on WhatsApp.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Browse;
