import { Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCampaignStore } from '../store/useCampaignStore';
import { useMemo } from 'react';

export const GuardrailsPage = () => {
    const { input } = useCampaignStore();

    // Derived active rules based on input
    const rules = useMemo(() => {
        const baseRules = [
            { id: 1, name: 'Brand Tone Verification', status: 'Active', level: 'Strict', type: 'NLP Analysis' },
            { id: 2, name: 'Regulatory Compliance (GDPR)', status: 'Active', level: 'Critical', type: 'Policy Check' },
        ];

        // Specific rules if brand guidelines were uploaded
        if (input.brandGuidelines) {
            baseRules.push({ id: 3, name: 'Custom Brand Guidelines', status: 'Active', level: 'Custom', type: 'Similarity Match' });
        }

        return baseRules;
    }, [input.brandGuidelines]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
                    <Shield size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Active Guardrails</h1>
                    <p className="text-slate-400">Automated safety and compliance protocols governing agent outputs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <div className="text-3xl font-bold text-green-500 mb-1">100%</div>
                    <div className="text-sm text-slate-500 uppercase tracking-wide font-bold">Safe Output Rate</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{rules.length} Active</div>
                    <div className="text-sm text-slate-500 uppercase tracking-wide font-bold">Rule Sets</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center">
                    <div className="text-3xl font-bold text-orange-500 mb-1">0</div>
                    <div className="text-sm text-slate-500 uppercase tracking-wide font-bold">Violations Detected</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="font-bold text-white text-lg">Rule Configuration</h3>
                </div>
                <div className="divide-y divide-slate-800">
                    {rules.map((rule, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={rule.id}
                            className="p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-200">{rule.name}</div>
                                    <div className="text-xs text-slate-500">{rule.type}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full uppercase tracking-wide">{rule.level}</span>
                                <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                                    <CheckCircle size={16} />
                                    {rule.status}
                                </div>
                                <div className="w-12 h-6 bg-blue-600/20 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-blue-500 rounded-full shadow-lg"></div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {!input.brandGuidelines && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-4 text-yellow-400">
                    <AlertTriangle size={24} />
                    <div>
                        <p className="font-bold">No Custom Brand Guidelines Detected</p>
                        <p className="text-sm opacity-80">Default global safety rules are active, but custom brand voice constraints are disabled.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
