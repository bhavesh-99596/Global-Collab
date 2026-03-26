import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Database, Sparkles, Activity, PlusSquare, Users, Loader2 } from 'lucide-react';
import ActivityFeed from '../components/ActivityFeed';
import Modal from '../components/Modal';
import { api } from '../services/api';

const AI_ACTIONS = [
    { key: 'generateTasks', label: 'Generate Tasks', icon: PlusSquare, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { key: 'recommendTeam', label: 'Recommend Team', icon: Users, gradient: 'linear-gradient(135deg, #f472b6, #a78bfa)' },
    { key: 'projectHealth', label: 'Project Health', icon: Activity, gradient: 'linear-gradient(135deg, #34d399, #10b981)' },
];

export default function ProjectDetails() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiModal, setAiModal] = useState({ isOpen: false, type: null, data: null, isLoading: false, error: null });
    const [selectedTaskIndices, setSelectedTaskIndices] = useState(new Set());
    const [isSavingTasks, setIsSavingTasks] = useState(false);

    useEffect(() => {
        api.get(`/projects/${id}`)
            .then(res => setProject(res.data))
            .catch(err => console.error("Failed to load project", err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleAITrigger = async (type) => {
        setAiModal({ isOpen: true, type, data: null, isLoading: true, error: null });
        try {
            let res;
            if (type === 'generateTasks') {
                res = await api.post('/ai/generate-tasks', { 
                    projectName: project.title,
                    description: project.description,
                    techStack: project.tech || '',
                    deadline: project.deadline || '',
                    projectId: project.id 
                });
            }
            else if (type === 'recommendTeam') res = await api.post('/ai/recommend-team', { projectDescription: project.description, techStack: project.tech ? project.tech.split(',').map(s => s.trim()) : [], projectId: project.id });
            else if (type === 'projectHealth') res = await api.get(`/ai/project-health/${project.id}`);
            
            setAiModal(prev => ({ ...prev, data: res.data, isLoading: false }));
            if (type === 'generateTasks' && res.data) {
                setSelectedTaskIndices(new Set(res.data.map((_, i) => i)));
            }
        } catch (err) {
            setAiModal(prev => ({ ...prev, error: err.message || 'AI service unavailable', isLoading: false }));
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin" size={32} style={{ color: '#6366f1' }} />
        </div>
    );
    if (!project) return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Project not found</div>;

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header Banner */}
            <div className="glass-card p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/projects" className="p-2 rounded-xl hover:bg-white/50 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>{project.title}</h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Project details and AI intelligence reporting</p>
                    </div>
                </div>
                <Link to={`/projects/${id}/board`} className="btn-glass">
                    View Kanban Board
                </Link>
            </div>

            {/* AI Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
                {AI_ACTIONS.map(({ key, label, icon: Icon, gradient }) => (
                    <button key={key} onClick={() => handleAITrigger(key)}
                        className="glass-card p-6 flex flex-col items-center justify-center group hover:scale-[1.02] active:scale-100 transition-transform">
                        <div className="icon-badge h-14 w-14 rounded-2xl mb-3 group-hover:scale-110 transition-transform"
                             style={{ background: gradient, boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{label}</span>
                        <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <Sparkles size={11} /> AI Powered
                        </span>
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-5">
                    {/* About */}
                    <div className="glass-card p-5">
                        <h3 className="font-bold mb-3" style={{ color: 'var(--text-heading)' }}>About Project</h3>
                        <p className="text-sm mb-5" style={{ color: 'var(--text-body)' }}>{project.description || 'No description provided.'}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: Database, label: 'Tech Stack', val: project.tech || 'Unspecified' },
                                { icon: Clock, label: 'Deadline', val: project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline' },
                            ].map(f => (
                                <div key={f.label} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.5)' }}>
                                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                                        <f.icon size={13} /> {f.label}
                                    </div>
                                    <div className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>{f.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="glass-card p-5">
                        <h3 className="font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Recent Activity</h3>
                        <ActivityFeed limit={5} projectId={parseInt(id, 10)} />
                    </div>
                </div>
                <div />
            </div>

            {/* AI Result Modal */}
            {aiModal.isOpen && (
                <Modal
                    title={aiModal.type === 'generateTasks' ? 'AI Task Generation' : aiModal.type === 'recommendTeam' ? 'AI Team Recommendations' : 'AI Project Health Report'}
                    onClose={() => setAiModal({ ...aiModal, isOpen: false })}
                >
                    {aiModal.isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Sparkles className="h-8 w-8 animate-pulse mb-4" style={{ color: '#6366f1' }} />
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing project details with AI…</p>
                        </div>
                    ) : aiModal.error ? (
                        <div className="p-4 rounded-2xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <p className="font-semibold">Analysis Failed</p>
                            <p className="mt-1 opacity-80">{aiModal.error}</p>
                        </div>
                    ) : aiModal.data ? (
                        <div className="space-y-3">
                            {aiModal.type === 'generateTasks' && (
                                <div className="space-y-3">
                                    <div className="px-3 py-2 rounded-xl text-sm flex items-center justify-between"
                                         style={{ background: 'rgba(52,211,153,0.12)', color: '#059669', border: '1px solid rgba(52,211,153,0.2)' }}>
                                        <span>Tasks generated! Select which ones to keep:</span>
                                        <button 
                                            onClick={() => setSelectedTaskIndices(selectedTaskIndices.size === aiModal.data.length ? new Set() : new Set(aiModal.data.map((_, i) => i)))}
                                            className="text-xs underline hover:opacity-80 transition-opacity"
                                        >
                                            {selectedTaskIndices.size === aiModal.data.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-2 scrollbar-hide py-1">
                                        {Array.isArray(aiModal.data) && aiModal.data.map((task, i) => (
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
                                            onClick={() => setAiModal({ ...aiModal, isOpen: false })}
                                            className="btn-glass text-sm px-4 py-2"
                                            disabled={isSavingTasks}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                const tasksToSave = aiModal.data.filter((_, i) => selectedTaskIndices.has(i));
                                                if (!tasksToSave.length) return;
                                                
                                                setIsSavingTasks(true);
                                                try {
                                                    await api.post('/tasks/bulk', { tasks: tasksToSave, projectId: project.id });
                                                    setAiModal({ ...aiModal, isOpen: false });
                                                    window.location.href = `/projects/${id}/board`;
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

                            {aiModal.type === 'recommendTeam' && (
                                <>
                                    <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Best developers matched to your project requirements:</p>
                                    {Array.isArray(aiModal.data) && aiModal.data.map((dev, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl"
                                             style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar-gradient h-9 w-9 text-sm">{dev.username ? dev.username.charAt(0).toUpperCase() : 'U'}</div>
                                                <div>
                                                    <div className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>{dev.username}</div>
                                                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round(dev.matchScore * 100)}% match</div>
                                                </div>
                                            </div>
                                            <button className="btn-gradient text-xs px-3 py-1.5" style={{ borderRadius: '10px' }}>Invite</button>
                                        </div>
                                    ))}
                                </>
                            )}

                            {aiModal.type === 'projectHealth' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl"
                                         style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)' }}>
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Health Score</p>
                                            <p className="text-3xl font-bold" style={{ color: 'var(--text-heading)' }}>{aiModal.data.healthScore}/100</p>
                                        </div>
                                        <span className={`badge ${aiModal.data.status === 'Healthy' || aiModal.data.status === 'Excellent' ? 'badge-green' : aiModal.data.status === 'At Risk' ? 'badge-orange' : 'badge-pink'}`}>
                                            {aiModal.data.status}
                                        </span>
                                    </div>
                                    {aiModal.data.recommendations && (
                                        <ul className="space-y-2">
                                            {aiModal.data.recommendations.map((rec, i) => (
                                                <li key={i} className="flex gap-2 text-xs p-2.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', color: 'var(--text-body)' }}>
                                                    <span style={{ color: '#6366f1' }}>•</span> {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}
                </Modal>
            )}
        </div>
    );
}
