import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { LogIn, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const inputClass = 'glass-input-rect w-full px-4 py-3 text-sm placeholder:text-gray-400';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMsg(location.state.successMessage);
            navigate(location.pathname, { replace: true, state: {} });
            const timer = setTimeout(() => setSuccessMsg(''), 3500);
            return () => clearTimeout(timer);
        }
    }, [location.state, navigate, location.pathname]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', formData);
            if (res.success) {
                login(res.user, res.token);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Invalid credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ background: 'var(--bg-gradient)', backgroundAttachment: 'fixed' }}
        >
            {/* Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <div className="icon-badge h-11 w-11 rounded-2xl"
                             style={{ background: 'var(--grad-primary)', boxShadow: '0 4px 18px rgba(99,102,241,0.45)' }}>
                            <Sparkles className="text-white h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>GlobalCollab</h1>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your workspace</p>
                </div>

                {/* Card */}
                <div className="glass-modal p-8 animate-fade-up">
                    <h2 className="text-xl font-bold mb-1 text-center" style={{ color: 'var(--text-heading)' }}>Welcome back</h2>
                    <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: '#6366f1', fontWeight: 600 }}>Create one</Link>
                    </p>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {successMsg && (
                            <div className="flex items-center gap-2 p-3 rounded-2xl text-sm"
                                 style={{ background: 'rgba(52,211,153,0.15)', color: '#059669', border: '1px solid rgba(52,211,153,0.3)' }}>
                                <CheckCircle size={15} /> {successMsg}
                            </div>
                        )}
                        {error && (
                            <div className="p-3 rounded-2xl text-sm text-center"
                                 style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Email Address
                            </label>
                            <input id="email-address" name="email" type="email" autoComplete="email"
                                required className={inputClass} placeholder="you@example.com"
                                value={formData.email} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Password
                            </label>
                            <input id="password" name="password" type="password" autoComplete="current-password"
                                required className={inputClass} placeholder="••••••••"
                                value={formData.password} onChange={handleChange} />
                        </div>

                        <div className="pt-2">
                            <button type="submit" disabled={isLoading} id="login-submit"
                                className="btn-gradient w-full justify-center py-3 text-base disabled:opacity-50">
                                <LogIn size={16} />
                                {isLoading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
