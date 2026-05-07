const CACHE_KEY = 'duvo_chat_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export function getCachedMessages() {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { messages, timestamp } = JSON.parse(cached);
  const now = Date.now();

  if (now - timestamp > CACHE_DURATION) {
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }

  return messages;
}

export function cacheMessages(messages) {
  const cache = {
    messages,
    timestamp: Date.now()
  };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function clearCache() {
  sessionStorage.removeItem(CACHE_KEY);
}
