// TikTok Ads API (Marketing API) Integration
// For tracking ad spend on TikTok Shop video ads

const ADS_API_BASE_URL = 'https://business-api.tiktok.com/open_api/v1.3';

/**
 * Make a request to TikTok Ads API
 */
async function makeAdsApiRequest(endpoint, credentials, params = {}) {
  const url = new URL(`${ADS_API_BASE_URL}${endpoint}`);

  // Add access token to params
  params.access_token = credentials.ads_access_token;

  // Add all params to URL
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log('TikTok Ads API Request:', url.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ads API Error:', errorText);
    throw new Error(`TikTok Ads API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    console.error('Ads API Error Response:', data);
    throw new Error(data.message || 'TikTok Ads API returned an error');
  }

  return data.data;
}

/**
 * Get ad spend report for a date range
 * @param {Object} credentials - Ads API credentials
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Ad spend data
 */
export async function getAdSpendReport(credentials, startDate, endDate) {
  if (!credentials.ads_access_token || !credentials.ads_advertiser_id) {
    throw new Error('TikTok Ads API credentials not configured');
  }

  try {
    const data = await makeAdsApiRequest('/reports/integrated/get/', credentials, {
      advertiser_id: credentials.ads_advertiser_id,
      report_type: 'BASIC',
      data_level: 'AUCTION_ADVERTISER',
      dimensions: JSON.stringify(['advertiser_id']),
      metrics: JSON.stringify([
        'spend',
        'impressions',
        'clicks',
        'conversion',
        'cost_per_conversion',
        'conversion_rate'
      ]),
      start_date: startDate,
      end_date: endDate,
      page: 1,
      page_size: 1000
    });

    return data;
  } catch (error) {
    console.error('Failed to fetch ad spend report:', error);
    throw error;
  }
}

/**
 * Get video shopping ads metrics
 * @param {Object} credentials - Ads API credentials
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Video shopping ads metrics
 */
export async function getVideoShoppingAdsMetrics(credentials, startDate, endDate) {
  if (!credentials.ads_access_token || !credentials.ads_advertiser_id) {
    throw new Error('TikTok Ads API credentials not configured');
  }

  try {
    const data = await makeAdsApiRequest('/reports/integrated/get/', credentials, {
      advertiser_id: credentials.ads_advertiser_id,
      report_type: 'BASIC',
      data_level: 'AUCTION_ADVERTISER',
      dimensions: JSON.stringify(['advertiser_id']),
      metrics: JSON.stringify([
        'spend',
        'impressions',
        'clicks',
        'conversion',
        'cost_per_conversion',
        'conversion_rate',
        'video_views',
        'video_watched_2s',
        'video_watched_6s'
      ]),
      start_date: startDate,
      end_date: endDate,
      page: 1,
      page_size: 1000
    });

    return data;
  } catch (error) {
    console.error('Failed to fetch video shopping ads metrics:', error);
    throw error;
  }
}

/**
 * Get today's ad spend
 * @param {Object} credentials - Ads API credentials
 * @returns {Promise<Object>} Today's ad spend summary
 */
export async function getTodayAdSpend(credentials) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const data = await getAdSpendReport(credentials, today, today);

    if (!data.list || data.list.length === 0) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        roas: 0
      };
    }

    const metrics = data.list[0].metrics;
    return {
      spend: parseFloat(metrics.spend || 0),
      impressions: parseInt(metrics.impressions || 0),
      clicks: parseInt(metrics.clicks || 0),
      conversions: parseInt(metrics.conversion || 0),
      costPerConversion: parseFloat(metrics.cost_per_conversion || 0),
      conversionRate: parseFloat(metrics.conversion_rate || 0)
    };
  } catch (error) {
    console.error('Failed to fetch today ad spend:', error);
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      roas: 0
    };
  }
}

/**
 * Get ad spend for a custom date range
 * @param {Object} credentials - Ads API credentials
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Ad spend summary
 */
export async function getCustomDateRangeAdSpend(credentials, startDate, endDate) {
  try {
    const data = await getAdSpendReport(credentials, startDate, endDate);

    if (!data.list || data.list.length === 0) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        roas: 0
      };
    }

    // Aggregate metrics across all entries
    const aggregated = data.list.reduce((acc, item) => {
      const metrics = item.metrics;
      return {
        spend: acc.spend + parseFloat(metrics.spend || 0),
        impressions: acc.impressions + parseInt(metrics.impressions || 0),
        clicks: acc.clicks + parseInt(metrics.clicks || 0),
        conversions: acc.conversions + parseInt(metrics.conversion || 0)
      };
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

    return aggregated;
  } catch (error) {
    console.error('Failed to fetch custom date range ad spend:', error);
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      roas: 0
    };
  }
}

/**
 * Calculate ROAS (Return on Ad Spend)
 * @param {number} revenue - Total revenue
 * @param {number} adSpend - Total ad spend
 * @returns {number} ROAS ratio
 */
export function calculateROAS(revenue, adSpend) {
  if (adSpend === 0) return 0;
  return revenue / adSpend;
}
