import navbar from './navbar.js';
import footer from './footer.js';

class AppShell {
  constructor() {
    this.element = null;
  }

  render() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'app-shell';
      this.element.innerHTML = `
        ${navbar.render()}
        <main id="page-content" class="page-container"></main>
        ${footer.render()}
        <div id="modal-root"></div>
      `;
    }
    return this.element;
  }

  updateNavbar() {
    const navbarElement = this.element.querySelector('.navbar');
    if (navbarElement) {
      navbarElement.outerHTML = navbar.render();
    }
  }
}

const appShell = new AppShell();
export default appShell;