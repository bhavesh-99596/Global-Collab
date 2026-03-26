import React, { useState, useEffect } from 'react';
import {
    Star, MapPin, Mail, Link as LinkIcon, Github, Twitter,
    CheckCircle2, FolderKanban, Code, Loader2, Edit3, Award, Wallet
} from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';

const LEVEL_CONFIG = {
    'Beginner':        { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', gradient: 'linear-gradient(135deg, #94a3b8, #64748b)', icon: '🌱' },
    'Contributor':     { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)', icon: '⚡' },
    'Professional':    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', icon: '💎' },
    'Expert':          { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', gradient: 'linear-gradient(135deg, #f59e0b, #fb923c)', icon: '🔥' },
    'Top Contributor': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  gradient: 'linear-gradient(135deg, #ef4444, #f97316)', icon: '👑' },
};

const inputClass = 'glass-input-rect w-full px-4 py-2.5 text-sm';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

const STAT_ICONS = [
    { key: 'reputation', icon: Star, gradient: 'linear-gradient(135deg, #f59e0b, #fb923c)', label: 'Reputation' },
    { key: 'completedTasks', icon: CheckCircle2, gradient: 'linear-gradient(135deg, #34d399, #10b981)', label: 'Tasks Done' },
    { key: 'projectsContributed', icon: FolderKanban, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', label: 'Projects' },
];

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [repData, setRepData] = useState({ points: 0, level: 'Beginner' });
    const [wallet, setWallet] = useState({ total_points: 0 });
    const [pointsHistory, setPointsHistory] = useState([]);

    const fetchProfileData = () => {
        setLoading(true);
        Promise.all([api.get('/users/me'), api.get('/projects')]).then(([userRes, projRes]) => {
            if (userRes.data) {
                const u = userRes.data;
                setProfile({
                    username: u.username || 'unknown',
                    fullName: u.full_name || u.username,
                    role: u.role || 'Member',
                    bio: u.bio || 'No bio provided.',
                    location: u.location || 'Unknown',
                    email: u.email || '',
                    website: u.website || '',
                    social: { github: u.github || '', twitter: u.twitter || '' },
                    reputation: u.reputation || 0,
                    completedTasks: u.completed_tasks || 0,
                    projectsContributed: projRes?.data?.length || 0,
                    skills: u.skills || []
                });
                setEditForm({
                    full_name: u.full_name || '', bio: u.bio || '',
                    location: u.location || '', website: u.website || '',
                    github: u.github || '', twitter: u.twitter || '',
                    skills: (u.skills || []).join(', ')
                });
            }
            if (projRes.data) {
                setRecentProjects(projRes.data.slice(0, 3).map(p => ({
                    id: p.id, name: p.title,
                    role: p.owner_id === userRes?.data?.id ? 'Lead' : 'Contributor',
                    status: 'Active'
                })));
            }
        }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchProfileData(); }, []);

    // Fetch reputation & wallet
    useEffect(() => {
        if (profile) {
            Promise.all([
                api.get('/users/me').then(res => res.data?.id ? api.get(`/reputation/${res.data.id}`) : null),
                api.get('/points'),
                api.get('/points/history')
            ]).then(([repRes, walletRes, histRes]) => {
                if (repRes?.success && repRes.data) setRepData(repRes.data);
                if (walletRes?.success && walletRes.data) setWallet(walletRes.data);
                if (histRes?.success && histRes.data) setPointsHistory(histRes.data);
            }).catch(() => {});
        }
    }, [profile]);

    const handleEditSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/users/profile', { ...editForm, skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean) });
            setIsEditing(false);
            fetchProfileData();
        } catch (err) { console.error(err); alert('Failed to update profile'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin" size={32} style={{ color: '#6366f1' }} />
        </div>
    );
    if (!profile) return <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Failed to load profile.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Developer Profile</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your public presence and stats.</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="btn-glass"><Edit3 size={14} /> Edit Profile</button>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <Modal title="Edit Profile" onClose={() => setIsEditing(false)}>
                    <form onSubmit={handleEditSave} className="space-y-4">
                        {[
                            { key: 'full_name', label: 'Full Name', type: 'text' },
                            { key: 'location', label: 'Location', type: 'text' },
                            { key: 'website', label: 'Website URL', type: 'url' },
                        ].map(f => (
                            <div key={f.key}>
                                <label className={labelClass} style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                                <input type={f.type} value={editForm[f.key]}
                                    onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                    className={inputClass} />
                            </div>
                        ))}
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Bio</label>
                            <textarea value={editForm.bio} rows={3}
                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                className={`${inputClass} resize-none`} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {['github', 'twitter'].map(k => (
                                <div key={k}>
                                    <label className={labelClass} style={{ color: 'var(--text-muted)' }}>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                                    <input type="text" value={editForm[k]}
                                        onChange={e => setEditForm({ ...editForm, [k]: e.target.value })}
                                        className={inputClass} />
                                </div>
                            ))}
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Skills (comma separated)</label>
                            <input type="text" value={editForm.skills} placeholder="React, Node.js, SQL"
                                onChange={e => setEditForm({ ...editForm, skills: e.target.value })}
                                className={inputClass} />
                        </div>
                        <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEditing(false)} className="btn-glass">Cancel</button>
                            <button type="submit" disabled={saving} className="btn-gradient disabled:opacity-50">
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Left Column */}
                <div className="md:col-span-1 space-y-4">
                    {/* Profile Card */}
                    <div className="glass-card text-center relative overflow-hidden">
                        {/* Cover */}
                        <div className="absolute top-0 left-0 w-full h-20" style={{ background: 'var(--grad-primary)' }} />
                        <div className="relative pt-12 pb-5 px-5">
                            <div className="avatar-gradient h-20 w-20 text-2xl mx-auto mb-3" style={{ border: '3px solid rgba(255,255,255,0.8)', borderRadius: '24px' }}>
                                {profile.fullName.charAt(0)}
                            </div>
                            <h2 className="font-bold text-lg" style={{ color: 'var(--text-heading)' }}>{profile.fullName}</h2>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>
                            <p className="text-xs font-semibold mt-1" style={{ color: '#6366f1' }}>{profile.role}</p>

                            {/* Gamification Badge */}
                            {(() => {
                                const lvl = LEVEL_CONFIG[repData.level] || LEVEL_CONFIG['Beginner'];
                                return (
                                    <div className="mt-3 p-2.5 rounded-2xl flex items-center gap-2.5"
                                         style={{ background: lvl.bg, border: `1px solid ${lvl.color}22` }}>
                                        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                                             style={{ background: lvl.gradient }}>
                                            <Award size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: lvl.color }}>
                                                {lvl.icon} {repData.level}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {repData.points.toLocaleString()} points
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            <div className="mt-4 space-y-2 text-left">
                                {[
                                    { icon: MapPin, val: profile.location },
                                    { icon: Mail, val: profile.email },
                                    { icon: LinkIcon, val: profile.website, href: profile.website },
                                ].filter(f => f.val).map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                        <f.icon size={12} />
                                        {f.href ? <a href={f.href} className="hover:underline truncate" style={{ color: '#6366f1' }}>{f.val}</a> : <span className="truncate">{f.val}</span>}
                                    </div>
                                ))}
                            </div>

                            {(profile.social.github || profile.social.twitter) && (
                                <div className="mt-4 pt-4 flex justify-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}>
                                    {profile.social.github && (
                                        <a href={`https://github.com/${profile.social.github}`} target="_blank" rel="noreferrer"
                                            className="p-2 rounded-xl hover:bg-white/50 transition-colors" style={{ color: 'var(--text-muted)' }}>
                                            <Github size={16} />
                                        </a>
                                    )}
                                    {profile.social.twitter && (
                                        <a href={`https://twitter.com/${profile.social.twitter}`} target="_blank" rel="noreferrer"
                                            className="p-2 rounded-xl hover:bg-white/50 transition-colors" style={{ color: 'var(--text-muted)' }}>
                                            <Twitter size={16} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="glass-card p-4">
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                            <Code size={14} style={{ color: '#6366f1' }} /> Technical Skills
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.skills.length > 0
                                ? profile.skills.map((s, i) => <span key={i} className="badge badge-blue">{s}</span>)
                                : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No skills listed</span>}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2 space-y-4">
                    {/* Bio */}
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text-heading)' }}>About Me</h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{profile.bio}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {STAT_ICONS.map(({ key, icon: Icon, gradient, label }) => (
                            <div key={key} className="glass-card p-4 text-center">
                                <div className="icon-badge h-10 w-10 mx-auto mb-2 rounded-2xl" style={{ background: gradient }}>
                                    <Icon size={17} className="text-white" />
                                </div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                <h4 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>
                                    {(profile[key] || 0).toLocaleString()}
                                </h4>
                            </div>
                        ))}
                    </div>

                    {/* Recent Contributions */}
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                            <FolderKanban size={14} style={{ color: '#6366f1' }} /> Recent Contributions
                        </h3>
                        <div className="space-y-2.5">
                            {recentProjects.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/30 transition-colors"
                                     style={{ background: 'rgba(255,255,255,0.25)' }}>
                                    <div>
                                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>{p.name}</h4>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Role: {p.role}</p>
                                    </div>
                                    <span className="badge badge-green">{p.status}</span>
                                </div>
                            ))}
                            {recentProjects.length === 0 && (
                                <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>No projects yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Points Wallet */}
                    <div className="glass-card p-5 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                                <Wallet size={14} style={{ color: '#10b981' }} /> Points Wallet
                            </h3>
                            <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full shadow-sm">
                                {wallet.total_points.toLocaleString()} pts
                            </div>
                        </div>
                        <div className="space-y-2">
                            {pointsHistory.slice(0, 4).map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/30 transition-colors"
                                     style={{ background: 'rgba(255,255,255,0.25)' }}>
                                    <div className="flex-1 min-w-0 pr-3">
                                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-heading)' }}>{tx.description}</p>
                                        <p className="text-[10px] mt-0.5 uppercase tracking-wide opacity-70" style={{ color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`text-xs font-bold whitespace-nowrap ${tx.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tx.type === 'earn' ? '+' : '-'}{tx.points}
                                    </div>
                                </div>
                            ))}
                            {pointsHistory.length === 0 && (
                                <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
