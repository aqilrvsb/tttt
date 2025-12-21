import { useState } from 'react';

export default function SOPModal({ isOpen, onClose }) {
  const [appKeyInput, setAppKeyInput] = useState('');

  if (!isOpen) return null;

  const authUrl = appKeyInput
    ? `https://auth.tiktok-shops.com/oauth/authorize?app_key=${appKeyInput}&state=test123`
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">How to Get TikTok Shop API Credentials</h2>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              <span className="text-2xl">🇲🇾</span> Malaysia Region
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1 */}
          <div className="card">
            <h3 className="text-lg font-bold text-tiktok-pink mb-3 flex items-center gap-2">
              <span className="bg-tiktok-pink text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Register at Partner Center
            </h3>
            <p className="text-gray-300 mb-3">Sign up as <span className="text-yellow-400 font-medium">App Developer</span>:</p>
            <a
              href="https://partner.tiktokshop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-tiktok-pink/20 border border-tiktok-pink/50 rounded-lg hover:bg-tiktok-pink/30 transition"
            >
              <span className="text-3xl">🇲🇾</span>
              <div className="flex-1">
                <p className="text-white font-medium text-lg">TikTok Shop Partner Center</p>
                <p className="text-sm text-tiktok-cyan">partner.tiktokshop.com</p>
              </div>
              <svg className="w-6 h-6 text-tiktok-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">⚠️ When registering, select <strong>"App Developer"</strong> (not ISV or Service Provider)</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card">
            <h3 className="text-lg font-bold text-tiktok-pink mb-3 flex items-center gap-2">
              <span className="bg-tiktok-pink text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Create Your App
            </h3>
            <a
              href="https://partner.tiktokshop.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-tiktok-cyan/20 text-tiktok-cyan rounded-lg hover:bg-tiktok-cyan/30 transition text-sm mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open App Management
            </a>
            <ol className="text-gray-300 space-y-2 list-decimal list-inside">
              <li>Click <span className="text-tiktok-cyan">"Create App"</span></li>
              <li>Fill in App Name, Icon, Description</li>
              <li>Click <span className="text-tiktok-cyan">"Confirm"</span></li>
            </ol>
          </div>

          {/* Step 3 */}
          <div className="card">
            <h3 className="text-lg font-bold text-tiktok-pink mb-3 flex items-center gap-2">
              <span className="bg-tiktok-pink text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Get App Key & App Secret
            </h3>
            <a
              href="https://partner.tiktokshop.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-tiktok-cyan/20 text-tiktok-cyan rounded-lg hover:bg-tiktok-cyan/30 transition text-sm mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open App Management → Your App → Basic Info
            </a>
            <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm">
              <p className="text-gray-400 mb-2">┌─ Basic Information ─────────────────────┐</p>
              <p className="text-gray-300">│ App Key: <span className="text-green-400">6idt36ueoum3i</span></p>
              <p className="text-gray-300">│ App Secret: <span className="text-yellow-400">●●●●●●●●</span> <span className="text-tiktok-cyan">[Show]</span> ← Klik ini!</p>
              <p className="text-gray-400">└─────────────────────────────────────────┘</p>
            </div>
            <p className="text-green-400 text-sm mt-3">✅ Copy kedua-dua App Key dan App Secret</p>
          </div>

          {/* Step 4 */}
          <div className="card">
            <h3 className="text-lg font-bold text-tiktok-pink mb-3 flex items-center gap-2">
              <span className="bg-tiktok-pink text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
              Enable API Permissions
            </h3>
            <a
              href="https://partner.tiktokshop.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-tiktok-cyan/20 text-tiktok-cyan rounded-lg hover:bg-tiktok-cyan/30 transition text-sm mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open App → Manage API / API Scopes
            </a>
            <p className="text-gray-300 mb-3">Enable SEMUA scopes ini:</p>
            <div className="space-y-2 mb-4">
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✅</span>
                  <span className="text-white font-bold">Shop Authorized Information</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">WAJIB</span>
                </div>
                <p className="text-gray-400 text-xs ml-6">→ Untuk dapatkan shop_cipher (login)</p>
              </div>
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✅</span>
                  <span className="text-white font-bold">Order Information</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">WAJIB</span>
                </div>
                <p className="text-gray-400 text-xs ml-6">→ Untuk lihat senarai orders dan details</p>
              </div>
              <div className="p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✅</span>
                  <span className="text-white font-bold">Fulfillment</span>
                  <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded">PENTING</span>
                </div>
                <p className="text-gray-400 text-xs ml-6">→ Untuk <span className="text-tiktok-cyan">SHIP orders</span> dan <span className="text-tiktok-pink">DOWNLOAD WAYBILL</span></p>
              </div>
              <div className="p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✅</span>
                  <span className="text-white font-bold">Logistics</span>
                  <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded">PENTING</span>
                </div>
                <p className="text-gray-400 text-xs ml-6">→ Untuk shipping providers dan tracking</p>
              </div>
            </div>

            {/* Important note about customer details */}
            <div className="p-3 bg-tiktok-cyan/20 border border-tiktok-cyan/50 rounded-lg mb-4">
              <p className="text-tiktok-cyan font-medium text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Maklumat Pelanggan (Phone & Address)
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Phone number dan address pelanggan ada dalam <span className="text-white font-medium">Order Information</span> API.
                Data ini <span className="text-yellow-400">masked</span> oleh TikTok untuk privacy, tapi akan terpapar penuh dalam <span className="text-tiktok-pink font-medium">waybill/shipping label</span>.
              </p>
            </div>
            <ol className="text-gray-300 space-y-2 list-decimal list-inside">
              <li>Click <span className="text-tiktok-cyan">"Save"</span></li>
              <li>Click <span className="text-tiktok-cyan">"Publish"</span> untuk activate app</li>
            </ol>
            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">⚠️ WAJIB publish app supaya scopes berfungsi!</p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="card border-tiktok-cyan/50">
            <h3 className="text-lg font-bold text-tiktok-pink mb-3 flex items-center gap-2">
              <span className="bg-tiktok-pink text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
              Get Callback URL (Authorization Code)
            </h3>

            {/* App Key Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Masukkan App Key anda untuk generate authorization link:
              </label>
              <input
                type="text"
                value={appKeyInput}
                onChange={(e) => setAppKeyInput(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-tiktok-cyan focus:border-transparent text-white"
                placeholder="contoh: 6idt36ueoum3i"
              />
            </div>

            {/* Generated Authorization Link */}
            {appKeyInput ? (
              <div className="mb-4">
                <p className="text-gray-300 text-sm mb-2">Authorization link anda:</p>
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-4 bg-tiktok-pink/20 border border-tiktok-pink/50 text-tiktok-pink rounded-lg hover:bg-tiktok-pink/30 transition"
                >
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="font-medium">Klik untuk Authorize Shop Anda</span>
                </a>
                <div className="mt-2 p-2 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-400 break-all font-mono">{authUrl}</p>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-gray-700/50 rounded-lg text-center text-gray-400">
                Masukkan App Key di atas untuk generate authorization link
              </div>
            )}

            <div className="mb-4 p-4 bg-tiktok-pink/10 border border-tiktok-pink/30 rounded-lg">
              <p className="text-white font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Cara Dapat Callback URL:
              </p>
              <ol className="text-gray-300 space-y-2 list-decimal list-inside text-sm">
                <li><span className="text-tiktok-cyan font-medium">Klik Copy</span> authorization link di atas</li>
                <li><span className="text-tiktok-cyan font-medium">Paste</span> dalam tab baru browser dan tekan Enter</li>
                <li>Log masuk dengan akaun <span className="text-yellow-400 font-medium">TikTok Seller</span> anda</li>
                <li>Pilih shop anda dan klik <span className="text-tiktok-cyan font-medium">"Authorize"</span></li>
                <li><span className="text-yellow-400 font-medium">Proceed (teruskan)</span> sehingga ia jump ke localhost</li>
                <li>Browser akan tunjuk error page (normal!), tapi <span className="text-green-400 font-medium">URL di address bar</span> adalah Callback URL anda!</li>
              </ol>
            </div>
            <p className="text-gray-300 text-sm mb-2">Contoh Callback URL yang anda akan dapat:</p>
            <div className="bg-gray-900 p-3 rounded-lg font-mono text-xs mt-3 break-all">
              <span className="text-green-400">https://localhost/?app_key=xxx&code=ROW_xxxxx...&locale=en-GB&shop_region=MY</span>
            </div>
            <p className="text-green-400 text-sm mt-3">✅ Copy SELURUH URL ini dari browser - ini adalah Callback URL anda!</p>
            <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">⚠️ Code expire dalam 10 minit! Guna dengan segera.</p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="card bg-gradient-to-r from-tiktok-pink/20 to-tiktok-cyan/20">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-white text-tiktok-pink w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
              Guna Quick Login
            </h3>
            <p className="text-gray-300 mb-3">Sekarang anda ada semua! Masukkan:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <span className="text-tiktok-cyan font-bold">1.</span>
                <span className="text-white">App Secret</span>
                <span className="text-gray-400 text-sm">→ dari Step 3</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <span className="text-tiktok-cyan font-bold">2.</span>
                <span className="text-white">Callback URL</span>
                <span className="text-gray-400 text-sm">→ dari Step 5</span>
              </div>
            </div>
            <p className="text-tiktok-cyan text-sm mt-4">
              Sistem akan automatically dapatkan access_token dan shop_cipher untuk anda!
            </p>
          </div>

          {/* Quick Links Summary - Malaysia Focus */}
          <div className="card border-tiktok-cyan/50">
            <h3 className="text-lg font-bold text-tiktok-cyan mb-3 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Quick Links 🇲🇾
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <a
                href="https://partner.tiktokshop.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
              >
                <span className="text-tiktok-pink">→</span>
                <span className="text-white">Partner Center</span>
              </a>
              <a
                href="https://partner.tiktokshop.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
              >
                <span className="text-tiktok-pink">→</span>
                <span className="text-white">App Management</span>
              </a>
              <a
                href="https://seller-my.tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
              >
                <span className="text-tiktok-pink">→</span>
                <span className="text-white">Seller Center Malaysia</span>
              </a>
              <a
                href="https://partner.tiktokshop.com/doc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-sm"
              >
                <span className="text-tiktok-pink">→</span>
                <span className="text-white">API Documentation</span>
              </a>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="card border-yellow-500/50">
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Masalah & Penyelesaian
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-red-400 font-medium">"Invalid authorization code"</p>
                <p className="text-gray-400">→ Code expire dalam 10 minit. Dapatkan baru dari Step 5.</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-red-400 font-medium">"No authorized shops found"</p>
                <p className="text-gray-400">→ Enable "Shop Authorized Information" scope dalam Step 4, lepas tu authorize semula.</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-red-400 font-medium">"Access denied"</p>
                <p className="text-gray-400">→ Klik "Publish" selepas enable scopes dalam Step 4, lepas tu authorize semula.</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-red-400 font-medium">"Network Error" atau CORS error</p>
                <p className="text-gray-400">→ Ini normal dalam browser. API call berfungsi di server-side.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Faham!
          </button>
        </div>
      </div>
    </div>
  );
}
