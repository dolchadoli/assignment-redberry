import { API_BASE_URL, AUTH_TOKEN_KEY } from '../config.js';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const config = {
    method: options.method || 'GET',
    headers: options.headers ? { ...options.headers } : {},
    body: options.body || null,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.body && !(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
}

export { request };