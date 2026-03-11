import React from 'react';
import { motion } from 'framer-motion';

export const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) => {
    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center font-sans">
            {/* Immersive Animated Background */}
            <div className="absolute inset-0 bg-navy-950 z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute top-0 -left-1/4 w-full h-full bg-gradient-to-br from-blue-900/30 to-transparent blur-3xl opacity-60 animate-pulse duration-[8000ms]"></div>
                <div className="absolute bottom-0 -right-1/4 w-full h-full bg-gradient-to-tl from-cyan-900/20 to-transparent blur-3xl opacity-60 animate-pulse duration-[10000ms] delay-1000"></div>

                {/* 3D-like Mesh Grid (CSS only for performance) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>

            {/* Content Container - Floating Monolith */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Header Section if provided */}
                {(title || subtitle) && (
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">{title}</h1>
                            <p className="text-slate-400 text-sm">{subtitle}</p>
                        </motion.div>
                    </div>
                )}

                {/* Glass Card */}
                <div className="bg-navy-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                    {/* Content */}
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="text-center mt-6 opacity-40">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Powered by ABMEL Intelligence</p>
                </div>
            </motion.div>
        </div>
    );
};
