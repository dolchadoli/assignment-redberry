import { authStore } from '../../state/authStore.js';

class Navbar {
  render() {
    const isAuthenticated = authStore.isAuthenticated();

    return `
      <nav class="navbar">
        <div class="navbar-container">
          <div class="navbar-logo">
            <a href="#/">Online Courses</a>
          </div>
          <div class="navbar-links">
            <a href="#/courses">Browse Courses</a>
            ${isAuthenticated ? `
              <button class="btn-enrolled">Enrolled Courses</button>
              <button class="btn-profile">Profile</button>
            ` : `
              <button class="btn-login">Log In</button>
              <button class="btn-signup">Sign Up</button>
            `}
          </div>
        </div>
      </nav>
    `;
  }
}

const navbar = new Navbar();
export default navbar;