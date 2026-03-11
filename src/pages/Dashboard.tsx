import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useCampaignStore } from '../store/useCampaignStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom'; // Added
import { AgentExecutionView } from '../components/AgentExecutionView';
import { PromptingInterface } from '../components/prompting/PromptingInterface';
import { CreativeReview } from './CreativeReview';

export const Dashboard = () => {
    const { status, executeCampaign, campaigns, fetchCampaigns } = useCampaignStore();
    const { user } = useAuthStore();
    const navigate = useNavigate(); // Hook

    useEffect(() => {
        if (user?.id) fetchCampaigns(user.id);
    }, [user, fetchCampaigns]);

    // Derived Metrics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Running').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'Completed').length;

    // View: Active Execution
    if (status === 'running' || status === 'CREATIVES_READY') {
        return <AgentExecutionView />;
    }

    // View: Completed Review
    if (status === 'completed') {
        return <CreativeReview />;
    }

    // View: Planning Approval
    if (status === 'planned') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Execution Plan Generated</h1>
                        <p className="text-slate-400 mt-2">Review the proposed agent workflow before execution.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => executeCampaign()}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/25 transition-all"
                    >
                        <Play size={20} className="fill-current" />
                        Approve & Execute
                    </motion.button>
                </div>
                <AgentExecutionView />
            </div>
        );
    }

    // Default View: Dashboard Overview + Prompting Interface
    return (
        <div className="space-y-8">
            {/* Header / Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Campaigns</h3>
                    <div className="text-4xl font-bold text-white">{totalCampaigns}</div>
                    <div className="mt-4 flex gap-3 text-xs font-bold">
                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{activeCampaigns} Active</span>
                        <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">{completedCampaigns} Done</span>
                    </div>
                </div>

                <div className="md:col-span-3 bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Welcome back, {user?.email ? user.email.split('@')[0] : 'Commander'}
                        </h2>
                        <p className="text-slate-400 max-w-lg">
                            System is fully operational. {activeCampaigns > 0 ? 'Agents are currently executing optimization protocols.' : 'Ready to initialize new autonomous marketing cycle.'}
                        </p>
                    </div>
                    {/* Abstract bg element */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-1">
                <PromptingInterface />
            </div>

            {/* Recent Activity Mini-Table */}
            {campaigns.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Recent Activity
                    </h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-3">Campaign</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Result</th>
                                    <th className="px-6 py-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {campaigns.slice(0, 3).map((c, i) => (
                                    <tr
                                        key={c.id || i}
                                        onClick={() => navigate(`/campaigns/${c.id}/creatives`)} // Navigation
                                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">{c.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold 
                                                    ${c.status === 'Running' ? 'bg-blue-500/10 text-blue-400' :
                                                    c.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{c.performance || '-'}</td>
                                        <td className="px-6 py-4 text-right text-slate-500 font-mono">{c.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
