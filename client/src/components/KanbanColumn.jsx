import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const COLUMN_ACCENTS = {
    todo:        { color: '#6b7280', badge: 'badge-gray' },
    in_progress: { color: '#60a5fa', badge: 'badge-blue' },
    review:      { color: '#fb923c', badge: 'badge-orange' },
    done:        { color: '#34d399', badge: 'badge-green' },
};

export default function KanbanColumn({ column, tasks, onEditTask }) {
    const { setNodeRef } = useDroppable({ id: column.id });
    const accent = COLUMN_ACCENTS[column.id] || COLUMN_ACCENTS.todo;

    return (
        <div className="rounded-2xl p-4 w-72 flex flex-col flex-shrink-0 min-h-[500px]"
             style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)' }}>
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: accent.color }} />
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{column.title}</h3>
                </div>
                <span className={`badge ${accent.badge}`}>{tasks.length}</span>
            </div>

            <div ref={setNodeRef} className="flex-1 space-y-3">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <KanbanCard key={task.id} task={task} onEditTask={onEditTask} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
