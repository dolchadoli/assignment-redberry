import Router from './router.js';
import appShell from './components/layout/appShell.js';
import { authStore } from './state/authStore.js';
import { uiStore } from './state/uiStore.js';
import { logout } from './services/authService.js';
import loginModal from './components/modals/loginModal.js';
import registerModal from './components/modals/registerModal.js';
import { renderEnrolledCoursesSidebarOverlay } from './components/sidebar/enrolledCoursesSidebar.js';
import { renderDashboardPage, initDashboardPage } from './pages/dashboardPage.js';
import { renderCatalogPage } from './pages/catalogPage.js';
import { renderCourseDetailPage } from './pages/courseDetailPage.js';
import { renderNotFoundPage } from './pages/notFoundPage.js';

const SIDEBAR_TRANSITION_MS = 280;
let sidebarCloseTimer = null;

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

function renderSidebar() {
  const sidebarRoot = document.getElementById('sidebar-root');
  if (!sidebarRoot) return;
  const existingOverlay = sidebarRoot.querySelector('.enrolled-sidebar-overlay');

  const activeSidebar = uiStore.getState().sidebar;
  if (activeSidebar === 'enrolled-courses') {
    if (sidebarCloseTimer) {
      window.clearTimeout(sidebarCloseTimer);
      sidebarCloseTimer = null;
    }

    if (existingOverlay) {
      existingOverlay.classList.add('is-open');
      return;
    }

    const overlay = renderEnrolledCoursesSidebarOverlay();
    sidebarRoot.appendChild(overlay);
    window.requestAnimationFrame(() => {
      overlay.classList.add('is-open');
    });
    return;
  }

  if (!existingOverlay) {
    return;
  }

  existingOverlay.classList.remove('is-open');
  if (sidebarCloseTimer) {
    window.clearTimeout(sidebarCloseTimer);
  }
  sidebarCloseTimer = window.setTimeout(() => {
    if (existingOverlay.parentElement === sidebarRoot && !existingOverlay.classList.contains('is-open')) {
      existingOverlay.remove();
    }
    sidebarCloseTimer = null;
  }, SIDEBAR_TRANSITION_MS);
}

function handleDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const profileToggle = target.closest('[data-profile-toggle]');
  if (profileToggle) {
    const clickedMenu = profileToggle.closest('[data-profile-menu]');
    document.querySelectorAll('[data-profile-menu].is-open').forEach((menu) => {
      if (menu !== clickedMenu) {
        menu.classList.remove('is-open');
      }
    });

    if (clickedMenu) {
      clickedMenu.classList.toggle('is-open');
    }
    return;
  }

  if (!target.closest('[data-profile-menu]')) {
    document.querySelectorAll('[data-profile-menu].is-open').forEach((menu) => {
      menu.classList.remove('is-open');
    });
  }

  if (target.closest('.btn-login')) {
    uiStore.openModal('login');
    return;
  }

  if (target.closest('.btn-enrolled')) {
    uiStore.openSidebar('enrolled-courses');
    return;
  }

  if (target.closest('[data-close-sidebar]')) {
    uiStore.closeSidebar();
    return;
  }

  if (target.classList.contains('enrolled-sidebar-overlay')) {
    uiStore.closeSidebar();
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

    if (event.key === 'Escape' && uiStore.getState().sidebar) {
      uiStore.closeSidebar();
    }
  });

  new Router(routes);

  authStore.subscribe(() => {
    appShell.updateNavbar();
    if (!authStore.isAuthenticated()) {
      uiStore.closeSidebar();
    }
    const currentHash = window.location.hash || '#/';
    if (currentHash === '#/' || currentHash === '' || currentHash === '#') {
      dashboardPage();
    }
  });

  uiStore.subscribe(() => {
    renderModal();
    renderSidebar();
  });

  renderModal();
  renderSidebar();
}

export { initApp };
