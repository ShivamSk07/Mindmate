"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  Circle,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FolderKanban
} from "lucide-react";
import type { Project, ProjectTask, TaskStatus, TaskPriority } from "@/types";

interface ProjectWorkspaceDrawerProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject?: (updatedProject: Project) => void;
}

export function ProjectWorkspaceDrawer({
  project: initialProject,
  isOpen,
  onClose,
  onUpdateProject,
}: ProjectWorkspaceDrawerProps) {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhaseId, setNewTaskPhaseId] = useState<string | null>(null);

  // Sync state if initialProject changes
  if (initialProject && project?.id !== initialProject.id) {
    setProject(initialProject);
  }

  if (!isOpen || !project) return null;

  // Recalculate overall project progress percentage
  const calculateProgress = (currProject: Project): number => {
    let totalTasks = 0;
    let completedTasks = 0;

    currProject.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        totalTasks += 1;
        if (task.status === "completed" || task.status === "skipped") {
          completedTasks += 1;
        }
      });
    });

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const handleUpdateTaskStatus = (phaseId: string, taskId: string, newStatus: TaskStatus) => {
    if (!project) return;

    const updatedPhases = project.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      const updatedTasks = phase.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return { ...task, status: newStatus };
      });
      return { ...phase, tasks: updatedTasks };
    });

    const updatedProject: Project = {
      ...project,
      phases: updatedPhases,
    };
    updatedProject.progressPercentage = calculateProgress(updatedProject);

    setProject(updatedProject);
    if (onUpdateProject) onUpdateProject(updatedProject);
  };

  const handleDeleteTask = (phaseId: string, taskId: string) => {
    if (!project) return;

    const updatedPhases = project.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.filter((task) => task.id !== taskId),
      };
    });

    const updatedProject: Project = {
      ...project,
      phases: updatedPhases,
    };
    updatedProject.progressPercentage = calculateProgress(updatedProject);

    setProject(updatedProject);
    if (onUpdateProject) onUpdateProject(updatedProject);
  };

  const handleAddTask = (phaseId: string) => {
    if (!newTaskTitle.trim() || !project) return;

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      description: "Custom user task",
      priority: "medium",
      status: "todo",
      estimatedDuration: "1-2 hrs",
    };

    const updatedPhases = project.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: [...phase.tasks, newTask],
      };
    });

    const updatedProject: Project = {
      ...project,
      phases: updatedPhases,
    };
    updatedProject.progressPercentage = calculateProgress(updatedProject);

    setProject(updatedProject);
    setNewTaskTitle("");
    setNewTaskPhaseId(null);
    if (onUpdateProject) onUpdateProject(updatedProject);
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "critical":
        return <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">Critical</span>;
      case "high":
        return <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">High</span>;
      case "medium":
        return <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Medium</span>;
      case "low":
      default:
        return <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-zinc-500/20 text-zinc-300 border border-zinc-500/30">Low</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl h-full bg-[#0b0c12] border-l border-[rgba(255,255,255,0.08)] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-zinc-200">

        {/* Drawer Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)] bg-[#10121a]/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FolderKanban size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate max-w-sm sm:max-w-md">
                  {project.title}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  {project.difficulty}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-md">{project.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats & Overall Progress */}
        <div className="px-6 py-4 bg-[#12141f] border-b border-[rgba(255,255,255,0.04)] grid grid-cols-3 gap-4">
          {/* Progress */}
          <div className="col-span-2">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <BarChart3 size={13} className="text-indigo-400" />
                Project Progress
              </span>
              <span className="text-indigo-300 font-mono">{project.progressPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${project.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Completion Time */}
          <div className="flex flex-col justify-center border-l border-white/[0.06] pl-4">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Est. Duration</span>
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-amber-400" />
              {project.estimatedCompletionTime}
            </span>
          </div>
        </div>

        {/* Smart Roadmap Phases & Tasks List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-400" />
              Smart Roadmap Phases ({project.phases.length})
            </span>
          </div>

          {project.phases.map((phase, phaseIdx) => {
            const isExpanded = expandedPhases[phase.id] !== false; // expanded by default
            const phaseCompletedTasks = phase.tasks.filter((t) => t.status === "completed" || t.status === "skipped").length;
            const phaseTotalTasks = phase.tasks.length;
            const isPhaseDone = phaseTotalTasks > 0 && phaseCompletedTasks === phaseTotalTasks;

            return (
              <div
                key={phase.id}
                className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#12141e]/90 overflow-hidden shadow-lg transition-all"
              >
                {/* Phase Header */}
                <div
                  onClick={() => togglePhase(phase.id)}
                  className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer flex items-center justify-between select-none border-b border-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        isPhaseDone
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {phaseIdx + 1}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">{phase.title}</h3>
                      <p className="text-[11px] text-zinc-400">{phase.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.05]">
                      {phaseCompletedTasks}/{phaseTotalTasks} Done
                    </span>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {/* Phase Tasks List */}
                {isExpanded && (
                  <div className="p-3 space-y-2.5 bg-[#0e1018]">
                    {phase.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border text-xs transition-all flex flex-col gap-2 ${
                          task.status === "completed"
                            ? "bg-emerald-500/[0.03] border-emerald-500/20 opacity-75"
                            : task.status === "skipped"
                            ? "bg-zinc-800/40 border-zinc-700/30 opacity-50"
                            : "bg-[#151724] border-white/[0.06] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            {/* Toggle Status Icon */}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateTaskStatus(
                                  phase.id,
                                  task.id,
                                  task.status === "completed" ? "todo" : "completed"
                                )
                              }
                              className="mt-0.5 text-zinc-400 hover:text-emerald-400 transition-colors"
                              title={task.status === "completed" ? "Mark incomplete" : "Mark complete"}
                            >
                              {task.status === "completed" ? (
                                <CheckCircle2 size={16} className="text-emerald-400" />
                              ) : task.status === "skipped" ? (
                                <SkipForward size={16} className="text-amber-400" />
                              ) : (
                                <Circle size={16} className="text-zinc-500 hover:text-indigo-400" />
                              )}
                            </button>

                            <div>
                              <div className={`font-semibold ${task.status === "completed" ? "line-through text-zinc-400" : "text-white"}`}>
                                {task.title}
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{task.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {getPriorityBadge(task.priority)}
                            <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {task.estimatedDuration}
                            </span>
                          </div>
                        </div>

                        {/* Task Action Toolbar */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px]">
                          {task.dependencies && task.dependencies.length > 0 && (
                            <span className="text-zinc-500 font-mono truncate max-w-[200px]">
                              Req: {task.dependencies.join(", ")}
                            </span>
                          )}

                          <div className="flex items-center gap-2 ml-auto">
                            {task.status !== "completed" && (
                              <button
                                onClick={() => handleUpdateTaskStatus(phase.id, task.id, "completed")}
                                className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium transition-colors"
                              >
                                Complete
                              </button>
                            )}

                            {task.status !== "skipped" && (
                              <button
                                onClick={() => handleUpdateTaskStatus(phase.id, task.id, "skipped")}
                                className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium transition-colors"
                              >
                                Skip
                              </button>
                            )}

                            {(task.status === "completed" || task.status === "skipped") && (
                              <button
                                onClick={() => handleUpdateTaskStatus(phase.id, task.id, "todo")}
                                className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium transition-colors flex items-center gap-1"
                              >
                                <RotateCcw size={10} /> Retry
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteTask(phase.id, task.id)}
                              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Custom Task under Phase */}
                    {newTaskPhaseId === phase.id ? (
                      <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl border border-indigo-500/30">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Task title..."
                          className="flex-1 bg-transparent border-none text-xs text-white outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask(phase.id);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddTask(phase.id)}
                          className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg text-xs font-semibold hover:bg-indigo-600"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setNewTaskPhaseId(null)}
                          className="px-2 py-1 text-zinc-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setNewTaskPhaseId(phase.id);
                          setNewTaskTitle("");
                        }}
                        className="w-full py-1.5 border border-dashed border-white/[0.08] hover:border-indigo-400/50 rounded-xl text-[11px] text-zinc-400 hover:text-indigo-300 font-semibold transition-all flex items-center justify-center gap-1 bg-white/[0.01] hover:bg-indigo-500/5"
                      >
                        <Plus size={12} />
                        Add Task to {phase.title}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
