import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
    Star,
    MapPin,
    Globe,
    Github,
    Twitter,
    Code2,
    CheckCircle,
    Trophy,
    Loader2
} from 'lucide-react';

export default function PublicPortfolio() {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/users/portfolio/${username}`)
            .then(res => {
                if (res.data) setProfile(res.data);
            })
            .catch(err => console.error("Error fetching portfolio:", err))
            .finally(() => setLoading(false));
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50 text-gray-500 text-lg">
                Portfolio not found or user does not exist.
            </div>
        );
    }

    // Dynamic hire button logic based on gender
    const hireText = profile.gender === 'Male' ? 'Hire Him' : profile.gender === 'Female' ? 'Hire Her' : 'Hire Me';

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl w-full space-y-8 animate-fade-in">

                {/* Header Profile Section */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-700"></div>
                    <div className="px-6 sm:px-10 pb-8 relative">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-6">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url.startsWith('http') ? profile.avatar_url : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') + profile.avatar_url} alt="Avatar" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover shadow-md bg-white" />
                            ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-bold shadow-md uppercase">
                                    {(profile.full_name || profile.username).charAt(0)}
                                </div>
                            )}
                            <div className="mt-4 sm:mt-0 flex gap-3">
                                <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm">
                                    {hireText}
                                </button>
                                <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                                    Message
                                </button>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.full_name || `@${profile.username}`}</h1>
                            <p className="text-lg sm:text-xl text-blue-600 font-medium mt-1 uppercase text-sm tracking-wider">{profile.gender ? profile.gender : 'Developer'}</p>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                {profile.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={16} className="text-gray-400" />
                                        {profile.location}
                                    </div>
                                )}
                                {profile.website && (
                                    <div className="flex items-center gap-1.5">
                                        <Globe size={16} className="text-gray-400" />
                                        <a href={profile.website} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">{profile.website.replace(/^https?:\/\//, '')}</a>
                                    </div>
                                )}
                                {profile.github && (
                                    <div className="flex items-center gap-1.5">
                                        <Github size={16} className="text-gray-400" />
                                        <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">{profile.github}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column - Bio & Stats */}
                    <div className="md:col-span-1 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" />
                                Reputation
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-gray-900">{(profile.reputation || 0).toLocaleString()}</span>
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Points</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Active platform contributor</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {profile.bio || "This user hasn't added a bio yet."}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Code2 size={20} className="text-blue-500" />
                                Technologies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills && profile.skills.length > 0 ? (
                                    profile.skills.map((skill, index) => (
                                        <span key={index} className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">No skills listed.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Projects */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <CheckCircle size={24} className="text-green-500" />
                            Featured Projects
                        </h2>

                        <div className="space-y-6">
                            {profile.portfolioProjects && profile.portfolioProjects.length > 0 ? (
                                profile.portfolioProjects.map((project) => (
                                    <div key={project.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                                        </div>
                                        <p className="text-gray-600 mb-6 leading-relaxed">
                                            {project.description || 'No description provided.'}
                                        </p>

                                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                                            <div className="flex flex-wrap gap-2">
                                                {project.technologies && project.technologies.map((tech, idx) => (
                                                    <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                            {project.link && (
                                                <a href={project.link.startsWith('http') ? project.link : `https://${project.link}`} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors">
                                                    <Github size={14} /> View Code
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-8 rounded-2xl shadow-sm border text-center text-gray-500">
                                    No public projects found for this user.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
