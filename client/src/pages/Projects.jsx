import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Code2, ArrowRight, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { api } from '../services/api';

const STATUS_COLORS = {
    active: 'badge-green',
    planning: 'badge-blue',
    completed: 'badge-purple',
    'on-hold': 'badge-orange',
};

const CARD_ACCENTS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #22d3ee, #60a5fa)',
    'linear-gradient(135deg, #f472b6, #a78bfa)',
    'linear-gradient(135deg, #34d399, #10b981)',
    'linear-gradient(135deg, #fb923c, #f59e0b)',
];

const inputClass = 'glass-input-rect w-full px-4 py-2.5 text-sm';
const labelClass = 'block text-xs font-semibold mb-1.5 uppercase tracking-wider';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', tech: '', deadline: '' });

    useEffect(() => {
        api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProject) {
                const res = await api.put(`/projects/${editingProject.id}`, formData);
                if (res && res.data) {
                    setProjects(projects.map(p => p.id === editingProject.id ? res.data : p));
                    closeModal();
                }
            } else {
                const res = await api.post('/projects', formData);
                if (res && res.data) {
                    setProjects([res.data, ...projects]);
                    closeModal();
                }
            }
        } catch (error) {
            console.error('Error saving project:', error);
            alert(error.message || 'Failed to save project');
        }
    };

    const openModal = (project = null) => {
        setEditingProject(project);
        setFormData(project || { title: '', description: '', tech: '', deadline: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
        setFormData({ title: '', description: '', tech: '', deadline: '' });
    };

    const deleteProject = async (id) => {
        try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting project', error);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Projects</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {projects.length} workspace{projects.length !== 1 ? 's' : ''} · Manage and collaborate
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn-gradient">
                    <Plus size={16} /> New Project
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <FolderOpen className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--text-light)' }} />
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>No projects yet</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create your first project to get started.</p>
                    <button onClick={() => openModal()} className="btn-gradient">
                        <Plus size={15} /> Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
                    {projects.map((project, i) => (
                        <div key={project.id} className="glass-card p-5 flex flex-col">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                                     style={{ background: CARD_ACCENTS[i % CARD_ACCENTS.length] }}>
                                    {project.title.charAt(0)}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.preventDefault(); openModal(project); }}
                                        className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                                        style={{ color: 'var(--text-muted)' }}
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
                                        className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                                        style={{ color: 'var(--text-muted)' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <Link to={`/projects/${project.id}`} className="flex-1 flex flex-col group" style={{ textDecoration: 'none' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-base group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--text-heading)' }}>
                                        {project.title}
                                    </h3>
                                    <span className={`badge ${STATUS_COLORS[project.status?.toLowerCase()] || 'badge-gray'}`}>
                                        {project.status || 'Active'}
                                    </span>
                                </div>
                                <p className="text-sm flex-1 mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                                    {project.description || 'No description provided.'}
                                </p>

                                <div className="pt-3 space-y-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.5)' }}>
                                    {(project.tech_stack || project.tech) && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <Code2 size={12} style={{ color: '#6366f1' }} />
                                            <span className="truncate">{(Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : project.tech_stack) || project.tech}</span>
                                        </div>
                                    )}
                                    {project.deadline && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <Clock size={12} style={{ color: '#f472b6' }} />
                                            <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-end">
                                        <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                                              style={{ color: '#6366f1' }}>
                                            View <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <Modal title={editingProject ? 'Edit Project' : 'Create New Project'} onClose={closeModal}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Project Title</label>
                            <input required type="text" value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={inputClass} placeholder="e.g. SaaS Dashboard" />
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Description</label>
                            <textarea required value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`${inputClass} rounded-2xl resize-none`} rows={3}
                                placeholder="Brief description of the project" />
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Tech Stack</label>
                            <input required type="text" value={formData.tech}
                                onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
                                className={inputClass} placeholder="e.g. React, Node.js, PostgreSQL" />
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Deadline</label>
                            <input required type="date" value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={closeModal} className="btn-glass">Cancel</button>
                            <button type="submit" className="btn-gradient">
                                {editingProject ? 'Save Changes' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
