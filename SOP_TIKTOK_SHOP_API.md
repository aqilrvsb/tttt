# SOP: How to Get TikTok Shop API Credentials

## Overview
This guide walks you through getting all the credentials needed to use the TikTok Shop Order Manager.

---

## Step 1: Register at Partner Center

### Choose Your Region:
| Region | Partner Center URL |
|--------|-------------------|
| Global (Malaysia, etc.) | https://partner.tiktokshop.com |
| US Only | https://partner.us.tiktokshop.com |

1. Go to https://partner.tiktokshop.com
2. Click **"Become a Partner"** or **"Sign Up"**
3. Select **"App Developer"** (NOT ISV or Service Provider)
4. Complete registration with your TikTok account

---

## Step 2: Create Your App

1. Log in to Partner Center
2. Go to **"App Management"** in the left sidebar
3. Click **"Create App"**

### Fill in App Details:
| Field | What to Enter |
|-------|---------------|
| App Name | Your app name (e.g., "My Order Manager") |
| App Icon | Upload a logo (100x100px recommended) |
| Description | Brief description of your app |

4. Click **"Confirm"** to create the app

---

## Step 3: Get App Key & App Secret

### Where to Find:
1. Go to **"App Management"**
2. Click on your app name
3. Look at the **"Basic Information"** section

```
┌─────────────────────────────────────────────────┐
│  Basic Information                              │
├─────────────────────────────────────────────────┤
│  App Key:     6idt36ueoum3i                     │  ← Copy this
│  App Secret:  ●●●●●●●●●●●●●●●●  [Show]          │  ← Click "Show" to reveal
└─────────────────────────────────────────────────┘
```

4. Click **"Show"** button next to App Secret to reveal it
5. Copy both values:
   - **App Key**: `6idt36ueoum3i` (example)
   - **App Secret**: `2fcb5dbcbc785d399a7b71a160595fa3e376edb1` (example)

---

## Step 4: Enable API Permissions (Scopes)

1. In your app page, find **"Manage API"** or **"API Scopes"** section
2. Enable these scopes (IMPORTANT):

### Required Scopes:
| Scope | Purpose |
|-------|---------|
| ✅ **Shop Authorized Information** | Get shop_cipher |
| ✅ **Order Information** | View orders & customer details |
| ✅ **Fulfillment** | Ship orders, get waybills |

### Recommended Additional Scopes:
| Scope | Purpose |
|-------|---------|
| ✅ Product Information | View products |
| ✅ Logistics | Shipping providers |
| ✅ Finance | Payment info |

3. Click **"Save"** or **"Confirm"**
4. Click **"Publish"** to activate the app

---

## Step 5: Get the Callback URL (Authorization Code)

### Method 1: Using Authorization Link

1. Open this URL in your browser (replace YOUR_APP_KEY):
```
https://auth.tiktok-shops.com/oauth/authorize?app_key=YOUR_APP_KEY&state=test123
```

Example with your app key:
```
https://auth.tiktok-shops.com/oauth/authorize?app_key=6idt36ueoum3i&state=test123
```

2. Log in with your TikTok Seller account
3. Select your shop and click **"Authorize"**
4. You will be redirected to a URL like:
```
https://localhost/?app_key=6idt36ueoum3i&code=ROW_xxxxx...&locale=en-GB&shop_region=MY
```

5. **Copy this entire URL** - this is your Callback URL!

### Method 2: Using Service Link (if available)

1. Go to Partner Center → App Management → Your App
2. Find **"Service Link"** or **"Authorization URL"**
3. Copy the link and open it
4. Complete authorization
5. Copy the redirected URL

---

## Step 6: Use Quick Login in the App

Now you have everything needed:

| Credential | Where to Get | Example |
|------------|--------------|---------|
| App Secret | Partner Center → App → Basic Info | `2fcb5dbcbc78...` |
| Callback URL | After authorization redirect | `https://localhost/?app_key=...&code=...` |

### In the App:
1. Open http://localhost:5173
2. Select **"Quick Login"** tab
3. Enter **App Secret**
4. Paste **Callback URL**
5. Click **"Quick Connect"**

The system will automatically:
- Extract app_key and code from URL
- Exchange code for access_token
- Get shop_cipher
- Log you in!

---

## Troubleshooting

### "Invalid authorization code"
- The code expires in 10 minutes
- Get a new callback URL by re-authorizing

### "No authorized shops found"
- Make sure you authorized your seller shop
- Check that "Shop Authorized Information" scope is enabled

### "Access denied"
- Enable all required API scopes
- Publish your app after enabling scopes
- Re-authorize to get new token with updated permissions

---

## Quick Reference Links

| Resource | URL |
|----------|-----|
| Partner Center (Global) | https://partner.tiktokshop.com |
| Partner Center (US) | https://partner.us.tiktokshop.com |
| Authorization URL | https://auth.tiktok-shops.com/oauth/authorize?app_key=YOUR_APP_KEY&state=test123 |
| API Documentation | https://partner.tiktokshop.com/doc |
| Seller Center (MY) | https://seller-my.tiktok.com |

---

## Screenshot Guide

### Finding App Key & App Secret:
```
Partner Center
    └── App Management (left sidebar)
        └── Click your app name
            └── Basic Information section
                ├── App Key: visible
                └── App Secret: click "Show" button
```

### Enabling API Scopes:
```
Partner Center
    └── App Management
        └── Your App
            └── Manage API / API Scopes
                └── Toggle ON required scopes
                    └── Click Save
                        └── Click Publish
```

### Getting Callback URL:
```
1. Visit: https://auth.tiktok-shops.com/oauth/authorize?app_key=YOUR_KEY&state=test
2. Login with Seller account
3. Select shop → Authorize
4. Copy the redirected URL from browser address bar
```
