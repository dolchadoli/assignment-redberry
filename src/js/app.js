import Router from './router.js';
import appShell from './components/layout/appShell.js';
import { authStore } from './state/authStore.js';
import { uiStore } from './state/uiStore.js';
import { logout } from './services/authService.js';
import loginModal from './components/modals/loginModal.js';
import registerModal from './components/modals/registerModal.js';
import { renderDashboardPage, initDashboardPage } from './pages/dashboardPage.js';
import { renderCatalogPage } from './pages/catalogPage.js';
import { renderCourseDetailPage } from './pages/courseDetailPage.js';
import { renderNotFoundPage } from './pages/notFoundPage.js';

function setPageContent(markup) {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;
  pageContent.innerHTML = markup;
}

const dashboardPage = () => {
  setPageContent(renderDashboardPage());
  initDashboardPage();
};
const catalogPage = () => setPageContent(renderCatalogPage());
const courseDetailPage = params => setPageContent(renderCourseDetailPage(params));
const notFoundPage = () => setPageContent(renderNotFoundPage());

const routes = [
  { path: '/', handler: dashboardPage },
  { path: '/courses', handler: catalogPage },
  { path: '/courses/:id', handler: courseDetailPage },
  { path: '/not-found', handler: notFoundPage }
];

function renderModal() {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;
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
  if (!(target instanceof Element)) return;

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
      authStore.clearAuth();
    });
  }
}

function initApp() {
  const appElement = appShell.render();
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    throw new Error('Missing #app root element');
  }
  appRoot.appendChild(appElement);

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && uiStore.getState().modal) {
      uiStore.closeModal();
    }
  });

  new Router(routes);

  authStore.subscribe(() => {
    appShell.updateNavbar();
  });

  uiStore.subscribe(() => {
    renderModal();
  });

  renderModal();
}

export { initApp };
