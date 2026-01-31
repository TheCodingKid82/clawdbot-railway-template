# Browser Persistence Guide for Agents

## Overview
Each agent has a dedicated browserless service that persists cookies and login sessions.

## Browser Service URLs
| Agent | Browser Service |
|-------|-----------------|
| Atlas | wss://atlas-browser-production.up.railway.app |
| Apollo | wss://apollo-browser-production.up.railway.app |
| Artemis | wss://artemis-browser-production.up.railway.app |
| Maia | wss://maia-browser-production.up.railway.app |
| Orpheus | wss://orpheus-browser-production.up.railway.app |
| Callisto | wss://callisto-browser-production.up.railway.app |
| Iris | wss://iris-browser-production.up.railway.app |

## How Persistence Works

### In-Memory Persistence (Automatic)
- Chrome stays running via `PREBOOT_CHROME=true`
- Cookies persist between connections for up to 24 hours
- Just use `puppeteer.connect()` and sessions will be maintained

### File-Based Backup (For Deployments)
When the browser service redeploys, Chrome restarts and loses in-memory cookies.
Use file-based backup to survive this.

## Using Puppeteer (Recommended)

### Basic Connection
```javascript
const puppeteer = require('puppeteer-core');

const browser = await puppeteer.connect({
  browserWSEndpoint: process.env.BROWSER_WS_ENDPOINT || 'wss://YOUR-browser-production.up.railway.app'
});

const pages = await browser.pages();
const page = pages[0] || await browser.newPage();

// Do your work...

// IMPORTANT: Disconnect, don't close!
browser.disconnect();
```

### With Cookie Persistence
```javascript
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const COOKIE_FILE = '/data/workspace/cookies.json';
const WS_URL = process.env.BROWSER_WS_ENDPOINT;

async function withBrowser(callback) {
  const browser = await puppeteer.connect({ browserWSEndpoint: WS_URL });
  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  
  // Load saved cookies
  if (fs.existsSync(COOKIE_FILE)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
    await page.setCookie(...cookies);
    console.log('Loaded saved cookies');
  }
  
  try {
    // Run your code
    const result = await callback(browser, page);
    
    // Save cookies before leaving
    const allCookies = await page.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(allCookies, null, 2));
    console.log('Saved cookies');
    
    return result;
  } finally {
    browser.disconnect();
  }
}

// Usage:
await withBrowser(async (browser, page) => {
  await page.goto('https://whop.com/dashboard/');
  // Check if logged in, do work, etc.
});
```

## Quick Login Check
```javascript
async function isLoggedInToWhop(page) {
  await page.goto('https://whop.com/dashboard/', { waitUntil: 'networkidle2' });
  const url = page.url();
  return url.includes('dashboard') && !url.includes('login');
}
```

## Important Notes

1. **Always disconnect, never close** - Use `browser.disconnect()` not `browser.close()`
2. **Save cookies after logins** - Always save cookies after a successful login
3. **Load cookies on connect** - Always try to load saved cookies when connecting
4. **One connection at a time** - MAX_CONCURRENT_SESSIONS=1, so wait for others to finish

## Environment Variable
Your browser WebSocket URL is available as:
```
process.env.BROWSER_WS_ENDPOINT
```

## Troubleshooting

### "Session expired" after working
- Check if another agent is using the same browser service
- Save/load cookies to file as backup

### "SingletonLock" errors
- Wait a moment and retry - previous connection may still be closing

### Cookies not persisting
- Make sure you're saving cookies BEFORE disconnecting
- Check that COOKIE_FILE path is writable (/data/workspace/)
