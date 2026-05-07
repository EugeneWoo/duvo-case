const CACHE_KEY = 'duvo_chat_cache';

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
