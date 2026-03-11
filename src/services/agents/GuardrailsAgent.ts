import { BaseAgent } from './BaseAgent';
import type { AgentResult } from '../../types/abmel';

export class GuardrailsAgent extends BaseAgent {
    constructor() {
        super('GuardrailsAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        const creative = input.selected_creative;

        if (!creative) {
            this.log('Waiting for creative selection...');
            // If we return 'completed' here without data, it breaks the flow.
            // We should probably remain in 'running' or fail if we expected input.
            // Given dependencies, we shouldn't run unless Decision completed.
            // If Decision completed with "Regeneration", we shouldn't be here.

            return {
                agentName: this.name,
                status: 'failed',
                data: { passed: false, error: 'No creative provided for validation' },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };
        }

        this.log(`Validating creative: ${creative.id}...`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // SIMULATION LOGIC:
        // Fail if the creative definition contains specific "bad" words (mock)
        // Or randomly fail 20% of the time to demonstrate the loop
        const isUnsafe = Math.random() < 0.2;

        if (isUnsafe) {
            this.log('VIOLATION DETECTED: Creative contains prohibited patterns.');
            return {
                agentName: this.name,
                status: 'completed',
                data: {
                    passed: false,
                    issues: ['Tone mismatch', 'Prohibited visual element detected'],
                    failed_variant_id: creative?.id
                },
                timestamp: new Date().toISOString(),
                logs: this.logs
            };
        }

        this.log('Guardrails passed. Creative certified for deployment.');
        this.status = 'completed';

        return {
            agentName: this.name,
            status: this.status,
            // Pass the creative back out to ensure it sticks in the final context
            data: {
                passed: true,
                issues: [],
                selected_creative: creative,
                compliance_report: {
                    overall_score: 98,
                    checks: [
                        { name: 'Brand Safety Policy', status: 'PASS' },
                        { name: 'Regulatory Compliance (FTC)', status: 'PASS' },
                        { name: 'Tone & Voice Check', status: 'PASS' },
                        { name: 'Visual Integrity', status: 'PASS' }
                    ],
                    certified_at: new Date().toISOString()
                }
            },
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }
}
