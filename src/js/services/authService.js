import * as authApi from '../api/authApi.js';
import * as userApi from '../api/userApi.js';

async function login(email, password) {
  const response = await authApi.login({ email, password });
  return response;
}

async function register(formData) {
  const response = await authApi.register(formData);
  return response;
}

async function logout() {
  const response = await authApi.logout();
  return response;
}

async function fetchCurrentUser() {
  const user = await userApi.fetchCurrentUser();
  return user;
}

export { login, register, logout, fetchCurrentUser };