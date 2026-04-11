import {
  fetchCourseById,
  fetchCourseWeeklySchedules,
  fetchCourseTimeSlots,
  fetchCourseSessionTypes,
} from '../api/coursesApi.js';
import { authStore } from '../state/authStore.js';
import { uiStore } from '../state/uiStore.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function extractRecord(payload) {
  if (!payload) return null;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;
  if (payload.course) return payload.course;
  return payload;
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function formatTime(value) {
  if (!value || typeof value !== 'string') return '';
  const [hoursRaw = '0', minutes = '00'] = value.split(':');
  const hours = Number(hoursRaw);
  if (!Number.isFinite(hours)) return value;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHours}:${minutes} ${suffix}`;
}

function splitDescription(text) {
  const normalized = String(text || '').trim();
  if (!normalized) return ['', ''];
  const sentences = normalized.split('. ').filter(Boolean);
  if (sentences.length < 3) return [normalized, ''];
  const midpoint = Math.ceil(sentences.length / 2);
  const first = `${sentences.slice(0, midpoint).join('. ')}.`;
  const second = `${sentences.slice(midpoint).join('. ')}.`;
  return [first, second];
}

function getImage(course) {
  return course?.image || course?.cover_image || course?.thumbnail || '/images/placeholder-course.png';
}

function getTitle(course) {
  return course?.title || course?.name || 'Untitled course';
}

function getDescription(course) {
  return course?.description || course?.short_description || 'Course description is unavailable.';
}

function getInstructorName(course) {
  return course?.instructor?.name || course?.lecturer_name || course?.lecturer || 'Unknown Instructor';
}

function getInstructorAvatar(course) {
  return course?.instructor?.avatar || '/images/placeholder-avatar.png';
}

function getCategoryName(course) {
  return course?.category?.name || course?.category_name || 'Development';
}

function getTopicName(course) {
  return course?.topic?.name || course?.topic_name || getCategoryName(course);
}

function getWeeks(course) {
  return Number(course?.durationWeeks || course?.duration || course?.weeks || 0) || 0;
}

function getHours(course) {
  return Number(course?.hours || 0) || 0;
}

function getBasePrice(course) {
  return Number(course?.basePrice || course?.price || 0) || 0;
}

function getRating(course) {
  if (Array.isArray(course?.reviews) && course.reviews.length > 0) {
    const total = course.reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0);
    return (total / course.reviews.length).toFixed(1);
  }
  return Number(course?.rating || 4.9).toFixed(1);
}

function formatDays(days) {
  if (!Array.isArray(days) || days.length === 0) return 'Schedule';
  const map = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  };
  if (days.length === 1) return map[days[0]] || days[0];
  return `${map[days[0]] || days[0]} - ${map[days[days.length - 1]] || days[days.length - 1]}`;
}

function setAccordionItemState(item, isOpen) {
  const content = item.querySelector('.course-detail-acc-content');
  const chevron = item.querySelector('[data-acc-chevron]');
  item.classList.toggle('is-open', isOpen);
  if (chevron) {
    chevron.textContent = isOpen ? '^' : 'v';
  }
  if (content instanceof HTMLElement) {
    content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : '0px';
  }
}

function syncAccordionHeights(root) {
  root.querySelectorAll('[data-acc-item]').forEach((item) => {
    const isOpen = item.classList.contains('is-open');
    setAccordionItemState(item, isOpen);
  });
}

function renderCourseDetailPage(params = {}) {
  return `
    <section class="course-detail-page" data-course-detail data-course-id="${escapeHtml(params.id ?? '')}">
      <div class="course-detail-breadcrumb">Home <span>&gt;</span> Browse <span>&gt;</span> <strong data-course-breadcrumb>Loading...</strong></div>
      <div class="course-detail-layout">
        <div class="course-detail-main">
          <h1 class="course-detail-title" data-course-title>Loading course...</h1>
          <img class="course-detail-image" data-course-image src="/images/placeholder-course.png" alt="Course cover" />

          <div class="course-detail-meta-row">
            <span data-course-weeks>0 Weeks</span>
            <span data-course-hours>0 Hours</span>
            <span class="course-detail-rating"><span class="course-detail-rating-star">*</span> <span data-course-rating>0.0</span></span>
            <span class="course-detail-pill" data-course-topic>Topic</span>
          </div>

          <div class="course-detail-instructor">
            <img class="course-detail-instructor-avatar" data-course-instructor-avatar src="/images/placeholder-avatar.png" alt="Instructor" />
            <span data-course-instructor>Instructor</span>
          </div>

          <h3 class="course-detail-section-title">Course Description</h3>
          <p class="course-detail-description" data-course-description></p>
          <p class="course-detail-description" data-course-description-2></p>
        </div>

        <aside class="course-detail-side" data-accordion-root>
          <div class="course-detail-accordion">
            <div class="course-detail-acc-item is-open" data-acc-item="weekly">
              <button type="button" class="course-detail-acc-trigger" data-acc-trigger="weekly">1) Weekly Schedule <span data-acc-chevron>^</span></button>
              <div class="course-detail-acc-content">
                <div class="course-detail-option-grid" data-weekly-options></div>
              </div>
            </div>

            <div class="course-detail-acc-item" data-acc-item="time">
              <button type="button" class="course-detail-acc-trigger" data-acc-trigger="time">2) Time Slot <span data-acc-chevron>v</span></button>
              <div class="course-detail-acc-content">
                <div class="course-detail-option-grid" data-time-options></div>
              </div>
            </div>

            <div class="course-detail-acc-item" data-acc-item="session">
              <button type="button" class="course-detail-acc-trigger" data-acc-trigger="session">3) Session Type <span data-acc-chevron>v</span></button>
              <div class="course-detail-acc-content">
                <div class="course-detail-option-grid" data-session-options></div>
              </div>
            </div>
          </div>

          <div class="course-detail-price-card">
            <div class="course-detail-price-top">
              <span>Total Price</span>
              <strong data-total-price>$0</strong>
            </div>
            <p class="course-detail-price-line"><span>Base Price</span><span data-base-price>$0</span></p>
            <p class="course-detail-price-line"><span>Session Type</span><span data-session-modifier>+ $0</span></p>
            <p class="course-detail-price-line"><span>Available Seats</span><span data-seat-count>0</span></p>
            <button type="button" class="course-detail-enroll-btn" data-enroll-btn>Enroll Now</button>
          </div>

          <div class="course-detail-profile-note">
            <div>
              <p class="course-detail-profile-note-title">Complete Your Profile</p>
              <p class="course-detail-profile-note-text">You need to fill in your profile details before enrolling in this course.</p>
            </div>
            <button type="button" class="course-detail-profile-note-btn" data-profile-btn>Complete -&gt;</button>
          </div>
        </aside>
      </div>
    </section>
  `;
}

async function initCourseDetailPage(params = {}) {
  const root = document.querySelector('[data-course-detail]');
  if (!(root instanceof HTMLElement)) return;
  const courseId = params.id;
  if (!courseId) return;

  const titleNode = root.querySelector('[data-course-title]');
  const breadcrumbNode = root.querySelector('[data-course-breadcrumb]');
  const imageNode = root.querySelector('[data-course-image]');
  const weeksNode = root.querySelector('[data-course-weeks]');
  const hoursNode = root.querySelector('[data-course-hours]');
  const ratingNode = root.querySelector('[data-course-rating]');
  const topicNode = root.querySelector('[data-course-topic]');
  const instructorNode = root.querySelector('[data-course-instructor]');
  const instructorAvatarNode = root.querySelector('[data-course-instructor-avatar]');
  const descriptionNode = root.querySelector('[data-course-description]');
  const descriptionNode2 = root.querySelector('[data-course-description-2]');
  const weeklyOptionsRoot = root.querySelector('[data-weekly-options]');
  const timeOptionsRoot = root.querySelector('[data-time-options]');
  const sessionOptionsRoot = root.querySelector('[data-session-options]');
  const totalPriceNode = root.querySelector('[data-total-price]');
  const basePriceNode = root.querySelector('[data-base-price]');
  const modifierNode = root.querySelector('[data-session-modifier]');
  const seatCountNode = root.querySelector('[data-seat-count]');
  const enrollBtn = root.querySelector('[data-enroll-btn]');
  const accordionRoot = root.querySelector('[data-accordion-root]');

  let basePrice = 0;
  let selectedWeeklyId = null;
  let selectedTimeSlotId = null;
  let selectedSessionType = null;

  function updatePriceCard() {
    const modifier = Number(selectedSessionType?.priceModifier || 0) || 0;
    const total = basePrice + modifier;

    if (totalPriceNode) totalPriceNode.textContent = `$${total.toFixed(0)}`;
    if (basePriceNode) basePriceNode.textContent = `$${basePrice.toFixed(0)}`;
    if (modifierNode) modifierNode.textContent = `+ $${modifier.toFixed(0)}`;
    if (seatCountNode) seatCountNode.textContent = String(selectedSessionType?.availableSeats ?? 0);

    if (enrollBtn instanceof HTMLButtonElement) {
      const isLoggedIn = authStore.isAuthenticated();
      const availableSeats = Number(selectedSessionType?.availableSeats ?? 0);
      enrollBtn.textContent = isLoggedIn ? 'Enroll Now' : 'Log In To Enroll';
      enrollBtn.classList.toggle('is-ready', isLoggedIn && availableSeats > 0);
      enrollBtn.classList.toggle('btn-login', !isLoggedIn);
      enrollBtn.disabled = availableSeats <= 0;
    }
  }

  async function loadSessionTypes() {
    if (!sessionOptionsRoot || !selectedWeeklyId || !selectedTimeSlotId) return;
    sessionOptionsRoot.innerHTML = '<span class="course-detail-pill">Loading...</span>';

    try {
      const payload = await fetchCourseSessionTypes(courseId, selectedWeeklyId, selectedTimeSlotId);
      const sessionTypes = extractList(payload);

      if (sessionTypes.length === 0) {
        selectedSessionType = null;
        sessionOptionsRoot.innerHTML = '<span class="course-detail-pill">No session types</span>';
        updatePriceCard();
        return;
      }

      if (!selectedSessionType || !sessionTypes.some((it) => it.id === selectedSessionType.id)) {
        selectedSessionType = sessionTypes[0];
      }

      sessionOptionsRoot.innerHTML = sessionTypes.map((type) => {
        const isActive = selectedSessionType?.id === type.id;
        const modifier = Number(type.priceModifier || 0);
        const seats = Number(type.availableSeats || 0);
        return `
          <button type="button" class="course-detail-week-btn course-detail-week-btn--session ${isActive ? 'is-active' : ''}" data-session-id="${type.id}">
            <span class="course-detail-option-main">${escapeHtml(type.name)}</span>
            <span class="course-detail-option-sub">+$${modifier.toFixed(0)} | ${seats} seats</span>
          </button>
        `;
      }).join('');

      updatePriceCard();
    } catch (_error) {
      sessionOptionsRoot.innerHTML = '<span class="course-detail-pill">Failed to load</span>';
      selectedSessionType = null;
      updatePriceCard();
    }
  }

  async function loadTimeSlots() {
    if (!timeOptionsRoot || !selectedWeeklyId) return;
    timeOptionsRoot.innerHTML = '<span class="course-detail-pill">Loading...</span>';

    try {
      const payload = await fetchCourseTimeSlots(courseId, selectedWeeklyId);
      const timeSlots = extractList(payload);

      if (timeSlots.length === 0) {
        selectedTimeSlotId = null;
        selectedSessionType = null;
        timeOptionsRoot.innerHTML = '<span class="course-detail-pill">No time slots</span>';
        if (sessionOptionsRoot) sessionOptionsRoot.innerHTML = '<span class="course-detail-pill">Select time slot first</span>';
        updatePriceCard();
        return;
      }

      if (!selectedTimeSlotId || !timeSlots.some((it) => it.id === selectedTimeSlotId)) {
        selectedTimeSlotId = timeSlots[0].id;
      }

      timeOptionsRoot.innerHTML = timeSlots.map((slot) => {
        const isActive = selectedTimeSlotId === slot.id;
        const labelMain = String(slot.label || 'Time').split('(')[0].trim();
        const labelSub = `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;

        return `
          <button type="button" class="course-detail-week-btn course-detail-week-btn--time ${isActive ? 'is-active' : ''}" data-time-slot-id="${slot.id}">
            <span class="course-detail-option-main">${escapeHtml(labelMain)}</span>
            <span class="course-detail-option-sub">${escapeHtml(labelSub)}</span>
          </button>
        `;
      }).join('');

      await loadSessionTypes();
    } catch (_error) {
      timeOptionsRoot.innerHTML = '<span class="course-detail-pill">Failed to load</span>';
      if (sessionOptionsRoot) sessionOptionsRoot.innerHTML = '<span class="course-detail-pill">Failed to load</span>';
      selectedSessionType = null;
      updatePriceCard();
    }
  }

  try {
    const payload = await fetchCourseById(courseId);
    const course = extractRecord(payload);

    basePrice = getBasePrice(course);

    if (titleNode) titleNode.textContent = getTitle(course);
    if (breadcrumbNode) breadcrumbNode.textContent = getCategoryName(course);
    if (imageNode instanceof HTMLImageElement) {
      imageNode.src = getImage(course);
      imageNode.alt = getTitle(course);
    }
    if (weeksNode) weeksNode.textContent = `${getWeeks(course)} Weeks`;
    if (hoursNode) hoursNode.textContent = `${getHours(course)} Hours`;
    if (ratingNode) ratingNode.textContent = getRating(course);
    if (topicNode) topicNode.textContent = `</> ${getTopicName(course)}`;
    if (instructorNode) instructorNode.textContent = getInstructorName(course);
    if (instructorAvatarNode instanceof HTMLImageElement) instructorAvatarNode.src = getInstructorAvatar(course);

    const [desc1, desc2] = splitDescription(getDescription(course));
    if (descriptionNode) descriptionNode.textContent = desc1;
    if (descriptionNode2) descriptionNode2.textContent = desc2;

    updatePriceCard();
  } catch (_error) {
    if (titleNode) titleNode.textContent = 'Unable to load this course';
    if (descriptionNode) descriptionNode.textContent = 'Please try again later.';
    if (descriptionNode2) descriptionNode2.textContent = '';
  }

  if (weeklyOptionsRoot) {
    weeklyOptionsRoot.innerHTML = '<span class="course-detail-pill">Loading...</span>';
    try {
      const payload = await fetchCourseWeeklySchedules(courseId);
      const schedules = extractList(payload);

      if (schedules.length === 0) {
        weeklyOptionsRoot.innerHTML = '<span class="course-detail-pill">No schedules</span>';
      } else {
        selectedWeeklyId = schedules[0].id;
        weeklyOptionsRoot.innerHTML = schedules.map((schedule) => `
          <button type="button" class="course-detail-week-btn ${selectedWeeklyId === schedule.id ? 'is-active' : ''}" data-weekly-id="${schedule.id}">
            <span class="course-detail-option-main">${escapeHtml(formatDays(schedule.days) || schedule.label)}</span>
          </button>
        `).join('');
      }
    } catch (_error) {
      weeklyOptionsRoot.innerHTML = '<span class="course-detail-pill">Failed to load</span>';
    }
  }

  await loadTimeSlots();

  if (accordionRoot instanceof HTMLElement) {
    syncAccordionHeights(accordionRoot);
  }

  root.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest('[data-acc-trigger]');
    if (trigger && accordionRoot instanceof HTMLElement) {
      const item = trigger.closest('[data-acc-item]');
      if (!(item instanceof HTMLElement)) return;
      const isOpen = item.classList.contains('is-open');
      setAccordionItemState(item, !isOpen);
      return;
    }

    const weeklyButton = target.closest('[data-weekly-id]');
    if (weeklyButton instanceof HTMLButtonElement) {
      const nextId = Number(weeklyButton.dataset.weeklyId);
      if (!Number.isFinite(nextId) || nextId === selectedWeeklyId) return;
      selectedWeeklyId = nextId;
      selectedTimeSlotId = null;
      selectedSessionType = null;
      weeklyOptionsRoot?.querySelectorAll('[data-weekly-id]').forEach((btn) => {
        btn.classList.toggle('is-active', Number(btn.getAttribute('data-weekly-id')) === selectedWeeklyId);
      });
      await loadTimeSlots();
      if (accordionRoot instanceof HTMLElement) syncAccordionHeights(accordionRoot);
      return;
    }

    const slotButton = target.closest('[data-time-slot-id]');
    if (slotButton instanceof HTMLButtonElement) {
      const nextId = Number(slotButton.dataset.timeSlotId);
      if (!Number.isFinite(nextId) || nextId === selectedTimeSlotId) return;
      selectedTimeSlotId = nextId;
      selectedSessionType = null;
      timeOptionsRoot?.querySelectorAll('[data-time-slot-id]').forEach((btn) => {
        btn.classList.toggle('is-active', Number(btn.getAttribute('data-time-slot-id')) === selectedTimeSlotId);
      });
      await loadSessionTypes();
      if (accordionRoot instanceof HTMLElement) syncAccordionHeights(accordionRoot);
      return;
    }

    const sessionButton = target.closest('[data-session-id]');
    if (sessionButton instanceof HTMLButtonElement) {
      const nextId = Number(sessionButton.dataset.sessionId);
      if (!Number.isFinite(nextId)) return;
      const payload = await fetchCourseSessionTypes(courseId, selectedWeeklyId, selectedTimeSlotId);
      const sessionTypes = extractList(payload);
      selectedSessionType = sessionTypes.find((type) => type.id === nextId) || null;
      sessionOptionsRoot?.querySelectorAll('[data-session-id]').forEach((btn) => {
        btn.classList.toggle('is-active', Number(btn.getAttribute('data-session-id')) === nextId);
      });
      updatePriceCard();
      return;
    }

    if (target.closest('[data-enroll-btn]') && !authStore.isAuthenticated()) {
      uiStore.openModal('login');
      return;
    }

    if (target.closest('[data-profile-btn]') && !authStore.isAuthenticated()) {
      uiStore.openModal('login');
    }
  });
}

export { renderCourseDetailPage, initCourseDetailPage };
