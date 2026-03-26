import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function TopNav() {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
        }
        function handleEscape(e) {
            if (e.key === 'Escape') setDropdownOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    // Fetch Notifications
    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                const { api } = await import('../services/api');
                const res = await api.get('/notifications');
                if (res.success) setNotifications(res.data);
            } catch (err) { console.error('Failed to load notifications'); }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000); // 30s polling fallback
        
        // Real-time socket connection for notifications
        const SOCKET_URL = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
        const socket = io(SOCKET_URL);
        socket.emit('joinUser', user.id);
        
        socket.on('receiveNotification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
        });
        
        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [user]);

    const handleReadNotification = async (id) => {
        try {
            const { api } = await import('../services/api');
            await api.put(`/notifications/read/${id}`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) { }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleLogout = () => {
        setDropdownOpen(false);
        logout();
    };

    return (
        <header className="glass-navbar fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-6 py-3">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    </span>
                    <input
                        type="text"
                        className="glass-input block w-full pl-10 pr-4 py-2 text-sm placeholder:text-gray-400"
                        placeholder="Search projects, tasks, people…"
                    />
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4 ml-6">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => { setShowNotifications(prev => !prev); setDropdownOpen(false); }}
                        className="relative p-2 rounded-xl transition-colors hover:bg-white/40"
                        aria-label="Notifications"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        {unreadCount > 0 && (
                            <span
                                className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white"
                                style={{ background: '#f472b6', boxShadow: '0 0 6px rgba(244,114,182,0.8)' }}
                            />
                        )}
                        <Bell className="h-5 w-5" />
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-14 w-80 rounded-2xl py-2 z-30 animate-fade-in shadow-xl"
                             style={{
                                 background: 'rgba(255,255,255,0.95)',
                                 backdropFilter: 'blur(24px)',
                                 border: '1px solid rgba(226,232,240,0.8)',
                             }}>
                            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: 'rgba(226,232,240,0.8)' }}>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--grad-primary)', color: 'white' }}>
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto mt-1 px-2 space-y-1 scrollbar-hide">
                                {notifications.length === 0 ? (
                                    <p className="text-xs text-center p-6 opacity-50" style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
                                ) : notifications.map(n => (
                                    <div key={n.id} onClick={() => !n.is_read && handleReadNotification(n.id)}
                                         className={`p-3 rounded-xl cursor-pointer transition-colors ${!n.is_read ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-gray-50/80'}`}>
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <h4 className={`text-[13px] ${!n.is_read ? 'font-bold' : 'font-semibold'}`} style={{ color: 'var(--text-heading)' }}>{n.title}</h4>
                                                <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                                                <span className="text-[9px] mt-1.5 font-medium opacity-60 block">
                                                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0"></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        id="user-menu-button"
                        aria-haspopup="true"
                        aria-expanded={dropdownOpen}
                        onClick={() => setDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2.5 focus:outline-none"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-heading)' }}>
                                {user?.full_name || user?.username || 'User'}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {user?.reputation || 0} rep
                            </p>
                        </div>

                        {/* Avatar with gradient ring */}
                        <div className="relative">
                            <div className="h-9 w-9 rounded-full avatar-gradient text-sm ring-2 ring-white ring-offset-1"
                                 style={{ background: 'var(--grad-primary)' }}>
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                        </div>

                        <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                            style={{ color: 'var(--text-muted)' }}
                        />
                    </button>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="user-menu-button"
                            className="absolute right-0 top-14 w-56 rounded-2xl py-1 z-30 animate-fade-in"
                            style={{
                                background: 'rgba(255,255,255,0.80)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255,255,255,0.7)',
                                boxShadow: '0 12px 40px rgba(99,102,241,0.18)'
                            }}
                        >
                            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.5)' }}>
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
                                    {user?.full_name || user?.username}
                                </p>
                                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                            </div>

                            <Link
                                to="/profile"
                                role="menuitem"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-white/60 transition-colors rounded-xl mx-1 mt-1"
                                style={{ color: 'var(--text-body)' }}
                            >
                                <User size={14} style={{ color: '#6366f1' }} /> My Profile
                            </Link>

                            <Link
                                to="/settings"
                                role="menuitem"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-white/60 transition-colors rounded-xl mx-1"
                                style={{ color: 'var(--text-body)' }}
                            >
                                <Settings size={14} style={{ color: '#8b5cf6' }} /> Settings
                            </Link>

                            <div className="border-t mx-1 mt-1" style={{ borderColor: 'rgba(255,255,255,0.5)' }}>
                                <button
                                    id="logout-button"
                                    role="menuitem"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors rounded-xl mt-0.5"
                                    style={{ color: '#ef4444' }}
                                >
                                    <LogOut size={14} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
