import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import Dashboard from "./pages/Dashboard";
import EditTask from "./EditTask";
import Tasks from "./Tasks";

// ProtectedRoute wrapper
function ProtectedRoute({ children }) {
  const userEmail = localStorage.getItem("userEmail");
  return userEmail ? children : <Navigate to="/Login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/Login" />} />

        <Route path="/Login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:taskId/edit" element={<EditTask />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
