import React, { useState, useEffect } from 'react';
import { CheckCircle2, Users, FolderKanban, Star, Clock, Loader2 } from 'lucide-react';
import { activityService } from '../services/activity.service';

export default function ActivityFeed({ limit = 5, projectId = null }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const data = await activityService.getRecentActivities(limit, projectId);
                setActivities(data);
            } catch (error) {
                console.error("Error fetching activities", error);
                setActivities([]); // Set to empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [limit, projectId]);

    const getActivityConfig = (type) => {
        switch (type) {
            case 'task_completed':
                return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' };
            case 'review_submitted':
                return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' };
            case 'project_created':
                return { icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-50' };
            case 'points_earned':
                return { icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' };
            case 'team_joined':
                return { icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' };
            default:
                return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' };
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-6 text-gray-400">
                <Loader2 className="animate-spin" size={24} />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500 text-sm">
                No recent activity to display.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activities.map((activity) => {
                const config = getActivityConfig(activity.type);
                const Icon = config.icon;

                return (
                    <div key={activity.id} className="flex gap-4">
                        <div className={`mt-1 p-2 rounded-lg shrink-0 ${config.bg} ${config.color}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                {activity.action || activity.text}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(activity.time).toLocaleDateString()}
                                </span>
                                {activity.project && (
                                    <span className="flex items-center gap-1 before:content-['•'] before:mr-2">
                                        <FolderKanban size={12} />
                                        {activity.project}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
