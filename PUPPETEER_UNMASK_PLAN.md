# Puppeteer Unmask Automation Plan

## Overview
Since the TikTok unmask API requires browser context and dynamic signatures, we'll use Puppeteer to automate the unmask process.

## Architecture

```
React Frontend (Processed.jsx)
    ↓
Backend API (/api/unmask)
    ↓
Puppeteer Service
    ↓
TikTok Seller Center
```

## Implementation Steps

### Step 1: Backend Setup (Node.js + Express)

Create a backend server that runs Puppeteer:

```
backend/
├── server.js              # Express server
├── services/
│   ├── puppeteerService.js   # Puppeteer browser management
│   └── unmaskService.js      # Unmask automation logic
└── routes/
    └── unmask.js          # API endpoints
```

### Step 2: Puppeteer Service

**File**: `backend/services/puppeteerService.js`

```javascript
const puppeteer = require('puppeteer');

class PuppeteerService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
  }

  async login(email, password) {
    await this.page.goto('https://seller-my.tiktok.com/login');

    // Fill login form
    await this.page.type('#email-input', email);
    await this.page.type('#password-input', password);
    await this.page.click('#login-button');

    // Wait for login to complete
    await this.page.waitForNavigation();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getPage() {
    return this.page;
  }
}

module.exports = PuppeteerService;
```

### Step 3: Unmask Service

**File**: `backend/services/unmaskService.js`

