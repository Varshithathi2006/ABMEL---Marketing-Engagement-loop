import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

// Define types matching our Schema
export interface DatabaseCampaign {
    id: string;
    product: string;
    target_audience: string;
    price: string;
    campaign_goal: 'AWARENESS' | 'CONVERSIONS' | 'ENGAGEMENT';
    status: 'PLANNING' | 'PROCESSING' | 'CREATIVES_READY' | 'FAILED';
    best_creative_id?: string;
    created_at?: string;
}

export interface CreativeVariant {
    id?: string;
    strategy_type: 'FEATURE' | 'EMOTIONAL' | 'SOCIAL_PROOF' | 'PRICE' | 'LIFESTYLE';
    headline: string;
    body_copy: string;
    visual_prompt: string;
    tone: string;
    platform: string;
    is_best_creative?: boolean;
}

export class SupabaseService {
    private static instance: SupabaseService;

    private constructor() { }

    public static getInstance(): SupabaseService {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }

    // --- CAMPAIGNS ---
    public async createCampaign(userId: string, input: any): Promise<string> {
        // 1. Strict Goal Mapping (UI -> DB Enum)
        const GOAL_MAP: Record<string, 'AWARENESS' | 'CONVERSIONS' | 'ENGAGEMENT'> = {
            'awareness': 'AWARENESS',
            'conversions': 'CONVERSIONS',
            'conversion': 'CONVERSIONS',
            'engagement': 'ENGAGEMENT'
        };

        const rawGoal = (input.goal || 'AWARENESS').toLowerCase().trim();
        const mappedGoal = GOAL_MAP[rawGoal];

        if (!mappedGoal) {
            throw new Error(`Invalid Campaign Goal: "${input.goal}". Supported: AWARENESS, CONVERSIONS, ENGAGEMENT.`);
        }

        // 2. Ensure User exists in public.users to prevent FK violations
        try {
            const { data: userRecord } = await supabase.from('users').select('id').eq('id', userId).single();
            if (!userRecord) {
                console.log('[DB] User record missing in public.users, creating...');
                const authUser = useAuthStore.getState().user;
                await supabase.from('users').upsert({
                    id: userId,
                    email: authUser?.email || 'unknown@example.com',
                    role: 'Marketing_Director'
                });
            }
        } catch (e) {
            console.warn('[DB] User check/upsert failed, attempting campaign insert anyway:', e);
        }

        // 3. Insert into campaigns table
        const insertPromise = supabase
            .from('campaigns')
            .insert({
                user_id: userId,
                product: input.product,
                target_audience: input.audience || 'General',
                price: input.price || input.budget || '0',
                campaign_goal: mappedGoal,
                status: 'PLANNING',
                num_variants: input.numVariants || 3,
                product_description: input.productDescription || null,
                key_features: input.keyFeatures || null,
                target_platforms: input.targetPlatforms?.length ? input.targetPlatforms : null
            })
            .select('id')
            .single();

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DB Connection Timeout (15s)')), 15000)
        );

        try {
            const { data: campaign, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

            if (error) {
                console.error("[DB] Campaign Insert Error:", error);
                throw new Error(`DB Error: ${error.message}`);
            }
            return campaign.id;
        } catch (error: any) {
            console.error("Critical DB Failure in createCampaign:", error);
            if (error.message.includes("Timeout") || error.message.includes("DB Error") || error.message.includes("Connection")) {
                console.warn("Returning temporary local ID due to DB connectivity issues.");
                return `temp-offline-${Date.now()}`;
            }
            throw error;
        }
    }

    public async updateCampaignStatus(campaignId: string, status: DatabaseCampaign['status']) {
        const { error } = await supabase
            .from('campaigns')
            .update({ status })
            .eq('id', campaignId);

        if (error) throw new Error(`Failed to update status: ${error.message}`);
    }

