import { readJsonStorage } from '../../utils/storage.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const ENROLLMENT_PROGRESS_KEY = 'demoEnrollmentProgressMap';
const ENROLLMENT_SELECTIONS_KEY = 'enrollmentSelectionMap';

function getEnrollmentProgressMap() {
  const parsed = readJsonStorage(ENROLLMENT_PROGRESS_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function getEnrollmentSelectionMap() {
  const parsed = readJsonStorage(ENROLLMENT_SELECTIONS_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.enrollments)) return payload.enrollments;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function formatDays(days) {
  if (!Array.isArray(days) || days.length === 0) return '';
  const map = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
    friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  };
  const first = map[String(days[0]).toLowerCase()] || String(days[0]);
  const last = map[String(days[days.length - 1]).toLowerCase()] || String(days[days.length - 1]);
  return first === last ? first : `${first} - ${last}`;
}

function getEnrollmentCourse(enrollment) {
  return enrollment?.course || enrollment?.course_data || enrollment;
}

function getEnrollmentTitle(enrollment) {
  const course = getEnrollmentCourse(enrollment);
  return course?.title || course?.name || 'Course';
}

function getEnrollmentImage(enrollment) {
  const course = getEnrollmentCourse(enrollment);
  return course?.image || course?.cover_image || course?.thumbnail || '/assets/images/slider1.svg';
}

function getEnrollmentInstructor(enrollment) {
  const course = getEnrollmentCourse(enrollment);
  return course?.instructor?.name || course?.lecturer_name || course?.lecturer || 'Instructor';
}

function getEnrollmentRating(enrollment) {
  const course = getEnrollmentCourse(enrollment);
  const raw = Number(course?.avgRating ?? course?.rating ?? 0);
  return Number.isFinite(raw) && raw > 0 ? raw.toFixed(1) : '4.9';
}

function getEnrollmentSchedule(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.scheduleLabel) return stored.scheduleLabel;
  const weekly = enrollment?.weeklySchedule || enrollment?.weekly_schedule;
  if (weekly?.days) return formatDays(weekly.days);
  return weekly?.label || '';
}

function getEnrollmentSessionType(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.sessionLabel) return stored.sessionLabel;
  const type = enrollment?.sessionType || enrollment?.session_type;
  return type?.name || '';
}

function getEnrollmentCourseId(enrollment) {
  return Number(
    enrollment?.course?.id
    ?? enrollment?.course_id
    ?? enrollment?.courseId
    ?? enrollment?.id
  );
}

function getStoredEnrollmentSelection(enrollment) {
  const map = getEnrollmentSelectionMap();
  const enrollmentId = enrollment?.id;
  const courseId = getEnrollmentCourseId(enrollment);
  return (
    map[`enrollment:${enrollmentId}`]
    || map[`course:${courseId}`]
    || null
  );
}

function getEnrollmentTime(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.timeLabel) return stored.timeLabel;
  const slot = enrollment?.timeSlot || enrollment?.time_slot;
  if (slot?.label) return slot.label;
  if (slot?.startTime && slot?.endTime) return `${slot.startTime} - ${slot.endTime}`;
  return '';
}

function getEnrollmentLocation(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.locationLabel) return stored.locationLabel;
  const type = enrollment?.sessionType || enrollment?.session_type;
  return type?.location || '';
}

function getEnrollmentProgress(enrollment) {
  const map = getEnrollmentProgressMap();
  const key = String(enrollment?.id ?? enrollment?.course?.id ?? '');
  const override = Number(map[key]);
  if (Number.isFinite(override)) {
    return Math.max(0, Math.min(100, override));
  }

  const raw = Number(enrollment?.progress ?? enrollment?.progress_percentage ?? 0);
  const normalized = Number.isFinite(raw) ? raw : 0;
  return Math.max(0, Math.min(100, normalized));
}

