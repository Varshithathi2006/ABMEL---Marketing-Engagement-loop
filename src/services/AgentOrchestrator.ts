import { abmelWorkflow } from './langchain/workflow';
import type { AbmelState } from './langchain/workflow';
import type { GraphEvent } from '../types/graph';

export class AgentOrchestrator {
    private subscribers: ((event: GraphEvent) => void)[] = [];
    private currentCampaignControl: { input?: any } = {};

    constructor() {
        console.log("Initializing LangChain Orchestrator");
    }

    public subscribe(callback: (event: GraphEvent) => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== callback);
        };
    }

    private emit(event: GraphEvent) {
        this.subscribers.forEach(s => s(event));
    }

    public async planCampaign(input: any) {
        console.log('Orchestrator: Planning campaign...', input);
        this.currentCampaignControl.input = input;

        // Emit the Deterministic DAG Structure for UI Visualization (3 Steps)
        this.emit({
            type: 'node_complete',
            nodeId: 'planning',
            data: {
                taskGraph: {
                    nodes: {
                        planning: { id: 'planning', agentName: 'PlanningAgent', status: 'completed', dependencies: [], inputContextKeys: [], outputContextKeys: [] },
                        market_research: { id: 'market_research', agentName: 'MarketIntelligenceAgent', status: 'idle', dependencies: ['planning'], inputContextKeys: [], outputContextKeys: [] },
                        persona_modeling: { id: 'persona_modeling', agentName: 'PersonaModelingAgent', status: 'idle', dependencies: ['market_research'], inputContextKeys: [], outputContextKeys: [] },
                        creative_generation: { id: 'creative_generation', agentName: 'CreativeGenerationAgent', status: 'idle', dependencies: ['persona_modeling'], inputContextKeys: [], outputContextKeys: [] },
                        image_generation: { id: 'image_generation', agentName: 'ImageGenerationAgent', status: 'idle', dependencies: ['creative_generation'], inputContextKeys: [], outputContextKeys: [] }
                    },
                    context: input
                }
            },
            timestamp: new Date().toISOString()
        });
    }

    public async startExecution() {
        if (!this.currentCampaignControl.input) throw new Error('No input provided.');
        console.log('Starting LangChain Workflow...');

        const inp = this.currentCampaignControl.input;
        const initialState: AbmelState = {
            product: inp.product,
            goal: inp.goal,
            brandGuidelines: inp.brandGuidelines,
            campaignId: inp.campaignId,
            productDescription: inp.productDescription,
            keyFeatures: inp.keyFeatures,
            targetPlatforms: inp.targetPlatforms,
            numVariants: inp.numVariants || 3,
            audience: inp.audience,
            loopCount: 0,
            onEvent: async (e: any) => {
                this.emit(e);

                // Store all agent outputs to Supabase securely
                if (e.type === 'node_complete' && e.nodeId !== 'workflow' && this.currentCampaignControl.input.campaignId) {
                    try {
                        const { SupabaseService } = await import('./SupabaseService');
                        await SupabaseService.getInstance().saveAgentOutput(
                            this.currentCampaignControl.input.campaignId,
                            e.nodeId, // Store under node ID (e.g., 'market_research')
                            e.data
                        );
                        console.log(`[DB] Saved output for node: ${e.nodeId}`);
                    } catch (error) {
                        console.error(`[DB] Failed to save output for node ${e.nodeId}:`, error);
                    }
                }
            }
        };

        try {
            // Execute Chain
            const result = await abmelWorkflow.invoke(initialState);
            console.log("Workflow Complete", result);

            if (result.creativeVariants) {
                // Workflow already saved to DB. Just emit for UI.
                this.emit({
                    type: 'WORKFLOW_COMPLETED',
                    stage: 'IMAGE_GENERATION', // Updated
                    data: {
                        count: result.creativeVariants?.length || 0,
                        variants: result.creativeVariants
                    },
                    timestamp: new Date().toISOString()
                });
            } else if (result.error) {
                // Workflow handled error logging but we want top level event
                this.emit({ type: 'node_fail', nodeId: 'workflow', data: result.error, timestamp: new Date().toISOString() });
            }

            this.emit({ type: 'graph_complete', timestamp: new Date().toISOString() });

        } catch (error) {
            console.error("Workflow Failed", error);
            this.emit({ type: 'node_fail', nodeId: 'workflow', data: error, timestamp: new Date().toISOString() });
        }
    }
}
