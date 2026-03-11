import React from 'react';
import { ShieldCheck, Database, Layout } from 'lucide-react';

interface ProfessionalLayoutProps {
    children: React.ReactNode;
}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#0A192F] text-slate-300 font-sans selection:bg-[#64FFDA] selection:text-[#0A192F]">
            {/* Enterprise Header */}
            <header className="border-b border-slate-800 bg-[#0A192F]/90 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#64FFDA] rounded flex items-center justify-center">
                            <Layout className="w-5 h-5 text-[#0A192F]" />
                        </div>
                        <span className="text-xl font-bold text-slate-100 tracking-tight">ABMEL <span className="text-[#64FFDA] text-sm font-mono ml-2">SYSTEMS</span></span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#" className="hover:text-[#64FFDA] transition-colors">Methodology</a>
                        <a href="#" className="hover:text-[#64FFDA] transition-colors">System Architecture</a>
                        <a href="#" className="hover:text-[#64FFDA] transition-colors">Audit Logs</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#112240] rounded-full border border-slate-700">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-mono text-slate-400">SYSTEM ONLINE</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600"></div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {children}
            </main>

            {/* Verification Footer */}
            <footer className="border-t border-slate-800 mt-20 py-8 bg-[#020c1b]">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-xs text-slate-500 font-mono">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>PROVABLE CORRECTNESS ENABLED</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <span>ARTIFACTS PERSISTED</span>
                        </div>
                    </div>
                    <div>
                        ID: {new Date().toISOString().split('T')[0]}-ABMEL-V1
                    </div>
                </div>
            </footer>
        </div>
    );
};