```javascript
class UnmaskService {
  constructor(puppeteerService) {
    this.puppeteerService = puppeteerService;
  }

  async unmaskOrder(orderNo) {
    const page = this.puppeteerService.getPage();

    // Navigate to order detail page
    const orderUrl = `https://seller-my.tiktok.com/order/detail?order_no=${orderNo}&shop_region=MY`;
    await page.goto(orderUrl, { waitUntil: 'networkidle2' });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Set up network interception to capture API response
    const unmaskData = await this.captureUnmaskResponse(page);

    // Click unmask button
    const unmaskButton = await page.$('.unmask-button-selector'); // Replace with actual selector
    if (unmaskButton) {
      await unmaskButton.click();
      await page.waitForTimeout(2000);
    }

    // Extract customer data from DOM (after unmask)
    const customerData = await page.evaluate(() => {
      return {
        name: document.querySelector('.customer-name-selector')?.textContent,
        phone: document.querySelector('.customer-phone-selector')?.textContent,
        address: document.querySelector('.customer-address-selector')?.textContent
      };
    });

    return customerData;
  }

  async captureUnmaskResponse(page) {
    return new Promise((resolve) => {
      page.on('response', async (response) => {
        const url = response.url();

        if (url.includes('/buyer_contact_info/get')) {
          const data = await response.json();
          resolve(data);
        }
      });
    });
  }

  async unmaskMultipleOrders(orderNumbers) {
    const results = [];

    for (const orderNo of orderNumbers) {
      try {
        const data = await this.unmaskOrder(orderNo);
        results.push({
          orderNo,
          success: true,
          data
        });
      } catch (error) {
        results.push({
          orderNo,
          success: false,
          error: error.message
        });
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
}

module.exports = UnmaskService;
```

### Step 4: API Routes

**File**: `backend/routes/unmask.js`

```javascript
const express = require('express');
const router = express.Router();
const PuppeteerService = require('../services/puppeteerService');
const UnmaskService = require('../services/unmaskService');

// Store browser sessions per user
const userSessions = new Map();

router.post('/init-session', async (req, res) => {
  const { userId, email, password } = req.body;

  try {
    const puppeteerService = new PuppeteerService();
    await puppeteerService.init();
    await puppeteerService.login(email, password);

    userSessions.set(userId, puppeteerService);

    res.json({ success: true, message: 'Session initialized' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/unmask', async (req, res) => {
  const { userId, orderNumbers } = req.body;

  try {
    const puppeteerService = userSessions.get(userId);

    if (!puppeteerService) {
      return res.status(401).json({
        success: false,
        error: 'No active session. Please initialize session first.'
      });
    }

    const unmaskService = new UnmaskService(puppeteerService);
    const results = await unmaskService.unmaskMultipleOrders(orderNumbers);

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/close-session', async (req, res) => {
  const { userId } = req.body;

  const puppeteerService = userSessions.get(userId);
  if (puppeteerService) {
    await puppeteerService.close();
    userSessions.delete(userId);
  }

  res.json({ success: true, message: 'Session closed' });
});

module.exports = router;
```

### Step 5: Frontend Integration

**File**: `src/pages/Processed.jsx`

Add unmask functionality:

```javascript
// Add state
const [unmasking, setUnmasking] = useState(false);

// Unmask selected orders
const handleUnmaskSelected = async () => {
  if (selectedOrders.length === 0) return;

  setUnmasking(true);

  try {
    // Call backend unmask API
    const response = await fetch('/api/unmask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id, // From auth context
        orderNumbers: selectedOrders.map(o => o.id)
      })
    });

    const data = await response.json();

    if (data.success) {
      // Update orders with unmasked data
      for (const result of data.results) {
        if (result.success) {
          // Update order in database
          await saveOrder({
            order_id: result.orderNo,
            customer_name: result.data.name,
            customer_phone: result.data.phone,
            customer_address: result.data.address
          });
        }
      }

      // Refresh orders from database
      loadOrdersFromDB();

      Swal.fire({
        icon: 'success',
        title: 'Unmask Complete',
        text: `Successfully unmasked ${data.results.filter(r => r.success).length} orders`
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Unmask Failed',
      text: error.message
    });
  } finally {
    setUnmasking(false);
  }
};
```

Add unmask button to UI:

```javascript
<BulkActions
  selectedCount={selectedOrders.length}
  loading={loading}
  activeTab="shipped"
  onUnmaskSelected={handleUnmaskSelected}
  unmaskLoading={unmasking}
/>
```

## Security Considerations

### 1. Store TikTok Credentials Securely
- Encrypt email/password in database
- Use environment variables
- Never expose credentials to frontend

### 2. Rate Limiting
- Add delay between unmask requests (2-3 seconds)
- Limit concurrent sessions
- Monitor for IP blocks

### 3. Session Management
- Auto-close sessions after timeout
- Handle session expiry gracefully
- Limit one session per user

### 4. Error Handling
- Detect and handle captcha
- Handle login failures
- Retry failed unmask attempts

## Deployment

### Option 1: Self-Hosted Backend
- Deploy Node.js backend on VPS
- Install Puppeteer with Chrome
- Ensure sufficient memory (1GB+ per browser instance)

### Option 2: Serverless (AWS Lambda)
- Use `@sparticuz/chromium` for Lambda
- Cold start may be slow
- Memory limits apply

### Option 3: Dedicated Automation Service
- Use service like Browserless.io
- Managed Chrome instances
- Better scaling

## Risks & Mitigation

### Risk 1: TikTok ToS Violation
**Mitigation**:
- Only use with explicit user consent
- Add disclaimer
- Limit usage to reasonable levels

### Risk 2: Account Suspension
**Mitigation**:
- Add human-like delays
- Limit requests per hour
- Use real user sessions (not bots)

### Risk 3: UI Changes Break Automation
**Mitigation**:
- Use multiple selectors as fallback
- Monitor for errors
- Update selectors when TikTok updates UI

### Risk 4: Captcha/2FA
**Mitigation**:
- Manual login with session reuse
- Handle 2FA via user input
- Use anti-captcha services (if legal)

## Testing Plan

1. **Unit Tests**: Test unmask logic with mocked Puppeteer
2. **Integration Tests**: Test full flow with test TikTok account
3. **Load Tests**: Test with multiple concurrent orders
4. **Error Tests**: Test failure scenarios (invalid order, network error, etc.)

## Alternative: Simpler Approach

If full automation is too complex, consider a **hybrid approach**:

1. User manually unmasked orders in TikTok Seller Center
2. App provides a "Sync Unmasked Data" button
3. Puppeteer scrapes already-unmasked data from order list
4. No need to click unmask button automatically

This is:
- Less likely to violate ToS
- More reliable (no need to find unmask button)
- Faster (no waiting for unmask API)
- Lower risk of account suspension

## Next Steps

1. Set up Node.js backend project
2. Install Puppeteer: `npm install puppeteer`
3. Test login automation with TikTok Seller Center
4. Identify correct DOM selectors for customer data
5. Implement unmask service
6. Test with small batch of orders
7. Monitor for blocks/errors
8. Scale gradually
