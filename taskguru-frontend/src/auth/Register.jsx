import { useState, useEffect } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true); // 👈 keep this with other hooks

  const navigate = useNavigate();

  // ✅ Always keep hooks (useEffect, useState, etc.) before any "return"
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      navigate("/dashboard");
    } else {
      setCheckingLogin(false);
    }
  }, [navigate]);

  // ✅ Early loading screen (after all hooks are defined)
  if (checkingLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pink-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setToast({ message: "Please fill in all fields.", type: "error" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setToast({ message: "Please enter a valid email address.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setToast({
        message: "Password must be at least 6 characters long.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8003/auth/register", {
        email,
        password,
      });

      setToast({ message: "Registration successful!", type: "success" });
      setEmail("");
      setPassword("");
      navigate("/Login"); // ✅ redirect to Login after success
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 400) {
        setToast({
          message: "User already exists. Try logging in instead.",
          type: "error",
        });
      } else {
        setToast({
          message: "Registration failed. Try again later.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-4xl font-bold text-pink-700 mb-2">TaskGuru</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Register</h2>

      <form
        onSubmit={handleRegister}
        className="bg-white shadow-lg rounded-2xl px-8 pt-6 pb-8 w-80"
      >
        <label className="block text-gray-600 font-medium mb-2">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />

        <label className="block text-gray-600 font-medium mb-2">Password</label>
        <div className="relative mb-6">
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

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-lg shadow-md transition duration-200 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Processing..." : "Register"}
        </button>

        <p className="mt-4 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <a href="/Login" className="text-pink-600 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;
