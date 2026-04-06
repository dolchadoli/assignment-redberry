import { AUTH_TOKEN_KEY, USER_STORAGE_KEY } from '../config.js';

class AuthStore {
  constructor() {
    this.token = localStorage.getItem(AUTH_TOKEN_KEY) || null;
    this.user = this.readUserFromStorage();
    this.listeners = [];
  }

  readUserFromStorage() {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch (_error) {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }

  isAuthenticated() {
    return !!this.token;
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    this.notify();
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(item => item !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }
}

const authStore = new AuthStore();
export { authStore };
