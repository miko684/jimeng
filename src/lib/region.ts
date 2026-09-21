/**
 * 新加坡国际区固定配置。
 */
export const SUPPORTED_REGION = "SG";
export const SUPPORTED_REGION_PREFIX = "sg-";
export const SG_ASSISTANT_ID = 513641;
export const SG_API_BASE_URL = "https://mweb-api-sg.capcut.com";
export const SG_COMMERCE_BASE_URL = "https://commerce-api-sg.capcut.com";
export const SG_ORIGIN = "https://dreamina.capcut.com";
export const SG_LOCALE = "en-SG,en;q=0.9";
export const SG_TIME_ZONE = "Asia/Singapore";
export const REGION_RESTRICTION_MESSAGE = "当前服务仅支持新加坡国际区账号，凭证必须使用 sg- 前缀";

/**
 * 将账号池中输入的原始凭证归一化为新加坡国际区令牌。
 *
 * Cookie 中的 sessionid 通常没有区域前缀，因此仅对无前缀值自动补充 sg-。
 * 已带其他区域前缀的凭证会被拒绝，避免误把其他国家账号路由到新加坡端点。
 *
 * @param value 原始 sessionid 或区域令牌
 * @returns 带 sg- 前缀的令牌
 */
export function normalizeSingaporeToken(value: string): string {
  const token = value.trim();
  if (!token) throw new Error(REGION_RESTRICTION_MESSAGE);
  if (/^[a-z]{2}-/i.test(token) && !token.toLowerCase().startsWith(SUPPORTED_REGION_PREFIX)) {
    throw new Error(REGION_RESTRICTION_MESSAGE);
  }
  const raw = token.toLowerCase().startsWith(SUPPORTED_REGION_PREFIX)
    ? token.slice(SUPPORTED_REGION_PREFIX.length).trim()
    : token;
  if (!raw) throw new Error(REGION_RESTRICTION_MESSAGE);
  return `${SUPPORTED_REGION_PREFIX}${raw}`;
}

/**
 * 校验外部 API 令牌必须明确属于新加坡国际区。
 *
 * @param value 外部传入的 Bearer 令牌
 * @returns 规范化后的新加坡国际区令牌
 */
export function assertSingaporeToken(value: string): string {
  const token = value.trim();
  if (!token.toLowerCase().startsWith(SUPPORTED_REGION_PREFIX)) {
    throw new Error(REGION_RESTRICTION_MESSAGE);
  }
  return normalizeSingaporeToken(token);
}

/**
 * 移除新加坡区域前缀，生成上游 Cookie 使用的原始 sessionid。
 *
 * @param value 新加坡国际区令牌
 * @returns 不含区域前缀的 sessionid
 */
export function stripSingaporePrefix(value: string): string {
  const token = assertSingaporeToken(value);
  return token.slice(SUPPORTED_REGION_PREFIX.length);
}
