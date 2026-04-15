import { request } from './client.js';

function fetchCurrentUser() {
  return request('/me', {
    method: 'GET',
  });
}

function updateProfile(body, { method = 'PUT', endpoint = '/profile' } = {}) {
  return request(endpoint, {
    method,
    body,
  });
}

export { fetchCurrentUser, updateProfile };
