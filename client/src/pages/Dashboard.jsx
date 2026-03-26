import React, { useState, useEffect } from 'react';
import {
    FolderKanban,
    CheckCircle2,
    Star,
    Plus,
    Users,
    Clock,
    ArrowRight,
    Zap,
    Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reputation, setReputation] = useState({ points: 0, level: 'Beginner' });

    const LEVEL_COLORS = {
        'Beginner': '#94a3b8',
        'Contributor': '#22d3ee',
        'Professional': '#6366f1',
        'Expert': '#f59e0b',
        'Top Contributor': '#ef4444',
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [projectsRes, tasksRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/tasks')
                ]);
                if (projectsRes.success) setProjects(projectsRes.data || []);
                if (tasksRes.success) setTasks(tasksRes.data || []);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();

        // Fetch live reputation
        if (user?.id) {
            api.get(`/reputation/${user.id}`).then(res => {
                if (res.success && res.data) setReputation(res.data);
            }).catch(() => {});
        }
    }, [user]);

    const activeProjects = projects.length;
    const completedTasks = tasks.filter(t => t.status && t.status.toLowerCase() === 'done').length;

    const stats = [
        { title: 'Active Projects', value: activeProjects.toString(), icon: FolderKanban, trend: { value: 'live', label: 'current total', isPositive: true }, index: 0 },
        { title: 'Tasks Completed', value: completedTasks.toString(), icon: CheckCircle2, trend: { value: 'live', label: 'completed', isPositive: true }, index: 1 },
        { title: 'Reputation Score', value: reputation.points.toLocaleString(), icon: Star, trend: { value: reputation.level, label: 'rank', isPositive: true }, index: 2 },
    ];

    const statusColors = {
        active: 'badge-green',
        planning: 'badge-blue',
        completed: 'badge-purple',
        'on-hold': 'badge-orange',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl sm:text-2xl">👋</span>
                        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
                            Welcome back, <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {user?.full_name || user?.username || 'Developer'}
                            </span>
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>Here's what's happening with your projects today.</p>
                </div>
                <Link
                    to="/projects"
                    className="btn-gradient flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                >
                    <Plus size={16} />
                    New Project
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 stagger">
                {stats.map((stat, i) => (
                    <StatsCard key={i} {...stat} index={i} />
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Projects */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="section-heading mb-0">Recent Projects</h3>
                            <Link to="/projects" className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                                  style={{ color: '#6366f1' }}>
                                View all <ArrowRight size={13} />
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 rounded-xl animate-pulse-soft" style={{ background: 'rgba(255,255,255,0.5)' }} />
                                ))
                            ) : projects.length === 0 ? (
                                <div className="text-center py-8">
                                    <FolderKanban className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--text-light)' }} />
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active projects yet. Create one to get started!</p>
                                </div>
                            ) : (
                                projects.slice(0, 4).map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        className="flex items-center justify-between p-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
                                        style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.6)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold uppercase text-sm"
                                                 style={{ background: 'var(--grad-primary)' }}>
                                                {project.title.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>{project.title}</h4>
                                                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                    <Clock size={11} />
                                                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`badge ${statusColors[project.status?.toLowerCase()] || 'badge-gray'}`}>
                                            {project.status || 'Active'}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card p-5">
                        <h3 className="section-heading">Quick Actions</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Link to="/tasks"
                                className="glass-card-strong p-4 rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 transition-all cursor-pointer text-center"
                                style={{ border: '1px solid rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                                <div className="icon-badge h-10 w-10 rounded-xl" style={{ background: 'var(--grad-primary)' }}>
                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>My Tasks</span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tasks.length} total</span>
                            </Link>
                            <Link to="/explore"
                                className="glass-card-strong p-4 rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 transition-all cursor-pointer text-center"
                                style={{ border: '1px solid rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                                <div className="icon-badge h-10 w-10 rounded-xl" style={{ background: 'var(--grad-cyan)' }}>
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Find Devs</span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Explore talent</span>
                            </Link>
                            <Link to="/analytics"
                                className="glass-card-strong p-4 rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 transition-all cursor-pointer text-center"
                                style={{ border: '1px solid rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                                <div className="icon-badge h-10 w-10 rounded-xl" style={{ background: 'linear-gradient(135deg, #f472b6, #a78bfa)' }}>
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Analytics</span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>View insights</span>
                            </Link>
                            <Link to="/messages"
                                className="glass-card-strong p-4 rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 transition-all cursor-pointer text-center"
                                style={{ border: '1px solid rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                                <div className="icon-badge h-10 w-10 rounded-xl" style={{ background: 'var(--grad-success)' }}>
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Messages</span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Chat now</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div>
                    <div className="glass-card p-5 h-full">
                        <h3 className="section-heading">Recent Activity</h3>
                        <ActivityFeed limit={6} />
                    </div>
                </div>
            </div>
        </div>
    );
}
