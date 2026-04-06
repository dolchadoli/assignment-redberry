import { request } from './client.js';

function fetchCurrentUser() {
  return request('/me', {
    method: 'GET',
  });
}

export { fetchCurrentUser };