import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// Dynamically injects the Razorpay checkout script so we don't have to add it
// to index.html — it loads on-demand when the user clicks "Proceed to Checkout"
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Cart = () => {
  const { cart, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  // Track payment result for the success/failure banner
  const [paymentStatus, setPaymentStatus] = useState(null); // null | "success" | "failed"
  const [paymentId, setPaymentId] = useState(null);

  const finalTotal = parseFloat((total * 1.18).toFixed(2));

  // ── Main checkout handler ─────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    if (!user) {
      alert("Please log in to proceed with payment.");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);

    // 1. Load Razorpay SDK
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert("Failed to load Razorpay. Check your internet connection.");
      setIsProcessing(false);
      return;
    }

    // 2. Create an order on our Express server
    let orderData;
    try {
      const res = await api.post("/payment/create-order", { amount: finalTotal });
      orderData = res.data;
    } catch (err) {
      alert(err.response?.data?.message || "Could not initiate payment. Try again.");
      setIsProcessing(false);
      return;
    }

    // 3. Open the Razorpay checkout modal
    const options = {
      key: orderData.key_id,          // rzp_test_... from your .env
      amount: orderData.amount,       // in paise
      currency: orderData.currency,
      name: "CampusCart",
      description: `Payment for ${cart.length} item(s)`,
      image: "/favicon.ico",           // optional logo
      order_id: orderData.order_id,

      // ── Handler called after Razorpay captures the payment ────────────────
      handler: async (response) => {
        // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        try {
          const verifyRes = await api.post("/payment/verify",{
      ...response,
      amount: finalTotal,
    });
          if (verifyRes.data.success) {
            setPaymentId(verifyRes.data.payment_id);
            setPaymentStatus("success");
            await clearCart(); // wipe the cart in MongoDB
          } else {
            setPaymentStatus("failed");
          }
        } catch {
          setPaymentStatus("failed");
        }
        setIsProcessing(false);
      },

      // ── Pre-filled customer info ──────────────────────────────────────────
      prefill: {
        name: user.name || "",
        email: user.email || "",
        contact: user.phone || "",
      },

      // ── Theming ───────────────────────────────────────────────────────────
      theme: { color: "#7c3aed" }, // purple-600

      // ── Called if user closes the modal without paying ────────────────────
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);

    // Handles network/card errors from Razorpay's own error event
    rzp.on("payment.failed", (response) => {
      console.error("Razorpay payment failed:", response.error);
      setPaymentStatus("failed");
      setIsProcessing(false);
    });

    rzp.open();
  };

  const handleContinueShopping = () => navigate("/browse");

  // ── Payment success screen ────────────────────────────────────────────────
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Payment Successful!</h1>
            <p className="text-gray-600 mb-2">Your order has been placed.</p>
            {paymentId && (
              <p className="text-xs text-gray-400 font-mono mb-6 break-all">
                Payment ID: {paymentId}
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/browse")}
                className="w-full py-3 rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => setPaymentStatus(null)}
                className="w-full py-3 rounded-lg text-gray-700 font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
            <p className="text-gray-600">Your cart is empty</p>
          </div>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items yet. Start shopping to find great deals!
            </p>
            <button onClick={handleContinueShopping} className="btn-primary text-lg px-8 py-3">
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main cart view ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
          <p className="text-gray-600">Review and manage your selected items</p>
        </div>

        {/* Payment failed banner */}
        {paymentStatus === "failed" && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg flex items-center justify-between">
            <span>⚠️ Payment failed or was cancelled. Please try again.</span>
            <button onClick={() => setPaymentStatus(null)} className="text-red-500 hover:text-red-700 text-xl font-bold">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Cart Items ({cart.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">
                              {item.category === "Education" && "📚"}
                              {item.category === "Hostel" && "🏠"}
                              {item.category === "Electronics" && "💻"}
                              {item.category === "Free" && "🆓"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {item.category}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">₹{item.price}</p>
                            <p className="text-sm text-gray-500">per item</p>
                          </div>
                        </div>

                        {/* Quantity + Remove */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <label className="text-sm font-medium text-gray-700">Quantity:</label>
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40"
                              >
                                −
                              </button>
                              <span className="px-3 py-1 text-gray-900 font-medium min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-semibold text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Actions */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button onClick={clearCart} className="text-red-600 hover:text-red-800 font-medium">
                    Clear Cart
                  </button>
                  <button onClick={handleContinueShopping} className="btn-secondary">
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cart.length} items)</span>
                  <span className="text-gray-900">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="text-gray-900">₹{(total * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-base">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">₹{finalTotal}</span>
                  </div>
                </div>
              </div>

              {/* ── Razorpay Checkout Button ── */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold text-base transition-all duration-200 shadow-md mb-3 ${
                  isProcessing
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 active:scale-[0.98]"
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Opening Razorpay...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{finalTotal}</span>
                  </>
                )}
              </button>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure payment via Razorpay</span>
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">💡 Shopping Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Contact sellers via WhatsApp for questions</li>
                  <li>• Free items can be downloaded directly</li>
                  <li>• Check item descriptions carefully</li>
                  <li>• Verify seller contact information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* You might also like */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">You might also like</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {cart.slice(0, 4).map((item, index) => (
                <div key={`suggestion-${index}`} className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-3xl mb-2">
                    {item.category === "Education" && "📚"}
                    {item.category === "Hostel" && "🏠"}
                    {item.category === "Electronics" && "💻"}
                    {item.category === "Free" && "🆓"}
                  </div>
                  <p className="text-sm text-gray-600">More {item.category} items</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
