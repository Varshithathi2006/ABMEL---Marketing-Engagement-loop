import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Manual .env parser
const env = {};
if (fs.existsSync('.env')) {
    const lines = fs.readFileSync('.env', 'utf8').split('\n');
    lines.forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) env[key.trim()] = value.join('=').trim();
    });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncCampaign(campaignId) {
    console.log(`🚀 Starting sync for campaign: ${campaignId}`);

    const { data: variants, error } = await supabase
        .from('creative_variants')
        .select('id, visual_asset_url, visual_assets')
        .eq('campaign_id', campaignId);

    if (error) {
        console.error('Error fetching variants:', error);
        return;
    }

    const baseDir = path.join(process.cwd(), 'public', 'local-assets', campaignId);
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    let downloadCount = 0;

    for (const variant of variants) {
        const assets = variant.visual_assets || [];
        if (variant.visual_asset_url) {
            assets.unshift({ url: variant.visual_asset_url, provider: 'Primary' });
        }

        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            if (!asset.url || !asset.url.startsWith('http')) continue;

            const filename = `${variant.id}_${i}.png`;
            const filePath = path.join(baseDir, filename);

            try {
                console.log(`Downloading ${asset.provider} visual for variant ${variant.id}...`);
                const response = await fetch(asset.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const buffer = await response.buffer();
                fs.writeFileSync(filePath, buffer);
                downloadCount++;
            } catch (err) {
                console.error(`Failed to download ${asset.url}:`, err.message);
            }
        }
    }

    console.log(`✅ Sync complete. ${downloadCount} images saved to ${baseDir}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node src/scripts/sync_images.mjs <campaign_id>');
} else {
    syncCampaign(args[0]);
}
