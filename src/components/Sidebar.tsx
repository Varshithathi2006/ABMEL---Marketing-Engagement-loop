import { Home, PlayCircle, BarChart2, Settings, ShieldCheck, Box } from 'lucide-react';
import { useNavigationStore } from '../store/useNavigationStore';

export const Sidebar = () => {
    const { currentView, setView } = useNavigationStore();

    return (
        <aside className="w-64 bg-slate-950 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 shadow-xl z-50">
            {/* Brand Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Box className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white leading-none">ABMEL</h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Enterprise AI</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <div className="mb-6">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Core Platform</p>
                    <NavItem
                        icon={<Home size={18} />}
                        label="Dashboard"
                        active={currentView === 'dashboard'}
                        onClick={() => setView('dashboard')}
                    />
                    <NavItem
                        icon={<PlayCircle size={18} />}
                        label="Active Campaigns"
                        active={currentView === 'campaigns'}
                        onClick={() => setView('campaigns')}
                    />
                    <NavItem
                        icon={<BarChart2 size={18} />}
                        label="Performance"
                        active={currentView === 'performance'}
                        onClick={() => setView('performance')}
                    />
                </div>

                <div>
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Governance</p>
                    <NavItem
                        icon={<ShieldCheck size={18} />}
                        label="Guardrails & Safety"
                        active={currentView === 'guardrails'}
                        onClick={() => setView('guardrails')}
                    />
                    <NavItem
                        icon={<Settings size={18} />}
                        label="System Settings"
                        active={currentView === 'settings'}
                        onClick={() => setView('settings')}
                    />
                </div>
            </nav>

            {/* System Status Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Status</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-500">ONLINE</span>
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>GPU Load</span>
                        <span className="text-slate-300">12%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-blue-600 w-[12%] h-full rounded-full"></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Memory</span>
                        <span className="text-slate-300">4.2GB</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 w-[35%] h-full rounded-full"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
    >
        {icon}
        <span className="text-sm font-medium">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
    </button>
);
