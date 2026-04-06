import Router from './router.js';
import appShell from './components/layout/appShell.js';
import { authStore } from './state/authStore.js';
import { uiStore } from './state/uiStore.js';
import { logout } from './services/authService.js';
import loginModal from './components/modals/loginModal.js';
import registerModal from './components/modals/registerModal.js';

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

function renderModal() {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = '';

  const activeModal = uiStore.getState().modal;
  if (!activeModal) return;

  if (activeModal === 'login') {
    modalRoot.appendChild(loginModal.createModal());
  }

  if (activeModal === 'register') {
    modalRoot.appendChild(registerModal.createModal());
  }
}

function handleDocumentClick(event) {
  const target = event.target;

  if (target.closest('.btn-login')) {
    uiStore.openModal('login');
    return;
  }

  if (target.closest('.btn-signup')) {
    uiStore.openModal('register');
    return;
  }

  if (target.closest('.btn-logout')) {
    logout().then(() => {
      authStore.clearAuth();
    }).catch(() => {
      authStore.clearAuth(); // Clear anyway
    });
    return;
  }
}

function initApp() {
  const appElement = appShell.render();
  document.getElementById('app').appendChild(appElement);

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && uiStore.getState().modal) {
      uiStore.closeModal();
    }
  });

  router = new Router(routes);

  authStore.subscribe(() => {
    appShell.updateNavbar();
  });

  uiStore.subscribe(() => {
    renderModal();
  });

  renderModal();
}

export { initApp, router };