    public async setBestCreative(campaignId: string, creativeId: string) {
        // 1. Update Campaign
        const { error: campError } = await supabase
            .from('campaigns')
            .update({ best_creative_id: creativeId })
            .eq('id', campaignId);

        if (campError) throw new Error(`Failed to set best creative on campaign: ${campError.message}`);

        // 2. Mark Creative
        const { error: creativeError } = await supabase
            .from('creative_variants')
            .update({ is_best_creative: true })
            .eq('id', creativeId);

        if (creativeError) throw new Error(`Failed to mark creative as best: ${creativeError.message}`);
    }

    public async getUserCampaigns(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('campaigns')
            .select(`
                *,
                creative_variants!id (
                    visual_asset_url
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`DB Error: ${error.message}`);

        // Map to include a preview_url from the first variant that has one
        return (data as any[]).map(c => ({
            ...c,
            preview_url: c.creative_variants?.find((v: any) => v.visual_asset_url)?.visual_asset_url
        }));
    }

    // --- BRAND GUIDELINES ---
    public async uploadGuidelineFile(userId: string, file: File): Promise<string> {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${userId}/${Date.now()}_${safeName}`;

        const { error } = await supabase
            .storage
            .from('brand-assets')
            .upload(path, file, { upsert: true, contentType: file.type });

        if (error) throw new Error(`Storage upload failed: ${error.message}`);

        const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
        return data.publicUrl;
    }

    public async saveGuideline(campaignId: string, text: string, fileName: string, storageUrl?: string) {
        const { error } = await supabase
            .from('brand_guidelines')
            .insert({
                campaign_id: campaignId,
                file_name: fileName,
                storage_path: storageUrl || `brand-assets/${campaignId}/${fileName}`,
                extracted_text: text,
                file_type: fileName.endsWith('.pdf') ? 'application/pdf' : fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain'
            });

        if (error) throw new Error(`DB Error: ${error.message}`);
    }

    public async getGuideline(campaignId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('brand_guidelines')
            .select('extracted_text')
            .eq('campaign_id', campaignId)
            .single();

        if (error) return null;
        return data.extracted_text;
    }

    // --- AGENT OUTPUTS ---
    public async saveAgentOutput(campaignId: string, agentName: string, json: any) {
        const { error } = await supabase
            .from('agent_outputs')
            .insert({
                campaign_id: campaignId,
                agent_name: agentName,
                output_json: json
            });

        if (error) console.error('Failed to log agent output to DB', error);
    }

    public async getAgentOutputs(campaignId: string): Promise<Record<string, any>> {
        const { data, error } = await supabase
            .from('agent_outputs')
            .select('*')
            .eq('campaign_id', campaignId);

        if (error) {
            console.error("Failed to fetch agent outputs", error);
            return {};
        }

        const outputs: Record<string, any> = {};
        data?.forEach((row: any) => {
            outputs[row.agent_name] = row.output_json;
        });
        return outputs;
    }

    // --- CREATIVE VARIANTS ---
    public async saveCreativeVariants(campaignId: string, variants: CreativeVariant[]) {
        const rows = variants.map(v => ({
            campaign_id: campaignId,
            strategy_type: v.strategy_type,
            headline: v.headline,
            body_copy: v.body_copy,
            visual_prompt: v.visual_prompt,
            tone: v.tone,
            platform: v.platform,
            is_best_creative: v.is_best_creative || false
        }));

        const { data, error } = await supabase
            .from('creative_variants')
            .insert(rows)
            .select('id, strategy_type');

        if (error) {
            console.error(`[SupabaseService] saveCreativeVariants failed for campaign ${campaignId}:`, error);
            throw new Error(`Failed to save creatives: ${error.message} (${error.details})`);
        }
        return data;
    }

    public async getCreatives(campaignId: string): Promise<CreativeVariant[]> {
        const { data, error } = await supabase
            .from('creative_variants')
            .select('*')
            .eq('campaign_id', campaignId);

        if (error) throw new Error(`Failed to fetch creatives: ${error.message}`);
        return data as CreativeVariant[];
    }

    public async getAllUserCreatives(_userId: string): Promise<CreativeVariant[]> {
        // Fetch campaigns first to filter by user (RLS handles this but explicit check is good)
        // OR rely on RLS if policies are set exactly.
        // Assuming RLS policy: "Users can view own variants" -> EXISTS (campaign.user_id = uid)
        // So we can just select all from creative_variants and RLS filters it.
        const { data, error } = await supabase
            .from('creative_variants')
            .select(`
                *,
                campaigns (
                    product
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch all creatives: ${error.message}`);
        // Flatten the campaign product into the object for UI convenience if needed, 
        // type assertion might be tricky here, but we will handle it in the UI or map it.
        return data as unknown as CreativeVariant[];
    }

    // --- DRAFTS ---
    public async saveDraft(userId: string, input: any) {
        const { error } = await supabase
            .from('user_drafts')
            .upsert({
                user_id: userId,
                draft_data: input,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw new Error(`Draft Save Error: ${error.message}`);
    }

    public async getDraft(userId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('user_drafts')
            .select('draft_data')
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data.draft_data;
    }

    // --- STORAGE & UPDATES ---
    public async uploadImageFromUrl(campaignId: string, creativeId: string, imageUrl: string): Promise<string | null> {
        if (!campaignId || campaignId.startsWith('temp-')) {
            console.warn('[Storage] Skipping upload for offline/temp campaign.');
            return imageUrl;
        }

        try {
            console.log(`[Storage] Fetching image from ${imageUrl}...`);
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`Failed to fetch source image: ${response.statusText}`);

            const blob = await response.blob();
            const fileName = `campaign-assets/${campaignId}/${creativeId}_${Date.now()}.png`;

            const { error: uploadError } = await supabase
                .storage
                .from('campaign-images')
                .upload(fileName, blob, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) {
                console.error('[Storage] Upload failed:', uploadError.message);
                return imageUrl;
            }

            const { data: publicUrlData } = supabase
                .storage
                .from('campaign-images')
                .getPublicUrl(fileName);

            const testUrl = publicUrlData.publicUrl;

            // Return the public URL if upload succeeded. 
            // We trust the upload was successful if no error was returned above.
            return testUrl;

        } catch (error) {
            console.error('[Storage] Error during image persistence:', error);
            return imageUrl;
        }
    }

    public async updateCreativeVisual(creativeId: string, visualUrl: string, provider: string, assets: any[] = []) {
        if (!creativeId) return;

        // Update the database row to link the image and store all assets
        const { error } = await supabase
            .from('creative_variants')
            .update({
                visual_asset_url: visualUrl,
                visual_asset_provider: provider,
                visual_assets: assets
            })
            .eq('id', creativeId);

        if (error) {
            console.error(`[DB] Failed to link image to creative ${creativeId}:`, error.message);
        } else {
            console.log(`[DB] Dynamic image and ${assets.length} assets linked to creative ${creativeId}`);
        }
    }

    /**
     * Triggers a browser download of an image from a URL.
     */
    public async downloadImage(url: string, filename: string) {
        try {
            console.log(`[Storage] Attempting to download image: ${url}`);

            // Try fetching with CORS
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();

            // Verify if it's actually an image
            if (!blob.type.startsWith('image/')) {
                console.warn(`[Storage] Warning: Downloaded content is type ${blob.type}, not an image.`);
                // If it's JSON or very small, it's almost certainly an error message
                if (blob.type.includes('json') || blob.size < 2000) {
                    const text = await blob.text();
                    console.error(`[Storage] Download error detail: ${text.substring(0, 200)}`);
                    throw new Error(`The visual asset could not be downloaded (invalid format).`);
                }
            }

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Small delay before revoking to ensure download starts
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

            return true;
        } catch (error) {
            console.error('[Storage] Download failed or CORS blocked:', error);

            // Fallback: If programmatic download fails (usually CORS), 
            // open in new tab and instruct user
            const win = window.open(url, '_blank');
            if (win) {
                console.log('[Storage] Opened image in new tab due to CORS restrictions.');
            }
            return false;
        }
    }
}
