import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_BASE = 'https://open-api.tiktokglobalshop.com';
const AUTH_BASE = 'https://auth.tiktok-shops.com';

// Generate TikTok API signature
function generateSignature(path, params, body, appSecret) {
  // Remove sign, access_token from params
  const paramsToBeSigned = { ...params };
  delete paramsToBeSigned.sign;
  delete paramsToBeSigned.access_token;

  // Sort params alphabetically
  const sortedKeys = Object.keys(paramsToBeSigned).sort();

  // Build string: key1value1key2value2...
  let stringToBeSigned = '';
  sortedKeys.forEach(key => {
    if (typeof paramsToBeSigned[key] !== 'object') {
      stringToBeSigned += `${key}${paramsToBeSigned[key]}`;
    }
  });

  // Prepend path
  stringToBeSigned = path + stringToBeSigned;

  // Append body if exists
  if (body) {
    stringToBeSigned += JSON.stringify(body);
  }

  // Wrap with app_secret
  stringToBeSigned = appSecret + stringToBeSigned + appSecret;

  // Generate HMAC-SHA256
  return CryptoJS.HmacSHA256(stringToBeSigned, appSecret).toString();
}

// Build API URL with signature
function buildApiUrl(path, credentials, extraParams = {}, body = null) {
  const timestamp = Math.floor(Date.now() / 1000) - 320; // Adjust for server time diff

  const params = {
    app_key: credentials.app_key,
    timestamp: timestamp,
    shop_cipher: credentials.shop_cipher,
    ...extraParams
  };

  const sign = generateSignature(path, params, body, credentials.app_secret);
  params.sign = sign;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return `${API_BASE}${path}?${queryString}`;
}

// Exchange auth code for access token
export async function getAccessToken(app_key, app_secret, auth_code) {
  const url = `${AUTH_BASE}/api/v2/token/get`;

  const response = await axios.get(url, {
    params: {
      app_key: app_key,
      app_secret: app_secret,
      auth_code: auth_code,
      grant_type: 'authorized_code'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to get access token');
  }

  return response.data.data;
}

// Refresh access token
export async function refreshAccessToken(app_key, app_secret, refresh_token) {
  const url = `${AUTH_BASE}/api/v2/token/refresh`;

  const response = await axios.get(url, {
    params: {
      app_key: app_key,
      app_secret: app_secret,
      refresh_token: refresh_token,
      grant_type: 'refresh_token'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to refresh token');
  }

  return response.data.data;
}

// Get authorized shops
export async function getAuthorizedShops(credentials) {
  const path = '/authorization/202309/shops';

  const timestamp = Math.floor(Date.now() / 1000) - 320;
  const params = {
    app_key: credentials.app_key,
    timestamp: timestamp
  };

  const sign = generateSignature(path, params, null, credentials.app_secret);
  params.sign = sign;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}${path}?${queryString}`;

  const response = await axios.get(url, {
    headers: {
      'x-tts-access-token': credentials.access_token,
      'Content-Type': 'application/json'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to get shops');
  }

  return response.data.data;
}

// Search orders
export async function searchOrders(credentials, filters = {}) {
  const path = '/order/202309/orders/search';

  const timestamp = Math.floor(Date.now() / 1000) - 320;
  const params = {
    app_key: credentials.app_key,
    timestamp: timestamp,
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

  const sign = generateSignature(path, params, body, credentials.app_secret);
  params.sign = sign;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}${path}?${queryString}`;

  const response = await axios.post(url, body, {
    headers: {
      'x-tts-access-token': credentials.access_token,
      'Content-Type': 'application/json'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to search orders');
  }

  return response.data.data;
}

// Get order details
export async function getOrderDetails(credentials, orderIds) {
  const path = '/order/202309/orders';

  const timestamp = Math.floor(Date.now() / 1000) - 320;
  const params = {
    app_key: credentials.app_key,
    timestamp: timestamp,
    shop_cipher: credentials.shop_cipher,
    ids: orderIds.join(',')
  };

  const sign = generateSignature(path, params, null, credentials.app_secret);
  params.sign = sign;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}${path}?${queryString}`;

  const response = await axios.get(url, {
    headers: {
      'x-tts-access-token': credentials.access_token,
      'Content-Type': 'application/json'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to get order details');
  }

  return response.data.data;
}

// Get shipping document (waybill)
export async function getShippingDocument(credentials, packageId, documentType = 'SHIPPING_LABEL') {
  const path = `/fulfillment/202309/packages/${packageId}/shipping_documents`;

  const timestamp = Math.floor(Date.now() / 1000) - 320;
  const params = {
    app_key: credentials.app_key,
    timestamp: timestamp,
    shop_cipher: credentials.shop_cipher,
    document_type: documentType,
    document_size: 0
  };

  const sign = generateSignature(path, params, null, credentials.app_secret);
  params.sign = sign;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}${path}?${queryString}`;

  const response = await axios.get(url, {
    headers: {
      'x-tts-access-token': credentials.access_token,
      'Content-Type': 'application/json'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to get shipping document');
  }

  return response.data.data;
}

// Ship package
export async function shipPackage(credentials, packageId, handoverMethod = 'PICKUP') {
  const path = `/fulfillment/202309/packages/${packageId}/ship`;

  const timestamp = Math.floor(Date.now() / 1000) - 320;
  const params = {
    app_key: credentials.app_key,
    timestamp: timestamp,
    shop_cipher: credentials.shop_cipher
  };

  const body = {
    handover_method: handoverMethod
  };

  const sign = generateSignature(path, params, body, credentials.app_secret);
  params.sign = sign;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}${path}?${queryString}`;

  const response = await axios.post(url, body, {
    headers: {
      'x-tts-access-token': credentials.access_token,
      'Content-Type': 'application/json'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to ship package');
  }

  return response.data.data;
}

// Search packages
export async function searchPackages(credentials, filters = {}) {
  const path = '/fulfillment/202309/packages/search';

  const timestamp = Math.floor(Date.now() / 1000) - 320;
  const params = {
    app_key: credentials.app_key,
    timestamp: timestamp,
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

  const sign = generateSignature(path, params, body, credentials.app_secret);
  params.sign = sign;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}${path}?${queryString}`;

  const response = await axios.post(url, body, {
    headers: {
      'x-tts-access-token': credentials.access_token,
      'Content-Type': 'application/json'
    }
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || 'Failed to search packages');
  }

  return response.data.data;
}
