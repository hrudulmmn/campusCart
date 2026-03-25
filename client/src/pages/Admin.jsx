import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Admin = () => {
  const { user, blockUser, unblockUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [listedItems, setListedItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center py-10 rounded-3xl">
        <div className="max-w-md mx-auto px-4 w-full">
          <div className="bg-gray-50 rounded-xl shadow-lg p-8 text-center border border-gray-200">
            <div className="text-6xl mb-6 text-red-500">🚫</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
            <p className="text-gray-700 mb-8 text-lg">You need admin privileges to view this page.</p>
            <button onClick={() => (window.location.href = "/")} className="px-6 py-3 rounded-lg text-white bg-purple-600 hover:bg-purple-700">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch all data from API (replaces localStorage reads) ─────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, analyticsRes, itemsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/analytics"),
        api.get("/items"),
      ]);
      setAllUsers(usersRes.data.users);
      setAnalytics(analyticsRes.data.analytics);
      setListedItems(itemsRes.data.items);
    } catch (err) {
      console.error("Admin data fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Block / Unblock — calls API then refreshes ─────────────────────────────
  const handleBlockUser = async (userId) => {
    const result = await blockUser(userId);
    if (result.success) {
      setAllUsers((prev) =>
        prev.map((u) => u._id === userId ? { ...u, isBlocked: true } : u)
      );
    }
  };

  const handleUnblockUser = async (userId) => {
    const result = await unblockUser(userId);
    if (result.success) {
      setAllUsers((prev) =>
        prev.map((u) => u._id === userId ? { ...u, isBlocked: false } : u)
      );
    }
  };

  // ── Delete item — calls DELETE /api/admin/items/:id ───────────────────────
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/admin/items/${itemId}`);
      setListedItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete item");
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "moderation", label: "Moderation" },
    { id: "listed-items", label: "Listed Items" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your campus marketplace</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-2 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading dashboard...</div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && analytics && (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatCard title="Total Users" value={analytics.users.total} icon="👥" color="text-blue-600" />
                  <StatCard title="Buyers" value={analytics.users.buyers} icon="🛒" color="text-green-600" />
                  <StatCard title="Sellers" value={analytics.users.sellers} icon="🏷️" color="text-purple-600" />
                  <StatCard title="Total Items" value={analytics.inventory.total} icon="📦" color="text-orange-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inventory breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Inventory</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Active Items</span>
                        <span className="font-semibold text-green-600">{analytics.inventory.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Out of Stock</span>
                        <span className="font-semibold text-red-600">{analytics.inventory.outOfStock}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📁 Categories</h3>
                    <div className="space-y-2">
                      {analytics.categories.map((cat, idx) => (
                        <div key={cat.name} className="flex items-center justify-between group py-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "📁"}</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">{cat.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{cat.count} items</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Moderation Tab */}
            {activeTab === "moderation" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🛡️ User Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {allUsers.map((u) => (
                        <tr key={u._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{u.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">{u.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              u.isBlocked
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }`}>
                              {u.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {u.isBlocked ? (
                              <button
                                onClick={() => handleUnblockUser(u._id)}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 font-medium"
                              >
                                Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(u._id)}
                                disabled={user._id === u._id}
                                className={`text-red-600 dark:text-red-400 hover:text-red-800 font-medium ${
                                  user._id === u._id ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                Block
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Listed Items Tab */}
            {activeTab === "listed-items" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📝 All Listed Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        {["Item Name", "Category", "Price", "Quantity", "Seller", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {listedItems.map((item) => (
                        <tr key={item._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{item.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">₹{item.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{item.sellerName || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
