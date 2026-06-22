/**
 * Temporary: hide AI chat on production while job data is still limited.
 * Re-enable later by removing this guard or setting NEXT_PUBLIC_ENABLE_AI_CHAT=true
 * once a dedicated env flag is added.
 */
export function isAiChatEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT !== "production";
}
