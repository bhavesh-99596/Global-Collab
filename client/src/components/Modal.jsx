import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, maxWidth = '520px' }) {
    return (
        <div className="glass-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="glass-modal animate-fade-up" style={{ maxWidth }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-white/50 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
