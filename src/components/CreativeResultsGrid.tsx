import React from 'react';
import { useCampaignStore } from '../store/useCampaignStore';
import { Star, ShieldCheck, Zap, ChevronRight, ChevronLeft, Eye, Loader2, Copy, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CreativeResultsGrid = () => {
    const { creatives, graph, generateImageForCreative } = useCampaignStore();

    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [imageLoadingStates, setImageLoadingStates] = React.useState<Record<string, boolean>>({});
    const [imageErrorStates, setImageErrorStates] = React.useState<Record<string, boolean>>({});
    const [retryCounts, setRetryCounts] = React.useState<Record<string, number>>({});
    const [selectedAssetIndices, setSelectedAssetIndices] = React.useState<Record<string, number>>({});
    const [activeImageUrls, setActiveImageUrls] = React.useState<Record<string, string>>({});

    // Reactive: If a creative gets a URL, reset error states for that ID
    React.useEffect(() => {
        creatives.forEach(c => {
            if (c.visual_asset_url) {
                if (imageErrorStates[c.id]) {
                    setImageErrorStates(prev => ({ ...prev, [c.id]: false }));
                }
                // If the URL in the creative object changed, update our active tracker
                if (c.visual_asset_url !== activeImageUrls[c.id]) {
                    setActiveImageUrls(prev => ({ ...prev, [c.id]: c.visual_asset_url }));
                    setImageLoadingStates(prev => ({ ...prev, [c.id]: true }));
                }
            }
        });
    }, [creatives, imageErrorStates, activeImageUrls]);

    // Unify source handling
    const rawVariants = (creatives && creatives.length > 0)
        ? creatives
        : (graph?.nodes['image_generation']?.result?.variants || graph?.nodes['creative_generation']?.result?.variants || []);

    const isGeneratingImage = graph?.nodes['image_generation']?.status === 'running';

    if (rawVariants.length === 0) {
        const isRunning = useCampaignStore.getState().status === 'running';
        if (isRunning) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
                    <p>Generating or Loading creatives...</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border border-dashed border-slate-700 rounded-2xl bg-slate-800/50 p-8 text-center">
                <Eye size={48} className="text-slate-600 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Creatives Available</h3>
                <p className="max-w-md">No creatives were found for this campaign. They may still be processing in the background, or the generation failed.</p>
            </div>
        );
    }

    const variants = [...rawVariants].sort((a: any, b: any) => {
        if (a.rank === 'BEST') return -1;
        if (b.rank === 'BEST') return 1;
        return 0;
    });

    const currentVariant = variants[currentIndex];

    // Handlers
    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % variants.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + variants.length) % variants.length);

    const handleImageLoad = (id: string) => {
        setImageLoadingStates(prev => ({ ...prev, [id]: false }));
    };

    const handleImageError = (id: string) => {
        setImageLoadingStates(prev => ({ ...prev, [id]: false }));
        setImageErrorStates(prev => ({ ...prev, [id]: true }));
    };

    const handleRetry = (variant: any) => {
        const currentRetry = retryCounts[variant.id] || 0;
        const nextRetry = currentRetry + 1;
        setRetryCounts(prev => ({ ...prev, [variant.id]: nextRetry }));

        const backends: any[] = ['POLLINATIONS', 'LCM', 'STOCK'];
        const backend = backends[currentRetry % backends.length];

        setImageErrorStates(prev => ({ ...prev, [variant.id]: false }));
        setImageLoadingStates(prev => ({ ...prev, [variant.id]: true }));

        console.log(`[UI] Retrying ${variant.id} with backend: ${backend} (Retry #${nextRetry})`);
        generateImageForCreative({ ...variant, backendPreference: backend });
    };

    return (
        <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {currentVariant?.rank === 'BEST' ? (
                            <><Star className="text-yellow-500 fill-current" size={24} /> Recommended Creative</>
                        ) : (
                            <><TrendingUp className="text-blue-500" size={24} /> Creative Option {currentIndex + 1}</>
                        )}
                    </h2>
                    <p className="text-slate-400 mt-1">Showing {currentIndex + 1} of {variants.length} generated concepts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handlePrev} className="p-3 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-colors shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNext} className="p-3 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-colors shadow-sm">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentVariant.id || currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col min-h-[600px] relative"
                        >
                            <div className="absolute top-6 left-6 z-20 flex gap-2">
                                <div className="bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                    {currentVariant.platform}
                                </div>
                                <div className="bg-purple-100 text-purple-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                    {(currentVariant.strategy_type || currentVariant.strategy)} Strategy
                                </div>
                            </div>

                            <div className="h-80 bg-slate-900 relative overflow-hidden flex items-center justify-center group">
                                {(() => {
                                    const assets = currentVariant.visual_assets || [];
                                    const selectedAssetIndex = selectedAssetIndices[currentVariant.id] || 0;

                                    const currentAsset = assets[selectedAssetIndex] || {
                                        url: currentVariant.visual_asset_url || currentVariant.imageUrl,
                                        provider: currentVariant.visual_asset_provider || 'Discovery AI'
                                    };

                                    const url = currentAsset.url;
                                    const variantId = currentVariant.id;
                                    const campaignId = graph?.context?.campaignId || currentVariant.campaign_id;
                                    const cleanUrl = typeof url === 'string' ? url.trim() : '';

                                    // Use local tracker if possible, else currentAsset
                                    const displayUrl = activeImageUrls[variantId] || cleanUrl;

                                    // Check for local file first
                                    const localPath = `/local-assets/${campaignId}/${variantId}_${selectedAssetIndex}.png`;
                                    const isPlaceholder = !displayUrl ||
                                        displayUrl.toLowerCase().includes('placeholder') ||
                                        displayUrl === 'AI Generated Concept' ||
                                        (!displayUrl.startsWith('http') && !displayUrl.startsWith('data:') && !displayUrl.startsWith('/'));
                                    const isLoading = imageLoadingStates[currentVariant.id] !== false && !isPlaceholder;
                                    const hasError = imageErrorStates[currentVariant.id];

                                    if (!isPlaceholder) {
                                        return (
                                            <>
                                                {isLoading && !hasError && (
                                                    <div className="absolute inset-0 z-10 bg-slate-800 flex flex-col items-center justify-center">
                                                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                                                        <p className="text-slate-300 font-medium tracking-wide animate-pulse">Loading visual assets...</p>
                                                    </div>
                                                )}
                                                {hasError && (
                                                    <div className="absolute inset-0 z-10 bg-slate-800 flex flex-col items-center justify-center p-6 text-center overflow-auto">
                                                        <Zap className="text-yellow-500 mb-3 opacity-50" size={32} />
                                                        <p className="text-slate-300 font-bold mb-1">Visual Generation Timeout</p>
                                                        <p className="text-slate-500 text-sm mb-6 max-w-xs">The AI model is taking too long to respond. This is common during peak traffic.</p>

                                                        <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                                            <button
                                                                onClick={() => handleRetry(currentVariant)}
                                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                                                            >
                                                                <Zap size={16} /> Retry Discovery
                                                            </button>
                                                            <a href={cleanUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-blue-400 break-all underline">
                                                                Manual URL Link
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                                <img
                                                    src={localPath}
                                                    alt="Creative Visual"
                                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
                                                    onLoad={() => handleImageLoad(currentVariant.id)}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        // Fallback logic: if localPath fails, try displayUrl
                                                        if (target.src.includes(localPath)) {
                                                            if (displayUrl && displayUrl !== localPath) {
                                                                console.log(`[UI] Local asset not found at ${localPath}, falling back to remote: ${displayUrl}`);
                                                                target.src = displayUrl;
                                                            } else {
                                                                handleImageError(currentVariant.id);
                                                            }
                                                        } else {
                                                            // If even displayUrl fails
                                                            handleImageError(currentVariant.id);
                                                        }
                                                    }}
                                                />

                                                {/* Asset Picker Overlay */}
                                                {assets.length > 1 && (
                                                    <div className="absolute bottom-4 right-4 z-30 flex gap-1.5 p-1.5 bg-slate-900/60 backdrop-blur rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {assets.map((asset: any, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedAssetIndices(prev => ({ ...prev, [currentVariant.id]: idx }));
                                                                }}
                                                                className={`w-2 h-2 rounded-full transition-all ${selectedAssetIndex === idx ? 'bg-blue-400 scale-125' : 'bg-white/30 hover:bg-white/60'}`}
                                                                title={asset.provider}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="absolute top-4 left-4 z-30 bg-black/50 backdrop-blur text-white/70 text-[10px] px-2 py-0.5 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Engine: {currentAsset.provider}
                                                </div>

                                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                                            </>
                                        );
                                    }
                                    return (
                                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                            <div className="text-center p-8 max-w-lg">
                                                {isGeneratingImage ? <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" /> : <Eye size={48} className="text-slate-600 mx-auto mb-4" />}
                                                <p className="text-slate-400 italic">"{currentVariant.visual_prompt || currentVariant.visualDescription}"</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="flex-1 p-8 bg-white flex flex-col">
                                <h3 className="text-3xl font-bold text-slate-900 leading-tight mb-4">{currentVariant.headline}</h3>
                                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line mb-6 flex-1">{currentVariant.body_copy || currentVariant.body}</p>
                                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-6">
                                    <div className="flex items-center gap-3">
                                        <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-2">
                                            <Copy size={18} /> Copy Text
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const url = currentVariant.visual_asset_url || currentVariant.imageUrl;
                                                const { SupabaseService } = await import('../services/SupabaseService');
                                                if (url) {
                                                    await SupabaseService.getInstance().downloadImage(url, `creative_${currentVariant.id}.png`);
                                                }
                                            }}
                                            className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition flex items-center gap-2"
                                        >
                                            <TrendingUp size={18} className="rotate-90" /> Download
                                        </button>
                                        {(() => {
                                            const url = currentVariant.visual_asset_url || currentVariant.imageUrl;
                                            const cleanUrl = typeof url === 'string' ? url.trim() : '';
                                            const isPlaceholderOrFallback = !cleanUrl || cleanUrl.toLowerCase().includes('placehold.co') || cleanUrl.toLowerCase().includes('placeholder') || cleanUrl === 'AI Generated Concept' || !cleanUrl.startsWith('http');
                                            if (isPlaceholderOrFallback && currentVariant.id) {
                                                return (
                                                    <button
                                                        onClick={() => generateImageForCreative(currentVariant)}
                                                        className="px-6 py-3 border border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-500 hover:text-white transition flex items-center gap-2"
                                                    >
                                                        {isGeneratingImage ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                                                        {isGeneratingImage ? "Generating Visual..." : "Generate AI Visual"}
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div className="text-slate-400 text-sm font-medium">Tone: {currentVariant.tone}</div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    <div className="flex justify-center gap-3 mt-8">
                        {variants.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all ${currentIndex === idx ? 'w-10 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-500'}`} aria-label={`Go to slide ${idx + 1}`} />
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div key={`sidebar-${currentVariant.id || currentIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                            <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 mb-6">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Targeting Profile</h3>
                                <div className="space-y-4">
                                    <div><span className="text-xs text-slate-500 block">Primary Tactic</span><span className="text-sm font-bold text-white">{currentVariant.strategy_type || currentVariant.strategy}</span></div>
                                    <div><span className="text-xs text-slate-500 block">Audience Focus</span><span className="text-sm font-medium text-blue-300">{currentVariant.target_persona_trait || graph?.nodes['persona_modeling']?.result?.personas?.persona_name || "General Audience"}</span></div>
                                    <div><span className="text-xs text-slate-500 block mb-1">Visual Directive</span><div className="text-xs bg-slate-900 p-3 rounded text-emerald-400/90 font-mono leading-relaxed line-clamp-4">"{currentVariant.visual_prompt || currentVariant.visualDescription}"</div></div>
                                </div>
                            </div>
                            <div className="bg-blue-900/40 rounded-xl p-6 border border-blue-500/30">
                                <h3 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck size={14} /> Strategic Insight</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">{currentVariant.why_it_works || currentVariant.why_this_works || "This creative variant was specifically generated to align with the core product offering while targeting specific engagement triggers."}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
