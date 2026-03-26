import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Star, MapPin, Code, MessageSquare, Briefcase, Loader2, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { aiService } from '../services/ai.service';
import { api } from '../services/api';

const calcLevel = (pts) => {
    if (pts >= 2500) return { label: 'Top Contributor', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '👑' };
    if (pts >= 1000) return { label: 'Expert', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🔥' };
    if (pts >= 500)  return { label: 'Professional', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '💎' };
    if (pts >= 100)  return { label: 'Contributor', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', icon: '⚡' };
    return { label: 'Beginner', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '🌱' };
};

const DEV_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #22d3ee, #60a5fa)',
    'linear-gradient(135deg, #f472b6, #a78bfa)',
    'linear-gradient(135deg, #34d399, #10b981)',
    'linear-gradient(135deg, #fb923c, #f59e0b)',
];

export default function Explore() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [developers, setDevelopers] = useState([]);

    useEffect(() => {
        api.get('/users').then(res => {
            if (res.data) {
                setDevelopers(res.data.map(u => ({
                    id: u.id,
                    name: u.full_name || u.username || 'Unknown Developer',
                    username: u.username,
                    role: u.role || 'Developer',
                    skills: u.skills || [],
                    reputation: u.reputation || 0,
                    location: u.location || 'Remote',
                    match: null
                })));
            }
        }).catch(console.error);
    }, []);

    const handleAiRecommendation = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const matchResults = await aiService.recommendTeam(aiPrompt, []);
            setDevelopers(prev => {
                const updated = prev.map(dev => {
                    const aiMatch = matchResults.find(m => m.userId === dev.id);
                    return { ...dev, match: aiMatch ? Math.round(aiMatch.matchScore * 100) : null };
                });
                return updated.sort((a, b) => (b.match || 0) - (a.match || 0));
            });
        } catch (error) { console.error("AI recommendation error", error); }
        finally { setIsGenerating(false); setIsAiModalOpen(false); setAiPrompt(''); }
    };

    const filtered = developers.filter(dev =>
        dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Explore Developers</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Find the perfect team members for your next project.</p>
                </div>
                <button onClick={() => setIsAiModalOpen(true)} className="btn-gradient">
                    <Sparkles size={15} /> AI Team Match
                </button>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, role, or skills…"
                        className="glass-input block w-full pl-11 pr-4 py-2.5 text-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Developer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
                {filtered.map((dev, i) => (
                    <div key={dev.id} className="glass-card p-5 relative">
                        {dev.match !== null && (
                            <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                                 style={{ background: 'rgba(52,211,153,0.15)', color: '#059669' }}>
                                <Sparkles size={11} /> {dev.match}% Match
                            </div>
                        )}

                        {/* Dev Header */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className="avatar-gradient h-14 w-14 text-xl rounded-2xl flex-shrink-0"
                                 style={{ background: DEV_GRADIENTS[i % DEV_GRADIENTS.length], borderRadius: '16px' }}>
                                {dev.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold flex items-center gap-1" style={{ color: 'var(--text-heading)' }}>
                                    {dev.name}
                                    {dev.reputation > 4000 && <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />}
                                </h3>
                                <p className="text-xs font-semibold" style={{ color: '#6366f1' }}>{dev.role}</p>
                                <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    <MapPin size={11} /> {dev.location}
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        {dev.skills.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <Code size={12} /> Skills
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {dev.skills.slice(0, 5).map((skill, idx) => (
                                        <span key={idx} className="badge badge-blue text-xs">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}>
                            <div>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Reputation</span>
                                <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
                                    {dev.reputation.toLocaleString()}
                                    {(() => {
                                        const lvl = calcLevel(dev.reputation);
                                        return (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>
                                                {lvl.icon} {lvl.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link to={`/portfolio/${dev.username}`}
                                    className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <Briefcase size={16} />
                                </Link>
                                <Link to={`/messages?user=${dev.id}`} className="btn-gradient text-xs px-3 py-1.5" style={{ borderRadius: '10px' }}>
                                    <MessageSquare size={13} /> Message
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Modal */}
            {isAiModalOpen && (
                <Modal title="AI Team Builder" onClose={() => !isGenerating && setIsAiModalOpen(false)}>
                    <div className="space-y-4">
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Describe your project requirements and tech stack. AI will find the best developer matches.
                        </p>
                        <textarea
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            disabled={isGenerating}
                            placeholder='e.g., "Need a backend engineer experienced with Node.js and PostgreSQL…"'
                            className="glass-input-rect w-full px-4 py-3 text-sm resize-none"
                            rows={4}
                        />
                        <button
                            onClick={handleAiRecommendation}
                            disabled={isGenerating || !aiPrompt.trim()}
                            className="btn-gradient w-full justify-center py-3 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <><Loader2 className="animate-spin" size={15} /> Analyzing Profiles…</>
                            ) : (
                                <><Sparkles size={15} /> Find Best Matches</>
                            )}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
