import { useEffect } from 'react';

export default function SOPAdsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">How to Get TikTok Ads API Credentials</h2>
              <p className="text-blue-100 text-sm">Step-by-step guide to access TikTok Marketing API</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Why TikTok Ads API?</h3>
                <p className="text-sm text-blue-800">
                  Even if you use the "Promote" button in TikTok Shop Seller Center, the ad spend data is tracked in
                  TikTok Ads Manager. You need Ads API credentials to access this data programmatically.
                </p>
              </div>
            </div>
          </div>

          {/* Step 1 */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Create TikTok For Business Account</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Go to <a href="https://ads.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">https://ads.tiktok.com</a></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Sign up or log in with your TikTok account</li>
                    <li>Complete business verification (name, email, phone)</li>
                    <li>This will be your Ads Manager account</li>
                  </ul>
                  <div className="bg-gray-50 rounded p-3 border border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>Note:</strong> Use the same account where you run your TikTok Shop promotions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Get Your Advertiser ID</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>In TikTok Ads Manager:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Look at the URL bar: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">https://ads.tiktok.com/i18n/dashboard?aadvid=<strong className="text-blue-600">1234567890123456</strong></code></li>
                    <li>The long number after <code className="bg-gray-100 px-1 rounded text-xs">aadvid=</code> is your <strong>Advertiser ID</strong></li>
                    <li>Or go to Settings → Account Info to find it</li>
                  </ul>
                  <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>Save this number!</strong> You'll need it for the API credentials form.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Apply for TikTok Marketing API Access</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Go to <a href="https://ads.tiktok.com/marketing_api/homepage" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">TikTok Marketing API</a></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Click "Apply for Access" or "Get Started"</li>
                    <li>Fill out the application form:
                      <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                        <li>Company/Business name</li>
                        <li>Use case: "Reporting & Analytics"</li>
                        <li>Description: "Tracking ad spend for TikTok Shop promotions"</li>
                      </ul>
                    </li>
                    <li>Submit and wait for approval (usually 1-3 business days)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Create a Developer App</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>After approval, go to <a href="https://ads.tiktok.com/marketing_api/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Developer Tools</a></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Click "Create New App"</li>
                    <li>Enter app details:
                      <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                        <li>App Name: "TikTok Shop Order Manager" (or your choice)</li>
                        <li>App Type: Select "Third Party App"</li>
                      </ul>
                    </li>
                    <li>Click "Create"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Get App Key & App Secret</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>In your newly created app:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Click on the app name to view details</li>
                    <li>Find the <strong>App Key</strong> (also called App ID)</li>
                    <li>Find the <strong>App Secret</strong> (click "Show" to reveal)</li>
                    <li>Copy both values - you'll need them later</li>
                  </ul>
                  <div className="bg-red-50 rounded p-3 border border-red-200">
                    <p className="text-xs text-red-800">
                      <strong>⚠️ Keep App Secret private!</strong> Never share it publicly or commit to git.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                6
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Generate Access Token</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>There are two methods to get an Access Token:</p>

                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="font-semibold text-green-900 mb-2">Method A: Long-term Access Token (Recommended)</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-green-800">
                      <li>In your app settings, find "Authentication"</li>
                      <li>Click "Generate Long-term Token"</li>
                      <li>Select your Advertiser Account</li>
                      <li>Authorize the app</li>
                      <li>Copy the generated token (valid for ~1 year)</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="font-semibold text-gray-900 mb-2">Method B: OAuth 2.0 Flow (Advanced)</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                      <li>Use OAuth 2.0 authorization code flow</li>
                      <li>Requires implementing callback handling</li>
                      <li>More complex but auto-refreshable</li>
                      <li>See TikTok's OAuth documentation for details</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 7 */}
          <div className="border border-green-300 bg-green-50 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                7
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">Enter Credentials in Settings</h3>
                <div className="space-y-3 text-sm text-green-800">
                  <p>Now you have everything needed! Enter these values in the TikTok Ads API form:</p>
                  <div className="bg-white rounded border border-green-300 p-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="font-semibold">Field</div>
                      <div className="font-semibold col-span-2">Where to Find</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
                      <div className="font-medium">Ads App Key</div>
                      <div className="col-span-2">Developer App → App Details</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
                      <div className="font-medium">Ads App Secret</div>
                      <div className="col-span-2">Developer App → App Details (click "Show")</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
                      <div className="font-medium">Ads Access Token</div>
                      <div className="col-span-2">Generated long-term token or OAuth token</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
                      <div className="font-medium">Advertiser ID</div>
                      <div className="col-span-2">From Ads Manager URL or Settings</div>
                    </div>
                  </div>
                  <p className="font-semibold">Click "Save Ads API Credentials" and you're done! 🎉</p>
                </div>
              </div>
            </div>
          </div>

          {/* Helpful Resources */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📚 Helpful Resources</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://ads.tiktok.com/marketing_api/docs?id=1738373164380162"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → TikTok Marketing API Documentation
              </a>
              <a
                href="https://ads.tiktok.com/marketing_api/docs?id=1738373141733378"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → Authentication Guide
              </a>
              <a
                href="https://ads.tiktok.com/marketing_api/docs?id=1738864915188737"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → Reporting API Guide
              </a>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">❓ Common Issues</h3>
            <div className="space-y-3 text-sm text-yellow-800">
              <div>
                <p className="font-semibold">Application not approved?</p>
                <p className="text-xs mt-1">Make sure you selected "Reporting & Analytics" as use case and provided business details.</p>
              </div>
              <div>
                <p className="font-semibold">Can't find Advertiser ID?</p>
                <p className="text-xs mt-1">Check the URL when logged into Ads Manager, or go to Settings → Account Info.</p>
              </div>
              <div>
                <p className="font-semibold">Access Token not working?</p>
                <p className="text-xs mt-1">Ensure you authorized the correct advertiser account and the token hasn't expired.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Got it! Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
