import { BaseAgent } from './BaseAgent';
import type { AgentResult } from '../../types/abmel';

// Helper to generate random score in range
const randomScore = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export class CTRAgent extends BaseAgent {
    constructor() {
        super('CTRAgent');
    }
    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Predicting CTR for generated variants...');

        const variants = input.variants || [];
        const ctr_scores: Record<string, number> = {};

        // Simulate processing each variant
        await new Promise(resolve => setTimeout(resolve, 600));

        variants.forEach((v: any) => {
            // Generate a realistic CTR-like score (0-100 scale for normalized ranking)
            ctr_scores[v.id] = randomScore(75, 98);
        });

        this.log(`Scored ${variants.length} variants for CTR.`);

        return {
            agentName: this.name,
            status: 'completed',
            data: { ctr_scores },
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }
}

export class MemorabilityAgent extends BaseAgent {
    constructor() {
        super('MemorabilityAgent');
    }
    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Predicting Memorability...');

        const variants = input.variants || [];
        const mem_scores: Record<string, number> = {};

        await new Promise(resolve => setTimeout(resolve, 600));

        variants.forEach((v: any) => {
            mem_scores[v.id] = randomScore(70, 95);
        });

        this.log(`Scored ${variants.length} variants for Memorability.`);

        return {
            agentName: this.name,
            status: 'completed',
            data: { mem_scores },
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }
}

export class BrandAlignmentAgent extends BaseAgent {
    constructor() {
        super('BrandAlignmentAgent');
    }
    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Checking Brand Alignment...');

        const variants = input.variants || [];
        const brand_scores: Record<string, number> = {};

        await new Promise(resolve => setTimeout(resolve, 600));

        variants.forEach((v: any) => {
            brand_scores[v.id] = randomScore(85, 99); // Brand alignment usually high for controlled gen
        });

        this.log(`Scored ${variants.length} variants for Brand Alignment.`);

        return {
            agentName: this.name,
            status: 'completed',
            data: { brand_scores },
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }
}
