
/**
 * ImageGenerationService.ts
 * 
 * Service facade for pluggable image generation backends with auto-verification and failover.
 */

export type ImageBackend = 'FLUX' | 'STABLE_DIFFUSION_LOCAL' | 'HUGGING_FACE' | 'HUGGING_FACE_SDXL' | 'REPLICATE' | 'LCM' | 'STABILITY_AI' | 'AI_HORDE' | 'POLLINATIONS' | 'STOCK_PHOTO';

export interface ImageGenerationRequest {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: '16:9' | '1:1' | '9:16';
    backend?: ImageBackend | string; // Allow string for legacy references
    forceBackend?: boolean;
}

export interface ImageGenerationResult {
    url: string;
    provider: string;
    metadata: any;
}

class ImageGenerationService {
    private static instance: ImageGenerationService;

    // Default config
    private config = {
        enabled: true,
        defaultBackend: 'POLLINATIONS' as ImageBackend,
        localEndpoint: 'http://127.0.0.1:7860/sdapi/v1/txt2img'
    };

    private constructor() { }

    public static getInstance(): ImageGenerationService {
        if (!ImageGenerationService.instance) {
            ImageGenerationService.instance = new ImageGenerationService();
        }
        return ImageGenerationService.instance;
    }

    /**
     * Entry point with auto-failover and verification.
     */
    public async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult | null> {
        console.log(`[ImageGen] generateImage entry: "${request.prompt.substring(0, 50)}..."`);

        if (!this.config.enabled) {
            console.warn('[ImageGen] Service is currently disabled.');
            return null;
        }

        // Reordered: FLUX is high quality but needs key. POLLINATIONS is free and fast. LCM is back-up. STOCK_PHOTO is absolute backup.
        const defaultFallbacks: ImageBackend[] = ['FLUX', 'POLLINATIONS', 'LCM', 'HUGGING_FACE_SDXL', 'AI_HORDE', 'REPLICATE', 'STABILITY_AI', 'STOCK_PHOTO'];

        let backendsToTry: ImageBackend[];
        if (request.backend) {
            const isKnown = (b: string): b is ImageBackend =>
                ['FLUX', 'STABLE_DIFFUSION_LOCAL', 'HUGGING_FACE', 'HUGGING_FACE_SDXL', 'REPLICATE', 'LCM', 'STABILITY_AI', 'AI_HORDE', 'POLLINATIONS', 'STOCK_PHOTO'].includes(b);

            const b = request.backend as string;
            if (isKnown(b)) {
                backendsToTry = request.forceBackend
                    ? [b]
                    : [b, ...defaultFallbacks.filter(f => f !== b)];
            } else {
                console.warn(`[ImageGen] Requested unknown backend ${b}, using fallbacks.`);
                backendsToTry = defaultFallbacks;
            }
        } else {
            backendsToTry = defaultFallbacks;
        }

        const startTime = Date.now();
        const GLOBAL_TIMEOUT = 5 * 60 * 1000; // 5 minutes

        for (const backend of backendsToTry) {
            console.log(`[ImageGen] Trying backend: ${backend}`);
            // Check global timeout
            if (Date.now() - startTime > GLOBAL_TIMEOUT) {
                console.warn('[ImageGen] Global 5-minute timeout reached. Falling back to Stock Photo.');
                return await this.generateStockPhoto(request);
            }

            const maxAttempts = (backend === 'LCM' || backend === 'AI_HORDE' || backend === 'POLLINATIONS') ? 2 : 1;
            let attempts = 0;

            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    let result: ImageGenerationResult;
                    if (backend === 'HUGGING_FACE' || backend === 'HUGGING_FACE_SDXL') {
                        result = await this.generateHuggingFace(request, backend === 'HUGGING_FACE_SDXL');
                    } else if (backend === 'STABILITY_AI') {
                        result = await this.generateStabilityAI(request);
                    } else if (backend === 'REPLICATE') {
                        result = await this.generateReplicate(request);
                    } else if (backend === 'AI_HORDE') {
                        result = await this.generateAIHorde(request);
                    } else if (backend === 'STABLE_DIFFUSION_LOCAL') {
                        result = await this.generateLocal(request);
                    } else if (backend === 'LCM') {
                        result = await this.generateLCM(request);
                    } else if (backend === 'POLLINATIONS') {
                        result = await this.generatePollinations(request);
                    } else if (backend === 'FLUX') {
                        result = await this.generateFlux(request);
                    } else if (backend === 'STOCK_PHOTO') {
                        result = await this.generateStockPhoto(request);
                    } else {
                        break; // Unknown backend
                    }

                    // Verification 
                    console.log(`[ImageGen] Verifying ${backend} result: ${result.url.substring(0, 50)}...`);
                    // Increased timeouts to handle slow generation
                    const isOk = await this.verifyImageUrl(result.url, (backend === 'LCM' || backend === 'POLLINATIONS') ? 45000 : 60000);
                    if (!isOk) {
                        console.error(`[ImageGen] ${backend} failed verification.`);
                        throw new Error(`${backend} failed verification`);
                    }

                    console.log(`[ImageGen] ${backend} succeeded!`);
                    return result;
                } catch (error: any) {
                    console.error(`[ImageGen] Attempt ${attempts}/${maxAttempts} for ${backend} failed:`, error.message || error);

                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        continue;
                    }
                    break;
                }
            }
        }

        // ABSOLUTE LAST RESORT: Return a stock photo without verification if everything else failed
        console.warn('[ImageGen] All backends failed. Using absolute last-resort fallback.');
        try {
            return await this.generateStockPhoto(request);
        } catch (e) {
            // If even stock photo fails (e.g. network down), we return a random picsum image as a hardcoded backup
            return {
                url: 'https://picsum.photos/1024/1024',
                provider: 'Picsum (Hard Fallback)',
                metadata: { type: 'random' }
            };
        }
    }

    /**
     * Parallel generation across multiple backends.
     */
    public async generateAllImages(request: ImageGenerationRequest): Promise<ImageGenerationResult[]> {
        console.log(`[ImageGen] generateAllImages entry: "${request.prompt.substring(0, 50)}..."`);

        if (!this.config.enabled) {
            console.warn('[ImageGen] Service is currently disabled.');
            return [];
        }

        const backendsToRun: ImageBackend[] = ['FLUX', 'POLLINATIONS', 'LCM', 'HUGGING_FACE_SDXL', 'AI_HORDE', 'REPLICATE', 'STABILITY_AI', 'STOCK_PHOTO'];

        const results = await Promise.allSettled(backendsToRun.map(async (backend) => {
            try {
                let result: ImageGenerationResult;
                if (backend === 'HUGGING_FACE' || backend === 'HUGGING_FACE_SDXL') {
                    result = await this.generateHuggingFace(request, backend === 'HUGGING_FACE_SDXL');
                } else if (backend === 'STABILITY_AI') {
                    result = await this.generateStabilityAI(request);
                } else if (backend === 'REPLICATE') {
                    result = await this.generateReplicate(request);
                } else if (backend === 'AI_HORDE') {
                    result = await this.generateAIHorde(request);
                } else if (backend === 'STABLE_DIFFUSION_LOCAL') {
                    result = await this.generateLocal(request);
                } else if (backend === 'LCM') {
                    result = await this.generateLCM(request);
                } else if (backend === 'POLLINATIONS') {
                    result = await this.generatePollinations(request);
                } else if (backend === 'FLUX') {
                    result = await this.generateFlux(request);
                } else if (backend === 'STOCK_PHOTO') {
                    result = await this.generateStockPhoto(request);
                } else {
                    throw new Error(`Unknown backend: ${backend}`);
                }

                // Quick verification (increased timeout for parallel as well)
                const isOk = await this.verifyImageUrl(result.url, 45000);
                if (!isOk) throw new Error(`${backend} failed verification`);

                return result;
            } catch (error: any) {
                console.warn(`[ImageGen] Parallel backend ${backend} failed:`, error.message || error);
                throw error;
            }
        }));

        const successfulResults = results
            .filter((r): r is PromiseFulfilledResult<ImageGenerationResult> => r.status === 'fulfilled')
            .map(r => r.value);

        console.log(`[ImageGen] Parallel generation finished. Successes: ${successfulResults.length}/${backendsToRun.length}`);

        return successfulResults;
    }

    private async verifyImageUrl(url: string, timeout = 30000): Promise<boolean> {
        if (url.startsWith('data:') || url.startsWith('blob:')) return true;

        return new Promise((resolve) => {
            const img = new Image();
            const timer = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                img.src = ''; // Cancel loading
                console.warn(`[ImageGen] Verification timeout (30s): ${url.substring(0, 50)}...`);
                resolve(false);
            }, timeout);

            img.onload = () => {
                clearTimeout(timer);
                if (img.naturalWidth < 10 || img.naturalHeight < 10) {
                    console.warn(`[ImageGen] Verification failed: Image too small (${img.naturalWidth}x${img.naturalHeight})`);
                    resolve(false);
                } else {
                    resolve(true);
                }
            };

            img.onerror = () => {
                clearTimeout(timer);
                console.warn(`[ImageGen] Verification failed: Could not load image from ${url.substring(0, 50)}...`);
                resolve(false);
            };

            // REMOVED crossOrigin = 'anonymous' to avoid CORS rejection on servers that don't send headers
            // but serve valid images for <img> tags.
            img.src = url;
        });
    }


    private async generateLCM(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
        if (!apiKey) throw new Error('Hugging Face API Key missing in .env');

        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/SimianLuo/LCM_Dreamshaper_v7",
            {
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({ inputs: request.prompt }),
            }
        );
        if (!response.ok) throw new Error(`LCM failed: ${response.status} ${response.statusText}`);
        const blob = await response.blob();
        return { url: URL.createObjectURL(blob), provider: 'HF-LCM', metadata: {} };
    }

    private async generateFlux(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
        if (!apiKey) throw new Error('Hugging Face API Key missing in .env');

        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false"
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: request.prompt,
                    parameters: {
                        guidance_scale: 3.5,
                        num_inference_steps: 4
                    }
                }),
            }
        );

        if (response.status === 503) {
            const data = await response.json();
            throw new Error(`FLUX loading: ${data.estimated_time || 20}s`);
        }

        if (!response.ok) throw new Error(`FLUX failed: ${response.status}`);

        const blob = await response.blob();
        return {
            url: URL.createObjectURL(blob),
            provider: 'HF-FLUX',
            metadata: { model: 'FLUX.1-schnell' }
        };
    }

    private async generatePollinations(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        const seed = Math.floor(Math.random() * 1000000);
        // Using turbo model for faster/more reliable free generation
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(request.prompt)}?seed=${seed}&width=1024&height=1024&nologo=true&model=turbo`;

        return {
            url,
            provider: 'Pollinations AI',
            metadata: { seed, model: 'turbo' }
        };
    }

    private async generateHuggingFace(request: ImageGenerationRequest, isSDXL = true): Promise<ImageGenerationResult> {
        const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
        if (!apiKey) throw new Error('Hugging Face API Key missing in .env');

        const model = isSDXL ? "stabilityai/stable-diffusion-xl-base-1.0" : "stabilityai/stable-diffusion-2-1";
        const response = await fetch(
            `https://router.huggingface.co/hf-inference/models/${model}`,
            {
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({
                    inputs: request.prompt,
                    parameters: { negative_prompt: request.negativePrompt }
                }),
            }
        );
        if (!response.ok) throw new Error(`HF failed: ${response.status}`);
        const blob = await response.blob();
        return { url: URL.createObjectURL(blob), provider: `HF-${isSDXL ? 'SDXL' : 'SD21'}`, metadata: {} };
    }

    private async generateStabilityAI(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        const apiKey = import.meta.env.VITE_STABILITY_API_KEY;
        if (!apiKey) throw new Error('Stability AI API Key missing in .env');

        const response = await fetch(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    text_prompts: [{ text: request.prompt }],
                    cfg_scale: 7,
                    height: 1024,
                    width: 1024,
                    steps: 30,
                    samples: 1,
                }),
            }
        );

        if (!response.ok) throw new Error(`Stability failed: ${response.status}`);
        const data = await response.json();
        return {
            url: `data:image/png;base64,${data.artifacts[0].base64}`,
            provider: 'StabilityAI',
            metadata: { seed: data.artifacts[0].seed }
        };
    }

    private async generateReplicate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        const apiKey = import.meta.env.VITE_REPLICATE_API_TOKEN;
        if (!apiKey) throw new Error('Replicate API Token missing in .env');

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "ac732d844af6f7902047ae3a097728f2441c0994d547d9539d9f95889704044c", // SDXL
                input: { prompt: request.prompt }
            })
        });

        if (!response.ok) throw new Error(`Replicate failed: ${response.status}`);
        let prediction = await response.json();

        // Polling loop (max 60 seconds for higher reliability)
        const start = Date.now();
        while (prediction.status !== "succeeded" && prediction.status !== "failed") {
            if (Date.now() - start > 60000) throw new Error("Replicate timeout (60s)");
            await new Promise(resolve => setTimeout(resolve, 3000));

            const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: { "Authorization": `Token ${apiKey}` }
            });
            if (pollResponse.ok) {
                prediction = await pollResponse.json();
            }
        }

        if (prediction.status === "failed") throw new Error("Replicate prediction failed");

        return {
            url: prediction.output[0],
            provider: 'Replicate-SDXL',
            metadata: { id: prediction.id }
        };
    }

    private async generateAIHorde(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        // AI Horde is a distributed crowd-sourced backend
        const response = await fetch("https://stablehorde.net/api/v2/generate/sync", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": "0000000000", // Anonymous key
                "Client-Agent": "ABMEL:1.1:Agent"
            },
            body: JSON.stringify({
                prompt: request.prompt,
                params: {
                    steps: 20,
                    n: 1,
                    sampler_name: "k_euler",
                    width: 512, // More success for anonymous at 512
                    height: 512,
                },
                models: ["stable_diffusion"]
            })
        });

        if (!response.ok) throw new Error(`AI Horde failed: ${response.status}`);
        const data = await response.json();
        if (!data.generations || data.generations.length === 0) throw new Error('AI Horde returned no images');

        return {
            url: data.generations[0].img,
            provider: 'AI-Horde',
            metadata: { model: data.generations[0].model }
        };
    }

    private async generateStockPhoto(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        // Extract meaningful keywords for a contextually relevant stock photo fallback
        const keywords = request.prompt
            .split(/[,.;]/)
            .map(s => s.trim())
            .filter(s => s.length > 3 && !['high', 'quality', 'shot', 'lighting', 'cinematic', 'photorealistic'].includes(s.toLowerCase()))
            .slice(0, 3)
            .join(',');

        const query = keywords || "business,marketing,tech";

        // LoremFlickr is better for tag-based search than Picsum
        const url = `https://loremflickr.com/1024/1024/${encodeURIComponent(query)}`;

        return {
            url,
            provider: 'Stock Photo (Fallback)',
            metadata: { query, source: 'LoremFlickr' }
        };
    }

    private async generateLocal(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        const response = await fetch(this.config.localEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: request.prompt, steps: 20 })
        });
        if (!response.ok) throw new Error("Local SD failed");
        const data = await response.json();
        return { url: `data:image/png;base64,${data.images[0]}`, provider: 'LocalSD', metadata: {} };
    }

    public isEnabled(): boolean { return this.config.enabled; }
    public setEnabled(status: boolean) { this.config.enabled = status; }
}

export const imageGenerationService = ImageGenerationService.getInstance();
