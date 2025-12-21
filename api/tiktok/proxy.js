import crypto from 'crypto';
import https from 'https';

// Generate TikTok API signature
function generateSignature(appSecret, path, params = {}, body = null) {
  // Remove sign and access_token from params before signing
  const paramsToBeSigned = { ...params };
  delete paramsToBeSigned.sign;
  delete paramsToBeSigned.access_token;

  // Sort params alphabetically
  const sortedKeys = Object.keys(paramsToBeSigned).sort();

  // Build string: key1value1key2value2...
  let paramString = '';
  sortedKeys.forEach(key => {
    if (typeof paramsToBeSigned[key] !== 'object') {
      paramString += `${key}${paramsToBeSigned[key]}`;
    }
  });

  // Build final string: appSecret + path + params + body + appSecret
  let signString = appSecret + path + paramString;

  if (body && Object.keys(body).length > 0) {
    signString += JSON.stringify(body);
  }

  signString += appSecret;

  return crypto.createHmac('sha256', appSecret).update(signString).digest('hex');
}

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Log incoming request for debugging
    console.log('Proxy request received:', {
      method: req.method,
      hasBody: !!req.body,
      bodyType: typeof req.body
    });

    // Parse request body
    const requestBody = req.body || {};

    const {
      method = 'GET',
      endpoint,
      params = {},
      body = null,
      appSecret,
      accessToken = null
    } = requestBody;

    console.log('Parsed request:', {
      method,
      endpoint,
      hasAppSecret: !!appSecret,
      hasAccessToken: !!accessToken,
      paramsKeys: Object.keys(params),
      bodyKeys: body ? Object.keys(body) : null
    });

    // Validation
    if (!endpoint) {
      return res.status(400).json({
        error: 'Missing required field: endpoint',
        received: { endpoint, hasAppSecret: !!appSecret }
      });
    }

    if (!appSecret) {
      return res.status(400).json({
        error: 'Missing required field: appSecret'
      });
    }

    // Build URL - use different base URL for auth endpoints
    const isAuthEndpoint = endpoint.startsWith('/api/v2/token');
    const baseUrl = isAuthEndpoint
      ? 'https://auth.tiktok-shops.com'
      : 'https://open-api.tiktokglobalshop.com';

    let allParams;

    if (isAuthEndpoint) {
      // Auth endpoints don't use signature - they use app_secret directly
      allParams = { ...params, app_secret: appSecret };
    } else {
      // Regular API endpoints use signature authentication
      const timestamp = Math.floor(Date.now() / 1000);
      allParams = { ...params, timestamp };

      // Generate signature (BEFORE adding sign to params)
      const signature = generateSignature(
        appSecret,
        endpoint,
        allParams,
        body
      );

      // Add signature to params
      allParams.sign = signature;
    }

    const queryString = new URLSearchParams(allParams).toString();
    const url = `${baseUrl}${endpoint}?${queryString}`;

    console.log('Making request to:', {
      baseUrl,
      endpoint,
      fullUrl: url.substring(0, 100) + '...',
      method: method.toUpperCase()
    });

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };

    if (accessToken) {
      headers['x-tts-access-token'] = accessToken;
    }

    // Make request
    const fetchOptions = {
      method: method.toUpperCase(),
      headers
    };

    if (body && method.toUpperCase() !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log('Fetching...', { url: url.substring(0, 80) });
    const response = await fetch(url, fetchOptions);

    console.log('Response received:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    const data = await response.json();

    console.log('Response data:', {
      code: data.code,
      message: data.message,
      hasData: !!data.data
    });

    // Return response with proper status
    return res.status(200).json(data);

  } catch (error) {
    console.error('TikTok API Proxy Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
