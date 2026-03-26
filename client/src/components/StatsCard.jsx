import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const ICON_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #22d3ee, #60a5fa)',
    'linear-gradient(135deg, #f472b6, #a78bfa)',
    'linear-gradient(135deg, #34d399, #10b981)',
    'linear-gradient(135deg, #fb923c, #f59e0b)',
];

export default function StatsCard({ title, value, icon: Icon, trend, index = 0 }) {
    const gradient = ICON_GRADIENTS[index % ICON_GRADIENTS.length];

    return (
        <div className="glass-card p-4 sm:p-5 animate-fade-up">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                        {title}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-heading)' }}>{value}</p>
                </div>
                {Icon && (
                    <div className="icon-badge h-11 w-11 rounded-2xl flex-shrink-0"
                         style={{ background: gradient, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                        <Icon className="text-white h-5 w-5" />
                    </div>
                )}
            </div>
            {trend && (
                <div className="flex items-center gap-1.5">
                    {trend.isPositive
                        ? <TrendingUp size={13} style={{ color: '#10b981' }} />
                        : <TrendingDown size={13} style={{ color: '#ef4444' }} />
                    }
                    <span className="text-xs font-semibold" style={{ color: trend.isPositive ? '#10b981' : '#ef4444' }}>
                        {trend.value}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
                </div>
            )}
        </div>
    );
}
