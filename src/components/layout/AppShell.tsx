import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, HelpCircle, Search, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Notifications } from '../ui/Notifications';
import { HelpModal } from '../ui/HelpModal';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const { setView } = useNavigationStore();
    const { user, signOut } = useAuthStore();

    return (
        <div className="min-h-screen bg-slate-950 flex overflow-hidden">
            <Notifications />
            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 md:ml-64 ml-0 min-w-0 flex flex-col h-screen relative z-10 transition-all duration-300">
                {/* Executive Top Bar */}
                <header className="h-16 px-6 flex items-center justify-between z-40 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 sticky top-0">

                    {/* Left: Context / Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden text-slate-400 hover:text-slate-100"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex items-center text-sm font-medium">
                            <span className="text-slate-400">Campaigns</span>
                            <span className="mx-2 text-slate-600">/</span>
                            <span className="text-slate-200">Q1 Product Launch</span>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative hidden md:block">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-1.5 text-sm bg-slate-900 border border-slate-800 rounded-md focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 w-64 text-slate-200 placeholder:text-slate-500"
                            />
                        </div>

                        <div className="h-6 w-px bg-slate-800 mx-1"></div>

                        {/* Notifications */}
                        <button className="text-slate-400 hover:text-slate-200 relative">
                            <Bell size={18} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-slate-950"></span>
                        </button>

                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            <HelpCircle size={18} />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="text-right hidden md:block leading-tight">
                                    <div className="text-xs font-semibold text-slate-200">{user?.email?.split('@')[0] || 'User'}</div>
                                    <div className="text-[10px] text-slate-500">Admin</div>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white border border-slate-700">
                                    <span className="text-xs font-bold">{user?.email?.[0].toUpperCase() || 'U'}</span>
                                </div>
                                <ChevronDown size={14} className={clsx("text-slate-500 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isProfileOpen && (
                                    <div
                                        className="absolute top-12 right-0 w-48 bg-slate-900 rounded-lg shadow-xl border border-slate-800 z-50 overflow-hidden"
                                    >
                                        <div className="py-1">
                                            <DropdownItem icon={<User size={14} />} label="Profile" onClick={() => { setView('settings'); setIsProfileOpen(false); }} />
                                            <DropdownItem icon={<Settings size={14} />} label="Settings" onClick={() => { setView('settings'); setIsProfileOpen(false); }} />
                                            <div className="border-t border-slate-800 my-1"></div>
                                            <button
                                                onClick={() => { signOut(); setIsProfileOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-slate-800 rounded-none transition-colors flex items-center gap-3"
                                            >
                                                <LogOut size={14} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scroll-smooth bg-slate-950">
                    {/* Static clean background - no blobs */}
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

const DropdownItem = ({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3"
    >
        {icon}
        {label}
    </button>
);
