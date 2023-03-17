import Redis from '@ioc:Adonis/Addons/Redis'

/**
 * Get key from cache, and update the expiration time if exists
 * @param {string} key - The key to get
 * @param {number} expTime - The expiration time in milliseconds
 * @returns {Promise<string>} The cached value
 */
export const getFromCache = async (key: string, expTime?: number): Promise<string | undefined> => {
  try {
    if (await Redis.exists(key)) {
      const value = await Redis.get(key)
      if (expTime) {
        await Redis.expire(key, expTime)
      }
      return value as string
    }
  } catch {}
}

/**
 * Caches data to redis with a given key and expiration time
 * @param {string} key - The key to cache
 * @param {string} value - The value to cache
 * @param {number} expTime - The expiration time in milliseconds
 * @returns {Promise<void>}
 */
export const saveToCache = async (
  key: string,
  value: string,
  expTime: number
): Promise<void | 'OK' | null> => {
  // Save to cache for 5 days
  return Redis.set(key, value, 'ex', expTime)
}
