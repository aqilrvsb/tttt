-- TikTok Ads API Integration Support
-- Add support for TikTok Marketing API credentials and ad spend tracking

-- Add Ads API credential fields to existing credentials table
ALTER TABLE public.credentials
ADD COLUMN IF NOT EXISTS ads_app_key TEXT,
ADD COLUMN IF NOT EXISTS ads_app_secret TEXT,
ADD COLUMN IF NOT EXISTS ads_access_token TEXT,
ADD COLUMN IF NOT EXISTS ads_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS ads_advertiser_id TEXT;

-- Create ad_spend table for historical ad spend data
CREATE TABLE IF NOT EXISTS public.ad_spend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_spend NUMERIC(10,2),
    currency TEXT DEFAULT 'MYR',
    video_shopping_ads_spend NUMERIC(10,2),
    impressions BIGINT,
    clicks BIGINT,
    conversions BIGINT,
    roas NUMERIC(10,4),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_credential_date UNIQUE(credential_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ad_spend_credential_id ON ad_spend(credential_id);
CREATE INDEX IF NOT EXISTS idx_ad_spend_date ON ad_spend(date DESC);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_ad_spend_updated_at ON ad_spend;
CREATE TRIGGER update_ad_spend_updated_at
    BEFORE UPDATE ON ad_spend
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ad_spend IS 'Stores daily ad spend data from TikTok Ads API';
COMMENT ON COLUMN credentials.ads_app_key IS 'TikTok Ads API app key';
COMMENT ON COLUMN credentials.ads_app_secret IS 'TikTok Ads API app secret';
COMMENT ON COLUMN credentials.ads_access_token IS 'TikTok Ads API access token';
COMMENT ON COLUMN credentials.ads_refresh_token IS 'TikTok Ads API refresh token';
COMMENT ON COLUMN credentials.ads_advertiser_id IS 'TikTok Ads advertiser account ID';
