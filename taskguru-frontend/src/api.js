import axios from "axios";

// 👇 Backend FastAPI URL (your backend port)
const API_BASE_URL = "http://127.0.0.1:8003";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
