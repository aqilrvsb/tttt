import axios from 'axios';

// Use Vercel API proxy to avoid CORS
const PROXY_URL = '/api/tiktok/proxy';

// Call TikTok API via proxy
async function callTikTokApi(endpoint, method, params, body, appSecret, accessToken) {
  const response = await axios.post(PROXY_URL, {
    method,
    endpoint,
    params,
    body,
    appSecret,
    accessToken
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'API request failed');
  }

  return response.data.data;
}

// Exchange auth code for access token
export async function getAccessToken(app_key, app_secret, auth_code) {
  return callTikTokApi(
    '/api/v2/token/get',
    'GET',
    {
      app_key,
      grant_type: 'authorized_code',
      auth_code
    },
    null,
    app_secret,
    null
  );
}

// Refresh access token
export async function refreshAccessToken(app_key, app_secret, refresh_token) {
  return callTikTokApi(
    '/api/v2/token/refresh',
    'GET',
    {
      app_key,
      grant_type: 'refresh_token',
      refresh_token
    },
    null,
    app_secret,
    null
  );
}

// Get authorized shops
export async function getAuthorizedShops(credentials) {
  return callTikTokApi(
    '/authorization/202309/shops',
    'GET',
    { app_key: credentials.app_key },
    null,
    credentials.app_secret,
    credentials.access_token
  );
}

// Search orders
export async function searchOrders(credentials, filters = {}) {
  const params = {
    app_key: credentials.app_key,
    shop_cipher: credentials.shop_cipher,
    page_size: filters.page_size || 20
  };

  if (filters.page_token) {
    params.page_token = filters.page_token;
  }

  const body = {};

  if (filters.order_status) {
    body.order_status = filters.order_status;
  }

  if (filters.create_time_ge) {
    body.create_time_ge = filters.create_time_ge;
  }

  if (filters.create_time_lt) {
    body.create_time_lt = filters.create_time_lt;
  }

  return callTikTokApi(
    '/order/202309/orders/search',
    'POST',
    params,
    body,
    credentials.app_secret,
    credentials.access_token
  );
}

// Get order details
export async function getOrderDetails(credentials, orderIds) {
  return callTikTokApi(
    '/order/202309/orders',
    'GET',
    {
      app_key: credentials.app_key,
      shop_cipher: credentials.shop_cipher,
      ids: orderIds.join(',')
    },
    null,
    credentials.app_secret,
    credentials.access_token
  );
}

// Get shipping document (waybill)
export async function getShippingDocument(credentials, packageId, documentType = 'SHIPPING_LABEL') {
  return callTikTokApi(
    `/fulfillment/202309/packages/${packageId}/shipping_documents`,
    'GET',
    {
      app_key: credentials.app_key,
      shop_cipher: credentials.shop_cipher,
      document_type: documentType,
      document_size: 0
    },
    null,
    credentials.app_secret,
    credentials.access_token
  );
}

// Ship package
export async function shipPackage(credentials, packageId, handoverMethod = 'PICKUP') {
  return callTikTokApi(
    `/fulfillment/202309/packages/${packageId}/ship`,
    'POST',
    {
      app_key: credentials.app_key,
      shop_cipher: credentials.shop_cipher
    },
    { handover_method: handoverMethod },
    credentials.app_secret,
    credentials.access_token
  );
}

// Search packages
export async function searchPackages(credentials, filters = {}) {
  const params = {
    app_key: credentials.app_key,
    shop_cipher: credentials.shop_cipher,
    page_size: filters.page_size || 20
  };

  if (filters.page_token) {
    params.page_token = filters.page_token;
  }

  const body = {};

  if (filters.create_time_ge) {
    body.create_time_ge = filters.create_time_ge;
  }

  if (filters.create_time_lt) {
    body.create_time_lt = filters.create_time_lt;
  }

  return callTikTokApi(
    '/fulfillment/202309/packages/search',
    'POST',
    params,
    body,
    credentials.app_secret,
    credentials.access_token
  );
}
