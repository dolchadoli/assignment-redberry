class AuthStore {
  constructor() {
    this.token = localStorage.getItem('authToken') || null;
    this.user = JSON.parse(localStorage.getItem('user')) || null;
    this.listeners = [];
  }

  isAuthenticated() {
    return !!this.token;
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.notify();
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }
}

const authStore = new AuthStore();
export { authStore };