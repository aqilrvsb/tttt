-- TikTok Shop Order Management System
-- Updated Schema with Users Table
-- Run this SQL in your Supabase SQL Editor

-- Create users table to store user profile information
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    shop_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credentials table (linked to users)
CREATE TABLE IF NOT EXISTS public.credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Create orders table (linked to credentials)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID REFERENCES public.credentials(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    order_status TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    total_amount NUMERIC,
    currency TEXT DEFAULT 'MYR',
    shipped_at TIMESTAMPTZ,
    waybill_url TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON public.credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_credential_id ON public.orders(credential_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credentials_updated_at ON public.credentials;
CREATE TRIGGER update_credentials_updated_at
    BEFORE UPDATE ON public.credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, shop_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'shop_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for credentials table
CREATE POLICY "Users can view own credentials"
    ON public.credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
    ON public.credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
    ON public.credentials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
    ON public.credentials FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for orders table
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (
        credential_id IN (
            SELECT id FROM public.credentials WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        credential_id IN (
            SELECT id FROM public.credentials WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    USING (
        credential_id IN (
            SELECT id FROM public.credentials WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own orders"
    ON public.orders FOR DELETE
    USING (
        credential_id IN (
            SELECT id FROM public.credentials WHERE user_id = auth.uid()
        )
    );
