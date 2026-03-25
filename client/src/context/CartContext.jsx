import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);       // array of cart item objects
  const [cartMeta, setCartMeta] = useState({ total: 0, tax: 0, finalTotal: 0 });
  const [loading, setLoading] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  // Normalise the cart document from the API into the shape Cart.jsx expects:
  // item.id (used in Cart.jsx key/remove), item.quantity, item.price, etc.
  const normaliseCart = (cartDoc) => {
    const items = (cartDoc.items || []).map((i) => ({
      ...i,
      // Cart.jsx uses item.id — map itemId._id or itemId string
      id: i.itemId?._id || i.itemId || i.id,
    }));
    setCart(items);
    setCartMeta({
      total: cartDoc.total || 0,
      tax: cartDoc.tax || 0,
      finalTotal: cartDoc.finalTotal || 0,
    });
  };

  // ─── Fetch cart from server when user logs in ─────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/cart");
      normaliseCart(res.data.cart);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Logged out — clear cart state
      setCart([]);
      setCartMeta({ total: 0, tax: 0, finalTotal: 0 });
    }
  }, [user, fetchCart]);

  // ─── Cart actions ─────────────────────────────────────────────────────────

  // addToCart(item) — item must have ._id (MongoDB ObjectId from Browse.jsx)
  const addToCart = async (item) => {
    if (!user) {
      alert("Please log in to add items to your cart.");
      return;
    }
    try {
      const res = await api.post("/cart/add", {
        itemId: item._id || item.id,
        quantity: 1,
      });
      normaliseCart(res.data.cart);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add item to cart");
    }
  };

  // removeFromCart(itemId) — itemId is the MongoDB _id string
  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/cart/remove/${itemId}`);
      normaliseCart(res.data.cart);
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  // updateQuantity(itemId, quantity)
  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/update/${itemId}`, { quantity });
      normaliseCart(res.data.cart);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  // clearCart()
  const clearCart = async () => {
    try {
      const res = await api.delete("/cart/clear");
      normaliseCart(res.data.cart);
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  const getCartItemCount = () =>
    cart.reduce((total, item) => total + item.quantity, 0);

  // total exposed to Cart.jsx (subtotal before tax, matching original behaviour)
  const total = cartMeta.total;

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        cartMeta,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
