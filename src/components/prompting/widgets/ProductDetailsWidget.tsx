import { useState } from 'react';
import { ShoppingBag, Users, Check, IndianRupee, FileText } from 'lucide-react';
import clsx from 'clsx';
// TiltCard Removed

export const ProductDetailsWidget = ({ onComplete }: { onComplete: (data: any) => void }) => {
    const [data, setData] = useState({
        projectName: '',
        product: '',
        audience: '',
        pricePoint: '',
        campaignType: 'AWARENESS' as 'AWARENESS' | 'CONVERSION' | 'RETENTION' | 'ENGAGEMENT',
        platforms: [] as string[]
    });
    const [isCompleted, setIsCompleted] = useState(false);

    const handleSubmit = () => {
        if (!data.projectName || !data.product || !data.audience) return;
        setIsCompleted(true);
        onComplete(data);
    };

    const togglePlatform = (p: string) => {
        setData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(p)
                ? prev.platforms.filter(x => x !== p)
                : [...prev.platforms, p]
        }));
    };

    if (isCompleted) {
        return (
            <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Check size={14} />
                </div>
                <div className="text-sm text-slate-200 font-medium">
                    Campaign Configuration Locked <span className="text-slate-500 ml-2">({data.projectName})</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                    Campaign Parameters
                </h2>
                <p className="text-sm text-slate-500">Define the core attributes for your marketing campaign.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">

                <div className="space-y-6">
                    {/* Project Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                            Project Name
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-200 text-sm placeholder:text-slate-600"
                                placeholder="e.g. Summer Launch 2024"
                                value={data.projectName}
                                onChange={e => setData({ ...data, projectName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                                Product Designation
                            </label>
                            <div className="relative">
                                <ShoppingBag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-200 text-sm placeholder:text-slate-600"
                                    placeholder="e.g. Quantum Neural Chip"
                                    value={data.product}
                                    onChange={e => setData({ ...data, product: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Audience */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Target Audience</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-200 text-sm placeholder:text-slate-600"
                                    placeholder="e.g. Data Scientists"
                                    value={data.audience}
                                    onChange={e => setData({ ...data, audience: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Price */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Price Point (INR)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-200 text-sm placeholder:text-slate-600"
                                    placeholder="0.00"
                                    value={data.pricePoint}
                                    onChange={e => setData({ ...data, pricePoint: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Campaign Type Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Campaign Type</label>
                            <select
                                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-200 text-sm"
                                value={data.campaignType}
                                onChange={e => setData({ ...data, campaignType: e.target.value as any })}
                            >
                                <option value="AWARENESS">Awareness</option>
                                <option value="CONVERSION">Conversion</option>
                                <option value="RETENTION">Retention</option>
                                <option value="ENGAGEMENT">Engagement</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-800 my-4"></div>

                    {/* Platforms */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">Deployment Channels</label>
                        <div className="flex flex-wrap gap-2">
                            {['Instagram', 'Web', 'LinkedIn', 'Twitter/X', 'Facebook', 'Email'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => togglePlatform(p)}
                                    className={clsx(
                                        "py-1.5 px-3 rounded-md text-xs font-medium transition-colors border flex items-center gap-2",
                                        data.platforms.includes(p)
                                            ? "bg-blue-900/40 border-blue-700 text-blue-300"
                                            : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:border-slate-700"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-1.5 h-1.5 rounded-full transition-colors",
                                        data.platforms.includes(p) ? "bg-blue-400" : "bg-slate-700"
                                    )}></div>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end pt-4 border-t border-slate-800">
                    <button
                        onClick={handleSubmit}
                        disabled={!data.projectName || !data.product || !data.audience}
                        className={clsx(
                            "px-6 py-2 rounded-md text-sm font-semibold transition-all shadow-sm flex items-center gap-2",
                            (!data.projectName || !data.product || !data.audience)
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-500"
                        )}
                    >
                        {!data.projectName || !data.product || !data.audience ? (
                            <span>Complete Configuration</span>
                        ) : (
                            <>
                                <span>Confirm Configuration</span>
                                <Check size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
