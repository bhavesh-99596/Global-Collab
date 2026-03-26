import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Sparkles, Loader2 } from 'lucide-react';
import KanbanColumn from '../components/KanbanColumn';
import Modal from '../components/Modal';
import { aiService } from '../services/ai.service';
import { api } from '../services/api';

export default function WorkspaceKanban() {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const columns = [
        { id: 'todo', title: 'Todo' },
        { id: 'in_progress', title: 'In Progress' },
        { id: 'review', title: 'Review' },
        { id: 'done', title: 'Done' }
    ];

    // AI Modal State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResultData, setAiResultData] = useState(null);
    const [selectedTaskIndices, setSelectedTaskIndices] = useState(new Set());
    const [isSavingTasks, setIsSavingTasks] = useState(false);

    // Edit Modal State
    const [editingTask, setEditingTask] = useState(null);
    const [isEditingTaskSaving, setIsEditingTaskSaving] = useState(false);

    useEffect(() => {
        api.get('/projects').then(res => {
            if (res.data && res.data.length > 0) {
                setProjects(res.data);
                setSelectedProjectId(res.data[0].id.toString());
            }
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedProjectId) return;
        api.get(`/tasks?projectId=${selectedProjectId}`).then(res => {
            if (res.data) {
                const mappedTasks = res.data.map(t => {
                    let s = t.status?.toLowerCase().replace(/ /g, '_') || 'todo';
                    if (!['todo', 'in_progress', 'review', 'done'].includes(s)) s = 'todo';
                    return { ...t, id: t.id.toString(), status: s };
                });
                setTasks(mappedTasks);
            }
        }).catch(console.error);
    }, [selectedProjectId]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over.id) {
            let newStatus = over.id;
            const droppedOverTask = tasks.find((t) => t.id === over.id);
            if (droppedOverTask) {
                newStatus = droppedOverTask.status;
            }

            setTasks((prevTasks) => {
                return prevTasks.map((t) => {
                    if (t.id === active.id) {
                        return { ...t, status: newStatus };
                    }
                    return t;
                });
            });

            // Persist to backend
            let cleanStatus = newStatus === 'in_progress' ? 'in progress' : newStatus;
            api.put(`/tasks/${active.id}`, { status: cleanStatus }).catch(console.error);
        }
    };

    const handleGenerateTasks = async () => {
        if (!aiPrompt.trim() || !selectedProjectId) return;
        setIsGenerating(true);

        const project = projects.find(p => p.id.toString() === selectedProjectId.toString());

        try {
            const response = await api.post('/ai/generate-tasks', {
                projectName: project?.title || 'Unknown Project',
                description: aiPrompt, // The user is asked to describe project features here
                techStack: project?.tech || '',
                deadline: project?.deadline || '',
                projectId: selectedProjectId
            });

            if (response.success && response.data) {
                setAiResultData(response.data);
                setSelectedTaskIndices(new Set(response.data.map((_, i) => i)));
            } else {
                alert("Failed to generate tasks.");
            }

        } catch (error) {
            console.error("Failed to generate AI tasks", error);
            alert("Error: " + (error.response?.data?.error || error.response?.data?.message || error.message));
        } finally {
            setIsGenerating(false);
            setAiPrompt('');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Project Workspace</h1>
                    <div className="mt-2">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="glass-input-rect px-4 py-2 text-sm cursor-pointer"
                        >
                            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            {projects.length === 0 && <option value="">No Active Projects</option>}
                        </select>
                    </div>
                </div>
                <button onClick={() => setIsAiModalOpen(true)} className="btn-gradient">
                    <Sparkles size={15} /> AI Task Gen
                </button>
            </div>

            {/* Kanban Board */}
            <div className="glass-card p-5 overflow-x-auto" style={{ minHeight: '560px' }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 pb-4">
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                tasks={tasks.filter((task) => task.status === column.id)}
                                onEditTask={setEditingTask}
                            />
                        ))}
                    </div>
                </DndContext>
            </div>

            {/* AI Modal */}
            {isAiModalOpen && (
                <Modal title="Generate Tasks with AI" onClose={() => !isGenerating && !isSavingTasks && setIsAiModalOpen(false)}>
                    {!aiResultData ? (
                        <div className="space-y-4">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Describe your project features and the AI will automatically generate and categorize the required technical tasks.
                            </p>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                disabled={isGenerating}
                                placeholder='e.g., "Build a SaaS developer collaboration platform with authentication, databases, and a React frontend"'
                                className="glass-input-rect w-full px-4 py-3 text-sm resize-none"
                                rows={4}
                            />
                            <button
                                onClick={handleGenerateTasks}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="btn-gradient w-full justify-center py-3 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="animate-spin" size={15} /> Generating Tasks…</>
                                ) : (
                                    <><Sparkles size={15} /> Generate Tasks</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="px-3 py-2 rounded-xl text-sm flex items-center justify-between"
                                 style={{ background: 'rgba(52,211,153,0.12)', color: '#059669', border: '1px solid rgba(52,211,153,0.2)' }}>
                                <span>Tasks generated! Select which ones to keep:</span>
                                <button 
                                    onClick={() => setSelectedTaskIndices(selectedTaskIndices.size === aiResultData.length ? new Set() : new Set(aiResultData.map((_, i) => i)))}
                                    className="text-xs underline hover:opacity-80 transition-opacity"
                                >
                                    {selectedTaskIndices.size === aiResultData.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-2 scrollbar-hide py-1">
                                {aiResultData.map((task, i) => (
                                    <div key={i} 
                                         onClick={() => {
                                             const newSet = new Set(selectedTaskIndices);
                                             if (newSet.has(i)) newSet.delete(i);
                                             else newSet.add(i);
                                             setSelectedTaskIndices(newSet);
                                         }}
                                         className={`p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition-all ${selectedTaskIndices.has(i) ? 'opacity-100 scale-100 shadow-sm' : 'opacity-50 scale-[0.98]'}`} 
                                         style={{ 
                                             background: selectedTaskIndices.has(i) ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', 
                                             border: selectedTaskIndices.has(i) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.4)' 
                                         }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedTaskIndices.has(i)}
                                            readOnly
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>{task.title}</div>
                                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{task.description}</div>
                                            <span className="badge badge-blue mt-2">{task.priority} priority</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                                <button 
                                    onClick={() => { setAiResultData(null); setIsAiModalOpen(false); }}
                                    className="btn-glass text-sm px-4 py-2"
                                    disabled={isSavingTasks}
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={async () => {
                                        const tasksToSave = aiResultData.filter((_, i) => selectedTaskIndices.has(i));
                                        if (!tasksToSave.length) return;
                                        
                                        setIsSavingTasks(true);
                                        try {
                                            await api.post('/tasks/bulk', { tasks: tasksToSave, projectId: selectedProjectId });
                                            
                                            // Auto-refresh the board with new tasks
                                            const tasksRes = await api.get(`/tasks?projectId=${selectedProjectId}`);
                                            if (tasksRes.data) {
                                                const mappedTasks = tasksRes.data.map(t => {
                                                    let s = t.status?.toLowerCase().replace(/ /g, '_') || 'todo';
                                                    if (!['todo', 'in_progress', 'review', 'done'].includes(s)) s = 'todo';
                                                    return { ...t, id: t.id.toString(), status: s };
                                                });
                                                setTasks(mappedTasks);
                                            }
                                            
                                            setAiResultData(null);
                                            setIsAiModalOpen(false);
                                        } catch (err) {
                                            alert("Failed to save tasks: " + (err.response?.data?.error || err.message));
                                        } finally {
                                            setIsSavingTasks(false);
                                        }
                                    }}
                                    disabled={selectedTaskIndices.size === 0 || isSavingTasks}
                                    className={`btn-gradient text-sm px-4 py-2 ${(!selectedTaskIndices.size || isSavingTasks) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSavingTasks ? (
                                        <><Loader2 className="animate-spin inline mr-2" size={14} /> Saving...</>
                                    ) : (
                                        `Add ${selectedTaskIndices.size} Selected Task${selectedTaskIndices.size !== 1 ? 's' : ''}`
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <Modal title="Edit Task" onClose={() => !isEditingTaskSaving && setEditingTask(null)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Title</label>
                            <input 
                                type="text"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                                disabled={isEditingTaskSaving}
                                className="glass-input-rect w-full px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                            <textarea 
                                value={editingTask.description || ''}
                                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                                disabled={isEditingTaskSaving}
                                className="glass-input-rect w-full px-3 py-2 text-sm resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Priority</label>
                                <select 
                                    value={editingTask.priority || 'medium'}
                                    onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                                    disabled={isEditingTaskSaving}
                                    className="glass-input-rect w-full px-3 py-2 text-sm cursor-pointer"
                                    style={{ color: 'var(--text-heading)' }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
                                <select 
                                    value={editingTask.status || 'todo'}
                                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                                    disabled={isEditingTaskSaving}
                                    className="glass-input-rect w-full px-3 py-2 text-sm cursor-pointer"
                                    style={{ color: 'var(--text-heading)' }}
                                >
                                    <option value="todo">Todo</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                            <button
                                onClick={async () => {
                                    if(window.confirm('Are you sure you want to delete this task?')) {
                                        setIsEditingTaskSaving(true);
                                        try {
                                            await api.delete(`/tasks/${editingTask.id}`);
                                            setTasks(tasks.filter(t => t.id !== editingTask.id));
                                            setEditingTask(null);
                                        } catch (err) {
                                            alert("Failed to delete task: " + (err.response?.data?.error || err.message));
                                        } finally {
                                            setIsEditingTaskSaving(false);
                                        }
                                    }
                                }}
                                disabled={isEditingTaskSaving}
                                className="text-xs px-3 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                Delete Task
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingTask(null)}
                                    disabled={isEditingTaskSaving}
                                    className="btn-glass text-sm px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={async () => {
                                        setIsEditingTaskSaving(true);
                                        try {
                                            const cleanStatus = editingTask.status === 'in_progress' ? 'in progress' : editingTask.status;
                                            const res = await api.put(`/tasks/${editingTask.id}`, {
                                                title: editingTask.title,
                                                description: editingTask.description,
                                                priority: editingTask.priority,
                                                status: cleanStatus,
                                            });
                                            if (res.data) {
                                                setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...editingTask } : t));
                                                setEditingTask(null);
                                            }
                                        } catch (err) {
                                            alert("Failed to update task: " + (err.response?.data?.error || err.message));
                                        } finally {
                                            setIsEditingTaskSaving(false);
                                        }
                                    }}
                                    disabled={isEditingTaskSaving || !editingTask.title?.trim()}
                                    className="btn-gradient text-sm px-4 py-2"
                                >
                                    {isEditingTaskSaving ? (
                                        <><Loader2 className="animate-spin inline mr-2" size={14} /> Saving...</>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
