import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    RadialBarChart, RadialBar, AreaChart, Area, LineChart, Line
} from 'recharts';
import StatsCard from '../components/StatsCard';
import {
    TrendingUp, Users, CheckSquare, AlertTriangle,
    Loader2, BarChart2, Clock, Target, RefreshCw
} from 'lucide-react';
import { analyticsService } from '../services/analytics.service';

const PIE_COLORS = { 'To Do': '#6366F1', 'In Progress': '#F59E0B', 'Done': '#10B981', 'Review': '#60a5fa' };
const BAR_GRADIENT = ['#6366F1', '#818CF8', '#a78bfa', '#60a5fa', '#22d3ee', '#f472b6', '#34d399', '#fb923c'];
const RADIAL_COLORS = ['#10B981', '#60a5fa', '#F59E0B', '#f472b6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const REFRESH_INTERVAL_MS = 10_000;

const glassTooltip = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(99,102,241,0.15)'
};

function EmptyState({ message = 'No data available' }) {
    return (
        <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: 'var(--text-muted)' }}>
            <BarChart2 size={32} strokeWidth={1.5} />
            <span className="text-sm">{message}</span>
        </div>
    );
}

function ChartLoader() {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin" size={28} style={{ color: '#6366f1' }} />
        </div>
    );
}

function SectionCard({ title, icon: Icon, children, loading, extra }) {
    return (
        <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.45)' }}>
                <div className="flex items-center gap-2">
                    {Icon && <div className="icon-badge h-7 w-7 rounded-xl" style={{ background: 'var(--grad-primary)' }}>
                        <Icon size={13} className="text-white" />
                    </div>}
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>{title}</h3>
                </div>
                {extra}
            </div>
            <div className="p-5">{loading ? <ChartLoader /> : children}</div>
        </div>
    );
}

const CustomBarLabel = ({ x, y, width, value }) => {
    if (!value) return null;
    return <text x={x + width / 2} y={y - 4} fill="#6B7280" textAnchor="middle" fontSize={11}>{value}</text>;
};

