class Navbar {
  render() {
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
            <button type="button" class="btn-profile" aria-label="Open account menu">
              <img src="/assets/images/Avatar.png" alt="Profile" />
            </button>
          </div>
        </div>
      </nav>
    `;
  }
}

const navbar = new Navbar();
export default navbar;