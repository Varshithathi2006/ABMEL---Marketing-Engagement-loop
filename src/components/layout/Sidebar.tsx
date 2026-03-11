import { Home, PlayCircle, BarChart2, Settings, ShieldCheck, Box, X } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
    const { currentView, setView } = useNavigationStore();
    const navigate = useNavigate();

    const handleNavigation = (view: any) => {
        setView(view);
        navigate('/');
        onClose?.();
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/80 z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={clsx(
                "w-64 h-screen fixed left-0 top-0 flex flex-col z-50 border-r border-slate-800 bg-slate-950 transition-transform duration-300 md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Box className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-100 leading-none">ABMEL</h1>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Enterprise</p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden ml-auto text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-8 overflow-y-auto w-full">
                    <div>
                        <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform</p>
                        <div className="space-y-0.5">
                            <NavItem
                                icon={<Home size={18} />}
                                label="Dashboard"
                                active={currentView === 'dashboard'}
                                onClick={() => handleNavigation('dashboard')}
                            />
                            <NavItem
                                icon={<PlayCircle size={18} />}
                                label="Campaigns"
                                active={currentView === 'campaigns'}
                                onClick={() => handleNavigation('campaigns')}
                            />
                            <NavItem
                                icon={<BarChart2 size={18} />}
                                label="Analytics"
                                active={currentView === 'performance'}
                                onClick={() => handleNavigation('performance')}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Governance</p>
                        <div className="space-y-0.5">
                            <NavItem
                                icon={<ShieldCheck size={18} />}
                                label="Guardrails"
                                active={currentView === 'guardrails'}
                                onClick={() => handleNavigation('guardrails')}
                            />
                            <NavItem
                                icon={<Settings size={18} />}
                                label="Settings"
                                active={currentView === 'settings'}
                                onClick={() => handleNavigation('settings')}
                            />
                        </div>
                    </div>
                </nav>

                {/* System Status Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <SystemStatusPanel />
                </div>
            </aside>
        </>
    );
};

// Extracted for cleaner component
import { useSystemHealth } from '../../hooks/useSystemHealth';

const SystemStatusPanel = () => {
    const health = useSystemHealth();

    // Normalize status color
    const statusColor = health.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500';
    const statusText = health.status === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">System Status</span>
                <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", statusColor)}></div>
                    <span className={clsx("text-xs font-medium", statusText)}>{health.status}</span>
                </div>
            </div>

            <StatusMetric label="Neural Engine" value={health.aiStatus === 'Operational' ? 100 : 60} color="bg-blue-600" displayValue={health.aiStatus} />
            <StatusMetric label="DB Latency" value={Math.min(100, (health.dbLatency / 200) * 100)} color="bg-slate-500" displayValue={`${health.dbLatency}ms`} />
        </div>
    );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
            active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        )}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const StatusMetric = ({ label, value, color, displayValue }: { label: string, value: number, color: string, displayValue?: string }) => (
    <div>
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>{label}</span>
            <span className="text-slate-400 font-mono">{displayValue}</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
                style={{ width: `${value}%` }}
                className={clsx(color, "h-full rounded-full")}
            />
        </div>
    </div>
);
