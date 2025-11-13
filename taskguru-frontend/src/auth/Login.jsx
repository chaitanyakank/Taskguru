import React, { useState, useEffect } from "react"; // 👈 add useEffect
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ If already logged in, redirect to dashboard automatically
const [checkingLogin, setCheckingLogin] = useState(true);

useEffect(() => {
  const userEmail = localStorage.getItem("userEmail");
  if (userEmail) {
    navigate("/dashboard");
  } else {
    setCheckingLogin(false);
  }
}, [navigate]);

// If still checking, show spinner
if (checkingLogin) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-pink-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
    </div>
  );
}


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
        setToast({ message: "Please fill in all fields.", type: "error" });
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setToast({ message: "Please enter a valid email.", type: "error" });
        return;
    }
    setLoading(true);
    // Simulate Login success (replace this with backend call later)  
    setTimeout(() => {
        localStorage.setItem("userEmail", email); // ✅ Save Login session
        setToast({ message: "Logged in successfully!", type: "success" });
        setLoading(false);
        setEmail("");
        setPassword("");
        navigate("/dashboard"); // ✅ Redirect to dashboard
        }, 1000);
    };

  // ✅ Handle password reset request
  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!resetEmail) {
      setToast({ message: "Please enter your email.", type: "error" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setToast({ message: "Please enter a valid email address.", type: "error" });
      return;
    }

    setResetLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8003/auth/reset-password", {
        email: resetEmail,
      });
      setToast({ message: "Password reset email sent!", type: "success" });
      setShowResetModal(false);
      setResetEmail("");
    } catch (error) {
      console.error(error);
      setToast({
        message:
          error.response?.data?.detail || "Failed to send reset email.",
        type: "error",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50">
      {/* ✅ Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-4xl font-bold text-pink-700 mb-2">TaskGuru</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Login</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl px-8 pt-6 pb-8 w-80"
      >
        {/* Email Field */}
        <label className="block text-gray-600 font-medium mb-2">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />

        {/* Password Field */}
        <label className="block text-gray-600 font-medium mb-2">Password</label>
        <div className="relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-pink-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute inset-y-0 right-3 flex items-center transition duration-200 ${
              showPassword
                ? "text-pink-500"
                : "text-gray-500 hover:text-pink-500"
            }`}
          >
            {showPassword ? (
              // 👁️ Eye open icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            ) : (
              // 🚫 Eye slash icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.938 12C3.212 16.057 7.002 19 11.48 19c1.64 0 3.188-.4 4.5-1.108M21 21l-18-18"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ✅ Forgot Password link */}
        <p
          onClick={() => setShowResetModal(true)}
          className="text-right text-sm text-pink-600 hover:underline cursor-pointer mb-4"
        >
          Forgot password?
        </p>

        {/* ✅ Remember Me */}
        <div className="flex items-center mb-5">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="mr-2 accent-pink-500"
          />
          <label htmlFor="remember" className="text-gray-600 text-sm">
            Remember me
          </label>
        </div>

        {/* ✅ Login Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-lg shadow-md transition duration-200 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Processing..." : "Login"}
        </button>

        <p className="mt-4 text-center text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link to="/register" className="text-pink-600 hover:underline">
            Register
          </Link>
        </p>
      </form>

      {/* ✅ Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg w-80 p-6 relative">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Reset Password
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Enter your registered email and we’ll send you a reset link.
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1 rounded-md text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className={`px-3 py-1 rounded-md text-white font-medium ${
                  resetLoading
                    ? "bg-pink-300 cursor-not-allowed"
                    : "bg-pink-500 hover:bg-pink-600"
                }`}
              >
                {resetLoading ? "Sending..." : "Send Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
