// taskguru-frontend/src/components/TaskCard.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, AlertTriangle, XCircle, Users } from 'lucide-react'; 
// Assuming lucide-react or similar icons library

// Maps priority integer to Tailwind color class
const PRIORITY_COLOR_MAP = {
    1: 'border-tg-danger bg-tg-danger', // P1 - Danger (Red)
    2: 'border-tg-warning bg-tg-warning', // P2 - Warning (Amber)
    3: 'border-tg-primary bg-tg-primary', // P3 - Primary (Indigo)
};

const STATUS_ICON_MAP = {
    1: <XCircle className="w-4 h-4 text-tg-danger" />,
    2: <AlertTriangle className="w-4 h-4 text-tg-warning" />,
    3: <Clock className="w-4 h-4 text-tg-primary" />,
};

// Placeholder Toast component (requires real toast implementation in production)
const showToast = (message, type = 'info') => console.log(`Toast (${type}): ${message}`);

function TaskCard({ task, onUpdate }) {
    const [isCompleteOptimistic, setIsCompleteOptimistic] = useState(task.is_complete);
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic classes derived from the task priority for styling consistency
    const priorityClass = PRIORITY_COLOR_MAP[task.priority] || PRIORITY_COLOR_MAP[3]; 
    const statusIcon = STATUS_ICON_MAP[task.priority] || STATUS_ICON_MAP[3];
    const completionColor = isCompleteOptimistic ? 'bg-tg-success' : 'bg-tg-surface';

    const handleToggleComplete = async (e) => {
        e.stopPropagation();
        if (isLoading) return;

        // 1. Optimistic Update (Instant UI feedback)
        const previousState = isCompleteOptimistic;
        setIsCompleteOptimistic(!previousState);
        setIsLoading(true);

        try {
            // 2. API Call to FastAPI PATCH endpoint
            // NOTE: axios.patch is relative, ensure your axios instance base URL is set to your FastAPI server (e.g. http://127.0.0.1:8000)
            await axios.patch(`/tasks/${task.id}`, { is_complete: !previousState });

            // 3. Success: Show subtle feedback
            showToast(`Task "${task.title}" marked ${!previousState ? 'complete' : 'incomplete'}!`, 'success');
            onUpdate(task.id, !previousState); // Update main list for sorting/filtering
        } catch (error) {
            // 4. Error: Rollback & show error toast (Worst-case scenario)
            setIsCompleteOptimistic(previousState);
            showToast('Failed to update task. Try again.', 'danger');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            // Applying combined styling based on your specs (shadow, rounded, border-l-4)
            className={`
                bg-white p-4 my-2 border-l-4 rounded-2xl shadow-card 
                hover:shadow-lg transition-all duration-150 ease-out-quint 
                cursor-pointer relative
                ${priorityClass}
            `}
            onClick={() => console.log('Open right-rail detail')}
        >
            <div className="flex items-center justify-between">
                
                {/* Checkbox and Title - Focus on clarity and hierarchy */}
                <div className="flex items-center flex-grow">
                    <button 
                        onClick={handleToggleComplete} 
                        aria-label={`Toggle completion for ${task.title}`}
                        className={`
                            w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 transition-all 
                            focus:outline-none focus:ring-4 focus:ring-tg-primary/50
                            ${isCompleteOptimistic ? completionColor + ' border-tg-success' : 'border-tg-text-muted'}
                        `}
                    >
                        {isCompleteOptimistic && <CheckCircle className="w-4 h-4 text-white mx-auto transition-opacity" />}
                        {isLoading && <div className="animate-spin w-4 h-4 rounded-full border-2 border-t-2 border-tg-primary mx-auto"></div>}
                    </button>
                    
                    <h3 className={`text-tg-text-primary text-base font-medium truncate ${isCompleteOptimistic ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                    </h3>
                </div>

                {/* Priority and Due Date - Subtle but informative */}
                <div className="flex items-center text-sm text-tg-text-muted space-x-3 ml-4 flex-shrink-0">
                    <span className={`
                        inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                        ${priorityClass.replace('border-', 'text-').replace('bg-', 'bg-opacity-10 ')}
                    `}>
                        {statusIcon}
                        <span className="ml-1">P{task.priority}</span>
                    </span>
                    <span className="flex items-center text-sm">
                        Due: {task.due_date} 
                    </span>
                </div>
            </div>
        </div>
    );
}

export default TaskCard;