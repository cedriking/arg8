/**
 * Function to easily manage cookies
 */
export class Cookies {
  /**
   * Set a cookie
   * @param {string} name The name of the cookie
   * @param {string} value The value of the cookie
   * @param {number} days The number of days the cookie should be valid
   */
  static set(name, value, days) {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';SameSite=Lax'
  }

  /**
   * Get a cookie
   * @param {string} name The name of the cookie
   * @returns {string} The value of the cookie
   */
  static get(name) {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length)
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length)
      }
    }
    return null
  }

  /**
   * Delete a cookie
   * @param {string} name The name of the cookie
   */
  static delete(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  }

  /**
   * Check if a cookie exists
   * @param {string} name The name of the cookie
   * @returns {boolean} True if the cookie exists, false otherwise
   */
  static exists(name) {
    return this.get(name) !== null
  }

  /**
   * Get all cookies
   * @returns {object} The cookies
   */
  static getAll() {
    const cookies = {}
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length)
      }
      const cookie = c.split('=')
      cookies[cookie[0]] = cookie[1]
    }
    return cookies
  }

  /**
   * Delete all cookies
   * @param {string} domain The domain of the cookies
   */
  static deleteAll(domain) {
    const cookies = this.getAll()
    for (const cookie in cookies) {
      if (cookies.hasOwnProperty(cookie)) {
        this.delete(cookie, domain)
      }
    }
  }
}
