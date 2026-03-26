import React from 'react';
import { useParams } from 'react-router-dom';
import {
    Star,
    MapPin,
    Globe,
    Github,
    Twitter,
    Code2,
    CheckCircle,
    Trophy
} from 'lucide-react';

export default function PublicPortfolio() {
    const { username } = useParams();

    const profile = {
        username: username || 'alex_dev',
        fullName: 'Alex K.',
        role: 'Senior Backend Engineer',
        bio: 'Passionate about distributed systems, API design, and scalable cloud architectures. 5+ years building SaaS platforms. Always open to collaborating on open-source infrastructure projects.',
        location: 'Remote, London',
        website: 'https://alexk.dev',
        social: {
            github: 'alex_k_code',
            twitter: '@alex_codes'
        },
        reputation: 4850,
        skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'GraphQL', 'TypeScript', 'Go']
    };

    const portfolioProjects = [
        {
            id: 1,
            name: 'GlobalCollab API Gateway',
            description: 'Built a highly scalable API gateway handling 10k+ req/sec using Node.js and Redis caching. Implemented rate limiting and JWT auth.',
            technologies: ['Node.js', 'Redis', 'Express'],
            link: 'github.com/alex_k_code/api-gateway'
        },
        {
            id: 2,
            name: 'Real-time Analytics Dashboard',
            description: 'Architected and developed a real-time analytics pipeline using WebSockets and timeseries databases.',
            technologies: ['React', 'WebSocket', 'PostgreSQL'],
            link: 'github.com/alex_k_code/analytics-ds'
        },
        {
            id: 3,
            name: 'Open Source Auth Module',
            description: 'Created an open-source authentication module used by over 500 projects with built-in OAuth support.',
            technologies: ['TypeScript', 'OAuth2'],
            link: 'github.com/alex_k_code/auth-module'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl w-full space-y-8">

                {/* Header Profile Section */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-700"></div>
                    <div className="px-6 sm:px-10 pb-8 relative">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-6">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-bold shadow-md">
                                {profile.fullName.charAt(0)}
                            </div>
                            <div className="mt-4 sm:mt-0 flex gap-3">
                                <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm">
                                    Hire Me
                                </button>
                                <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                                    Message
                                </button>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
                            <p className="text-xl text-blue-600 font-medium mt-1">{profile.role}</p>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} className="text-gray-400" />
                                    {profile.location}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Globe size={16} className="text-gray-400" />
                                    <a href={profile.website} className="hover:text-blue-600 transition-colors">{profile.website}</a>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Github size={16} className="text-gray-400" />
                                    <a href={`https://github.com/${profile.social.github}`} className="hover:text-blue-600 transition-colors">{profile.social.github}</a>
                                </div>
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
                                <span className="text-4xl font-bold text-gray-900">{profile.reputation.toLocaleString()}</span>
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Points</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Top 5% of GlobalCollab developers</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">{profile.bio}</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Code2 size={20} className="text-blue-500" />
                                Technologies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Projects */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <CheckCircle size={24} className="text-green-500" />
                            Featured Projects
                        </h2>

                        <div className="space-y-6">
                            {portfolioProjects.map((project) => (
                                <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                                    </div>
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        {project.description}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                                        <div className="flex flex-wrap gap-2">
                                            {project.technologies.map((tech, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                        <a href={`https://${project.link}`} className="text-sm text-gray-500 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors">
                                            <Github size={14} /> View Code
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
