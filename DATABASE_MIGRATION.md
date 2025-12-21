# Database Migration Guide

## Overview
This guide explains how to update your Supabase database to support the new user authentication system with shop names.

## What's New?

### 1. **Users Table**
A new `users` table that stores user profile information:
- `id` - Links to Supabase Auth user
- `email` - User's email (Gmail only)
- `full_name` - User's full name
- `shop_name` - User's shop name
- `created_at`, `updated_at` - Timestamps

### 2. **Updated Credentials Table**
- Added `user_id` foreign key to link credentials to users
- Each user can have multiple TikTok Shop credentials

### 3. **Automatic User Profile Creation**
- When a user signs up, a profile is automatically created in the `users` table
- Uses a database trigger to sync data from Supabase Auth to `users` table

### 4. **Row Level Security (RLS)**
- Users can only access their own data
- Proper security policies for all tables

## Migration Steps

### Option 1: Fresh Setup (Recommended for New Installations)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the entire `supabase_setup_updated.sql` file

### Option 2: Update Existing Database

If you already have data in the old schema, follow these steps:

#### Step 1: Create Users Table
```sql
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    shop_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
```

#### Step 2: Add user_id to Credentials Table
```sql
ALTER TABLE public.credentials
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON public.credentials(user_id);
```

#### Step 3: Create Trigger for Auto User Profile Creation
```sql
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

#### Step 4: Enable RLS (Run the RLS policies from supabase_setup_updated.sql)

## Verification

After migration, verify everything works:

1. **Test User Registration**
   - Register a new user with shop name
   - Check that a record appears in `public.users` table

2. **Test Credentials**
   - Add TikTok Shop credentials in Settings
   - Verify `user_id` is set correctly in `credentials` table

3. **Test Orders**
   - Fetch orders
   - Verify orders are linked to the correct credentials

## Notes

- The shop name is stored in BOTH `auth.users.raw_user_meta_data` AND `public.users.shop_name`
- This dual storage ensures compatibility and better querying
- Existing users will need to re-register OR you can manually migrate their data

## Manual Data Migration (If Needed)

If you have existing auth users, run this to create their profiles:

```sql
INSERT INTO public.users (id, email, full_name, shop_name)
SELECT
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'shop_name' as shop_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

## Troubleshooting

### Issue: "User profile not created"
- Check that the trigger is installed: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Manually insert user profile if needed

### Issue: "RLS blocking queries"
- Ensure you're authenticated when making queries
- Check that policies are created correctly
- Use service role key for admin operations
