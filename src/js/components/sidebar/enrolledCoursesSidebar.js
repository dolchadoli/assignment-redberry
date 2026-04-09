function renderEnrolledCoursesSidebar() {
  return `
    <aside class="enrolled-sidebar" role="dialog" aria-modal="true" aria-label="Enrolled Courses">
      <header class="enrolled-sidebar-header">
        <h2 class="enrolled-sidebar-title">Enrolled Courses</h2>
        <p class="enrolled-sidebar-count">Total Enrollments 0</p>
        <button type="button" class="enrolled-sidebar-close" data-close-sidebar aria-label="Close sidebar">&times;</button>
      </header>

      <div class="enrolled-sidebar-body">
        <div class="enrolled-sidebar-empty">
          <img class="enrolled-sidebar-empty-icon" src="/assets/icons/no_courses.svg" alt="" aria-hidden="true" />
          <h3 class="enrolled-sidebar-empty-title">No Enrolled Courses Yet</h3>
          <p class="enrolled-sidebar-empty-subtitle">Your learning journey starts here!<br />Browse courses to get started.</p>
          <a href="#/courses" class="enrolled-sidebar-empty-cta" data-close-sidebar>Browse Courses</a>
        </div>
      </div>
    </aside>
  `;
}

function renderEnrolledCoursesSidebarOverlay() {
  const wrapper = document.createElement('div');
  wrapper.className = 'enrolled-sidebar-overlay';
  wrapper.innerHTML = renderEnrolledCoursesSidebar();
  return wrapper;
}

export { renderEnrolledCoursesSidebarOverlay };
