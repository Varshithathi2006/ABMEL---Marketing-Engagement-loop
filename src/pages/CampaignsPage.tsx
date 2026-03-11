import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreHorizontal, ArrowUpRight, Calendar, BarChart3, Users, Plus, X, FileJson, CheckCircle2 } from 'lucide-react';

import { useCampaignStore } from '../store/useCampaignStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const CampaignsPage = () => {
    const { campaigns, fetchCampaigns, fetchCampaignDetails } = useCampaignStore();
    const { user } = useAuthStore();
    const { setView } = useNavigationStore();
    const navigate = useNavigate();

    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [details, setDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchCampaigns(user.id);
        }
    }, [user, fetchCampaigns]);

    const handleSelectCampaign = async (campaign: any) => {
        setSelectedCampaign(campaign);
        setLoadingDetails(true);
        // data.fetchCampaignDetails doesn't exist on type, correcting implementation
        // Fixed: Added fetchCampaignDetails to store interface and implementation previously
        const artifacts = await fetchCampaignDetails(campaign.id);
        setDetails(artifacts);
        setLoadingDetails(false);
    };

    return (
        <div className="space-y-6 relative h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Campaign Archive</h1>
                    <p className="text-slate-400 mt-2">Manage and review autonomous agent operations.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white flex items-center gap-2">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        <ArrowUpRight size={16} /> Export Report
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col h-full max-h-[600px]">
                <div className="p-4 border-b border-slate-800 flex items-center gap-4 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {campaigns.length === 0 ? (
                        <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BarChart3 className="text-slate-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Active Campaigns</h3>
                            <p className="text-slate-400 mb-6">Start a new autonomous marketing strategy to see data here.</p>
                            <button
                                onClick={() => setView('dashboard')}
                                className="px-6 py-3 bg-[#64FFDA] text-[#0A192F] font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
                            >
                                <Plus size={18} /> Launch New Campaign
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-slate-900 z-10">
                                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs font-bold">
                                    <th className="px-6 py-4">Preview</th>
                                    <th className="px-6 py-4">Campaign Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Timeline</th>
                                    <th className="px-6 py-4">Audience</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {campaigns.map((campaign, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={campaign.id}
                                        onClick={() => handleSelectCampaign(campaign)}
                                        className="group hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
                                                {campaign.preview_url ? (
                                                    <img src={campaign.preview_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                                        <BarChart3 size={16} className="text-slate-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{campaign.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 opacity-60">ID: {campaign.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                campaign.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    campaign.status === 'Running' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        'bg-slate-700/50 text-slate-400 border-slate-600/50'
                                            )}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-500" />
                                                <span className="text-xs font-medium">{campaign.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-slate-500" />
                                                {campaign.audience}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-green-400 font-bold">
                                                <BarChart3 size={14} />
                                                {campaign.performance}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Campaign Detail Slide-Over */}
            <AnimatePresence>
                {selectedCampaign && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedCampaign(null)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedCampaign.name}</h2>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                        <span className="font-mono">ID: {selectedCampaign.id}</span>
                                        <span>•</span>
                                        <span>{selectedCampaign.date}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Campaign Preview Image */}
                            {selectedCampaign.preview_url && (
                                <div className="mb-8 rounded-2xl overflow-hidden aspect-video bg-slate-800 border border-slate-800 shadow-2xl relative group">
                                    <img
                                        src={selectedCampaign.preview_url}
                                        alt="Campaign Primary Visual"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-400/30">
                                            Primary Visual
                                        </span>
                                    </div>
                                </div>
                            )}

                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                    <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full mb-4"></div>
                                    <p>Retrieving Agent Artifacts...</p>
                                </div>
                            ) : !details || Object.keys(details).length === 0 ? (
                                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center">
                                    <FileJson className="mx-auto text-slate-600 mb-4" size={32} />
                                    <p className="text-slate-400">No structured artifacts found for this campaign.</p>
                                    <p className="text-xs text-slate-600 mt-2">Check 'agent_outputs' table or ensure Orchestrator persisted data.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Render Artifacts */}
                                    {Object.entries(details).map(([agentName, data]: [string, any]) => (
                                        <div key={agentName} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                                            <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <h3 className="font-bold text-slate-200 capitalize">
                                                    {agentName.replace(/_/g, ' ')} Output
                                                </h3>
                                            </div>
                                            <div className="p-4 bg-slate-950">
                                                <pre className="text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
                                                    {JSON.stringify(data, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate(`/campaigns/${selectedCampaign.id}/creatives`)}
                                    className="w-full py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                                    <ArrowUpRight size={18} />
                                    View Creatives
                                </button>
                                <button className="w-full py-4 bg-slate-800 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                                    <FileJson size={18} />
                                    Export JSON
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
