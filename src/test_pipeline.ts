
import { AgentOrchestrator } from './services/AgentOrchestrator';
import { GraphEvent } from './types/graph';

async function main() {
    console.log('--- STARTING PIPELINE VERIFICATION ---');

    const orchestrator = new AgentOrchestrator();

    // Mock Input
    const input = {
        product: "NeuralLink Headset",
        audience: "Tech Enthusiasts & Gamers",
        goal: "conversion",
        budget: "5000",
        platforms: ["Twitter", "Reddit"],
        brandGuidelines: "Use futuristic, cyberpunk tone."
    };

    // Listener
    orchestrator.subscribe((event: GraphEvent) => {
        console.log(`[EVENT: ${event.type}] Node: ${event.nodeId || 'N/A'} | Timestamp: ${event.timestamp}`);
        if (event.type === 'node_complete' && event.nodeId === 'creative_generation') {
            console.log('\n>>> CREATIVE GENERATION COMPLETE. CHECKING OUTPUT...\n');
            const variants = event.data?.variants;
            if (Array.isArray(variants)) {
                console.log(`Generated ${variants.length} variants.`);
                if (variants.length === 5) {
                    console.log('PASS: Exactly 5 variants generated.');
                } else {
                    console.error(`FAIL: Expected 5 variants, got ${variants.length}`);
                }
                console.log('Sample Variant:', JSON.stringify(variants[0], null, 2));
            } else {
                console.error('FAIL: No variants array found in output.');
            }
        }
    });

    try {
        console.log('1. Planning Campaign...');
        await orchestrator.planCampaign({ ...input, campaignId: 'test-run-1' });

        console.log('2. Starting Execution...');
        orchestrator.startExecution(); // non-blocking

        // Keep alive for a bit to allow execution
        await new Promise(resolve => setTimeout(resolve, 30000));

    } catch (e) {
        console.error('PIPELINE ERROR:', e);
    }
}

main();
