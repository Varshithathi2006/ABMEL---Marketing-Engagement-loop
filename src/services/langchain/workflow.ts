import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { PlanningAgent } from "../agents/PlanningAgent";
import { MarketIntelligenceAgent } from "../agents/MarketIntelligenceAgent";
import { PersonaModelingAgent } from "../agents/PersonaModelingAgent";
import { CreativeGenerationAgent } from "../agents/CreativeGenerationAgent";
import { SupabaseService } from "../SupabaseService";
// DecisionAgent removed as per strict spec

// 1. Define State
export interface AbmelState {
    product: string;
    goal: string;
    brandGuidelines?: string;
    loopCount?: number;
    campaignId?: string;
    // New enriched fields
    audience?: string;
    productDescription?: string;
    keyFeatures?: string;
    targetPlatforms?: string[];
    numVariants?: number;

    // Context accumulators
    plan?: any;
    marketData?: any;
    personas?: any;
    creativeVariants?: any[];

    // Status
    error?: string;

    // Events (for UI)
    onEvent?: (event: any) => void;
}

// 2. Instantiate Class Agents
const planner = new PlanningAgent();
const marketResearcher = new MarketIntelligenceAgent();
const personaModeler = new PersonaModelingAgent();
const creativeGenerator = new CreativeGenerationAgent();
// const decisionMaker = new DecisionAgent();

// 3. Define Runnables that wrap Class Agents

// --- Planning ---
// --- Planning ---
const planningStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'planning', timestamp: new Date().toISOString() });

        const result = await planner.execute({
            product: state.product,
            audience: state.audience || 'General',
            goal: state.goal,
            brandGuidelines: state.brandGuidelines,
            productDescription: state.productDescription,
            keyFeatures: state.keyFeatures,
            campaignId: state.campaignId
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        // Persistence: Backend Authority
        if (state.campaignId && !state.campaignId.startsWith('temp-')) {
            await SupabaseService.getInstance().saveAgentOutput(state.campaignId, 'planning', result.data);
        }

        state.onEvent?.({ type: 'node_complete', nodeId: 'planning', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, plan: result.data };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'planning', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Planning Failed: ${e.message}` };
    }
});

// --- Market Research ---
const marketStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'market_research', timestamp: new Date().toISOString() });

        const result = await marketResearcher.execute({
            product: state.product,
            audience: state.audience || state.plan?.context?.audience || 'General',
            productDescription: state.productDescription
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        if (state.campaignId && !state.campaignId.startsWith('temp-')) {
            await SupabaseService.getInstance().saveAgentOutput(state.campaignId, 'market_research', result.data);
        }

        state.onEvent?.({ type: 'node_complete', nodeId: 'market_research', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, marketData: result.data };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'market_research', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Market Research Failed: ${e.message}` };
    }
});

