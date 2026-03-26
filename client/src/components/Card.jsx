import React from 'react';

export default function Card({ children, className = '', noPadding = false, noHover = false }) {
    return (
        <div className={`glass-card ${noHover ? '' : ''} ${noPadding ? '' : 'p-5'} ${className}`}
             style={{ cursor: noHover ? 'default' : undefined }}>
            {children}
        </div>
    );
}