export default function Analytics() {
    const [data, setData] = useState(null);
    const [legacy, setLegacy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingLegacy, setLoadingLegacy] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchNew = async () => {
        try {
            const result = await analyticsService.getAnalyticsDashboard();
            setData(result);
            setLastRefreshed(new Date());
        } catch (err) { console.error('Analytics fetch failed', err); }
        finally { setLoading(false); }
    };

    const fetchLegacy = async () => {
        try {
            const result = await analyticsService.getDashboardData();
            setLegacy(result);
        } catch (err) { console.error('Legacy analytics fetch failed', err); }
        finally { setLoadingLegacy(false); }
    };

    useEffect(() => {
        fetchNew(); fetchLegacy();
        const interval = setInterval(fetchNew, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    const totalCompleted = data ? (data.taskStatus.find(s => s.status === 'Done')?.count || 0) : 0;
    const totalTasks = data ? data.taskStatus.reduce((s, r) => s + r.count, 0) : 0;
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const overdueCount = data?.overdueTasks?.count || 0;
    const teamSize = data?.teamContribution?.length || 0;

    const statCards = [
        { title: 'Tasks Completed', value: totalCompleted, icon: CheckSquare, trend: { value: `${completionRate}%`, label: 'completion rate', isPositive: completionRate >= 50 }, index: 0 },
        { title: 'Overdue Tasks', value: overdueCount, icon: AlertTriangle, trend: { value: overdueCount === 0 ? '✓ On track' : 'Needs attention', label: '', isPositive: overdueCount === 0 }, index: 1 },
        { title: 'Completion Rate', value: `${completionRate}%`, icon: Target, trend: { value: `${totalCompleted}/${totalTasks}`, label: 'tasks done', isPositive: completionRate >= 50 }, index: 2 },
        { title: 'Team Members', value: teamSize, icon: Users, trend: { value: 'contributing', label: 'to projects', isPositive: true }, index: 3 },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Analytics</h1>
                    <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Project insights · auto-refreshes every 10s
                        {lastRefreshed && <span className="ml-2 opacity-60">· {lastRefreshed.toLocaleTimeString()}</span>}
                    </p>
                </div>
                <button onClick={() => { setLoading(true); fetchNew(); }} className="btn-glass flex items-center gap-1.5 text-sm w-full sm:w-auto justify-center">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass-card h-28 animate-pulse-soft" />
                    ))
                    : statCards.map((s, i) => <StatsCard key={i} {...s} />)
                }
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SectionCard title="Tasks Completed Per Project" icon={BarChart2} loading={loading}>
                    {data?.tasksPerProject?.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.tasksPerProject} margin={{ top: 16, right: 8, left: -10, bottom: 40 }}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366F1" /><stop offset="100%" stopColor="#818CF8" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                                    <XAxis dataKey="project" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} allowDecimals={false} />
                                    <RTooltip formatter={v => [`${v} tasks`, 'Completed']} contentStyle={glassTooltip} />
                                    <Bar dataKey="completed" fill="url(#barGrad)" radius={[6, 6, 0, 0]} label={<CustomBarLabel />}>
                                        {data.tasksPerProject.map((_, i) => <Cell key={i} fill={BAR_GRADIENT[i % BAR_GRADIENT.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <EmptyState />}
                </SectionCard>

                <SectionCard title="Task Status Distribution" icon={Target} loading={loading}>
                    {data?.taskStatus?.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.taskStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                                        outerRadius={90} innerRadius={50} paddingAngle={3}
                                        label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {data.taskStatus.map((entry, i) => <Cell key={i} fill={PIE_COLORS[entry.status] || '#94A3B8'} />)}
                                    </Pie>
                                    <RTooltip formatter={(v, n) => [`${v} tasks`, n]} contentStyle={glassTooltip} />
                                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#374151', fontSize: 12 }}>{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <EmptyState />}
                </SectionCard>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SectionCard title="Project Progress" icon={TrendingUp} loading={loading}>
                    {data?.projectProgress?.length > 0 ? (
                        <>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart cx="50%" cy="50%" innerRadius="15%" outerRadius="90%"
                                        data={data.projectProgress.map((p, i) => ({ ...p, fill: RADIAL_COLORS[i % RADIAL_COLORS.length] }))}
                                        startAngle={90} endAngle={-270}>
                                        <RadialBar minAngle={5} dataKey="progress" cornerRadius={4}
                                            background={{ fill: 'rgba(255,255,255,0.3)' }}
                                            label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} />
                                        <RTooltip formatter={(v, n, p) => [`${v}%`, p.payload.project]} contentStyle={glassTooltip} />
                                        <Legend iconSize={8} iconType="circle" formatter={(value, entry) => (
                                            <span style={{ color: '#374151', fontSize: 11 }}>{entry.payload.project} — {entry.payload.progress}%</span>
                                        )} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2.5 mt-3">
                                {data.projectProgress.map((p, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                                            <span className="font-medium truncate max-w-[60%]">{p.project}</span>
                                            <span>{p.completed}/{p.total} · {p.progress}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.4)' }}>
                                            <div className="h-full rounded-full transition-all duration-500"
                                                 style={{ width: `${p.progress}%`, background: RADIAL_COLORS[i % RADIAL_COLORS.length] }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <EmptyState />}
                </SectionCard>

                <SectionCard title="Team Contribution" icon={Users} loading={loading}>
                    {data?.teamContribution?.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.teamContribution} margin={{ top: 16, right: 8, left: -10, bottom: 40 }}>
                                    <defs>
                                        <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                                    <XAxis dataKey="member" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} allowDecimals={false} />
                                    <RTooltip formatter={v => [`${v} tasks`, 'Completed']} contentStyle={glassTooltip} />
                                    <Bar dataKey="completed" fill="url(#teamGrad)" radius={[6, 6, 0, 0]} label={<CustomBarLabel />} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <EmptyState />}
                </SectionCard>
            </div>

            {/* Overdue */}
            <SectionCard title="Overdue Tasks" icon={Clock} loading={loading}
                extra={overdueCount > 0 && (
                    <span className="badge badge-pink">{overdueCount} overdue</span>
                )}>
                {data?.overdueTasks?.tasks?.length > 0 ? (
                    <div className="space-y-2">
                        {data.overdueTasks.tasks.map(task => {
                            const daysOverdue = Math.floor((Date.now() - new Date(task.deadline).getTime()) / 86_400_000);
                            return (
                                <div key={task.id} className="flex items-center justify-between p-3 rounded-2xl"
                                     style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>{task.title}</p>
                                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{task.project} · {task.assignee || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-4 text-right">
                                        <span className="text-xs font-bold" style={{ color: '#ef4444' }}>{daysOverdue}d overdue</span>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(task.deadline).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ color: '#10b981' }}>
                        <CheckSquare size={28} strokeWidth={1.5} />
                        <p className="text-sm font-medium">No overdue tasks — great work! 🎉</p>
                    </div>
                )}
            </SectionCard>

            {/* Row 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SectionCard title="Weekly Productivity" icon={BarChart2} loading={loadingLegacy}>
                    {legacy?.weeklyActivityData?.length > 0 ? (
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={legacy.weeklyActivityData} margin={{ top: 8, right: 8, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                                    <RTooltip contentStyle={glassTooltip} />
                                    <Bar dataKey="tasks" fill="#6366F1" radius={[4, 4, 0, 0]} name="Tasks" />
                                    <Bar dataKey="commits" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Commits" />
                                    <Legend iconType="circle" iconSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <EmptyState />}
                </SectionCard>

                <SectionCard title="Project Activity Trends" icon={TrendingUp} loading={loadingLegacy}>
                    {legacy?.projectActivityData?.length > 0 ? (
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={legacy.projectActivityData} margin={{ top: 8, right: 8, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                                    <RTooltip contentStyle={glassTooltip} />
                                    <Line type="monotone" dataKey="active" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4 }} name="Active" />
                                    <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} name="Completed" />
                                    <Legend iconType="circle" iconSize={8} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <EmptyState />}
                </SectionCard>
            </div>

            {/* Row 5 */}
            <SectionCard title="Reputation Growth (6-month trend)" icon={TrendingUp} loading={loadingLegacy}>
                {legacy?.reputationGrowthData?.length > 0 ? (
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={legacy.reputationGrowthData} margin={{ top: 8, right: 8, left: -10 }}>
                                <defs>
                                    <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                                <RTooltip contentStyle={glassTooltip} />
                                <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#repGrad)" name="Reputation" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : <EmptyState />}
            </SectionCard>
        </div>
    );
}
