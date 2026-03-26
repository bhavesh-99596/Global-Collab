import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    KanbanSquare,
    CheckSquare,
    Users,
    BarChart3,
    User,
    Settings,
    Sparkles,
    MessageSquare,
    LogOut,
    Compass,
    Trophy,
    Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [hasUnreadMessage, setHasUnreadMessage] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                const { api } = await import('../services/api');
                const res = await api.get('/notifications');
                if (res.success) {
                    const unreadMsgs = res.data.filter(n => !n.is_read && n.title.toLowerCase().includes('message'));
                    setHasUnreadMessage(unreadMsgs.length > 0);
                }
            } catch (err) {}
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);

        const SOCKET_URL = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
        const socket = io(SOCKET_URL);
        socket.emit('joinUser', user.id);
        socket.on('receiveNotification', (notif) => {
            if (notif.title?.toLowerCase().includes('message')) {
                setHasUnreadMessage(true);
            }
        });

        // Also turn off red dot when they visit messages page
        const handleLocationChange = () => {
            if (window.location.pathname.includes('/messages')) {
                setHasUnreadMessage(false);
            }
        };
        window.addEventListener('popstate', handleLocationChange);

        return () => {
            clearInterval(interval);
            socket.disconnect();
            window.removeEventListener('popstate', handleLocationChange);
        };
    }, [user]);

    const navItems = [
        { label: 'Dashboard',      path: '/dashboard',       icon: LayoutDashboard },
        { label: 'Projects',       path: '/projects',        icon: FolderKanban },
        { label: 'Project Board',  path: '/projects/1/board',icon: KanbanSquare },
        { label: 'My Tasks',       path: '/tasks',           icon: CheckSquare },
        { label: 'Explore',        path: '/explore',         icon: Compass },
        { label: 'Messages',       path: '/messages',        icon: MessageSquare },
        { label: 'Analytics',      path: '/analytics',       icon: BarChart3 },
        { label: 'Leaderboard',    path: '/leaderboard',     icon: Trophy },
        { label: 'Profile',        path: '/profile',         icon: User },
        { label: 'Settings',       path: '/settings',        icon: Settings },
    ];

    // Add admin panel link for admin users only
    if (user?.role === 'admin') {
        navItems.push({ label: 'Admin Panel', path: '/admin', icon: Shield });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="glass-sidebar fixed left-0 top-0 h-screen w-64 flex flex-col pt-6 z-20">
            {/* Logo */}
            <div className="px-5 mb-8 flex items-center gap-3">
                <div className="icon-badge" style={{ background: 'var(--grad-primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                    <Sparkles className="text-white h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--text-heading)' }}>GlobalCollab</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Workspace</p>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: 'var(--text-light)' }}>Main Menu</p>
        {navItems.map((item) => {
            const isMessagesSection = item.label === 'Messages';
            return (
                <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={() => {
                        if (isMessagesSection) setHasUnreadMessage(false);
                    }}
                    className={({ isActive }) =>
                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    <div className="relative">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {isMessagesSection && hasUnreadMessage && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-pink-500 shadow-sm animate-pulse border border-white"></span>
                        )}
                    </div>
                    <span>{item.label}</span>
                </NavLink>
            );
        })}
            </nav>

            {/* Divider */}
            <div className="px-3">
                <hr className="glass-divider" />
            </div>

            {/* User Card */}
            <div className="p-3 pb-5">
                <div className="glass-card-strong rounded-2xl p-3 flex items-center gap-3">
                    <div className="avatar-gradient h-9 w-9 text-sm">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
                            {user?.full_name || user?.username || 'User'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {user?.role || 'Developer'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
