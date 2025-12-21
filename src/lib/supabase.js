import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Save credentials to Supabase
export async function saveCredentials(credentials) {
  const { data, error } = await supabase
    .from('credentials')
    .insert([credentials])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get credentials by ID
export async function getCredentials(id) {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Update credentials
export async function updateCredentials(id, updates) {
  const { data, error } = await supabase
    .from('credentials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Save order to history
export async function saveOrder(order) {
  const { data, error } = await supabase
    .from('orders')
    .upsert([order], { onConflict: 'order_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get orders by credential ID
export async function getOrdersByCredential(credentialId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('credential_id', credentialId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Merge multiple waybill PDFs into a single PDF using Supabase Edge Function
export async function mergeWaybills(waybillUrls) {
  try {
    const { data, error } = await supabase.functions.invoke('merge-waybills', {
      body: { waybillUrls }
    });

    if (error) {
      console.error('Supabase function error:', error);
      return null;
    }

    // If data is already a blob, return it
    if (data instanceof Blob) {
      return data;
    }

    // If data is an ArrayBuffer or similar, convert to Blob
    if (data) {
      return new Blob([data], { type: 'application/pdf' });
    }

    return null;
  } catch (error) {
    console.error('Failed to merge waybills:', error);
    return null;
  }
}
