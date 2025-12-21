-- ============================================================================
-- TikTok Shop - Complete Database Setup (Following dev-muse-automaton pattern)
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE USERS TABLE (stores user profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    shop_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- ============================================================================
-- 2. CREATE CREDENTIALS TABLE
-- ============================================================================
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

-- ============================================================================
-- 3. CREATE ORDERS TABLE
-- ============================================================================
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

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON public.credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_credential_id ON public.orders(credential_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================================================
-- 5. CREATE FUNCTION TO AUTO-UPDATE updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ============================================================================
-- 6. CREATE TRIGGERS FOR updated_at
-- ============================================================================
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

-- ============================================================================
-- 7. CREATE FUNCTION TO AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, full_name, shop_name, last_login)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'shop_name',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. CREATE TRIGGER TO AUTO-CREATE USER PROFILE
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. DROP OLD POLICIES IF THEY EXIST
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;

-- ============================================================================
-- 11. CREATE RLS POLICIES FOR USERS TABLE
-- ============================================================================
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- ============================================================================
-- 12. CREATE RLS POLICIES FOR CREDENTIALS TABLE
-- ============================================================================
CREATE POLICY "Users can view own credentials"
    ON public.credentials FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own credentials"
    ON public.credentials FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own credentials"
    ON public.credentials FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own credentials"
    ON public.credentials FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- 13. CREATE RLS POLICIES FOR ORDERS TABLE
-- ============================================================================
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (
        credential_id IN (
            SELECT c.id FROM public.credentials c
            JOIN public.users u ON c.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        credential_id IN (
            SELECT c.id FROM public.credentials c
            JOIN public.users u ON c.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    USING (
        credential_id IN (
            SELECT c.id FROM public.credentials c
            JOIN public.users u ON c.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own orders"
    ON public.orders FOR DELETE
    USING (
        credential_id IN (
            SELECT c.id FROM public.credentials c
            JOIN public.users u ON c.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- DONE! Database setup complete.
-- Now configure Supabase Auth settings:
-- 1. Go to Authentication → Settings
-- 2. Turn OFF "Enable email confirmations"
-- 3. Save
-- ============================================================================
