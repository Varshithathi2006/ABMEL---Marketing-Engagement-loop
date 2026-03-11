-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS (Mails to Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Marketing_Director', 'Auditor', 'System_Admin')) DEFAULT 'Marketing_Director',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Handle New User Registration (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'Marketing_Director');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    product TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    price TEXT NOT NULL,
    campaign_goal TEXT CHECK (campaign_goal IN ('AWARENESS', 'CONVERSIONS', 'ENGAGEMENT')),
    status TEXT CHECK (status IN ('PLANNING', 'PROCESSING', 'CREATIVES_READY', 'FAILED')) DEFAULT 'PLANNING',
    best_creative_id UUID, -- Will reference creative_variants(id) after generation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BRAND GUIDELINES
CREATE TABLE IF NOT EXISTS public.brand_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) UNIQUE NOT NULL, 
    file_name TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('application/pdf', 'text/plain')),
    storage_path TEXT NOT NULL,
    extracted_text TEXT, 
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. AGENT OUTPUTS (Generic store for intermediate steps like Market Analysis)
CREATE TABLE IF NOT EXISTS public.agent_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
    agent_name TEXT NOT NULL, 
    output_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CREATIVE VARIANTS (Strict Schema)
CREATE TABLE IF NOT EXISTS public.creative_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
    strategy_type TEXT CHECK (strategy_type IN ('FEATURE', 'EMOTIONAL', 'SOCIAL_PROOF', 'PRICE', 'LIFESTYLE')) NOT NULL,
    headline TEXT NOT NULL,
    body_copy TEXT NOT NULL,
    visual_prompt TEXT NOT NULL,
    tone TEXT NOT NULL,
    platform TEXT NOT NULL,
    visual_asset_url TEXT,
    visual_asset_provider TEXT,
    visual_assets JSONB DEFAULT '[]'::jsonb,
    is_best_creative BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. USER DRAFTS
CREATE TABLE IF NOT EXISTS public.user_drafts (
    user_id UUID PRIMARY KEY REFERENCES public.users(id),
    draft_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.campaigns;
CREATE POLICY "Users can insert own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own guidelines" ON public.brand_guidelines;
CREATE POLICY "Users can view own guidelines" ON public.brand_guidelines FOR SELECT USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = brand_guidelines.campaign_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own guidelines" ON public.brand_guidelines;
CREATE POLICY "Users can insert own guidelines" ON public.brand_guidelines FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE id = brand_guidelines.campaign_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view own agent outputs" ON public.agent_outputs;
CREATE POLICY "Users can view own agent outputs" ON public.agent_outputs FOR SELECT USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = agent_outputs.campaign_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own agent outputs" ON public.agent_outputs;
CREATE POLICY "Users can insert own agent outputs" ON public.agent_outputs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE id = agent_outputs.campaign_id AND user_id = auth.uid()));
    
DROP POLICY IF EXISTS "Users can view own variants" ON public.creative_variants;
CREATE POLICY "Users can view own variants" ON public.creative_variants FOR SELECT USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = creative_variants.campaign_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own variants" ON public.creative_variants;
CREATE POLICY "Users can insert own variants" ON public.creative_variants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE id = creative_variants.campaign_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own variants" ON public.creative_variants;
CREATE POLICY "Users can update own variants" ON public.creative_variants FOR UPDATE USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = creative_variants.campaign_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own drafts" ON public.user_drafts;
CREATE POLICY "Users can manage own drafts" ON public.user_drafts FOR ALL USING (auth.uid() = user_id);

-- Profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

