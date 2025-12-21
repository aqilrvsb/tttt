import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SOPModal from '../components/SOPModal';
import { getAuthorizedShops, getAccessToken } from '../lib/tiktokApi';
import { saveCredentials } from '../lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('quick'); // 'quick' or 'manual'
  const [callbackUrl, setCallbackUrl] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [formData, setFormData] = useState({
    app_key: '',
    app_secret: '',
    access_token: '',
    shop_cipher: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSOP, setShowSOP] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState(null);

  // Load existing credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('tiktok_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentCredentials(parsed);
      } catch (e) {
        console.error('Failed to parse credentials:', e);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!callbackUrl) {
      setError('Please paste the callback URL');
      setLoading(false);
      return;
    }

    if (!appSecret) {
      setError('App Secret is required');
      setLoading(false);
      return;
    }

    try {
      // Parse the callback URL
      const url = new URL(callbackUrl);
      const params = new URLSearchParams(url.search);

      const app_key = params.get('app_key');
      const code = params.get('code');

      if (!app_key || !code) {
        setError('Invalid callback URL. Must contain app_key and code parameters.');
        setLoading(false);
        return;
      }

      // Step 1: Exchange code for access token
      const tokenData = await getAccessToken(app_key, appSecret, code);

      if (!tokenData.access_token) {
        throw new Error('Failed to get access token');
      }

      // Build credentials with the token
      const tempCredentials = {
        app_key,
        app_secret: appSecret,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      };

      // Step 2: Get authorized shops to get shop_cipher
      const shopsData = await getAuthorizedShops(tempCredentials);

      if (!shopsData.shops || shopsData.shops.length === 0) {
        throw new Error('No authorized shops found');
      }

      const shop = shopsData.shops[0];

      // Build final credentials with shop_cipher
      const finalCredentials = {
        ...tempCredentials,
        shop_cipher: shop.cipher
      };

      // Save to localStorage
      localStorage.setItem('tiktok_credentials', JSON.stringify(finalCredentials));

      // Save to Supabase
      try {
        await saveCredentials({
          app_key: finalCredentials.app_key,
          app_secret: finalCredentials.app_secret,
          access_token: finalCredentials.access_token,
          refresh_token: finalCredentials.refresh_token,
          shop_cipher: finalCredentials.shop_cipher,
          shop_id: shop.id,
          shop_name: shop.name
        });
      } catch (e) {
        console.warn('Failed to save to Supabase:', e);
      }

      setCurrentCredentials(finalCredentials);
      setSuccess('TikTok Shop credentials connected successfully!');
      setCallbackUrl('');
      setAppSecret('');
    } catch (err) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.app_key || !formData.app_secret || !formData.access_token || !formData.shop_cipher) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      // Verify credentials by fetching shops
      const data = await getAuthorizedShops(formData);

      if (!data.shops || data.shops.length === 0) {
        throw new Error('No authorized shops found');
      }

      // Save to localStorage
      localStorage.setItem('tiktok_credentials', JSON.stringify(formData));

      // Save to Supabase
      try {
        await saveCredentials({
          app_key: formData.app_key,
          app_secret: formData.app_secret,
          access_token: formData.access_token,
          shop_cipher: formData.shop_cipher,
          shop_id: data.shops[0].id,
          shop_name: data.shops[0].name
        });
      } catch (e) {
        console.warn('Failed to save to Supabase:', e);
      }

      setCurrentCredentials(formData);
      setSuccess('TikTok Shop credentials connected successfully!');
      setFormData({
        app_key: '',
        app_secret: '',
        access_token: '',
        shop_cipher: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect your TikTok Shop?')) {
      localStorage.removeItem('tiktok_credentials');
      setCurrentCredentials(null);
      setSuccess('TikTok Shop disconnected successfully');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your TikTok Shop API credentials</p>
      </div>

      {/* Current Connection Status */}
      {currentCredentials && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Connected to TikTok Shop</h3>
              <p className="text-sm text-green-700 mb-1">
                <span className="font-medium">App Key:</span> {currentCredentials.app_key}
              </p>
              <p className="text-sm text-green-700">
                <span className="font-medium">Shop Cipher:</span> {currentCredentials.shop_cipher}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        {/* SOP Button */}
        <button
          type="button"
          onClick={() => setShowSOP(true)}
          className="w-full mb-6 py-3 px-4 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-100 transition flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to Get API Credentials (SOP)
        </button>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'quick'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quick Login
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'manual'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manual
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {mode === 'quick' ? (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Secret
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your App Secret"
              />
              <p className="text-xs text-gray-500 mt-1">From Partner Center → App → Basic Info</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Callback URL
              </label>
              <textarea
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows="4"
                placeholder="Paste the full URL after TikTok authorization&#10;&#10;Example: https://localhost/?app_key=xxx&code=xxx&locale=en"
              />
              <p className="text-xs text-gray-500 mt-1">
                The URL you see after authorizing your shop
              </p>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 text-sm border border-primary-100">
              <p className="text-primary-900 font-medium mb-2">How it works:</p>
              <ol className="text-primary-700 space-y-1 list-decimal list-inside">
                <li>System extracts app_key & code from URL</li>
                <li>Exchanges code for access_token</li>
                <li>Gets shop_cipher automatically</li>
                <li>You're logged in!</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                'Quick Connect'
              )}
            </button>

            {error && (
              <div className="text-red-700 text-sm text-center mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                {error}
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Key
              </label>
              <input
                type="text"
                name="app_key"
                value={formData.app_key}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your App Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Secret
              </label>
              <input
                type="password"
                name="app_secret"
                value={formData.app_secret}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your App Secret"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="text"
                name="access_token"
                value={formData.access_token}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your Access Token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Cipher
              </label>
              <input
                type="text"
                name="shop_cipher"
                value={formData.shop_cipher}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your Shop Cipher"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                'Connect Shop'
              )}
            </button>

            {error && (
              <div className="text-red-700 text-sm text-center mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                {error}
              </div>
            )}
          </form>
        )}
      </div>

      {/* SOP Modal */}
      <SOPModal isOpen={showSOP} onClose={() => setShowSOP(false)} />
    </div>
  );
}
