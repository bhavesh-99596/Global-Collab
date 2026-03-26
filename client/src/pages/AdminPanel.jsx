import React, { useState, useEffect } from 'react';
import { Shield, Trash2, UserCog, Users, AlertTriangle, Search, Crown } from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

const ROLE_OPTIONS = ['Developer', 'Designer', 'Manager', 'admin'];
const ROLE_COLORS = {
    admin: 'linear-gradient(135deg, #f472b6, #a78bfa)',
    Developer: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    Designer: 'linear-gradient(135deg, #22d3ee, #60a5fa)',
    Manager: 'linear-gradient(135deg, #34d399, #10b981)',
};

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [roleTarget, setRoleTarget] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            if (res && res.data) {
                setUsers(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            alert(err.message || 'Access denied');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/admin/users/${deleteTarget.id}`);
            setUsers(users.filter(u => u.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            alert(err.message || 'Failed to delete user');
        }
    };

    const handleRoleChange = async () => {
        if (!roleTarget || !selectedRole) return;
        try {
            const res = await api.put(`/admin/users/${roleTarget.id}/role`, { role: selectedRole });
            if (res && res.data) {
                setUsers(users.map(u => u.id === roleTarget.id ? { ...u, role: res.data.role } : u));
            }
            setRoleTarget(null);
            setSelectedRole('');
        } catch (err) {
            alert(err.message || 'Failed to change role');
        }
    };

    const filteredUsers = users.filter(u =>
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                        <Shield size={24} style={{ color: '#6366f1' }} />
                        Admin Panel
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {users.length} registered user{users.length !== 1 ? 's' : ''} · Manage roles and access
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="glass-card p-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass-input-rect w-full pl-10 pr-4 py-2.5 text-sm"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3" style={{ color: 'var(--text-muted)' }}>User</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3" style={{ color: 'var(--text-muted)' }}>Email</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3" style={{ color: 'var(--text-muted)' }}>Role</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3" style={{ color: 'var(--text-muted)' }}>Rep</th>
                                <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3" style={{ color: 'var(--text-muted)' }}>Joined</th>
                                <th className="text-right text-xs font-semibold uppercase tracking-wider px-5 py-3" style={{ color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => {
                                const roleGrad = ROLE_COLORS[u.role] || ROLE_COLORS['Developer'];
                                const isAdmin = u.role === 'admin';
                                return (
                                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
                                        className="hover:bg-white/30 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="avatar-gradient h-9 w-9 text-sm flex-shrink-0">
                                                    {(u.username || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
                                                        {u.full_name || u.username}
                                                        {isAdmin && <Crown size={12} style={{ color: '#f59e0b' }} />}
                                                    </p>
                                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm" style={{ color: 'var(--text-body)' }}>{u.email}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                                                  style={{ background: roleGrad }}>
                                                {u.role || 'Developer'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-bold" style={{ color: '#6366f1' }}>{u.reputation || 0}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setRoleTarget(u); setSelectedRole(u.role || 'Developer'); }}
                                                    className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                                                    style={{ color: 'var(--text-muted)' }}
                                                    title="Change Role"
                                                >
                                                    <UserCog size={15} />
                                                </button>
                                                {!isAdmin && (
                                                    <button
                                                        onClick={() => setDeleteTarget(u)}
                                                        className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                                                        style={{ color: '#ef4444' }}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--text-light)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)' }}>
                            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                                    Delete user "{deleteTarget.username}"?
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    This will permanently remove the user and all their associated data (projects, tasks, messages). This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="btn-glass">Cancel</button>
                            <button onClick={handleDelete}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                Delete User
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Role Change Modal */}
            {roleTarget && (
                <Modal title="Change Role" onClose={() => setRoleTarget(null)}>
                    <div className="space-y-4">
                        <p className="text-sm" style={{ color: 'var(--text-body)' }}>
                            Change role for <strong>{roleTarget.username}</strong>
                        </p>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="glass-input-rect w-full px-4 py-2.5 text-sm"
                        >
                            {ROLE_OPTIONS.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRoleTarget(null)} className="btn-glass">Cancel</button>
                            <button onClick={handleRoleChange} className="btn-gradient">
                                Save Role
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
