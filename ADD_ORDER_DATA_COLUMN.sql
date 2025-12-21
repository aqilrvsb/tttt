-- ============================================================================
-- Add order_data JSONB column to store full TikTok order object
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add order_data column to store complete order JSON
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_data JSONB;

-- Create index on order_data for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_data ON public.orders USING GIN (order_data);

-- Done! Now orders will store both summary fields AND full order JSON
