import { useEffect, useState } from "react";
import ProgressBar from "./components/ProgressBar";
import api from "./api"; // this connects to your backend
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch tasks from backend
  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await api.get("/tasks/all"); // adjust if backend route differs
        console.log("Fetched tasks:", res.data);

        setTasks(res.data);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    if (location.state?.updatedTask) {
      const updated = location.state.updatedTask;
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    }
  }, [location.state]);
  
  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center py-10">
      <h1 className="text-4xl font-bold text-pink-700 mb-6">Your Tasks</h1>

      <div className="w-full max-w-lg space-y-4">
        {tasks.map((task) => {
          const completedSubtasks =
            task.subtasks?.filter((s) => s.done).length || 0;
          const totalSubtasks = task.subtasks?.length || 0;
          const progress =
            totalSubtasks > 0
              ? (completedSubtasks / totalSubtasks) * 100
              : 0;

          return (
            <div
              key={task.task_id}
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <Link to={`/tasks/${task.task_id}/edit`}>
              console.log("Link rendered for:", task.task_id);

  <h3 className="text-lg font-semibold text-pink-600 cursor-pointer hover:underline">
    {task.title}
  </h3>
</Link>


              <p className="text-gray-600 text-sm mb-2">
                {task.description}
              </p>
              {console.log("Progress value:", progress)}



              {/* Progress bar with fade-in animation */}
              <div className="animate-fadeIn">
                <ProgressBar progress={progress} />
              </div>

              {/* Progress info + percentage */}
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-600">
                  {completedSubtasks}/{totalSubtasks} subtasks completed
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tasks;
