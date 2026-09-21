import { chromium } from "playwright";

const DREAMINA_HOME = "https://dreamina.capcut.com/";
const LOGIN_TIMEOUT = 120_000;

function firstVisible(page: import("playwright").Page, selectors: string[]) {
  return selectors.reduce((locator, selector) => locator.or(page.locator(selector)), page.locator("__never__")).first();
}

/**
 * Log into Dreamina and return the SG-prefixed session token.
 * The caller is responsible for persisting the token securely.
 */
export async function autoLoginDreamina(email: string, password: string): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
    timezoneId: "Asia/Singapore"
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    (window as any).chrome = { runtime: {} };
  });

  const page = await context.newPage();

  try {
    await page.goto(DREAMINA_HOME, { waitUntil: "domcontentloaded", timeout: 60_000 });

    const loginButton = firstVisible(page, [
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      '[role="button"]:has-text("Log in")',
      '[role="button"]:has-text("Sign in")'
    ]);
    if (await loginButton.count()) await loginButton.click();

    const emailOption = firstVisible(page, [
      'button:has-text("Sign in with email")',
      'button:has-text("Continue with email")',
      'text=Sign in with email',
      'text=Continue with email'
    ]);
    if (await emailOption.count()) await emailOption.click();

    const emailInput = firstVisible(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[autocomplete="username"]',
      'input[placeholder*="email" i]'
    ]);
    const passwordInput = firstVisible(page, [
      'input[type="password"]',
      'input[name="password"]',
      'input[autocomplete="current-password"]'
    ]);

    await emailInput.waitFor({ state: "visible", timeout: 30_000 });
    await emailInput.fill(email);
    await passwordInput.fill(password);

    const submitButton = firstVisible(page, [
      'button[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'button:has-text("Continue")'
    ]);
    await submitButton.click();

    const deadline = Date.now() + LOGIN_TIMEOUT;
    let sessionCookie: { value: string } | undefined;
    while (Date.now() < deadline) {
      const cookies = await context.cookies();
      sessionCookie = cookies.find((cookie) => cookie.name === "sessionid" || cookie.name === "sessionid_ss");
      if (sessionCookie?.value) break;
      await page.waitForTimeout(500);
    }

    if (!sessionCookie?.value) throw new Error("登录成功但未找到 sessionid");

    return sessionCookie.value.startsWith("sg-") ? sessionCookie.value : `sg-${sessionCookie.value}`;
  } finally {
    await browser.close();
  }
}