// --- Persona Modeling ---
const personaStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'persona_modeling', timestamp: new Date().toISOString() });

        // Infer industry from market data triggers or positioning or pass "general"
        // The implementation of PersonaAgent expects 'industry' in input.
        // We can heuristic check marketData or just pass a default if missing.
        const result = await personaModeler.execute({
            audience: state.audience || state.plan?.context?.audience || 'General',
            industry: 'general'
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        if (state.campaignId && !state.campaignId.startsWith('temp-')) {
            await SupabaseService.getInstance().saveAgentOutput(state.campaignId, 'persona_modeling', result.data);
        }

        state.onEvent?.({ type: 'node_complete', nodeId: 'persona_modeling', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, personas: result.data };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'persona_modeling', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Persona Modeling Failed: ${e.message}` };
    }
});

// --- Creative Generation ---
const creativeStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'creative_generation', timestamp: new Date().toISOString() });

        const result = await creativeGenerator.execute({
            product: state.product,
            audience: state.audience || 'General',
            productDescription: state.productDescription,
            keyFeatures: state.keyFeatures,
            targetPlatforms: state.targetPlatforms,
            numVariants: state.numVariants || 3,
            personaData: state.personas,
            marketData: state.marketData,
            goal: state.goal,
            brandGuidelines: state.brandGuidelines
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        // Persistence: Save Output AND Status Update
        if (state.campaignId && !state.campaignId.startsWith('temp-')) {
            await SupabaseService.getInstance().saveAgentOutput(state.campaignId, 'creative_generation', result.data);

            // Save structured variants for easier querying
            if (result.data.variants) {
                // Map to Supabase Schema expected by saveCreativeVariants
                const STRATEGY_MAP: Record<string, 'FEATURE' | 'EMOTIONAL' | 'SOCIAL_PROOF' | 'PRICE' | 'LIFESTYLE'> = {
                    'Feature': 'FEATURE',
                    'Feature-Led': 'FEATURE',
                    'Emotional': 'EMOTIONAL',
                    'SocialProof': 'SOCIAL_PROOF',
                    'Social Proof': 'SOCIAL_PROOF',
                    'Price': 'PRICE',
                    'Price/Value': 'PRICE',
                    'Lifestyle': 'LIFESTYLE',
                    'Lifestyle / Use-Case': 'LIFESTYLE'
                };

                const dbVariants = result.data.variants.map((v: any) => ({
                    strategy_type: STRATEGY_MAP[v.strategy] || 'FEATURE',
                    headline: v.headline,
                    body_copy: v.body,
                    visual_prompt: v.visual_prompt,
                    tone: v.tone || 'Neutral',
                    platform: v.platform,
                    is_best_creative: v.rank === 'BEST' || v.rank === 1
                }));
                const savedVariants = await SupabaseService.getInstance().saveCreativeVariants(state.campaignId, dbVariants);

                // Map IDs back to local variants for persistence-aware UI
                if (savedVariants && savedVariants.length === result.data.variants.length) {
                    result.data.variants = result.data.variants.map((v: any, i: number) => ({
                        ...v,
                        id: savedVariants[i].id
                    }));
                }
            }

            // CRITICAL: Status update deferred until after image generation
            // await SupabaseService.getInstance().updateCampaignStatus(state.campaignId, 'CREATIVES_READY');
        }

        state.onEvent?.({ type: 'node_complete', nodeId: 'creative_generation', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, creativeVariants: result.data.variants }; // Explicitly set workflow result
    } catch (e: any) {
        // Persistence: On Error
        if (state.campaignId && !state.campaignId.startsWith('temp-')) {
            await SupabaseService.getInstance().updateCampaignStatus(state.campaignId, 'FAILED');
        }
        state.onEvent?.({ type: 'node_fail', nodeId: 'creative_generation', data: { error: e.message }, timestamp: new Date().toISOString() });
        return { ...state, error: `Creative Generation Failed: ${e.message}` };
    }
});

// --- Image Generation ---
// Import new agent (add to top of file)
import { ImageGenerationAgent } from "../agents/ImageGenerationAgent";
const imageGenerator = new ImageGenerationAgent();

const imageStep = RunnableLambda.from(async (state: AbmelState) => {
    if (state.error) return state;
    try {
        state.onEvent?.({ type: 'node_start', nodeId: 'image_generation', timestamp: new Date().toISOString() });

        const result = await imageGenerator.execute({
            creatives: state.creativeVariants, // Pass the variants from previous step
            campaignId: state.campaignId // Pass ID for persistence
        });

        if (result.status === 'failed') throw new Error(result.data.error);

        // Persistence: Save Output
        // In a real app we would update the creative variants in DB with the new URLs
        // For now we just verify they exist and update state context

        if (state.campaignId && !state.campaignId.startsWith('temp-')) {
            // CRITICAL: Update Campaign Status now that images are generated
            await SupabaseService.getInstance().updateCampaignStatus(state.campaignId, 'CREATIVES_READY');
        }

        state.onEvent?.({ type: 'node_complete', nodeId: 'image_generation', data: result.data, timestamp: new Date().toISOString() });
        return { ...state, creativeVariants: result.data.variants };
    } catch (e: any) {
        state.onEvent?.({ type: 'node_fail', nodeId: 'image_generation', data: { error: e.message }, timestamp: new Date().toISOString() });
        // Don't fail the whole campaign if images fail, just log error
        return { ...state, error: `Image Generation Failed (Non-fatal): ${e.message}` };
    }
});

// 4. Compose Workflow
export const abmelWorkflow = RunnableSequence.from([
    planningStep,
    marketStep,
    personaStep,
    creativeStep,
    imageStep
]);
