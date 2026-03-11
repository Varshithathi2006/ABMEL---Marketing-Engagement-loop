
import { BaseAgent } from './BaseAgent';
import type { AgentResult, CreativeVariant } from '../../types/abmel';
import { imageGenerationService } from '../image/ImageGenerationService';

export class ImageGenerationAgent extends BaseAgent {
    constructor() {
        super('ImageGenerationAgent');
    }

    async execute(input: any): Promise<AgentResult> {
        this.status = 'running';
        this.log('Initializing Image Generation Module...');

        const creatives: CreativeVariant[] = input.creatives || [];

        if (creatives.length === 0) {
            this.log('No creatives found to visualize. Skipping.');
            return this.complete([]);
        }

        // Enable service temporarily for this execution if not globally enabled?
        // For now, we assume user enables it or we auto-enable for this agent's run if configured.
        // Currently, we'll respect the global config.
        if (!imageGenerationService.isEnabled()) {
            this.log('Image Generation Service is disabled in config. Enabling for session.');
            imageGenerationService.setEnabled(true);
        }

        const updatedCreatives: CreativeVariant[] = [];

        // Find the best creative to generate an image for, or default to the first one
        const targetCreativeIndex = creatives.findIndex(c => (c as any).rank === 'BEST' || (c as any).is_best_creative);
        const indexToGenerate = targetCreativeIndex >= 0 ? targetCreativeIndex : 0;

        this.log(`Generating image for 1 creative to allow quick verification...`);

        // Process concurrently, but only actually generate for the selected one
        await Promise.all(creatives.map(async (creative, index) => {
            if (index !== indexToGenerate) {
                // Skip image generation for other creatives initially to save time
                updatedCreatives.push(creative);
                return;
            }

            try {
                this.log(`🎨 Visualizing: "${creative.headline}"`);

                const platformStyle = this.getPlatformStyle(creative.platform || 'General');
                const finalPrompt = `${creative.visual_prompt}, (${platformStyle}:1.2), high quality, professional photorealistic`;

                this.log(`Starting parallel image generation for "${creative.headline.substring(0, 30)}..."`);

                // 1. Generate All (Parallel)
                const results = await imageGenerationService.generateAllImages({
                    prompt: finalPrompt,
                    aspectRatio: '16:9'
                });

                if (results.length > 0) {
                    this.log(`Parallel generation: ${results.length} models succeeded.`);

                    const campaignId = (input as any).campaignId;
                    const persistedAssets: any[] = [];
                    let primaryUrl = results[0].url;
                    let primaryProvider = results[0].provider;

                    // 2. Persist ALL to Storage
                    if (campaignId && !campaignId.startsWith('temp-')) {
                        const { SupabaseService } = await import('../SupabaseService');
                        const svc = SupabaseService.getInstance();

                        this.log(`Uploading ${results.length} visual assets for ${creative.id}...`);

                        // Concurrent uploads
                        const uploadResults = await Promise.all(results.map(async (res, i) => {
                            try {
                                const storageUrl = await svc.uploadImageFromUrl(campaignId, `${creative.id}_${i}`, res.url);
                                if (storageUrl) {
                                    return {
                                        url: storageUrl,
                                        provider: res.provider,
                                        metadata: res.metadata
                                    };
                                }
                            } catch (e) {
                                this.log(`Upload failed for ${res.provider}: ${e}`);
                            }
                            return null;
                        }));

                        const successfulUploads = uploadResults.filter(Boolean);
                        persistedAssets.push(...successfulUploads);

                        if (persistedAssets.length > 0) {
                            primaryUrl = persistedAssets[0].url;
                            primaryProvider = persistedAssets[0].provider;

                            await svc.updateCreativeVisual(creative.id!, primaryUrl, primaryProvider, persistedAssets);
                            this.log(`Persisted ${persistedAssets.length} assets to Supabase.`);
                        }
                    }

                    updatedCreatives.push({
                        ...creative,
                        visual_asset_url: primaryUrl,
                        visual_asset_provider: primaryProvider,
                        visual_assets: persistedAssets,
                        imageUrl: primaryUrl
                    } as any);
                } else {
                    this.log(`No images were generated successfully for ${creative.id}. Using stock fallback.`);
                    // Generate a single stock photo as a last resort in the agent level
                    const stock = await imageGenerationService.generateImage({
                        prompt: creative.visual_prompt,
                        backend: 'STOCK_PHOTO'
                    });
                    if (stock) {
                        updatedCreatives.push({
                            ...creative,
                            visual_asset_url: stock.url,
                            visual_asset_provider: stock.provider,
                            imageUrl: stock.url
                        } as any);
                    } else {
                        updatedCreatives.push(creative);
                    }
                }
            } catch (error: any) {
                this.log(`❌ Critical failure generating images for ${creative.id}: ${error.message || error}`);
                updatedCreatives.push(creative);
            }
        }));

        this.log(`Image Generation Agent finished. Modified ${updatedCreatives.filter(c => c.visual_asset_url).length} items.`);
        return this.complete(updatedCreatives);
    }

    private complete(data: any): AgentResult {
        this.status = 'completed';
        return {
            agentName: this.name,
            status: 'completed',
            data: { variants: data }, // Maintain "variants" structure for compatibility
            timestamp: new Date().toISOString(),
            logs: this.logs
        };
    }

    private getPlatformStyle(platform: string): string {
        const styles: Record<string, string> = {
            'LinkedIn': 'professional corporate photography, clean lighting, trusted atmosphere, verified',
            'Instagram': 'lifestyle aesthetic, warm natural lighting, high engagement, influencer style, vsco preset',
            'Twitter': 'bold minimalist graphic, high contrast, catchy, vector art style or sharp photo',
            'Email': 'clean product shot, white background studio lighting, commercial photography',
            'Web': 'hero website banner, wide angle, sleek UI context, landing page style'
        };
        // Fuzzy match
        const key = Object.keys(styles).find(k => platform.toLowerCase().includes(k.toLowerCase()));
        return key ? styles[key] : 'high quality commercial photography, 4k, trending on artstation';
    }
}
