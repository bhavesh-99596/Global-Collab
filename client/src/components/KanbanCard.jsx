import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock } from 'lucide-react';

const PRIORITY_BADGE = {
    critical: 'badge-pink',
    high: 'badge-orange',
    medium: 'badge-blue',
    low: 'badge-gray',
};

export default function KanbanCard({ task, onEditTask }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { ...task }
    });

    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            onClick={() => onEditTask && onEditTask(task)}
            style={{
                ...style,
                background: isDragging ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.60)',
                border: isDragging ? '2px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.7)',
                boxShadow: isDragging ? '0 16px 40px rgba(99,102,241,0.25)' : '0 4px 16px rgba(99,102,241,0.1)',
                borderRadius: '16px',
                padding: '14px',
                opacity: isDragging ? 0.85 : 1,
                cursor: isDragging ? 'grabbing' : 'pointer',
            }}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`badge ${PRIORITY_BADGE[task.priority?.toLowerCase()] || 'badge-gray'}`}>
                    {task.priority || 'medium'}
                </span>
                <div {...attributes} {...listeners}
                     onClick={(e) => e.stopPropagation()}
                     onPointerDown={(e) => {
                         // Let dnd-kit handle pointer down but prevent bubbling if needed
                         // e.stopPropagation(); 
                     }}
                     className="p-1 rounded-lg hover:bg-white/60 transition-colors cursor-grab active:cursor-grabbing"
                     style={{ color: 'var(--text-light)' }}>
                    <GripVertical size={14} />
                </div>
            </div>

            <h4 className="font-semibold text-sm mb-1 leading-snug" style={{ color: 'var(--text-heading)' }}>
                {task.title}
            </h4>
            {task.description && (
                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.5)' }}>
                {task.deadline ? (
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={11} /> {new Date(task.deadline).toLocaleDateString()}
                    </div>
                ) : <span />}
                {task.assignedUser && (
                    <div className="avatar-gradient h-6 w-6 text-xs" title={task.assignedUser}>
                        {task.assignedUser.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );
}
