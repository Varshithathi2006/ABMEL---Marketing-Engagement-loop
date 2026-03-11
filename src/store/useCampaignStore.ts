import { create } from 'zustand';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import type { GraphState } from '../types/graph';
import { useNotificationStore } from './useNotificationStore';
import { SupabaseService } from '../services/SupabaseService';
import { useAuthStore } from './useAuthStore';

interface CampaignInput {
    projectName: string;
    product: string;
    productDescription: string;
    keyFeatures: string;
    audience: string;
    goal: string;
    campaignType: 'AWARENESS' | 'CONVERSION' | 'RETENTION' | 'ENGAGEMENT';
    pricePoint: string;
    budget: string;
    numVariants: number;
    platforms: string[];
    targetPlatforms: string[];
    brandGuidelines: string;
    guidelineFileName?: string;
    guidelineStorageUrl?: string;
}

interface CampaignState {
    input: CampaignInput;
    status: 'idle' | 'planning' | 'planned' | 'running' | 'completed' | 'failed' | 'created' | 'CREATIVES_READY';
    graph: GraphState | null;
    creatives: any[];
    allCreatives: any[];
    logs: string[];
    campaigns: any[];
    campaignId: string | null;
    orchestrator: AgentOrchestrator;

    setInput: (updates: Partial<CampaignInput>) => void;
    restoreDraft: (userId: string) => Promise<void>;
    planCampaign: () => Promise<void>;
    executeCampaign: () => void;
    resetCampaign: () => Promise<void>;
    generateImageForCreative: (creative: any) => Promise<void>;
    updateCreativeVisual: (creativeId: string, url: string, provider: string) => void;
    updateGraph: (graph: GraphState | null) => void;
    updateNodeStatus: (nodeId: string, status: any, result?: any) => void;
    addLog: (msg: string) => void;
    reset: () => void;
    fetchCampaigns: (userId: string) => Promise<void>;
    fetchAllCreatives: (userId: string) => Promise<void>;
    fetchCampaignDetails: (campaignId: string) => Promise<any>;
}

const orchestrator = new AgentOrchestrator();

