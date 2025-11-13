import React, { useEffect, useState } from "react";

const Toast = ({ message, type = "success", onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(true);

    // Auto close after 2.5s
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for fade-out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transform transition-all duration-500 ease-in-out
        ${
          visible
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-5"
        }
        ${
          type === "success"
            ? "bg-green-500 shadow-green-200"
            : "bg-red-500 shadow-red-200"
        }`}
    >
      {type === "success" ? "✅ " : "❌ "}
      {message}
    </div>
  );
};

export default Toast;
