import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import { Link } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  // ------------------- STATES -------------------
  const [forceRender, setForceRender] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [shareEmail, setShareEmail] = useState("");
  const [sharingTask, setSharingTask] = useState(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingTask, setDeletingTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState({});
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // ------------------- FILTER & SORT -------------------
  const filteredTasks = tasks
    .filter((t) => {
      const matchesStatus =
        filter === "open" ? !t.done : filter === "completed" ? t.done : true;
      const matchesSearch = t.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const order = { high: 3, normal: 2, low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      if (sortBy === "dueDate") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // ------------------- FETCH FUNCTIONS -------------------
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const resp = await axios.get(
        `http://127.0.0.1:8003/tasks/list?email=${encodeURIComponent(
          userEmail
        )}&_=${Date.now()}`
      );

      console.log("🧾 FETCHED TASKS FROM BACKEND:", resp.data);

      if (resp.data && resp.data.tasks && resp.data.tasks.length > 0) {
        setTasks(resp.data.tasks);
      } else {
        console.warn("⚠️ Backend returned empty tasks list");
      }
    } catch (err) {
      console.error("❌ Failed to load tasks:", err);
      setToast({ message: "Failed to load tasks.", type: "error" });
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const resp = await axios.get(
        `http://127.0.0.1:8003/auth/notifications?email=${userEmail}`
      );
      setNotifications(resp.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // ------------------- MAIN USEEFFECT -------------------
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);

    const fetchUserData = async () => {
      try {
        const resp = await axios.get(
          `http://127.0.0.1:8003/auth/user-info?email=${userEmail}`
        );
        setUserData(resp.data || { email: userEmail });
      } catch {
        setUserData({ email: userEmail });
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchUserData();
      fetchTasks();
      fetchNotifications();

      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setTasksLoading(false);
    }

    return () => clearTimeout(timer);
  }, [userEmail]);

  // keep editTitle in sync when editingTask opens (so old flow using editTitle works)
  useEffect(() => {
    if (editingTask) {
      setEditTitle(editingTask.title || "");
    }
  }, [editingTask]);

  // ------------------- REFRESH TASKS (Smooth + No Blink) -------------------
  const refreshTasks = async () => {
    const scrollY = window.scrollY; // ✅ Remember where the user is
    const currentTasks = [...tasks]; // ✅ Keep current tasks in memory

    try {
      const resp = await axios.get(
        `http://127.0.0.1:8003/tasks/list?email=${encodeURIComponent(userEmail)}&_=${Date.now()}`
      );
      const newTasks = resp.data.tasks || [];

      // ✅ Update only changed tasks (so React doesn't blink)
      setTasks((prev) =>
        prev.map((t) => newTasks.find((nt) => nt.id === t.id) || t)
      );

      // ✅ Add any new tasks that were not there before
      newTasks.forEach((nt) => {
        if (!currentTasks.some((t) => t.id === nt.id)) {
          currentTasks.push(nt);
        }
      });

      // ✅ Set the final list (merged version)
      setTasks(currentTasks);

      // ✅ Keep scroll position exactly same
      setTimeout(() => window.scrollTo(0, scrollY), 0);
    } catch (err) {
      console.error("Silent refresh failed:", err);
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("userEmail");
    setShowLogoutModal(false);
    navigate("/Login");
  };

  const addTask = async (e) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      setToast({ message: "Please enter a task title.", type: "error" });
      return;
    }

    setAdding(true);

    try {
      const payload = {
        title: newTitle.trim(),
        description: "",
        due_date: newDueDate || "",
        priority: newPriority,
        user_email: userEmail,
      };

      // 🟢 Step 1: Instantly show task
      const tempTask = {
        id: Date.now(),
        task_id: Date.now(),
        title: payload.title,
        due_date: payload.due_date,
        priority: payload.priority,
        done: false,
        subtasks: [],
      };
      setTasks((prev) => [tempTask, ...prev]);

      // 🟢 Step 2: Send to backend
      const response = await axios.post(
        "http://127.0.0.1:8003/tasks/create",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Task created backend response:", response.data);

      if (response.status === 200) {
        setToast({ message: "✅ Task created successfully!", type: "success" });
        // 🔥 Step 3: Backend confirmed? Append real one instead of refresh
        if (response.data && response.data.task) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === tempTask.id ? response.data.task : t
            )
          );
        }
      }
    } catch (err) {
      console.error("❌ Failed to create task:", err);
      setToast({ message: "Failed to create task.", type: "error" });
    } finally {
      setAdding(false);
      setNewTitle("");
      setNewDueDate("");
      setNewPriority("normal");
    }
  };

  // ✅ FIXED: markComplete function with immediate checkbox update
  const markComplete = async (taskId) => {
    // Get the current task state before updating
    const currentTask = tasks.find(t => t.id === taskId || t.task_id === taskId);
    if (!currentTask) return;

    const newDoneState = !currentTask.done;

    // Create a completely new array to force React to re-render
    const updatedTasks = tasks.map(task =>
      task.id === taskId || task.task_id === taskId
        ? { ...task, done: newDoneState }
        : task
    );

    // Set the state with the new array
    setTasks(updatedTasks);

    try {
      await axios.put(
        `http://127.0.0.1:8003/tasks/update/${taskId}`,
        { done: newDoneState },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Failed to update task done state:", err);
      // Revert on failure
      const revertedTasks = tasks.map(task =>
        task.id === taskId || task.task_id === taskId
          ? { ...task, done: !newDoneState }
          : task
      );
      setTasks(revertedTasks);
      setToast({ message: "Failed to update task.", type: "error" });
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://127.0.0.1:8003/tasks/delete/${deletingTask.task_id || deletingTask.id}`
      );
      setToast({ message: "Task deleted", type: "success" });
      setDeletingTask(null);
      await refreshTasks();
      setForceRender((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to delete task:", err);
      setToast({ message: "Failed to delete task.", type: "error" });
    }
  };

  const confirmEdit = async () => {
    if (!editTitle.trim()) {
      setToast({ message: "Title cannot be empty.", type: "error" });
      return;
    }
    try {
      await axios.put(
        `http://127.0.0.1:8003/tasks/update/${editingTask.task_id || editingTask.id}`,
        { title: editTitle, due_date: editingTask.due_date || "" }
      );
      setToast({ message: "Task updated!", type: "success" });
      setEditingTask(null);
      await refreshTasks();
      setForceRender((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to update task:", err);
      setToast({ message: "Failed to update task.", type: "error" });
    }
  };

  // Add Subtask
  const addSubtask = async (taskId) => {
    const title = newSubtask[taskId]?.trim();
    if (!title) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId || task.task_id === taskId
          ? {
              ...task,
              subtasks: [
                ...(task.subtasks || []),
                {
                  id: Date.now(),
                  title,
                  done: false,
                },
              ],
            }
          : task
      )
    );
    setForceRender((prev) => prev + 1);

    try {
      await axios.post("http://127.0.0.1:8003/tasks/subtask/add", {
        title,
        parent_task_id: taskId,
      });
      setToast({ message: "Subtask added!", type: "success" });
      setNewSubtask((prev) => ({ ...prev, [taskId]: "" }));
      await refreshTasks();
      setForceRender((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to add subtask:", err);
      setToast({ message: "Failed to add subtask.", type: "error" });
    }
  };

  // ✅ FIXED: completeSubtask function with immediate checkbox update
  const completeSubtask = async (taskId, subtaskId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Get current state
    const currentTasks = [...tasks];
    const taskIndex = currentTasks.findIndex(t => t.id === taskId || t.task_id === taskId);
    if (taskIndex === -1) return;

    const subtaskIndex = currentTasks[taskIndex].subtasks?.findIndex(s => s.id === subtaskId);
    if (subtaskIndex === -1) return;

    const newDoneState = !currentTasks[taskIndex].subtasks[subtaskIndex].done;

    // Create new array with updated subtask
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      subtasks: updatedTasks[taskIndex].subtasks.map((sub, index) =>
        index === subtaskIndex ? { ...sub, done: newDoneState } : sub
      )
    };

    // Set the state with the new array
    setTasks(updatedTasks);

    try {
      await axios.put(
        `http://127.0.0.1:8003/tasks/subtask/complete/${taskId}/${subtaskId}`
      );
    } catch (err) {
      console.error("Failed to update subtask:", err);
      // Revert on failure
      setTasks(currentTasks);
      setToast({ message: "Failed to update subtask.", type: "error" });
    }
  };

  // Delete Subtask
  const deleteSubtask = async (taskId, subtaskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId || task.task_id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((sub) => sub.id !== subtaskId),
            }
          : task
      )
    );
    setForceRender((prev) => prev + 1);

    try {
      await axios.delete(
        `http://127.0.0.1:8003/tasks/subtask/delete/${taskId}/${subtaskId}`
      );
      await refreshTasks();
      setForceRender((prev) => prev + 1);
      setToast({ message: "Subtask deleted successfully!", type: "success" });
    } catch (err) {
      console.error("Failed to delete subtask:", err);
      setToast({ message: "Failed to delete subtask.", type: "error" });
    }
  };

  // ------------------- SHARE TASK -------------------
  const sendShareInvite = async (taskId) => {
    if (!shareEmail.trim()) {
      setToast({ message: "Please enter an email.", type: "error" });
      return;
    }
    try {
      const response = await axios.post(
        `http://127.0.0.1:8003/tasks/share_task/${taskId}`,
        { shared_with: shareEmail }
      );
      setToast({ message: response.data.message, type: "success" });
      setShareEmail("");
      setSharingTask(null);
      setForceRender((prev) => prev + 1);
    } catch (err) {
      console.error("Share failed:", err);
      setToast({
        message: err.response?.data?.detail || "Failed to send invite.",
        type: "error",
      });
    }
  };

  // ------------------- APPROVE ACCESS -------------------
  const approveAccess = async (taskId, userEmailToApprove) => {
    try {
      const approverEmail = localStorage.getItem("userEmail");
      const response = await axios.post(
        `http://127.0.0.1:8003/tasks/approve_access/${taskId}`,
        {
          approver_email: approverEmail,
          user_email: userEmailToApprove,
        }
      );
      setToast({ message: response.data.message, type: "success" });
      await refreshTasks();
      setForceRender((prev) => prev + 1);
    } catch (err) {
      console.error("Approval failed:", err);
      setToast({
        message: err.response?.data?.detail || "Failed to approve access.",
        type: "error",
      });
    }
  };

  // ------------------- SUBTASK UPDATE -------------------
  const updateSubtask = async () => {
    if (!editingSubtask) return;
    try {
      await axios.put(
        `http://127.0.0.1:8003/tasks/subtask/update/${editingSubtask.taskId}/${editingSubtask.id}`,
        {
          title: editingSubtask.title,
          due_date: editingSubtask.due_date || "",
          done: editingSubtask.done || false,
        }
      );
      setToast({ message: "Subtask updated successfully!", type: "success" });
      setEditingSubtask(null);
      refreshTasks();
    } catch (err) {
      console.error("Failed to update subtask:", err);
      setToast({ message: "Failed to update subtask.", type: "error" });
    }
  };

  // ------------------- RENDER -------------------
  if (loading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pink-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const displayName = userEmail ? userEmail.split("@")[0] : "Guest";

  return (
    <div
      className={`flex flex-col items-center justify-start min-h-screen bg-pink-50 text-gray-800 transition-opacity duration-700 pt-12 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* HEADER */}
      <div className="w-full max-w-4xl px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-pink-700">
              👋 Welcome back, {displayName}!
            </h1>
            <p className="text-gray-600">Your task overview</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("userEmail");
              navigate("/Login");
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Task Controls */}
      <div className="w-full max-w-4xl px-4 mt-4">
        {/* Filter Buttons */}
        <div className="flex justify-center gap-3 mb-4">
          {["all", "open", "completed"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1 rounded-md border ${
                filter === type
                  ? "bg-pink-500 text-white"
                  : "bg-white text-pink-600 border-pink-400 hover:bg-pink-100"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Add Task Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask(e);
          }}
          className="flex flex-col md:flex-row gap-3 mb-4"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task title..."
            className="flex-1 border border-pink-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="border border-pink-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            className="border border-pink-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            className={`px-4 py-2 rounded-md text-white ${
              adding ? "bg-pink-300" : "bg-pink-500 hover:bg-pink-600"
            }`}
          >
            {adding ? "Adding..." : "Add Task"}
          </button>
        </form>

        {/* Task List */}
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks yet. Add your first one!</p>
        ) : (
          <ul className="space-y-3">
            {filteredTasks.map((t) => {
              const id = t.task_id || t.id;

              return (
                <li
                  key={`${id}-${t.done}`} // ✅ Add done state to key to force re-render
                  className="flex flex-col p-3 border rounded-md bg-gray-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* ✅ FIXED CHECKBOX - Now updates immediately */}
                      <input
                        type="checkbox"
                        checked={!!t.done}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markComplete(id);
                        }}
                        className="transform scale-105 transition-all duration-200 ease-in-out"
                      />

                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExpandedTaskId(expandedTaskId === id ? null : id);
                        }}
                        className={`font-medium text-pink-600 hover:underline cursor-pointer ${
                          t.done ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSharingTask(t);
                        }}
                        className="text-sm px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                      >
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingTask(t);
                        }}
                        className="text-sm px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedTaskId === id && (
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mt-3 animate-fadeIn">
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>📅 Due Date:</strong>{" "}
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : "Not set"}
                      </p>
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>⭐ Priority:</strong>{" "}
                        <span
                          className={`${
                            t.priority === "high"
                              ? "text-red-500"
                              : t.priority === "normal"
                              ? "text-yellow-500"
                              : "text-green-500"
                          } font-semibold`}
                        >
                          {t.priority || "Normal"}
                        </span>
                      </p>

                      <div className="flex gap-3 mb-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingTask(t);
                          }}
                          className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded-md text-sm"
                        >
                          ✏️ Edit Task
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setNewSubtask((prev) => ({ ...prev, [id]: "" }));
                          }}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
                        >
                          ➕ Add Subtask
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="New subtask title..."
                          value={newSubtask[id] || ""}
                          onChange={(e) =>
                            setNewSubtask((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          className="flex-1 border border-pink-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addSubtask(id);
                          }}
                          className="bg-pink-400 hover:bg-pink-500 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Add
                        </button>
                      </div>

                      {t.subtasks && t.subtasks.length > 0 && (() => {
                        const completed = t.subtasks.filter((s) => s.done).length;
                        const total = t.subtasks.length;
                        const percentage = (completed / total) * 100;
                        return (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{completed}/{total} done</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full shadow-inner transition-all duration-500 ease-out ${
                                  percentage === 100
                                    ? "bg-green-500 animate-pulse"
                                    : percentage >= 50
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {t.subtasks && t.subtasks.length > 0 ? (
                        <ul className="ml-3 space-y-2">
                          {t.subtasks.map((s) => (
                            <li
                              key={`${s.id}-${s.done}`} // ✅ Add done state to key to force re-render
                              className="flex items-center justify-between text-sm border-b pb-1"
                            >
                              <div className="flex items-center gap-2">
                                {/* ✅ FIXED SUBTASK CHECKBOX - Now updates immediately */}
                                <input
                                  type="checkbox"
                                  checked={!!s.done}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onChange={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    completeSubtask(id, s.id, e);
                                  }}
                                  className="accent-pink-500"
                                />
                                <span
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingSubtask({ ...s, taskId: id });
                                  }}
                                  className={`cursor-pointer ${
                                    s.done
                                      ? "line-through text-gray-400"
                                      : "text-pink-600 hover:underline"
                                  }`}
                                >
                                  {s.title}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteSubtask(id, s.id);
                                }}
                                className="text-red-500 text-xs hover:text-red-700"
                              >
                                ✖
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No subtasks yet.</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-40">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6 text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Task</h3>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />

            <input
              type="date"
              value={editingTask.due_date || ""}
              onChange={(e) =>
                setEditingTask({ ...editingTask, due_date: e.target.value })
              }
              className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />

            {editingTask.subtasks && editingTask.subtasks.length > 0 && (
              <div className="mt-4 text-left">
                <h4 className="font-medium text-gray-700 mb-2">Subtasks</h4>
                <ul className="space-y-2">
                  {editingTask.subtasks.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex justify-between items-center border-b pb-1 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!sub.done}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const isChecked = e.target.checked;
                            completeSubtask(
                              editingTask.id || editingTask.task_id,
                              sub.id,
                              e
                            );
                            setEditingTask((prev) => {
                              const updatedSubtasks = prev.subtasks.map((s) =>
                                s.id === sub.id ? { ...s, done: isChecked } : s
                              );
                              return { ...prev, subtasks: updatedSubtasks };
                            });
                          }}
                          className="accent-pink-500"
                        />
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingSubtask({
                              ...sub,
                              taskId: editingTask.id || editingTask.task_id,
                            });
                          }}
                          className="cursor-pointer text-pink-600 hover:underline"
                        >
                          {sub.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteSubtask(
                            editingTask.id || editingTask.task_id,
                            sub.id
                          );
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✖
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={confirmEdit}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subtask Modal */}
      {editingSubtask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6 text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Subtask</h3>

            <input
              type="text"
              value={editingSubtask.title || ""}
              onChange={(e) => setEditingSubtask({ ...editingSubtask, title: e.target.value })}
              className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />

            <input
              type="date"
              value={editingSubtask.due_date || ""}
              onChange={(e) => setEditingSubtask({ ...editingSubtask, due_date: e.target.value })}
              className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />

            <div className="flex items-center justify-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={!!editingSubtask.done}
                onChange={(e) => setEditingSubtask({ ...editingSubtask, done: e.target.checked })}
                className="accent-pink-500"
              />
              <label className="text-gray-700">Mark as Done</label>
            </div>

            <div className="flex justify-center gap-3">
              <button onClick={updateSubtask} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md">Save</button>
              <button onClick={() => setEditingSubtask(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg w-80 p-6 text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Delete "{deletingTask.title}"?</h3>
            <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md">Delete</button>
              <button onClick={() => setDeletingTask(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg w-80 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Share "{sharingTask.title}"</h3>
            <input type="email" placeholder="Enter collaborator email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="w-full border border-pink-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400" />
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => sendShareInvite(sharingTask.id)} className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">Send Invite</button>
              <button onClick={() => setSharingTask(null)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;