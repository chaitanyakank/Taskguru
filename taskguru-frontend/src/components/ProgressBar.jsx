import React from "react";

const ProgressBar = ({ progress }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 mt-2 overflow-hidden">
      <div
        className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 h-3 rounded-full transition-all duration-700 ease-in-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
