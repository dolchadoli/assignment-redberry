import * as authApi from '../api/authApi.js';
import * as userApi from '../api/userApi.js';

async function login(email, password) {
  return authApi.login({ email, password });
}

async function register(formData) {
  return authApi.register(formData);
}

async function logout() {
  return authApi.logout();
}

async function fetchCurrentUser() {
  return userApi.fetchCurrentUser();
}

export { login, register, logout, fetchCurrentUser };
