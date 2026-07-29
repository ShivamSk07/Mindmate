"use client";

import { useState, useEffect, DragEvent } from "react";
import { X, Plus, Trash2, CheckCircle2, Circle, ArrowLeftRight, Edit2, Check } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
}

interface KanbanBoardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KanbanBoard({ isOpen, onClose }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status: "todo" }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => [...prev, data.task]);
        setNewTaskTitle("");
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const saveTaskEdit = async (taskId: string) => {
    const title = editingTitle.trim();
    if (!title) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, title } : t))
        );
        setEditingTaskId(null);
      }
    } catch (error) {
      console.error("Failed to edit task title:", error);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDrop = (e: DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  if (!isOpen) return null;

  // Filter tasks into columns
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const renderColumn = (title: string, status: string, columnTasks: Task[], accentColor: string) => {
    return (
      <div
        className="flex-1 flex flex-col min-h-[150px] bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] rounded-2xl p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, status)}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#64748b]">{title}</h4>
          </div>
          <span className="text-[9px] font-bold text-[#64748b] bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 rounded-md">
            {columnTasks.length}
          </span>
        </div>

        {/* Task List */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-0.5 scrollbar-none">
          {columnTasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-[rgba(255,255,255,0.03)] rounded-xl py-6 text-center text-[10px] text-[#475569]">
              Drop tasks here
            </div>
          ) : (
            columnTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="group flex flex-col p-3 bg-[rgba(10,10,15,0.65)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] rounded-xl cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5 shadow-sm"
              >
                {editingTaskId === task.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-grow bg-[#0c0c12] border border-indigo-500/30 text-white rounded-lg p-1.5 text-xs outline-none"
                      onKeyDown={(e) => e.key === "Enter" && saveTaskEdit(task.id)}
                      autoFocus
                    />
                    <button
                      onClick={() => saveTaskEdit(task.id)}
                      className="p-1 text-green-400 hover:text-green-300 hover:bg-[rgba(255,255,255,0.03)] rounded"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className={`text-xs text-[#cbd5e1] leading-relaxed break-words ${status === "done" ? "line-through opacity-50" : ""}`}>
                      {task.title}
                    </p>

                    {/* Task Footer Actions */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.02)] opacity-30 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1.5">
                        {status !== "todo" && (
                          <button
                            onClick={() => updateTaskStatus(task.id, status === "done" ? "in_progress" : "todo")}
                            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.03)] rounded transition-colors text-[9px] uppercase tracking-wider font-bold"
                            title="Move back"
                          >
                            ←
                          </button>
                        )}
                        {status !== "done" && (
                          <button
                            onClick={() => updateTaskStatus(task.id, status === "todo" ? "in_progress" : "done")}
                            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.03)] rounded transition-colors text-[9px] uppercase tracking-wider font-bold"
                            title="Move forward"
                          >
                            →
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(task)}
                          className="p-1 text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.03)] rounded transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-[#64748b] hover:text-red-400 hover:bg-[rgba(255,255,255,0.03)] rounded transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Sliding Drawer Overlay */}
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sliding Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] bg-[rgba(8,8,12,0.92)] backdrop-blur-2xl border-l border-[rgba(255,255,255,0.08)] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col animate-slide-in relative">
        {/* Header */}
        <header className="px-5 py-4 border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Task Board</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Input Box to Add Task */}
        <form onSubmit={createTask} className="p-4 border-b border-[rgba(255,255,255,0.03)]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-grow input-premium rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/40"
            />
            <button
              type="submit"
              className="bg-white hover:bg-[#e4e4e7] text-black rounded-xl p-2.5 transition-all flex items-center justify-center shadow-md active:scale-95"
            >
              <Plus size={14} />
            </button>
          </div>
        </form>

        {/* Kanban Board Columns (Stacked vertically or in small grid/scroll) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
          {renderColumn("To Do", "todo", todoTasks, "#94a3b8")}
          {renderColumn("In Progress", "in_progress", inProgressTasks, "#38bdf8")}
          {renderColumn("Completed", "done", doneTasks, "#10b981")}
        </div>
      </div>
    </>
  );
}
