import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "./api";

function EditTask() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [task, setTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    async function fetchTask() {
      try {
        console.log("🔄 Fetching task:", taskId);
        const res = await api.get(`/tasks/${taskId}`);
        console.log("✅ Task loaded:", res.data);
        setTask(res.data);
      } catch (err) {
        console.error("❌ Error loading task:", err);
      }
    }
    fetchTask();
  }, [taskId]);

  const handleSave = async () => {
    if (!task) return;
    
    setSaveStatus("Saving...");
    console.log("🔄 Starting task update...");
    
    try {
      // Try BOTH endpoint formats to see which one works
      let res;
      try {
        // First try: the format your backend expects
        res = await api.put(`/tasks/update/${taskId}`, {
          title: task.title,
          due_date: task.due_date,
          description: task.description,
          priority: task.priority,
          subtasks: task.subtasks || []
        });
        console.log("✅ Used /tasks/update/ endpoint");
      } catch (firstError) {
        console.log("⚠️ First endpoint failed, trying alternative...");
        // Second try: alternative endpoint format
        res = await api.put(`/tasks/${taskId}`, {
          title: task.title,
          due_date: task.due_date,
          description: task.description,
          priority: task.priority,
          subtasks: task.subtasks || []
        });
        console.log("✅ Used /tasks/ endpoint");
      }
      
      console.log("✅ Save successful! Response:", res.data);
      setSaveStatus("✅ All changes saved successfully!");
      
      setTimeout(() => {
        navigate("/tasks", { state: { updatedTask: res.data } });
      }, 1500);
      
    } catch (err) {
      console.error("❌ Error saving task:", err);
      console.error("❌ Error details:", err.response?.data);
      setSaveStatus("❌ Failed to save changes");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // Better subtask toggle function
  const toggleSubtask = (index) => {
    if (!task || !task.subtasks) return;
    
    const updatedSubtasks = task.subtasks.map((subtask, i) => 
      i === index 
        ? { ...subtask, done: !subtask.done }
        : subtask
    );
    
    console.log(`🔄 Toggled subtask ${index} from ${task.subtasks[index]?.done} to ${!task.subtasks[index]?.done}`);
    setTask({ ...task, subtasks: updatedSubtasks });
  };

  if (!task) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center py-10">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4">Edit Task</h2>

        {saveStatus && (
          <div className={`mb-4 p-3 rounded ${
            saveStatus.includes("✅") 
              ? "bg-green-100 text-green-800 border border-green-300" 
              : "bg-red-100 text-red-800 border border-red-300"
          }`}>
            {saveStatus}
          </div>
        )}

        {/* Title */}
        <label className="block text-gray-600 text-sm mb-1">Title</label>
        <input
          type="text"
          value={task.title || ""}
          onChange={(e) => {
            console.log("📝 Title changing to:", e.target.value);
            setTask({ ...task, title: e.target.value });
          }}
          className="border border-pink-300 w-full p-2 rounded mb-4"
        />

        {/* Due date */}
        <label className="block text-gray-600 text-sm mb-1">Due Date</label>
        <input
          type="datetime-local"
          value={task.due_date || ""}
          onChange={(e) => setTask({ ...task, due_date: e.target.value })}
          className="border border-pink-300 w-full p-2 rounded mb-4"
        />

        {/* Description */}
        <label className="block text-gray-600 text-sm mb-1">Description</label>
        <textarea
          value={task.description || ""}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          className="border border-pink-300 w-full p-2 rounded mb-4"
          rows="3"
        />

        {/* Subtasks */}
        <h3 className="text-lg font-medium mt-4 mb-2">Subtasks</h3>
        <ul className="mb-2">
          {task.subtasks?.map((s, i) => (
            <li key={i} className="flex items-center mb-2 gap-2">
              {/* Fixed checkbox with proper state management */}
              <input
                type="checkbox"
                checked={s.done || false}
                onChange={() => toggleSubtask(i)}
                className="w-4 h-4 cursor-pointer"
              />
              
              <input
                type="text"
                value={s.title}
                onChange={(e) => {
                  const updated = [...task.subtasks];
                  updated[i].title = e.target.value;
                  setTask({ ...task, subtasks: updated });
                }}
                className={`border border-gray-300 p-1 rounded w-full ${
                  s.done ? 'line-through text-gray-500 bg-gray-100' : ''
                }`}
              />
              
              <button
                onClick={() => {
                  const updated = task.subtasks.filter((_, idx) => idx !== i);
                  setTask({ ...task, subtasks: updated });
                }}
                className="ml-2 text-red-500 font-bold hover:text-red-700"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {/* Add new subtask */}
        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Add new subtask"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (!newSubtask.trim()) return;
                const updated = [
                  ...(task.subtasks || []),
                  { 
                    id: `subtask-${Date.now()}`,
                    title: newSubtask, 
                    done: false 
                  },
                ];
                setTask({ ...task, subtasks: updated });
                setNewSubtask("");
              }
            }}
          />
          <button
            onClick={() => {
              if (!newSubtask.trim()) return;
              const updated = [
                ...(task.subtasks || []),
                { 
                  id: `subtask-${Date.now()}`,
                  title: newSubtask, 
                  done: false 
                },
              ];
              setTask({ ...task, subtasks: updated });
              setNewSubtask("");
            }}
            className="ml-2 bg-pink-400 text-white px-3 rounded hover:bg-pink-500"
          >
            +
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors w-full"
        >
          Save Changes
        </button>

        {/* Debug info */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong>
          <div>Task ID: {taskId}</div>
          <div>Title: "{task.title}"</div>
          <div>Due: {task.due_date || "Not set"}</div>
          <div>Subtasks: {task.subtasks?.length || 0}</div>
          <div>Completed: {task.subtasks?.filter(s => s.done).length || 0}</div>
        </div>
      </div>
    </div>
  );
}

export default EditTask;