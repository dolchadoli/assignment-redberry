import { authStore } from '../../state/authStore.js';

class Navbar {
  render() {
    if (!authStore.isAuthenticated()) {
      return `
        <nav class="navbar">
          <div class="navbar-container">
            <a href="#/" class="navbar-logo" aria-label="Go to dashboard">
              <img src="/assets/images/Logo.png" alt="Online Courses Logo" />
            </a>
            <div class="navbar-links">
              <a href="#/courses" class="nav-link">
                <img src="/assets/icons/stars.png" alt="Browse Courses" />
                <span>Browse Courses</span>
              </a>
              <button type="button" class="nav-link btn-login">Log In</button>
              <button type="button" class="nav-link btn-signup">Sign Up</button>
            </div>
          </div>
        </nav>
      `;
    }

    return `
      <nav class="navbar">
        <div class="navbar-container">
          <a href="#/" class="navbar-logo" aria-label="Go to dashboard">
            <img src="/assets/images/Logo.png" alt="Online Courses Logo" />
          </a>
          <div class="navbar-links">
            <a href="#/courses" class="nav-link">
              <img src="/assets/icons/stars.png" alt="Browse Courses" />
              <span>Browse Courses</span>
            </a>
            <button type="button" class="nav-link btn-enrolled">
              <img src="/assets/icons/book.png" alt="Enrolled Courses" />
              <span>Enrolled Courses</span>
            </button>
            <div class="profile-menu" data-profile-menu>
              <button type="button" class="btn-profile" data-profile-toggle aria-label="Open account menu" aria-haspopup="true">
                <img src="/assets/images/Avatar.png" alt="Profile" />
              </button>
              <div class="profile-dropdown" data-profile-dropdown>
                <button type="button" class="profile-dropdown-item btn-logout">Log Out</button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
  }
}

const navbar = new Navbar();
export default navbar;
