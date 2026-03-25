import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: "📚",
      title: "Academic Resources",
      description:
        "Buy, sell, or share books, notes, lab records, and study materials",
      bgColor: "bg-sky-100",
    },
    {
      icon: "🏠",
      title: "Hostel Essentials",
      description:
        "Find everything you need for your hostel life - from mugs to bedsheets",
      bgColor: "bg-emerald-100",
    },
    {
      icon: "💻",
      title: "Electronics",
      description:
        "Calculators, chargers, and other electronic devices for students",
      bgColor: "bg-amber-100",
    },
    {
      icon: "🆓",
      title: "Free Resources",
      description: "Download free PDFs, question papers, and study materials",
      bgColor: "bg-purple-100",
    },
  ];

  const stats = [
    { number: "1000+", label: "Active Users", bgColor: "bg-blue-200" },
    { number: "500+", label: "Items Listed", bgColor: "bg-teal-200" },
    { number: "50+", label: "Daily Transactions", bgColor: "bg-orange-200" },
    { number: "100%", label: "Student Focused", bgColor: "bg-rose-200" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-white transition-colors duration-300 overflow-x-hidden">
      {/* Hero Section */}
      <section
        className="relative text-white py-20 md:py-28 lg:py-36 rounded-3xl shadow-xl overflow-hidden mb-10 mx-4"
        style={{
          backgroundImage: `url("/Screenshot 2025-09-15 194720.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/70"></div>{" "}
        {/* Overlay */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-md leading-tight">
            Discover, Share, Thrive
            <br />
            Your Campus Marketplace Awaits
          </h1>
          <p className="text-lg md:text-xl mb-10 text-white max-w-4xl mx-auto drop-shadow-sm">
            CampusCart is your go-to platform for effortlessly buying, selling,
            and freely sharing academic resources and hostel essentials within
            your university community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="text-lg font-semibold px-8 py-4 bg-white text-indigo-800 rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Get Started
                </Link>
                <Link
                  to="/browse"
                  className="text-lg font-semibold px-8 py-4 border-2 border-white text-white rounded-full shadow-lg hover:bg-white hover:text-indigo-800 transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Browse Items
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/browse"
                  className="text-lg font-semibold px-8 py-4 bg-white text-indigo-800 rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Browse Items
                </Link>
                {user.role === "buyer" && (
                  <Link
                    to="/sell"
                    className="text-lg font-semibold px-8 py-4 border-2 border-white text-white rounded-full shadow-lg hover:bg-white hover:text-indigo-800 transform hover:scale-105 transition-all duration-300 ease-in-out"
                  >
                    Start Selling
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50 rounded-3xl my-10 mx-auto px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">
              Everything You Need for Campus Life
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From textbooks to hostel essentials, CampusCart has got you
              covered with a wide range of student resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`text-center p-8 rounded-3xl ${feature.bgColor} shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 ease-in-out border border-transparent hover:border-blue-300`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-blue-500 to-indigo-700 text-white rounded-3xl my-10 mx-auto px-4 sm:px-6 lg:px-8 shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 drop-shadow-md">
            CampusCart by the Numbers
          </h2>
          <p className="text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Join thousands of students who trust CampusCart for their resource
            needs.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center p-8 rounded-3xl ${stat.bgColor} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out border border-transparent hover:border-blue-300`}
              >
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-white to-orange-50 rounded-3xl my-10 mx-auto px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Simple steps to get started with CampusCart
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step, index) => (
              <div
                key={index}
                className={`text-center p-8 rounded-3xl ${
                  ["bg-blue-100", "bg-purple-100", "bg-green-100"][index]
                } shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 ease-in-out border border-transparent hover:border-gray-300`}
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {step === 1
                    ? "Register & Choose Role"
                    : step === 2
                    ? "Browse or List Items"
                    : "Connect & Transact"}
                </h3>
                <p className="text-gray-600">
                  {step === 1
                    ? "Sign up as a buyer, seller, or both. Start exploring or listing items immediately."
                    : step === 2
                    ? "Find what you need or upload your own items with descriptions and images."
                    : "Use WhatsApp to connect with sellers, negotiate prices, and complete transactions."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-indigo-800 text-white rounded-3xl shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 drop-shadow-md">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 text-white max-w-2xl mx-auto leading-relaxed">
            Join the CampusCart community today and discover a better way to
            manage your campus resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="text-lg font-semibold px-8 py-4 bg-white text-indigo-800 rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Create Account
                </Link>
                <Link
                  to="/browse"
                  className="text-lg font-semibold px-8 py-4 border-2 border-white text-white rounded-full shadow-lg hover:bg-white hover:text-indigo-800 transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Explore Items
                </Link>
              </>
            ) : (
              <Link
                to="/browse"
                className="text-lg font-semibold px-8 py-4 bg-white text-indigo-800 rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                Start Browsing
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
