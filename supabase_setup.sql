-- TikTok Shop Order Management System
-- Run this SQL in your Supabase SQL Editor

-- Create credentials table
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_key TEXT NOT NULL,
    app_secret TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    shop_cipher TEXT,
    shop_id TEXT,
    shop_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    order_status TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT 'MYR',
    shipped_at TIMESTAMPTZ,
    waybill_url TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_credential_id ON orders(credential_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security (optional - disable if you want open access)
-- ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (if RLS enabled)
-- CREATE POLICY "Service role has full access to credentials" ON credentials FOR ALL USING (true);
-- CREATE POLICY "Service role has full access to orders" ON orders FOR ALL USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_credentials_updated_at ON credentials;
CREATE TRIGGER update_credentials_updated_at
    BEFORE UPDATE ON credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (for anon/authenticated if needed)
-- GRANT ALL ON credentials TO anon, authenticated;
-- GRANT ALL ON orders TO anon, authenticated;
