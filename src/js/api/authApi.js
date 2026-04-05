import { request } from './client.js';

function login(credentials) {
  return request('/login', {
    method: 'POST',
    body: credentials,
  });
}

function register(formData) {
  return request('/register', {
    method: 'POST',
    body: formData,
  });
}

function logout() {
  return request('/logout', {
    method: 'POST',
  });
}

export { login, register, logout };
