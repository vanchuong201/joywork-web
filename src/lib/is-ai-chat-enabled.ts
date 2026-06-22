export function isAiChatEnabled(): boolean {
  const value = process.env.NEXT_PUBLIC_ENABLE_AI_CHAT?.trim().toLowerCase();

  if (value === "false" || value === "0") {
    return false;
  }

  return true;
}
