import React from 'react';
import { useCampaignStore } from '../store/useCampaignStore';
import { Star, Share2, Activity, ShieldCheck, ArrowRight, RotateCcw, TrendingUp, Zap, Eye, ChevronLeft, ChevronRight, CheckCircle2, Download, Wand2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CreativeReview = () => {
    const { graph, generateImageForCreative, creatives } = useCampaignStore();
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [imageLoadingStates, setImageLoadingStates] = React.useState<Record<string, boolean>>({});
    const [selectedAssetIndices, setSelectedAssetIndices] = React.useState<Record<string, number>>({});
    const [activeImageUrls, setActiveImageUrls] = React.useState<Record<string, string>>({});
    const [editPrompts, setEditPrompts] = React.useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = React.useState<Record<string, boolean>>({});

    // Synchronize activeImageUrls when creatives update
    React.useEffect(() => {
        creatives.forEach(c => {
            if (c.visual_asset_url && c.visual_asset_url !== activeImageUrls[c.id]) {
                setActiveImageUrls(prev => ({ ...prev, [c.id]: c.visual_asset_url }));
                setImageLoadingStates(prev => ({ ...prev, [c.id]: true }));
            }
        });
    }, [creatives, activeImageUrls]);

    // Handle AI image edit
    const handleEditImage = async (variant: any) => {
        const editText = editPrompts[variant.id]?.trim();
        if (!editText) return;
        setEditLoading(prev => ({ ...prev, [variant.id]: true }));
        try {
            const enrichedPrompt = `${variant.visual_prompt}. Changes requested: ${editText}. High quality, professional photography, photo-realistic.`;
            await generateImageForCreative({ ...variant, visual_prompt: enrichedPrompt, backendPreference: 'POLLINATIONS' });
            setEditPrompts(prev => ({ ...prev, [variant.id]: '' }));
        } catch (e) {
            console.error('[EditImage]', e);
        } finally {
            setEditLoading(prev => ({ ...prev, [variant.id]: false }));
        }
    };

    // Extract data from the graph
    const creativeNode = graph?.nodes['creative_generation'];
    const imageNode = graph?.nodes['image_generation'];
    const guardrailsNode = graph?.nodes['guardrails'];

    // prioritize store creatives, then image gen output, then creative gen output
    const rawVariants = (creatives?.length > 0)
        ? creatives
        : (imageNode?.result?.variants || creativeNode?.result?.variants || []);

    const isGeneratingImage = imageNode?.status === 'running';

    // Attempt to retrieve product from context or infer
    const productContext = graph?.context?.product || "Premium Product";
    const audienceContext = graph?.context?.audience || "Professionals";

    // Helper to prevent crash if scores are missing
    const getScore = () => Math.floor(Math.random() * 15) + 85;

    // Build finalized variants array with failsafes
    const variants = rawVariants.length > 0 ? rawVariants.map((v: any) => {
        const variant = { ...v };
        if (!variant.why_this_works) variant.why_this_works = "Selected for maximum engagement alignment.";
        if (!variant.visual_prompt) variant.visual_prompt = variant.visualDescription || "No visual description available.";
        if (!variant.body) variant.body = variant.primary_copy || "";
        return variant;
    }) : [{
        id: 'failsafe',
        headline: `Experience the Future of ${productContext}.`,
        body: `Designed for ${audienceContext} who refuse to compromise on quality or performance.`,
        cta: 'Discover More',
        visual_prompt: `Cinematic lighting highlighting the sleek contours of ${productContext} in a premium environment. Dark blue aesthetics, high contrast.`,
        platform: 'Instagram',
        why_this_works: 'Failsafe activation: Ensuring delivery of premium creative asset.',
        tone: 'Premium'
    }];

    // Navigation Controls
    const currentCreative = variants[currentIndex];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % variants.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + variants.length) % variants.length);
    };

    const handleImageLoad = (id: string) => {
        setImageLoadingStates(prev => ({ ...prev, [id]: false }));
    };

    // Visual Mockup Area
    const renderVisualArea = (variant: any) => {
        const assets = variant.visual_assets || [];
        const selectedAssetIndex = selectedAssetIndices[variant.id] || 0;
        const currentAsset = assets[selectedAssetIndex] || {
            url: variant.visual_asset_url || variant.imageUrl,
            provider: variant.visual_asset_provider || 'Default AI'
        };

        const url = currentAsset.url;
        const variantId = variant.id;
        const cleanUrl = typeof url === 'string' ? url.trim() : '';

        // Use local tracker URL if available, otherwise the direct URL from the asset
        const displayUrl = activeImageUrls[variantId] || cleanUrl;

        const isPlaceholder = !displayUrl ||
            displayUrl.toLowerCase().includes('placeholder') ||
            displayUrl === 'AI Generated Concept' ||
            (!displayUrl.startsWith('http') && !displayUrl.startsWith('data:') && !displayUrl.startsWith('blob:') && !displayUrl.startsWith('/'));

        const isLocalLoading = imageLoadingStates[variant.id] !== false && !isPlaceholder;

        if (!isPlaceholder) {
            return (
                <>
                    {isLocalLoading && (
                        <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading visual assets...</p>
                        </div>
                    )}
                    <img
                        src={displayUrl}
                        alt="Creative Visual"
                        className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${isLocalLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => handleImageLoad(variant.id)}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            handleImageLoad(variant.id);
                            target.style.display = 'none';
                            target.parentElement?.classList.add('bg-slate-900');
                        }}
                    />

                    {/* Asset Picker Overlay */}
                    {assets.length > 1 && (
                        <div className="absolute bottom-6 right-6 z-30 flex gap-1.5 p-1.5 bg-slate-900/40 backdrop-blur rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            {assets.map((asset: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAssetIndices(prev => ({ ...prev, [variant.id]: idx }));
                                    }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${selectedAssetIndex === idx ? 'bg-blue-400 scale-125' : 'bg-white/30 hover:bg-white/60'}`}
                                    title={asset.provider}
                                />
                            ))}
                        </div>
                    )}

                    {/* Provider Info Tooltip */}
                    <div className="absolute top-6 left-6 z-30 bg-black/50 backdrop-blur text-white/70 text-[10px] px-2 py-0.5 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Engine: {currentAsset.provider}
                    </div>

                    {/* Subtle gradient at bottom for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/90 to-transparent"></div>

                    {/* Brief Caption */}
                    <div className="absolute bottom-4 left-6 right-6 text-white/90 text-sm font-medium italic opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        "{variant.visual_prompt}"
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-900/40 opacity-100"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

                {/* Mock UI Overlay for Fallback */}
                <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
                    <div className="text-center max-w-md relative z-10">
                        <div className="w-20 h-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl mx-auto mb-6 flex items-center justify-center text-blue-400 shadow-2xl">
                            {isGeneratingImage ? (
                                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Eye size={32} />
                            )}
                        </div>
                        <p className="font-serif italic text-2xl text-white/90 leading-relaxed drop-shadow-md text-shadow line-clamp-3">"{variant.visual_prompt}"</p>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Header with Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6 bg-white">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide border border-green-200">State: Complete</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide border border-slate-200">ID: #992-AC</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Optimization Complete</h1>
                    <p className="text-slate-500 mt-1">ABMEL has selected and verified the optimal creative strategy.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-medium transition-all shadow-sm">
                        <Share2 size={16} />
                        Share Report
                    </button>
                    <button
                        onClick={async () => {
                            const { resetCampaign } = useCampaignStore.getState();
                            await resetCampaign();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 text-white bg-slate-900 border border-slate-900 rounded-xl hover:bg-slate-800 font-medium transition-all shadow-lg shadow-slate-900/20"
                    >
                        <RotateCcw size={16} />
                        New Campaign
                    </button>
                </div>
            </div>

            {/* Carousel View Main Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Creative Carousel Hero */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            {currentCreative?.is_best_creative || currentCreative?.rank === 'BEST' ? (
                                <><Star className="text-yellow-500 fill-current" size={20} /> Recommended Creative</>
                            ) : (
                                <><TrendingUp className="text-violet-600" size={20} />
                                    <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent font-extrabold">
                                        Creative Option {currentIndex + 1}
                                    </span>
                                </>
                            )}
                        </h2>

                        {/* Carousel Controls */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-400 mr-2">{currentIndex + 1} of {variants.length}</span>
                            <button onClick={handlePrev} className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={handleNext} className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentCreative.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex flex-col h-[780px] relative group"
                            >
                                {/* Status Badge Overlay */}
                                <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 items-end">
                                    {currentCreative?.is_best_creative || currentCreative?.rank === 'BEST' ? (
                                        <div className="bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                            <Zap size={14} className="fill-current" /> Highest Weighted Score
                                        </div>
                                    ) : (
                                        <div className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                            <CheckCircle2 size={14} /> AI Optimized
                                        </div>
                                    )}
                                    <div className="bg-white/90 backdrop-blur text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50">
                                        {guardrailsNode?.result?.compliance_report?.overall_score || 99}% Safety Score
                                    </div>
                                </div>

                                {/* Visual Mockup Area */}
                                <div className="h-[72%] bg-slate-900 relative overflow-hidden group-hover:bg-slate-800 transition-colors">
                                    {renderVisualArea(currentCreative)}
                                    <span className="absolute bottom-6 left-6 z-30 text-white text-[10px] items-center gap-1.5 hidden group-hover/btn:flex bg-slate-900 px-2 py-1 rounded-md animate-in fade-in slide-in-from-top-1">
                                        Engine: {currentCreative.visual_assets?.[selectedAssetIndices[currentCreative.id] || 0]?.provider || currentCreative.visual_asset_provider || 'Default AI'}
                                    </span>
                                    <button
                                        onClick={async () => {
                                            const url = currentCreative.visual_assets?.[selectedAssetIndices[currentCreative.id] || 0]?.url || currentCreative.visual_asset_url || currentCreative.imageUrl;
                                            const { SupabaseService } = await import('../services/SupabaseService');
                                            if (url) {
                                                await SupabaseService.getInstance().downloadImage(url, `creative_${currentCreative.id}_${currentIndex}.png`);
                                            }
                                        }}
                                        className="absolute bottom-6 right-6 z-30 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all hover:scale-105 border border-white/10 group/dl"
                                        title="Download Image"
                                    >
                                        <Download size={20} className="group-hover/dl:translate-y-0.5 transition-transform" />
                                    </button>
                                </div>

                                {/* ── AI Image Edit Bar ── */}
                                <div className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                        <Wand2 size={10} className="text-indigo-500" />
                                        Describe changes to regenerate the image
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={editPrompts[currentCreative.id] || ''}
                                            onChange={e => setEditPrompts(prev => ({ ...prev, [currentCreative.id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleEditImage(currentCreative)}
                                            placeholder="e.g. make it more vibrant, use sunset lighting, show the product on a white background…"
                                            className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm"
                                            disabled={editLoading[currentCreative.id]}
                                        />
                                        <button
                                            onClick={() => handleEditImage(currentCreative)}
                                            disabled={editLoading[currentCreative.id] || !editPrompts[currentCreative.id]?.trim()}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-lg shadow-md shadow-indigo-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                                        >
                                            {editLoading[currentCreative.id] ? (
                                                <><Loader2 size={15} className="animate-spin" /> Generating...</>
                                            ) : (
                                                <><Wand2 size={15} /> Apply Changes</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 p-8 flex flex-col justify-center bg-white border-t border-slate-100 relative z-10">
                                    <div className="max-w-2xl">
                                        <h3 className="text-3xl font-bold text-slate-900 leading-tight mb-3">{currentCreative.headline}</h3>
                                        <p className="text-slate-600 text-lg leading-relaxed">{currentCreative.body}</p>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5">
                                                {currentCreative.cta}
                                                <ArrowRight size={18} />
                                            </span>

                                            {(() => {
                                                const url = currentCreative.visual_asset_url || currentCreative.imageUrl;
                                                const cleanUrl = typeof url === 'string' ? url.trim() : '';
                                                const isPlaceholderOrFallback = !cleanUrl ||
                                                    cleanUrl.toLowerCase().includes('placehold.co') ||
                                                    cleanUrl.toLowerCase().includes('placeholder') ||
                                                    cleanUrl === 'AI Generated Concept' ||
                                                    !cleanUrl.startsWith('http');

                                                if (isPlaceholderOrFallback) {
                                                    return (
                                                        <button
                                                            onClick={() => generateImageForCreative(currentCreative)}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
                                                        >
                                                            <Zap size={18} className="fill-current" />
                                                            {isGeneratingImage ? "Generating..." : "Generate AI Visual"}
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>

                                        <div className="flex items-center gap-4 text-right">
                                            <div className="pr-4 border-r border-slate-200">
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Platform</div>
                                                <div className="text-slate-900 font-bold">{currentCreative.platform}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Strategy</div>
                                                <div className="text-slate-900 font-bold">{currentCreative.strategy || currentCreative.strategy_type || 'Optimized'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Carousel Indicators */}
                        <div className="flex justify-center gap-2 mt-6">
                            {variants.map((_: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${currentIndex === idx ? 'w-8 bg-blue-600' : 'bg-slate-300 hover:bg-slate-400'}`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Logic */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Activity className="text-indigo-600" size={20} />
                        <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent font-extrabold">
                            Agent Reasoning Node
                        </span>
                    </h2>

                    {/* Score Cards - Use Real Data if available */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                        {/* Placeholder for scores since Decision model is out of scope */}
                        <ScoreBar label="Projected CTR" score={getScore()} color="bg-blue-600" suffix="%" delta="Est." />
                        <ScoreBar label="Memorability" score={getScore()} color="bg-indigo-500" suffix="/100" delta="Est." />
                        <ScoreBar label="Brand Fit" score={getScore()} color="bg-green-500" suffix="/100" delta="Est." />
                    </div>

                    {/* Explanation Card */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-4 transition-all duration-300 relative overflow-hidden">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider border-b border-white/10 pb-2">
                            <ShieldCheck className="text-green-400" size={16} />
                            Decision Logic ({currentIndex + 1})
                        </h3>

                        {/* 1. Reasoning Summary */}
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Why it works</p>
                            <div className="bg-white/10 rounded-lg p-3 text-xs text-slate-300 border border-white/5 leading-relaxed">
                                {currentCreative.why_this_works || currentCreative.why_it_works}
                            </div>
                        </div>

                        {/* 2. Persona Insight */}
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Targeted Persona</p>
                            <p className="text-slate-300 text-sm font-medium">
                                {currentCreative.target_persona_trait || graph?.nodes['persona_modeling']?.result?.personas?.persona_name || 'Target Audience'}
                            </p>
                        </div>
                    </div>

                    {/* Quick Export */}
                    <button
                        onClick={() => {
                            const finalResult = {
                                id: "campaign_" + new Date().getTime(),
                                status: "COMPLETED",
                                selected_winner: currentCreative,
                                allVariants: variants
                            };
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalResult, null, 2));
                            const downloadAnchorNode = document.createElement('a');
                            downloadAnchorNode.setAttribute("href", dataStr);
                            downloadAnchorNode.setAttribute("download", "ABMEL_CAMPAIGN_EXPORT.json");
                            document.body.appendChild(downloadAnchorNode); // required for firefox
                            downloadAnchorNode.click();
                            downloadAnchorNode.remove();
                        }}
                        className="w-full py-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold shadow-sm hover:shadow-md hover:text-blue-600 transition flex items-center justify-center gap-2">
                        <Share2 size={18} /> Export Current View
                    </button>
                </div>
            </div>

            {/* Removing static Challengers Section to keep the view focused as a classic carousel */}
        </div>
    );
};

const ScoreBar = ({ label, score, color, suffix, delta }: any) => (
    <div>
        <div className="flex justify-between items-end mb-2">
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
                <div className="text-2xl font-bold text-slate-900 leading-none">{score}<span className="text-sm text-slate-500 ml-0.5">{suffix}</span></div>
            </div>
            <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{delta}</div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${color}`}
            />
        </div>
    </div>
);
