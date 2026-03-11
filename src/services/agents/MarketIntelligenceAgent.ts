import { BaseAgent } from './BaseAgent';
import type { AgentResult, MarketAnalysisOutput } from '../../types/abmel';

export class MarketIntelligenceAgent extends BaseAgent {
    constructor() {
        super('MarketIntelligenceAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Initializing Market Domain Analysis...');

        try {
            // Simulate deep analysis time
            await new Promise(resolve => setTimeout(resolve, 1500));

            const product = input.product || "Generic Product";
            const industry = this.detectIndustry(product);

            this.log(`Detected Domain Context: ${industry.toUpperCase()}`);

            const intelligence = this.generateIntelligence(industry);

            this.status = 'completed';
            return {
                agentName: this.name,
                status: this.status,
                data: intelligence,
                timestamp: new Date().toISOString(),
                logs: this.logs
            };

        } catch (error: any) {
            this.status = 'failed';
            return {
                agentName: this.name,
                status: 'failed',
                data: { error: error.message },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };
        }
    }

    private detectIndustry(product: string): string {
        const p = product.toLowerCase();
        if (p.includes('ai') || p.includes('software') || p.includes('app') || p.includes('platform') || p.includes('cloud')) return 'saas';
        if (p.includes('shoe') || p.includes('wear') || p.includes('shirt') || p.includes('dress') || p.includes('fashion')) return 'fashion';
        if (p.includes('coin') || p.includes('bank') || p.includes('invest') || p.includes('card') || p.includes('wallet')) return 'fintech';
        if (p.includes('tea') || p.includes('drink') || p.includes('food') || p.includes('snack')) return 'fmcg';
        if (p.includes('health') || p.includes('med') || p.includes('care') || p.includes('supplement')) return 'health';
        return 'general_tech'; // Default fallback
    }

    private generateIntelligence(industry: string): MarketAnalysisOutput {
        // Deterministic Strategy Maps
        const strategies: Record<string, any> = {
            'saas': {
                positioning: 'The Intelligent Enabler',
                triggers: ['Efficiency at scale', 'AI-powered automation', 'Seamless integration'],
                recommended_channels: ['LinkedIn', 'Twitter', 'TechCrunch'],
                risks: ['Buzzword fatigue', 'Implementation complexity']
            },
            'fashion': {
                positioning: 'The Identity Shaper',
                triggers: ['Visual Aesthetics', 'Social Validation', 'Sustainability'],
                recommended_channels: ['Instagram', 'TikTok', 'Pinterest'],
                risks: ['Greenwashing', 'Trend obsolescence']
            },
            'fintech': {
                positioning: 'The Trusted Partner',
                triggers: ['Financial Freedom', 'Security', 'Speed'],
                recommended_channels: ['LinkedIn', 'Google Search', 'Financial News'],
                risks: ['Trust deficit', 'Regulatory concerns']
            },
            'health': {
                positioning: 'The Wellness Companion',
                triggers: ['Vitality', 'Science-backed results', 'Ease of use'],
                recommended_channels: ['Instagram', 'YouTube', 'Health Blogs'],
                risks: ['Medical claims scrutiny', 'Skepticism']
            },
            'general_tech': {
                positioning: 'The Premium Choice',
                triggers: ['Performance', 'Status', 'Innovation'],
                recommended_channels: ['YouTube', 'Tech Blogs', 'Reddit'],
                risks: ['Commoditization', 'Better specs elsewhere']
            }
        };

        const strat = strategies[industry] || strategies['general_tech'];

        return {
            market_position: strat.positioning,
            key_triggers: strat.triggers,
            // Strict Schema Compliance
            risks: strat.risks,
            recommended_channels: strat.recommended_channels
        };
    }
}