export const useCampaignStore = create<CampaignState>((set, get) => {
    // Subscriber to Orchestrator events
    orchestrator.subscribe((event) => {
        const { graph } = get();

        if (event.type === 'node_start') {
            get().addLog(`[${event.timestamp}] Agent ${event.nodeId} started...`);
            if (event.nodeId) get().updateNodeStatus(event.nodeId, 'running');
        } else if (event.type === 'node_complete') {
            get().addLog(`[${event.timestamp}] Agent ${event.nodeId} completed successfully.`);
            if (event.nodeId) get().updateNodeStatus(event.nodeId, 'completed', event.data);

            if (event.nodeId === 'creative_generation' && event.data?.variants) {
                set({ creatives: event.data.variants });
            }
        } else if (event.type === 'WORKFLOW_COMPLETED') {
            get().addLog(`[${event.timestamp}] Full campaign strategy generation complete.`);

            if (event.data?.variants) {
                set({ creatives: event.data.variants });
            }

            const currentId = get().campaignId;
            if (currentId && !currentId.startsWith('temp-')) {
                const newCampaign = {
                    id: currentId,
                    name: get().input.product + ' Campaign',
                    status: 'CREATIVES_READY',
                    date: new Date().toLocaleDateString(),
                    performance: 'In Progress',
                    audience: get().input.audience
                };
                set((state) => ({
                    campaigns: [newCampaign, ...state.campaigns],
                    status: 'completed'
                }));
            } else {
                set({ status: 'completed' });
            }

            useNotificationStore.getState().addNotification({
                type: 'success',
                title: 'Campaign Optimized',
                message: 'All agents have completed their tasks. Review the final decision.'
            });

        } else if (event.type === 'node_fail') {
            const errorMsg = typeof event.data === 'string' ? event.data : (event.data?.error || 'Unknown error');
            get().addLog(`[${event.timestamp}] Agent ${event.nodeId} failed: ${errorMsg}`);

            if (event.nodeId) get().updateNodeStatus(event.nodeId, 'failed', event.data);
            set({ status: 'failed' });

            useNotificationStore.getState().addNotification({
                type: 'error',
                title: `${event.nodeId} Agent Failed`,
                message: errorMsg
            });
        } else if (event.type === 'node_reset') {
            get().addLog(`[${event.timestamp}] Resetting task: ${event.nodeId}`);
            if (graph && event.nodeId) {
                const nodes = { ...graph.nodes };
                if (nodes[event.nodeId]) {
                    nodes[event.nodeId] = {
                        ...nodes[event.nodeId],
                        status: 'idle',
                        result: undefined
                    };
                    set({ graph: { ...graph, nodes } });
                }
            }
        }
    });

    return {
        orchestrator,
        input: {
            projectName: '',
            product: '',
            productDescription: '',
            keyFeatures: '',
            audience: '',
            goal: '',
            campaignType: 'AWARENESS',
            pricePoint: '',
            budget: '',
            numVariants: 3,
            platforms: [],
            targetPlatforms: [],
            brandGuidelines: '',
            guidelineFileName: '',
            guidelineStorageUrl: ''
        },
        status: 'idle',
        graph: null,
        creatives: [],
        allCreatives: [],
        logs: [],
        campaigns: [],
        campaignId: null,

        setInput: (updates) => {
            set((state) => {
                const newInput = { ...state.input, ...updates };
                const userId = useAuthStore.getState().user?.id;
                if (userId) {
                    SupabaseService.getInstance().saveDraft(userId, newInput).catch(console.warn);
                }
                return { input: newInput };
            });
        },

        restoreDraft: async (userId: string) => {
            try {
                const draft = await SupabaseService.getInstance().getDraft(userId);
                if (draft) {
                    set({ input: { ...get().input, ...draft } });
                    get().addLog('Restored previous campaign configuration from cloud.');
                }
            } catch (e) {
                console.log('No draft found or error restoring', e);
            }
        },

        fetchCampaigns: async (userId: string) => {
            try {
                const data = await SupabaseService.getInstance().getUserCampaigns(userId);
                const statusLabel: Record<string, string> = {
                    'PLANNING': 'Planning',
                    'RUNNING': 'Running',
                    'CREATIVES_READY': 'Completed',
                    'FAILED': 'Failed',
                    'Running': 'Running',
                    'Completed': 'Completed',
                };
                const mapped = data.map(c => ({
                    id: c.id,
                    name: c.product + ' Campaign',
                    status: statusLabel[c.status] || c.status || 'Draft',
                    created_at: c.created_at,
                    date: new Date(c.created_at || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    performance: c.status === 'CREATIVES_READY' || c.status === 'Completed' ? '✓ Creatives Ready' : 'In Progress',
                    audience: c.target_audience || '—',
                    preview_url: c.preview_url
                }));
                set({ campaigns: mapped });
            } catch (e) {
                console.error('Failed to fetch campaigns', e);
            }
        },

        fetchAllCreatives: async (userId: string) => {
            try {
                const data = await SupabaseService.getInstance().getAllUserCreatives(userId);
                set({ allCreatives: data });
            } catch (e) {
                console.error("Failed to fetch all creatives", e);
            }
        },

        fetchCampaignDetails: async (campaignId: string) => {
            try {
                const outputs = await SupabaseService.getInstance().getAgentOutputs(campaignId);
                const creativesFromDB = await SupabaseService.getInstance().getCreatives(campaignId);

                if (creativesFromDB && creativesFromDB.length > 0) {
                    set({ creatives: creativesFromDB });
                } else if (outputs && outputs['creative_generation']?.variants) {
                    set({ creatives: outputs['creative_generation'].variants });
                } else {
                    set({ creatives: [] });
                }
                return outputs;
            } catch (e) {
                console.error("Failed to fetch details", e);
                set({ creatives: [] });
                return {};
            }
        },

        addLog: (msg) => set((state) => ({ logs: [...state.logs, msg] })),

        updateGraph: (graph) => set({ graph }),

        updateNodeStatus: (nodeId, status, result) => set((state) => {
            if (!state.graph) return state;
            const nodes = { ...state.graph.nodes };
            if (nodes[nodeId]) {
                nodes[nodeId] = { ...nodes[nodeId], status, result };
            }
            return { graph: { ...state.graph, nodes } };
        }),

        planCampaign: async () => {
            console.log('[Store] planCampaign triggered');
            const { input, orchestrator } = get();

            let campaignId = 'temp-' + Date.now();
            try {
                const userId = useAuthStore.getState().user?.id;
                if (userId) {
                    campaignId = await SupabaseService.getInstance().createCampaign(userId, input);
                    get().addLog(`[System] Campaign initialized in DB: ${campaignId}`);
                } else {
                    get().addLog('[System] Warning: No authenticated user. Campaign saved locally.');
                }
            } catch (err) {
                console.warn("Failed to create campaign in DB", err);
            }

            set({ campaignId, status: 'running', logs: [] });

            try {
                await orchestrator.planCampaign({
                    ...input,
                    campaignId: campaignId
                });

                set({ status: 'planned' });
                get().addLog('Campaign execution plan generated.');
                get().executeCampaign();
            } catch (error) {
                console.error('[Store] Error during planning:', error);
                set({ status: 'idle' });
            }
        },

        executeCampaign: () => {
            const { orchestrator } = get();
            set({ status: 'running' });
            try {
                orchestrator.startExecution();
            } catch (error) {
                console.error(error);
                get().addLog(`Error starting execution: ${error}`);
            }
        },

        generateImageForCreative: async (creative: any & { backendPreference?: any }) => {
            get().addLog(`[Manual Trigger] Generating image for creative: ${creative.id} using ${creative.backendPreference || 'default'}`);
            useNotificationStore.getState().addNotification({
                type: 'info',
                title: 'Generating Image...',
                message: creative.backendPreference === 'STOCK' ? 'Fetching stock photo...' : 'Connecting to AI model...'
            });

            try {
                const { imageGenerationService } = await import('../services/image/ImageGenerationService');

                // Force check if service is enabled
                imageGenerationService.setEnabled(true);

                const platformStyle = creative.platform || 'General';
                const finalPrompt = `${creative.visual_prompt}, high resolution professional photography, ${platformStyle} aesthetics`;

                console.log('[Store] Requesting image for prompt:', finalPrompt);
                const result = await imageGenerationService.generateImage({
                    prompt: finalPrompt,
                    backend: creative.backendPreference || 'LCM'
                });

                console.log('[Store] generateImage result:', result);

                if (result && result.url) {
                    let finalUrl = result.url;
                    const campaignId = get().graph?.context?.campaignId || get().campaignId;

                    // 1. Persistent Sync to Supabase Storage (Synchronous for the store state)
                    if (creative.id && campaignId && !campaignId.toString().startsWith('temp-')) {
                        get().addLog(`[Storage] Persisting image for ${creative.id} to Supabase...`);
                        try {
                            const svc = SupabaseService.getInstance();
                            const storageUrl = await svc.uploadImageFromUrl(campaignId, creative.id, result.url);
                            if (storageUrl) {
                                finalUrl = storageUrl;
                                await svc.updateCreativeVisual(creative.id, finalUrl, result.provider);
                                get().addLog('[Storage] Image persisted and linked successfully.');
                            }
                        } catch (syncErr) {
                            console.error('[Store] Persistent sync failed:', syncErr);
                            get().addLog('[Storage] Sync failed, falling back to external URL.');
                        }
                    }

                    set((state) => {
                        // 2. Update local state with the final (ideally Supabase) URL
                        const updatedCreatives = state.creatives.map(c => {
                            if (c.id === creative.id) {
                                return { ...c, visual_asset_url: finalUrl, visual_asset_provider: result.provider };
                            }
                            return c;
                        });

                        // 3. Update graph node results
                        let newGraph = state.graph;
                        if (newGraph && newGraph.nodes['creative_generation']) {
                            const node = newGraph.nodes['creative_generation'];
                            const variants = node.result?.variants || [];
                            const updatedVariants = variants.map((v: any) => {
                                if (v.id === creative.id) {
                                    return { ...v, visual_asset_url: finalUrl, visual_asset_provider: result.provider, imageUrl: finalUrl };
                                }
                                return v;
                            });
                            newGraph = {
                                ...newGraph,
                                nodes: { ...newGraph.nodes, creative_generation: { ...node, result: { ...node.result, variants: updatedVariants } } }
                            };
                        }

                        return { creatives: updatedCreatives, graph: newGraph };
                    });

                    useNotificationStore.getState().addNotification({
                        type: 'success',
                        title: 'Image Generated',
                        message: 'Custom visual is ready.'
                    });
                } else {
                    console.error('[Store] Service returned empty result');
                    throw new Error('Service returned no URL');
                }
            } catch (error: any) {
                console.error("[Store] Manual generation failed:", error);
                useNotificationStore.getState().addNotification({
                    type: 'error',
                    title: 'Generation Failed',
                    message: `Could not generate image: ${error.message}`
                });
            }
        },

        updateCreativeVisual: (creativeId, url, provider) => {
            set(state => ({
                creatives: state.creatives.map(c =>
                    c.id === creativeId ? { ...c, visual_asset_url: url, visual_asset_provider: provider } : c
                )
            }));
        },

        resetCampaign: async () => {
            const userId = useAuthStore.getState().user?.id;
            if (userId) {
                try {
                    await SupabaseService.getInstance().saveDraft(userId, {
                        product: '',
                        productDescription: '',
                        keyFeatures: '',
                        audience: '',
                        goal: 'AWARENESS',
                        budget: '',
                        numVariants: 3,
                        platforms: [],
                        targetPlatforms: [],
                        brandGuidelines: '',
                        guidelineFileName: '',
                        guidelineStorageUrl: ''
                    });
                } catch (e) {
                    console.warn('Failed to clear draft in DB', e);
                }
            }
            set({
                status: 'idle',
                graph: null,
                logs: [],
                creatives: [],
                campaignId: null,
                input: {
                    projectName: '',
                    product: '',
                    productDescription: '',
                    keyFeatures: '',
                    audience: '',
                    goal: '',
                    campaignType: 'AWARENESS',
                    pricePoint: '',
                    budget: '',
                    numVariants: 3,
                    platforms: [],
                    targetPlatforms: [],
                    brandGuidelines: '',
                    guidelineFileName: '',
                    guidelineStorageUrl: ''
                }
            });
        },

        reset: () => set({ status: 'idle', graph: null, logs: [], creatives: [], campaignId: null })
    };
});
