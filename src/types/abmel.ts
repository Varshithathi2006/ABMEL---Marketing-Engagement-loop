export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentResult {
    agentName: string;
    status: AgentStatus;
    data: any;
    timestamp: string;
    logs: string[];
}

export interface CampaignInput {
    product: string;
    audience: string;
    goal: string;
    budget: string;
    platforms: string[];
    constraints?: string;
    brandFiles?: string[];
    brandGuidelines?: string;
    file?: File;
}

export interface CreativeVariant {
    id?: string;
    rank?: number; // Changed to number for sorting (1-5)
    channel?: string;
    platform?: string; // Added alias
    strategy?: string;
    strategy_type: 'Feature' | 'Emotional' | 'SocialProof' | 'Price' | 'Lifestyle' | 'USE_CASE';
    headline: string;
    primary_copy?: string;
    body?: string; // Preferred
    cta: string;
    visual_prompt: string;
    tone?: string;

    // New Explainability Fields
    why_it_works?: string;        // Logic behind the strategy
    target_persona_trait?: string; // Specific trait targeted

    // Image Generation Fields
    visual_asset_url?: string;
    visual_asset_provider?: string;
    visual_assets?: any[];
}

export interface MarketAnalysisOutput {
    market_position: string;
    key_triggers: string[];
    // channel_insights removed
    recommended_channels: string[];
    risks: string[];
}

export interface PersonaOutput {
    persona_name: string;
    age_range: string;
    profession: string;
    motivations: string[];
    pain_points: string[];
    preferred_tone: string;
}
