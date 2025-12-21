import { useState } from 'react';
import SOPModal from './SOPModal';

export default function LoginForm({ onLogin, onQuickLogin, loading }) {
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
  const [showSOP, setShowSOP] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!callbackUrl) {
      setError('Please paste the callback URL');
      return;
    }

    if (!appSecret) {
      setError('App Secret is required');
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
        return;
      }

      // Call the quick login function which will:
      // 1. Exchange code for access_token
      // 2. Get shop_cipher from authorized shops
      await onQuickLogin({
        app_key,
        app_secret: appSecret,
        auth_code: code
      });
    } catch (err) {
      setError(err.message || 'Failed to connect');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.app_key || !formData.app_secret || !formData.access_token || !formData.shop_cipher) {
      setError('All fields are required');
      return;
    }

    try {
      await onLogin(formData);
    } catch (err) {
      setError(err.message || 'Failed to connect');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-tiktok-pink">TikTok Shop</h1>
          <p className="text-gray-400 mt-2">Order Management System</p>
        </div>

        {/* SOP Button */}
        <button
          type="button"
          onClick={() => setShowSOP(true)}
          className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-tiktok-pink/20 to-tiktok-cyan/20 border border-tiktok-cyan/50 rounded-lg text-tiktok-cyan hover:from-tiktok-pink/30 hover:to-tiktok-cyan/30 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to Get API Credentials (SOP)
        </button>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'quick'
                ? 'bg-tiktok-pink text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Quick Login
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'manual'
                ? 'bg-tiktok-pink text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manual
          </button>
        </div>

        {mode === 'quick' ? (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                App Secret
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="input-field"
                placeholder="Enter your App Secret"
              />
              <p className="text-xs text-gray-500 mt-1">From Partner Center → App → Basic Info</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Callback URL
              </label>
              <textarea
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="Paste the full URL after TikTok authorization&#10;&#10;Example: https://localhost/?app_key=xxx&code=xxx&locale=en"
              />
              <p className="text-xs text-gray-500 mt-1">
                The URL you see after authorizing your shop
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4 text-sm">
              <p className="text-tiktok-cyan font-medium mb-2">How it works:</p>
              <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                <li>System extracts app_key & code from URL</li>
                <li>Exchanges code for access_token</li>
                <li>Gets shop_cipher automatically</li>
                <li>You're logged in!</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="text-red-400 text-sm text-center mt-2 p-2 bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                App Key
              </label>
              <input
                type="text"
                name="app_key"
                value={formData.app_key}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your App Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                App Secret
              </label>
              <input
                type="password"
                name="app_secret"
                value={formData.app_secret}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your App Secret"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Access Token
              </label>
              <input
                type="text"
                name="access_token"
                value={formData.access_token}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your Access Token"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Shop Cipher
              </label>
              <input
                type="text"
                name="shop_cipher"
                value={formData.shop_cipher}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your Shop Cipher"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="text-red-400 text-sm text-center mt-2 p-2 bg-red-900/20 rounded-lg">
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
