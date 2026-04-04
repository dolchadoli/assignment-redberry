import Router from './router.js';
import appShell from './components/layout/appShell.js';
import { authStore } from './state/authStore.js';

// Placeholder page handlers - will be replaced with actual page components
const dashboardPage = (params) => {
  const pageContent = document.getElementById('page-content');
  pageContent.innerHTML = '<h1>Dashboard</h1><p>Welcome to the Online Courses Platform!</p>';
};

const catalogPage = (params) => {
  const pageContent = document.getElementById('page-content');
  pageContent.innerHTML = '<h1>Courses Catalog</h1><p>Browse available courses here.</p>';
};

const courseDetailPage = (params) => {
  const pageContent = document.getElementById('page-content');
  pageContent.innerHTML = `<h1>Course Detail</h1><p>Course ID: ${params.id}</p>`;
};

const notFoundPage = (params) => {
  const pageContent = document.getElementById('page-content');
  pageContent.innerHTML = '<h1>404 - Page Not Found</h1>';
};

const routes = [
  { path: '/', handler: dashboardPage },
  { path: '/courses', handler: catalogPage },
  { path: '/courses/:id', handler: courseDetailPage },
  { path: '/not-found', handler: notFoundPage }
];

let router;

function initApp() {
  // Render the app shell
  const appElement = appShell.render();
  document.getElementById('app').appendChild(appElement);

  // Initialize router
  router = new Router(routes);

  // Subscribe to auth state changes to update navbar
  authStore.subscribe(() => {
    appShell.updateNavbar();
  });
}

export { initApp, router };