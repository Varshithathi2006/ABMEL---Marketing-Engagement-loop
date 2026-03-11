import { BaseAgent } from './BaseAgent';
import type { AgentResult, CreativeVariant } from '../../types/abmel';
import { GroqService } from '../GroqService';

export class CreativeGenerationAgent extends BaseAgent {
    constructor() {
        super('CreativeGenerationAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Initializing Creative Synthesis Module...');

        // RETRY LOGIC (Step 5: "retry once -> else fail")
        let attempt = 0;
        const maxAttempts = 2;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                this.log(`Attempt ${attempt}/${maxAttempts}: Generating Creatives...`);
                const variants = await this.generateCreatives(input);

                this.status = 'completed';
                return {
                    agentName: this.name,
                    status: 'completed',
                    data: { variants }, // Standardized output key
                    timestamp: new Date().toISOString(),
                    logs: this.logs
                };

            } catch (error: any) {
                this.log(`Attempt ${attempt} failed: ${error.message}`);
                if (attempt >= maxAttempts) {
                    this.status = 'failed';
                    return {
                        agentName: this.name,
                        status: 'failed',
                        data: { error: `Final Error after ${maxAttempts} attempts: ${error.message}` },
                        timestamp: new Date().toISOString(),
                        logs: this.logs
                    };
                }
                // Wait briefly before retry
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // Fallback (Should be unreachable)
        return {
            agentName: this.name,
            status: 'failed',
            data: { error: "Unknown failure" },
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }

    private async generateCreatives(input: any): Promise<CreativeVariant[]> {
        // 1. Context Synthesis
        const product = input.product || 'Unknown Product';
        const personaName = input.personaData?.persona_name || 'General Audience';
        const motivations = input.personaData?.motivations?.join(', ') || '';
        const painPoints = input.personaData?.pain_points?.join(', ') || '';
        const tone = input.personaData?.preferred_tone || 'Professional';
        const goal = input.goal || 'AWARENESS';
        const brandConstraints = input.brandGuidelines ? `Brand Guidelines: ${input.brandGuidelines}` : 'No strict brand guidelines.';

        // 2. Strict System Prompt
        const systemPrompt = `
You are the Lead Creative Director of a top-tier ad agency.
Your task is to generate EXACTLY 5 distinct creative ad concepts for a campaign.

CAMPAIGN CONTEXT:
Product: ${product}
Target Persona: ${personaName}
Motivations: ${motivations}
Pain Points: ${painPoints}
Preferred Tone: ${tone}
Goal: ${goal}
Constraints: ${brandConstraints}

REQUIRED OUTPUT:
You must generate a SINGLE valid JSON object containing an array of 5 creative objects.
One creative must be identified as the "BEST" (rank 1).
The other 4 must be ranked 2-5.

STRATEGIES (Must use all 5, ONE per creative):
1. Feature-Led (Focus on specs/utility)
2. Emotional (Focus on feelings/aspirations)
3. Social Proof (Testimonial/Trust authority)
4. Price/Value (ROI/Offer focus)
5. Lifestyle / Use-Case (Problem-Solution narrative)

JSON SCHEMA (Strict):
{
  "creatives": [
    {
      "rank": 1, 
      "strategy": "Feature | Emotional | SocialProof | Price | Lifestyle",
      "platform": "LinkedIn | Instagram | Twitter | Email | Web",
      "headline": "Punchy headline (max 50 chars)",
      "body": "Compelling copy (max 280 chars)",
      "cta": "Clear Call to Action",
      "tone": "Matches preferred tone",
      "visual_prompt": "Detailed AI image generation prompt describing the scene, lighting, style, and subject.",
      "why_it_works": "Brief explanation of why this strategy fits the persona.",
      "target_persona_trait": "Which specific motivation/pain point does this target?"
    },
    ... (4 more items)
  ]
}

RULES:
- Return ONLY valid JSON.
- EXACTLY 5 items.
- NO introduction or markdown formatting outside the JSON.
- Ensure 'visual_prompt' is descriptive enough for Stable Diffusion.
`;

        // 3. Call Groq
        const resultJson = await GroqService.generate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate 5 creatives for ${product} targeting ${personaName}.` }
        ]);

        // 4. Parse & Validate
        let parsed;
        try {
            // Aggressive cleanup
            const clean = resultJson.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(clean);
        } catch (e) {
            console.error("LLM JSON Parse Error:", resultJson);
            throw new Error("Invalid JSON response from LLM");
        }

        if (!parsed.creatives || !Array.isArray(parsed.creatives)) {
            throw new Error("Response missing 'creatives' array");
        }

        if (parsed.creatives.length !== 5) {
            throw new Error(`Expected 5 creatives, got ${parsed.creatives.length}. Strict 5 required.`);
        }

        // 5. Map & Verify
        const STRATEGY_ORDER = ['Feature', 'Emotional', 'SocialProof', 'Price', 'Lifestyle'];

        return parsed.creatives.map((c: any, index: number) => {
            // Fallback for strategy if missing or hallucinated
            const strategyType = (c.strategy && STRATEGY_ORDER.some(s => c.strategy.includes(s)))
                ? c.strategy
                : STRATEGY_ORDER[index % 5];

            // Deterministic ID
            const pseudoId = `cr-${Date.now()}-${index}`;

            return {
                id: pseudoId,
                rank: c.rank || index + 1,
                strategy_type: strategyType as any,
                strategy: strategyType,
                platform: c.platform || "General",
                headline: c.headline || "Untitled Creative",
                body: c.body || c.primary_copy || "No copy generated.",
                cta: c.cta || "Learn More",
                visual_prompt: c.visual_prompt || "Abstract concept visualization.",
                tone: c.tone || tone,

                // Explainability
                why_it_works: c.why_it_works || "Aligned with campaign goals.",
                target_persona_trait: c.target_persona_trait || "General Audience Interest"
            };
        });
    }
}
