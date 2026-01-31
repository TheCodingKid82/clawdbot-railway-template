/**
 * Cookie Utilities for Spark Studio Agents
 * 
 * Copy this file to your workspace and use it for browser persistence.
 * 
 * Usage:
 *   const { connectWithCookies, saveCookies, loadCookies } = require('./cookie-utils');
 *   
 *   // Easy way - auto save/load
 *   await connectWithCookies(async (page) => {
 *     await page.goto('https://whop.com/dashboard/');
 *     // cookies are auto-loaded before, auto-saved after
 *   });
 *   
 *   // Manual way
 *   const browser = await puppeteer.connect({...});
 *   const page = (await browser.pages())[0];
 *   await loadCookies(page, 'whop.com');
 *   // ... do stuff ...
 *   await saveCookies(page, 'whop.com');
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Cookie storage location - uses agent's persistent volume
const COOKIE_DIR = process.env.COOKIE_DIR || '/data/workspace/cookies';

// Browser WebSocket URL
const BROWSER_WS = process.env.BROWSER_WS_ENDPOINT;

function getCookiePath(domain) {
  const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  return path.join(COOKIE_DIR, `${safeDomain}.json`);
}

function ensureCookieDir() {
  if (!fs.existsSync(COOKIE_DIR)) {
    fs.mkdirSync(COOKIE_DIR, { recursive: true });
  }
}

/**
 * Save all cookies from a page to file
 */
async function saveCookies(page, domain = 'all') {
  ensureCookieDir();
  const cookies = await page.cookies();
  const cookiePath = getCookiePath(domain);
  fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
  console.log(`💾 Saved ${cookies.length} cookies to ${cookiePath}`);
  return cookies;
}

/**
 * Load cookies from file and set them on the page
 */
async function loadCookies(page, domain = 'all') {
  const cookiePath = getCookiePath(domain);
  
  if (!fs.existsSync(cookiePath)) {
    console.log(`📭 No saved cookies for ${domain}`);
    return [];
  }
  
  const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
  if (cookies.length > 0) {
    await page.setCookie(...cookies);
    console.log(`📬 Loaded ${cookies.length} cookies for ${domain}`);
  }
  return cookies;
}

/**
 * Connect to browser with automatic cookie management
 */
async function connectWithCookies(callback, options = {}) {
  const {
    domain = 'all',
    wsEndpoint = BROWSER_WS,
    autoSave = true,
    autoLoad = true
  } = options;
  
  if (!wsEndpoint) {
    throw new Error('BROWSER_WS_ENDPOINT not set and no wsEndpoint provided');
  }
  
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  
  try {
    // Load cookies before running callback
    if (autoLoad) {
      await loadCookies(page, domain);
    }
    
    // Run the user's code
    const result = await callback(page, browser);
    
    // Save cookies after
    if (autoSave) {
      await saveCookies(page, domain);
    }
    
    return result;
  } finally {
    browser.disconnect();
    console.log('🔌 Disconnected from browser');
  }
}

/**
 * Check if logged into a site
 */
async function checkLogin(page, url, loggedInIndicator) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  const currentUrl = page.url();
  
  if (typeof loggedInIndicator === 'function') {
    return await loggedInIndicator(page, currentUrl);
  }
  
  // Default: check URL doesn't contain login/signin
  return !currentUrl.includes('login') && !currentUrl.includes('signin');
}

/**
 * Whop-specific helpers
 */
const whop = {
  async isLoggedIn(page) {
    return checkLogin(page, 'https://whop.com/dashboard/', (page, url) => {
      return url.includes('dashboard') && !url.includes('login');
    });
  },
  
  async getDashboard(page, bizId = 'biz_7MiHfVRaR8S1LN') {
    await page.goto(`https://whop.com/dashboard/${bizId}/`, { waitUntil: 'networkidle2' });
    return page.url();
  }
};

module.exports = {
  saveCookies,
  loadCookies,
  connectWithCookies,
  checkLogin,
  whop,
  COOKIE_DIR,
  getCookiePath
};

// CLI usage
if (require.main === module) {
  const [,, action, domain] = process.argv;
  
  if (action === 'list') {
    ensureCookieDir();
    const files = fs.readdirSync(COOKIE_DIR).filter(f => f.endsWith('.json'));
    console.log('Saved cookie domains:', files.map(f => f.replace('.json', '')).join(', ') || 'none');
  } else {
    console.log('Usage: node cookie-utils.js list');
  }
}
