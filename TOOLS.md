# TOOLS.md - Agent Browser Instructions

## ⚠️ CRITICAL: Browser Automation Rules

**ONLY USE `agent-browser` CLI FOR ALL BROWSER TASKS!**

❌ **NEVER USE:**
- Clawdbot's built-in browser tool
- puppeteer.launch() or puppeteer.connect()
- playwright directly
- Any other browser automation method

✅ **ALWAYS USE:**
- `agent-browser` CLI commands (installed globally)

## Why?
- `agent-browser` has persistent profiles - logins and cookies survive!
- Other methods create fresh sessions every time
- `agent-browser` is AI-optimized with refs for reliable element selection

---

## agent-browser Quick Reference

### Basic Navigation
```bash
agent-browser open <url>           # Navigate to URL
agent-browser back                 # Go back
agent-browser forward              # Go forward  
agent-browser reload               # Reload page
```

### Get Page Info (AI-Friendly)
```bash
agent-browser snapshot -i          # Interactive elements with refs (@e1, @e2...)
agent-browser snapshot -i -c       # Compact version (less noise)
agent-browser screenshot page.png  # Take screenshot
agent-browser get url              # Current URL
agent-browser get title            # Page title
agent-browser get text @e1         # Get text of element
```

### Interact with Elements
Use refs from `snapshot -i` output:
```bash
agent-browser click @e2            # Click element
agent-browser fill @e3 "text"      # Clear and type into input
agent-browser type @e3 "text"      # Type without clearing
agent-browser press Enter          # Press key
agent-browser select @e4 "option"  # Select dropdown option
agent-browser check @e5            # Check checkbox
agent-browser uncheck @e5          # Uncheck checkbox
```

### Wait for Things
```bash
agent-browser wait @e1             # Wait for element to appear
agent-browser wait 2000            # Wait 2 seconds
```

### Cookies & Storage
```bash
agent-browser cookies get          # List all cookies
agent-browser cookies set --name "x" --value "y" --domain ".site.com"
agent-browser cookies clear        # Clear all cookies
```

### Sessions
Your profile is automatically persistent via `AGENT_BROWSER_PROFILE`.
Cookies and logins survive between commands!

---

## Example: Login to Whop

```bash
# 1. Open Whop
agent-browser open whop.com

# 2. Get snapshot to see the page
agent-browser snapshot -i

# 3. Click login button (use ref from snapshot)
agent-browser click @e5

# 4. Fill email
agent-browser fill @e7 "email@example.com"

# 5. Click continue
agent-browser click @e8

# 6. Wait for 2FA, enter code
agent-browser fill @e10 "123456"

# 7. Verify logged in
agent-browser open whop.com/dashboard
agent-browser get url
# Should show dashboard URL, not login redirect
```

---

## Example: Check if Already Logged In

```bash
agent-browser open whop.com/dashboard
agent-browser get url
# If URL contains "dashboard" and not "login", you're logged in!
```

---

## Troubleshooting

### "Browser not started"
Run any command - browser starts automatically and stays running.

### "Element not found"
1. Run `agent-browser snapshot -i` to see current elements
2. Make sure you're using the correct ref

### Need to see the browser?
```bash
agent-browser --headed open example.com
```

---

## Environment Variable
```
AGENT_BROWSER_PROFILE=/data/workspace/.browser-profile
```
This makes all cookies/logins persist automatically!
