import crypto from 'crypto';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Generate TikTok API signature
function generateSignature(appSecret, path, timestamp, params = {}, body = null) {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  let paramString = '';
  for (const [key, value] of Object.entries(sortedParams)) {
    paramString += key + value;
  }

  let signString = appSecret + path + paramString;

  if (body) {
    signString += JSON.stringify(body);
  }

  signString += appSecret;

  return crypto.createHmac('sha256', appSecret).update(signString).digest('hex');
}

// Main handler
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    const {
      method = 'GET',
      endpoint,
      params = {},
      body = null,
      appSecret,
      accessToken = null
    } = req.body;

    if (!endpoint || !appSecret) {
      return res.status(400).json({
        error: 'Missing required fields: endpoint, appSecret'
      });
    }

    // Prepare request
    const timestamp = Math.floor(Date.now() / 1000);
    const allParams = { ...params, timestamp };

    // Generate signature
    const signature = generateSignature(
      appSecret,
      endpoint,
      timestamp,
      allParams,
      body
    );

    allParams.sign = signature;

    // Build URL
    const baseUrl = 'https://open-api.tiktokglobalshop.com';
    const queryString = new URLSearchParams(allParams).toString();
    const url = `${baseUrl}${endpoint}?${queryString}`;

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

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    // Return response
    return res.status(response.ok ? 200 : response.status).json(data);

  } catch (error) {
    console.error('TikTok API Proxy Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Apply CORS headers to all responses
export const config = {
  api: {
    bodyParser: true,
  },
};
