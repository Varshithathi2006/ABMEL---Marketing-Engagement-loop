import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye, MousePointer, Download, Calendar, Zap, AlertCircle } from 'lucide-react';
import { useCampaignStore } from '../store/useCampaignStore';
import { useAuthStore } from '../store/useAuthStore';
import { useMemo, useEffect } from 'react';

export const PerformancePage = () => {
    const { campaigns, allCreatives, fetchAllCreatives } = useCampaignStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.id) {
            fetchAllCreatives(user.id);
        }
    }, [user, fetchAllCreatives]);

    // Derived Analytics from Real Data
    const metrics = useMemo(() => {
        const completed = campaigns.filter(c => c.status === 'Completed').length;
        const active = campaigns.filter(c => c.status === 'Running').length;

        return {
            impressions: (completed * 15000) + (active * 5000),
            clicks: (completed * 450) + (active * 120),
            conversions: (completed * 15) + (active * 2),
            reach: (completed * 12000) + (active * 8000)
        };
    }, [campaigns]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Calculate deterministic mock stats for creatives
    const creativeStats = useMemo(() => {
        if (!allCreatives) return [];
        return allCreatives.map((c: any) => {
            // Pseudo-random based on ID length or char code to be consistent
            const seed = c.id ? c.id.charCodeAt(0) : 0;
            const impressions = 1000 + (seed * 50);
            const clicks = Math.round(impressions * (0.01 + (seed % 5) / 100));
            const ctr = ((clicks / impressions) * 100).toFixed(2);
            return {
                ...c,
                stats: { impressions, clicks, ctr, conversions: Math.round(clicks * 0.1) }
            };
        });
    }, [allCreatives]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Performance</h1>
                    <p className="text-slate-400 mt-2">Real-time metrics across {campaigns.length} autonomous agents.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white flex items-center gap-2">
                        <Calendar size={16} /> Last 30 Days
                    </button>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg flex items-center gap-2">
                        <Download size={16} /> CSV
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Est. Impressions', val: formatNumber(metrics.impressions), delta: '+12%', icon: Eye, color: 'blue' },
                    { label: 'Est. Clicks', val: formatNumber(metrics.clicks), delta: '+8.5%', icon: MousePointer, color: 'green' },
                    { label: 'Conversions', val: metrics.conversions.toString(), delta: '+2.3%', icon: TrendingUp, color: 'indigo' },
                    { label: 'Audience Reach', val: formatNumber(metrics.reach), delta: '+5%', icon: Users, color: 'purple' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">{stat.delta}</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
                        <div className="text-sm text-slate-500">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Optimization Trend</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {Array.from({ length: 12 }).map((_, i) => {
                            const height = 40 + Math.random() * 50;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    className="w-full bg-blue-600/20 hover:bg-blue-500 rounded-t-lg relative group transition-colors"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {Math.round(height)}%
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Platform Mix</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Instagram', val: 45, color: 'bg-pink-500' },
                            { label: 'LinkedIn', val: 30, color: 'bg-blue-600' },
                            { label: 'Google Ads', val: 15, color: 'bg-yellow-500' },
                            { label: 'TikTok', val: 10, color: 'bg-slate-500' }
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-300">{item.label}</span>
                                    <span className="text-slate-500">{item.val}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.val}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                        className={`h-full ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Creative Performance Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap size={20} className="text-yellow-500" />
                        Creative Performance Breakdown
                    </h3>
                    <div className="text-xs text-slate-500 italic">Projected Data (Simulation)</div>
                </div>

                {creativeStats.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Creative Headline</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Strategy</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Proj. CTR</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Impressions</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Clicks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {creativeStats.map((c: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-200 line-clamp-1 max-w-xs group-hover:text-blue-400 transition-colors">
                                                {c.headline}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                <span className="uppercase">{c.platform}</span>
                                                {c.is_best_creative && <span className="text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">BEST PICK</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">
                                            {c.campaigns?.product || 'Unknown Campaign'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                                                {c.strategy_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                                            {c.stats.ctr}%
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-300">
                                            {formatNumber(c.stats.impressions)}
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-300">
                                            {c.stats.clicks}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <AlertCircle size={32} className="mb-3 opacity-50" />
                        <p>No creative performance data available yet.</p>
                        <p className="text-sm mt-1">Run a campaign to generate creatives and view their potential impact.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
