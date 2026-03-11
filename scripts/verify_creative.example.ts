
import { CreativeGenerationAgent } from '../src/services/agents/CreativeGenerationAgent';
import { AgentResult } from '../src/types/abmel';
import dotenv from 'dotenv';
dotenv.config();

async function runVerification() {
    console.log("---------------------------------------------------");
    console.log("STARTING CREATIVE GENERATION AGENT VERIFICATION");
    console.log("---------------------------------------------------");

    const agent = new CreativeGenerationAgent();

    // Mock Input similar to what PersonaModelingAgent would output
    const mockInput = {
        product: "Nexus AI Headset",
        goal: "Product Launch",
        personaData: {
            persona_name: "Tech-Savvy Early Adopter",
            motivations: ["Innovation", "Status", "Efficiency"],
            pain_points: ["Obsolete tech", "Slow interfaces"],
            preferred_tone: "Futuristic & Direct"
        },
        marketData: {
            risks: ["High price perception", "Battery life concerns"]
        },
        brandGuidelines: "Use sleek, minimalist language. No buzzwords."
    };

    try {
        console.log("Executing Agent with Mock Input...");
        const result: AgentResult = await agent.execute(mockInput);

        console.log("\n--- AGENT RESULT STATUS:", result.status);

        if (result.status === 'completed' && result.data && result.data.variants) {
            const creatives = result.data.variants;
            console.log(`\nCreatives Generated: ${creatives.length}`);

            // Validation 1: Exact Count
            if (creatives.length !== 5) {
                console.error(`FAIL: Expected 5 creatives, got ${creatives.length}`);
                process.exit(1);
            } else {
                console.log("PASS: Exactly 5 creatives generated.");
            }

            // Validation 2: Best Creative Exists
            const bestCreative = creatives.find((c: any) => c.rank === 1);
            if (!bestCreative) {
                console.error("FAIL: No creative with rank 1 found.");
                process.exit(1);
            } else {
                console.log(`PASS: Best Creative found (ID: ${bestCreative.id})`);
            }

            // Validation 3: Schema Fields
            const sample = creatives[0];
            const hasVisualPrompt = !!sample.visual_prompt;
            const hasWhyItWorks = !!sample.why_it_works;

            console.log(`PASS: Schema Check - Visual Prompt: ${hasVisualPrompt ? 'YES' : 'NO'}`);
            console.log(`PASS: Schema Check - Explanation: ${hasWhyItWorks ? 'YES' : 'NO'}`);

            console.log("\n--- SAMPLE CREATIVE PREVIEW ---");
            console.log(`Strategy: ${sample.strategy}`);
            console.log(`Headline: ${sample.headline}`);
            console.log(`Visual Prompt: "${sample.visual_prompt}"`);
            console.log(`Why It Works: "${sample.why_it_works}"`);

            console.log("\nVERIFICATION SUCCESSFUL.");
        } else {
            console.error("FAIL: Agent did not complete successfully or returned empty data.");
            console.log(result);
        }

    } catch (error) {
        console.error("CRITICAL FAILURE:", error);
    }
}

runVerification();
