import React, { useState, useEffect } from 'react';
import { Trophy, Loader2, ArrowUp, ArrowDown, Award, Crown } from 'lucide-react';
import { api } from '../services/api';
import { io } from 'socket.io-client';

const LEVEL_COLORS = {
    'Beginner': '#94a3b8',
    'Contributor': '#0ea5e9',
    'Professional': '#6366f1',
    'Expert': '#f59e0b',
    'Top Contributor': '#ef4444',
};

const theme = {
    bgMain: '#ffffff',
    bgPanel: '#f8fafc',
    bgList: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    accentPrimary: '#6366f1',
    accentPodiumBlue: '#818cf8',
    borderColor: 'border-slate-200'
};

const REWARDS = [
    { place: '1st', prize: '1000 pts' },
    { place: '2nd', prize: '750 pts' },
    { place: '3rd', prize: '500 pts' },
    { place: '4th', prize: '300 pts' },
    { place: '5th', prize: '200 pts' },
    { place: '6th', prize: '150 pts' },
    { place: '7th', prize: '100 pts' },
    { place: '8th', prize: '75 pts' },
    { place: '9th', prize: '50 pts' },
    { place: '10th', prize: '25 pts' }
];

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('Monthly'); // Default to monthly as requested by rewards logic

    useEffect(() => {
        const fetchLeaders = () => {
             const typeStr = timeframe.replace(' ', '').toLowerCase();
             api.get(`/reputation/leaderboard?limit=10&type=${typeStr}`)
                .then(res => {
                    if (res.success) setLeaders(res.data || []);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        };
        
        fetchLeaders();

        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
        socket.on('reputationUpdated', fetchLeaders);
        socket.on('leaderboardUpdated', fetchLeaders);

        return () => socket.disconnect();
    }, [timeframe]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[500px]">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
    );

    const safeLeaders = [...leaders, ...Array(Math.max(0, 10 - leaders.length)).fill(null)].map((l, i) => l || {
        userId: `ghost-${i}`,
        username: '---',
        fullName: '---',
        points: 0,
        monthlyPoints: 0,
        level: 'Beginner'
    });

    const top3 = [safeLeaders[1], safeLeaders[0], safeLeaders[2]];
    const rest = safeLeaders.slice(3, 10);

    const getDisplayScore = (user) => {
        return timeframe === 'Monthly' ? (user.monthlyPoints || 0) : (user.points || 0);
    };

    return (
        <div className="animate-fade-in text-slate-900 mx-auto max-w-6xl pb-10">
            {/* Header */}
            <div className="flex justify-center mb-8 mt-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">Leaderboard</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
                
                {/* Left Area (Podium & List) */}
                <div className="space-y-8">
                    
                    {/* 3D Podium Area */}
                    <div className="flex justify-center items-end h-[180px] sm:h-[240px] gap-1 sm:gap-2 mb-6 sm:mb-8">
                        
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center w-20 sm:w-28">
                            <div className="relative mb-4 flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-sm border-2 border-white"
                                     style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[top3[0]?.level]}, ${LEVEL_COLORS[top3[0]?.level]}dd)` }}>
                                    {(top3[0]?.fullName || top3[0]?.username).charAt(0).toUpperCase()}
                                </div>
                                <div className="text-xs font-semibold text-center truncate max-w-full mb-1 text-slate-700">{top3[0]?.fullName || top3[0]?.username}</div>
                                <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{getDisplayScore(top3[0])} Pts</div>
                            </div>
                            <div className="w-full h-[80px] sm:h-[110px] bg-indigo-300 rounded-t-xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white/90 shadow-inner z-10 border-t border-x border-indigo-400">
                                2
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center w-24 sm:w-32">
                            <div className="relative mb-4 sm:mb-5 flex flex-col items-center">
                                <Crown size={24} className="absolute -top-5 sm:-top-6 text-amber-400 drop-shadow-sm" fill="#fbbf24" stroke="#d97706" />
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl text-white shadow-md border-4 border-amber-300 z-10"
                                     style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[top3[1]?.level]}, ${LEVEL_COLORS[top3[1]?.level]}dd)` }}>
                                    {(top3[1]?.fullName || top3[1]?.username).charAt(0).toUpperCase()}
                                </div>
                                <div className="text-sm font-bold text-center truncate max-w-full my-1 text-slate-800">{top3[1]?.fullName || top3[1]?.username}</div>
                                <div className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full shadow-sm">{getDisplayScore(top3[1])} Pts</div>
                            </div>
                            <div className="w-full h-[110px] sm:h-[150px] bg-indigo-400 rounded-t-2xl flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-white shadow-inner z-20 border-t border-x border-indigo-500 relative">
                                1
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center w-20 sm:w-28">
                            <div className="relative mb-3 sm:mb-4 flex flex-col items-center">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-sm border-2 border-white"
                                     style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[top3[2]?.level]}, ${LEVEL_COLORS[top3[2]?.level]}dd)` }}>
                                    {(top3[2]?.fullName || top3[2]?.username).charAt(0).toUpperCase()}
                                </div>
                                <div className="text-xs font-semibold text-center truncate max-w-full mb-1 text-slate-700">{top3[2]?.fullName || top3[2]?.username}</div>
                                <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{getDisplayScore(top3[2])} Pts</div>
                            </div>
                            <div className="w-full h-[65px] sm:h-[90px] bg-indigo-200 rounded-t-xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white/80 shadow-inner z-0 border-t border-x border-indigo-300">
                                3
                            </div>
                        </div>

                    </div>

                    {/* Compact List Box */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Trophy size={16} className="text-indigo-500" />
                                <span>Leaderboard Rankings</span>
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === 'Monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setTimeframe('Monthly')}
                                >Monthly</button>
                                <button
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === 'All Time' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setTimeframe('All Time')}
                                >All Time</button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {rest.map((r, i) => (
                                <div key={r.userId} className="flex items-center p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl transition-all duration-200 hover:translate-x-1 border border-transparent hover:border-indigo-100">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-slate-400 mr-2 bg-white border border-slate-200 shadow-sm">
                                        {4 + i}
                                    </div>
                                    
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm mr-4"
                                         style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[r.level]}, ${LEVEL_COLORS[r.level]}dd)` }}>
                                        {(r.fullName || r.username).charAt(0).toUpperCase()}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-800 truncate">{r.fullName || r.username}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <ArrowUp size={12} className="text-emerald-500" />
                                            <span className="font-medium text-emerald-600 mr-1">Active</span> • {r.level}
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-600">
                                            <span className="text-xs text-slate-400 font-medium">Pts:</span>
                                            {getDisplayScore(r).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Area (Monthly Rewards) */}
                <div className="lg:pl-8 lg:border-l border-slate-200 h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                            <Award size={22} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none mb-1">Monthly</span>
                            <span className="text-xl font-bold text-slate-800 leading-none">Rewards</span>
                        </div>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                        At the end of each month, the top 10 contributors on our platform are rewarded with points to spend on premium deals and SaaS subscriptions!
                    </p>

                    <div className="space-y-2">
                        {REWARDS.map((rew, i) => (
                            <div key={rew.place} className={`flex items-center justify-between p-3.5 rounded-xl border ${i < 3 ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100'}`}>
                                <div className="text-sm font-bold text-slate-700">
                                    {rew.place} <span className="font-medium text-slate-400 ml-1 text-xs">place</span>
                                </div>
                                <div className={`text-sm font-extrabold ${i < 3 ? 'text-indigo-600' : 'text-slate-600'}`}>
                                    {rew.prize}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
