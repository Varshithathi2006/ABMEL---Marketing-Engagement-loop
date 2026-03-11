export class GroqService {
    private static apiKey = import.meta.env.VITE_GROQ_API_KEY;
    private static apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    static async generate(messages: { role: string; content: string }[], temperature: number = 0.7, jsonMode: boolean = true) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: messages,
                    temperature: temperature,
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Groq Generation Failed:', error);
            throw error;
        }
    }

    static async optimizeVisualPrompt(marketingDescription: string): Promise<string> {
        const prompt = `Convert the following marketing visual description into a highly descriptive, technical Stable Diffusion prompt.
        Focus strictly on: subjects, specific actions, environment, lighting (e.g. volumetric, cinematic), and artistic style.
        Preserve ALL key subjects and products mentioned. Keep it under 60 words.
        
        Description: ${marketingDescription}
        
        Return ONLY the optimized prompt as a JSON object: {"optimizedPrompt": "..."}`;

        try {
            const raw = await this.generate([
                { role: 'system', content: 'You are an expert AI prompt engineer for Stable Diffusion.' },
                { role: 'user', content: prompt }
            ], 0.3, true);

            const data = JSON.parse(raw);
            return data.optimizedPrompt || marketingDescription;
        } catch (error) {
            console.error('[Groq] Prompt optimization failed, using original.', error);
            return marketingDescription;
        }
    }
}
