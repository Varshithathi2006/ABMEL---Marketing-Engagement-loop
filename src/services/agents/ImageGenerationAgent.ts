
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

        if (!imageGenerationService.isEnabled()) {
            this.log('Image Generation Service is disabled. Enabling for session.');
            imageGenerationService.setEnabled(true);
        }

        // ── Target: always the first creative (rank 1 / index 0) ──────────
        // Find rank-1 explicitly; fall back to index 0.
        const VISUAL_PLATFORMS = ['instagram', 'web'];
        const rankOneIndex = creatives.findIndex(
            (c: any) => c.rank === 1 || c.rank === 'BEST' || c.is_best_creative
        );
        const primaryIndex = rankOneIndex >= 0 ? rankOneIndex : 0;

        this.log(`Targeting creative at index ${primaryIndex} (rank 1) for image generation.`);

        // ── Process sequentially to preserve array order ──────────────────
        const updatedCreatives: CreativeVariant[] = [];

        for (let index = 0; index < creatives.length; index++) {
            const creative = creatives[index];
            const platform = ((creative as any).platform || '').toLowerCase();
            const isVisualPlatform = VISUAL_PLATFORMS.some(p => platform.includes(p));
            const isTarget = index === primaryIndex;

            // Only generate image for: the primary creative AND it targets Instagram or Web
            if (!isTarget || !isVisualPlatform) {
                if (isTarget && !isVisualPlatform) {
                    this.log(`Skipping image for primary creative: platform "${(creative as any).platform}" is not Instagram or Web.`);
                }
                updatedCreatives.push(creative);
                continue;
            }

            try {
                this.log(`🎨 Visualizing rank-1 creative: "${(creative as any).headline}" (${(creative as any).platform})`);

                const platformStyle = this.getPlatformStyle((creative as any).platform || 'General');
                const finalPrompt = `${(creative as any).visual_prompt}, (${platformStyle}:1.2), high quality, professional photorealistic`;

                const results = await imageGenerationService.generateAllImages({
                    prompt: finalPrompt,
                    aspectRatio: '16:9'
                });

                if (results.length > 0) {
                    this.log(`${results.length} image(s) generated successfully.`);

                    const campaignId = (input as any).campaignId;
                    const persistedAssets: any[] = [];
                    let primaryUrl = results[0].url;
                    let primaryProvider = results[0].provider;

                    if (campaignId && !campaignId.startsWith('temp-')) {
                        const { SupabaseService } = await import('../SupabaseService');
                        const svc = SupabaseService.getInstance();

                        this.log(`Uploading ${results.length} asset(s) for creative ${(creative as any).id}...`);

                        for (let i = 0; i < results.length; i++) {
                            try {
                                const storageUrl = await svc.uploadImageFromUrl(
                                    campaignId,
                                    `${(creative as any).id}_${i}`,
                                    results[i].url
                                );
                                if (storageUrl) {
                                    persistedAssets.push({
                                        url: storageUrl,
                                        provider: results[i].provider,
                                        metadata: results[i].metadata
                                    });
                                }
                            } catch (e) {
                                this.log(`Upload failed for ${results[i].provider}: ${e}`);
                            }
                        }

                        if (persistedAssets.length > 0) {
                            primaryUrl = persistedAssets[0].url;
                            primaryProvider = persistedAssets[0].provider;
                            await svc.updateCreativeVisual(
                                (creative as any).id!,
                                primaryUrl,
                                primaryProvider,
                                persistedAssets
                            );
                            this.log(`Persisted ${persistedAssets.length} asset(s) to Supabase.`);
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
                    this.log(`No images generated for ${(creative as any).id}. Using stock fallback.`);
                    const stock = await imageGenerationService.generateImage({
                        prompt: (creative as any).visual_prompt,
                        backend: 'STOCK_PHOTO'
                    });
                    updatedCreatives.push(stock
                        ? { ...creative, visual_asset_url: stock.url, visual_asset_provider: stock.provider, imageUrl: stock.url } as any
                        : creative
                    );
                }

            } catch (error: any) {
                this.log(`❌ Image generation failed for ${(creative as any).id}: ${error.message || error}`);
                updatedCreatives.push(creative);
            }
        }

        this.log(`Done. ${updatedCreatives.filter((c: any) => c.visual_asset_url).length} creative(s) have images.`);
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
