# TikTok Seller Center Unmask Research

## Problem
Customer data (name, phone, address) is masked by TikTok API with `***` characters. Unmasking requires manual action in TikTok Seller Center web interface.

## Investigation Required

### Step 1: Network Analysis
1. Open browser DevTools (F12)
2. Go to Network tab
3. Enable "Preserve log"
4. Visit: `https://seller-my.tiktok.com/order/detail?order_no=581769084568176530&shop_region=MY`
5. Click the unmask button
6. Look for API calls in Network tab

### What to Look For:
- **Endpoint URL**: The API path that gets called
- **Request Method**: GET, POST, PUT, etc.
- **Request Headers**: Authentication tokens, cookies
- **Request Payload**: Data sent to server
- **Response Data**: Unmasked customer information

### Step 2: Document Findings
Create a file with:
```json
{
  "endpoint": "/api/path/to/unmask",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer ...",
    "Cookie": "...",
    "x-tiktok-token": "..."
  },
  "request": {
    "order_id": "581769084568176530",
    "shop_region": "MY"
  },
  "response": {
    "customer_name": "John Doe",
    "customer_phone": "+60123456789"
  }
}
```

## Implementation Options

### Option A: Hidden API Endpoint
If unmask button triggers an API call, we can integrate it into our codebase:

**Pros**:
- Clean integration
- Fast and reliable
- No browser overhead

**Cons**:
- May require different authentication
- Might not be publicly accessible
- Could be rate limited

**Implementation**:
```javascript
// In src/lib/tiktokApi.js
export async function unmaskCustomerInfo(credentials, orderId) {
  return callTikTokApi(
    '/order/privacy/unmask', // Replace with actual endpoint
    'POST',
    {
      app_key: credentials.app_key,
      shop_cipher: credentials.shop_cipher,
      order_id: orderId
    },
    null,
    credentials.app_secret,
    credentials.access_token
  );
}
```

### Option B: Browser Automation (Puppeteer)
If no API endpoint exists, automate browser interaction:

**Pros**:
- Works exactly like human
- Can handle any UI changes
- Bypasses API limitations

**Cons**:
- Slower than API
- Requires browser runtime
- May violate TikTok ToS
- Needs login session management
- Fragile (breaks if UI changes)

**Implementation**:
```javascript
// New file: src/lib/browserAutomation.js
import puppeteer from 'puppeteer';

export async function unmaskOrderViaBrowser(orderNo, shopRegion = 'MY') {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set cookies/session from authenticated user
    // This requires user to provide their session cookies
    await page.setCookie(...sessionCookies);

    // Navigate to order detail
    const url = `https://seller-my.tiktok.com/order/detail?order_no=${orderNo}&shop_region=${shopRegion}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for unmask button and click it
    await page.waitForSelector('.unmask-button-selector'); // Replace with actual selector
    await page.click('.unmask-button-selector');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Extract unmasked data
    const customerData = await page.evaluate(() => {
      return {
        name: document.querySelector('.customer-name-selector')?.textContent,
        phone: document.querySelector('.customer-phone-selector')?.textContent,
        address: document.querySelector('.customer-address-selector')?.textContent
      };
    });

    return customerData;
  } finally {
    await browser.close();
  }
}
```

### Option C: MCP Server with Browser Automation
Create an MCP server that handles browser automation:

**Architecture**:
```
React App → MCP Server → Puppeteer → TikTok Seller Center
```

**Pros**:
- Separates automation logic
- Can run on separate server
- Reusable across projects

**Cons**:
- More complex setup
- Requires MCP server infrastructure
- Same ToS concerns

## Risks and Considerations

### Legal/ToS Issues
- **TikTok Terms of Service**: May prohibit automated access
- **Privacy Compliance**: Unmasking logs may be audited
- **Account Suspension**: Risk of account ban

### Technical Issues
- **Rate Limiting**: TikTok may limit unmask requests
- **Session Management**: Browser automation needs valid login
- **Captcha**: May encounter captcha challenges
- **UI Changes**: Selectors break when TikTok updates UI

### Alternative Approach
Instead of automating unmask, consider:
1. **Manual unmask workflow**: Provide easy UI for manual unmask
2. **Batch unmask**: User unmasked data in bulk, app syncs it
3. **Smart detection**: Only unmask when needed (e.g., before printing waybill)

## Next Steps

1. **Perform network analysis** following Step 1 above
2. **Share findings** (screenshot of Network tab showing unmask API call)
3. **Decide approach** based on what endpoint exists
4. **Implement solution** with appropriate safeguards

## Questions to Answer

- [ ] What API endpoint is called when unmask is clicked?
- [ ] What authentication headers are required?
- [ ] Is the endpoint part of the official TikTok Shop API?
- [ ] What rate limits exist?
- [ ] Does TikTok log unmask actions?
- [ ] Are there any ToS restrictions?