function renderEnrollmentCard(enrollment) {
  const courseId = getEnrollmentCourseId(enrollment);
  const title = escapeHtml(getEnrollmentTitle(enrollment));
  const image = escapeHtml(getEnrollmentImage(enrollment));
  const instructor = escapeHtml(getEnrollmentInstructor(enrollment));
  const rating = escapeHtml(getEnrollmentRating(enrollment));
  const schedule = escapeHtml(getEnrollmentSchedule(enrollment));
  const time = escapeHtml(getEnrollmentTime(enrollment));
  const sessionType = escapeHtml(getEnrollmentSessionType(enrollment));
  const location = escapeHtml(getEnrollmentLocation(enrollment));
  const progress = getEnrollmentProgress(enrollment);
  const detailsHref = Number.isFinite(courseId) && courseId > 0 ? `#/courses/${courseId}` : '#/courses';

  return `
    <article class="enrolled-sidebar-card">
      <img class="enrolled-sidebar-card-image" src="${image}" alt="${title}" />
      <div class="enrolled-sidebar-card-main">
        <div class="enrolled-sidebar-card-top">
          <p class="enrolled-sidebar-card-instructor">Instructor ${instructor}</p>
          <p class="enrolled-sidebar-card-rating"><span>&#9733;</span> ${rating}</p>
        </div>
        <h3 class="enrolled-sidebar-card-title">${title}</h3>
        <div class="enrolled-sidebar-card-meta-list">
          <p class="enrolled-sidebar-card-meta"><span aria-hidden="true">&#128197;</span><span>${schedule || 'Schedule selected'}</span></p>
          <p class="enrolled-sidebar-card-meta"><span aria-hidden="true">&#9716;</span><span>${time || 'Time selected'}</span></p>
          <p class="enrolled-sidebar-card-meta"><span aria-hidden="true">&#9874;</span><span>${sessionType || 'Session selected'}</span></p>
          <p class="enrolled-sidebar-card-meta"><span aria-hidden="true">&#128205;</span><span>${location || 'Location not specified'}</span></p>
        </div>
        <div class="enrolled-sidebar-card-bottom">
          <div class="enrolled-sidebar-card-progress-wrap">
            <p class="enrolled-sidebar-card-progress">${progress}% Complete</p>
            <div class="enrolled-sidebar-card-progressbar">
              <span style="width: ${progress}%"></span>
            </div>
          </div>
          <a class="enrolled-sidebar-card-view" href="${detailsHref}" data-close-sidebar>View</a>
        </div>
      </div>
    </article>
  `;
}

function renderSidebarInnerSkeleton() {
  return `
    <header class="enrolled-sidebar-header">
      <h2 class="enrolled-sidebar-title">Enrolled Courses</h2>
      <p class="enrolled-sidebar-count" data-enrolled-count>Total Enrollments 0</p>
      <button type="button" class="enrolled-sidebar-close" data-close-sidebar aria-label="Close sidebar">&times;</button>
    </header>

    <div class="enrolled-sidebar-body" data-enrolled-body>
      <p class="enrolled-sidebar-loading">Loading...</p>
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div class="enrolled-sidebar-empty">
      <img class="enrolled-sidebar-empty-icon" src="/assets/icons/no_courses.svg" alt="" aria-hidden="true" />
      <h3 class="enrolled-sidebar-empty-title">No Enrolled Courses Yet</h3>
      <p class="enrolled-sidebar-empty-subtitle">Your learning journey starts here!<br />Browse courses to get started.</p>
      <a href="#/courses" class="enrolled-sidebar-empty-cta" data-close-sidebar>Browse Courses</a>
    </div>
  `;
}

function renderEnrolledCoursesSidebarOverlay() {
  const wrapper = document.createElement('div');
  wrapper.className = 'enrolled-sidebar-overlay';
  wrapper.innerHTML = `
    <aside class="enrolled-sidebar" role="dialog" aria-modal="true" aria-label="Enrolled Courses">
      ${renderSidebarInnerSkeleton()}
    </aside>
  `;
  return wrapper;
}

function populateEnrolledSidebar(overlay, payload, { error = false } = {}) {
  if (!(overlay instanceof HTMLElement)) return;
  const body = overlay.querySelector('[data-enrolled-body]');
  const count = overlay.querySelector('[data-enrolled-count]');
  if (!(body instanceof HTMLElement) || !(count instanceof HTMLElement)) return;

  if (error) {
    count.textContent = 'Total Enrollments 0';
    body.innerHTML = '<p class="enrolled-sidebar-loading">Unable to load enrollments.</p>';
    return;
  }

  const enrollments = extractList(payload);
  count.textContent = `Total Enrollments ${enrollments.length}`;

  if (enrollments.length === 0) {
    body.innerHTML = renderEmptyState();
    return;
  }

  body.innerHTML = `<div class="enrolled-sidebar-list">${enrollments.map(renderEnrollmentCard).join('')}</div>`;
}

export { renderEnrolledCoursesSidebarOverlay, populateEnrolledSidebar };
