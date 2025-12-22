import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Save credentials to Supabase
export async function saveCredentials(credentials) {
  // Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get user's ID from users table using auth_user_id
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (userDataError || !userData) {
    throw new Error('User profile not found. Please contact support.');
  }

  // Insert credentials with user_id
  const { data, error } = await supabase
    .from('credentials')
    .insert([{
      ...credentials,
      user_id: userData.id
    }])
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

// Get user's credential ID
export async function getUserCredentialId() {
  // Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get user's ID from users table using auth_user_id
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (userDataError || !userData) {
    throw new Error('User profile not found. Please contact support.');
  }

  // Get the first credential for this user
  const { data: credentialData, error: credentialError } = await supabase
    .from('credentials')
    .select('id')
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (credentialError || !credentialData) {
    throw new Error('No credentials found. Please add TikTok Shop credentials in Settings.');
  }

  return credentialData.id;
}

// Get user's credentials (full data)
export async function getUserCredentials() {
  // Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get user's ID from users table using auth_user_id
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (userDataError || !userData) {
    throw new Error('User profile not found. Please contact support.');
  }

  // Get the first credential for this user
  const { data: credentialData, error: credentialError } = await supabase
    .from('credentials')
    .select('*')
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (credentialError || !credentialData) {
    return null;
  }

  return credentialData;
}

// Save order to history (with full order data)
export async function saveOrder(order, fullOrderData = null) {
  // Get user's credential ID if not provided
  let credentialId = order.credential_id;

  if (!credentialId) {
    credentialId = await getUserCredentialId();
  }

  const orderRecord = {
    ...order,
    credential_id: credentialId
  };

  // If full order data is provided, store it in order_data column
  if (fullOrderData) {
    orderRecord.order_data = fullOrderData;
  }

  const { data, error } = await supabase
    .from('orders')
    .upsert([orderRecord], { onConflict: 'order_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all orders from Supabase for current user
export async function getAllOrdersFromDB() {
  try {
    const credentialId = await getUserCredentialId();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('credential_id', credentialId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching orders from DB:', error);
    return [];
  }
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
