import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';

export default function WorkspaceLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-x-hidden" style={{ background: 'var(--bg-gradient)', backgroundAttachment: 'fixed' }}>
            {/* Decorative Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex flex-1 ml-0 md:ml-64 flex-col min-w-0 relative z-10 transition-[margin] duration-300">
                <TopNav onMenuToggle={() => setSidebarOpen(prev => !prev)} />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
