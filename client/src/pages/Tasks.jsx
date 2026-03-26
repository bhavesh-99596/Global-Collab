import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, User, Edit2, Trash2, ClipboardList } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';

const inputClass = 'glass-input-rect w-full px-4 py-2.5 text-sm';
const labelClass = 'block text-xs font-semibold mb-1.5 uppercase tracking-wider';
const selectClass = 'glass-input-rect w-full px-4 py-2.5 text-sm cursor-pointer';

const PRIORITY_BADGE = {
    critical: 'badge-pink',
    high: 'badge-orange',
    medium: 'badge-blue',
    low: 'badge-gray',
};

const STATUS_BADGE = {
    done: 'badge-green',
    'in progress': 'badge-blue',
    review: 'badge-orange',
    todo: 'badge-gray',
};

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', priority: 'medium', status: 'Todo',
        assignedUser: '', deadline: '', projectId: ''
    });

    useEffect(() => {
        api.get('/tasks').then(res => setTasks(res.data || [])).catch(console.error);
        api.get('/projects').then(res => {
            if (res.data) {
                setProjects(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, projectId: res.data[0].id.toString() }));
                }
            }
        }).catch(console.error);
    }, []);

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'done': return <CheckSquare size={14} style={{ color: '#10b981' }} />;
            case 'in progress': return <Clock size={14} style={{ color: '#60a5fa' }} />;
            case 'review': return <AlertCircle size={14} style={{ color: '#fb923c' }} />;
            default: return <div className="w-3.5 h-3.5 rounded border-2" style={{ borderColor: '#9ca3af' }} />;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const taskData = { ...formData, project_id: parseInt(formData.projectId, 10) };
        try {
            if (editingTask) {
                const res = await api.put(`/tasks/${editingTask.id}`, taskData);
                if (res.success) setTasks(tasks.map(t => t.id === editingTask.id ? res.data : t));
            } else {
                const res = await api.post('/tasks', taskData);
                if (res.success) setTasks([res.data, ...tasks]);
            }
            closeModal();
        } catch (err) { console.error(err); }
    };

    const openModal = (task = null) => {
        setEditingTask(task);
        setFormData(task || {
            title: '', description: '', priority: 'medium', status: 'Todo',
            assignedUser: '', deadline: '', projectId: projects.length > 0 ? projects[0].id.toString() : ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };

    const deleteTask = async (id) => {
        try { await api.delete(`/tasks/${id}`); setTasks(tasks.filter(t => t.id !== id)); }
        catch (error) { console.error('Error deleting task', error); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>My Tasks</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''} · Manage and track your work
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn-gradient">
                    <Plus size={16} /> New Task
                </button>
            </div>

            {/* Tasks Table */}
            <div className="glass-card overflow-hidden">
                {tasks.length === 0 ? (
                    <div className="p-16 text-center">
                        <ClipboardList className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--text-light)' }} />
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>No tasks yet</h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create your first task to start tracking work.</p>
                        <button onClick={() => openModal()} className="btn-gradient"><Plus size={15} /> Add Task</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                                    {['Task Name', 'Project', 'Status', 'Priority', 'Assignee', 'Deadline', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.25)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id} className="group transition-colors hover:bg-white/30"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>{task.title}</div>
                                            {task.description && (
                                                <div className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{task.description}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-muted)' }}>{task.projectName || '—'}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(task.status)}
                                                <span className={`badge ${STATUS_BADGE[task.status?.toLowerCase()] || 'badge-gray'}`}>
                                                    {task.status || 'Todo'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`badge ${PRIORITY_BADGE[task.priority?.toLowerCase()] || 'badge-gray'}`}>
                                                {task.priority || 'medium'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {task.assignedUser ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="avatar-gradient h-6 w-6 text-xs">
                                                        {task.assignedUser.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.assignedUser}</span>
                                                </div>
                                            ) : <span className="text-xs" style={{ color: 'var(--text-light)' }}>Unassigned</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(task)}
                                                    className="p-1.5 rounded-xl hover:bg-white/50 transition-colors"
                                                    style={{ color: 'var(--text-muted)' }}>
                                                    <Edit2 size={13} />
                                                </button>
                                                <button onClick={() => deleteTask(task.id)}
                                                    className="p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                                                    style={{ color: 'var(--text-muted)' }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <Modal title={editingTask ? 'Edit Task' : 'Create New Task'} onClose={closeModal}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Task Title</label>
                            <input required type="text" value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className={inputClass} placeholder="e.g. Implement Login API" />
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Description</label>
                            <textarea value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className={`${inputClass} rounded-2xl resize-none`} rows={2}
                                placeholder="Task details and requirements" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Project</label>
                                <select value={formData.projectId}
                                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                    className={selectClass}>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Status</label>
                                <select value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className={selectClass}>
                                    {['Todo', 'In Progress', 'Review', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Priority</label>
                                <select value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    className={selectClass}>
                                    {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Deadline</label>
                                <input type="date" value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Assignee</label>
                            <input type="text" value={formData.assignedUser}
                                onChange={e => setFormData({ ...formData, assignedUser: e.target.value })}
                                className={inputClass} placeholder="e.g. Sarah M." />
                        </div>
                        <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={closeModal} className="btn-glass">Cancel</button>
                            <button type="submit" className="btn-gradient">
                                {editingTask ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
