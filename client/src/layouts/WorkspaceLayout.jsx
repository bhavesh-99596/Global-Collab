import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';

export default function WorkspaceLayout() {
    return (
        <div className="flex h-screen" style={{ background: 'var(--bg-gradient)', backgroundAttachment: 'fixed' }}>
            {/* Decorative Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <Sidebar />

            <main className="flex flex-1 ml-64 flex-col min-w-0 relative z-10">
                <TopNav />
                <div className="flex-1 overflow-y-auto p-6 mt-16">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
