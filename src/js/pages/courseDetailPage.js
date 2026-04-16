import {
  fetchCourseById,
  fetchCourseWeeklySchedules,
  fetchCourseTimeSlots,
  fetchCourseSessionTypes,
} from '../api/coursesApi.js';
import { createEnrollment, fetchEnrollments } from '../api/enrollmentsApi.js';
import { fetchCurrentUser, updateProfile } from '../services/authService.js';
import { authStore } from '../state/authStore.js';
import { uiStore } from '../state/uiStore.js';
import { readJsonStorage, writeJsonStorage } from '../utils/storage.js';

const ENROLLMENT_PROGRESS_KEY = 'demoEnrollmentProgressMap';
const PROFILE_DRAFT_KEY = 'pendingProfileDraft';
const ENROLLMENT_SELECTIONS_KEY = 'enrollmentSelectionMap';
const ENROLLMENT_RATING_KEY = 'enrollmentRatingMap';

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
  if (payload.enrollment) return payload.enrollment;
  if (payload.item) return payload.item;
  return payload;
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.enrollments)) return payload.enrollments;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getEnrollmentProgressMap() {
  const parsed = readJsonStorage(ENROLLMENT_PROGRESS_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function getEnrollmentSelectionMap() {
  const parsed = readJsonStorage(ENROLLMENT_SELECTIONS_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function setEnrollmentSelectionMap(map) {
  writeJsonStorage(ENROLLMENT_SELECTIONS_KEY, map);
}

function getEnrollmentRatingMap() {
  const parsed = readJsonStorage(ENROLLMENT_RATING_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function setEnrollmentRatingMap(map) {
  writeJsonStorage(ENROLLMENT_RATING_KEY, map);
}

function getEnrollmentProgressOverride(enrollmentId) {
  const map = getEnrollmentProgressMap();
  const raw = Number(map[String(enrollmentId)]);
  if (!Number.isFinite(raw)) return null;
  return Math.max(0, Math.min(100, raw));
}

function setEnrollmentProgressOverride(enrollmentId, progress) {
  const map = getEnrollmentProgressMap();
  map[String(enrollmentId)] = Math.max(0, Math.min(100, Number(progress) || 0));
  writeJsonStorage(ENROLLMENT_PROGRESS_KEY, map);
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

function getAvailableSeats(sessionType) {
  const raw = Number(
    sessionType?.availableSeats
    ?? sessionType?.available_seats
    ?? sessionType?.seats
    ?? 0
  );
  return Number.isFinite(raw) ? raw : 0;
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

function getEnrollmentCourseId(enrollment) {
  return Number(
    enrollment?.course?.id
    ?? enrollment?.course_id
    ?? enrollment?.courseId
    ?? enrollment?.id
  );
}

function getEnrollmentProgress(enrollment) {
  const enrollmentId = enrollment?.id || getEnrollmentCourseId(enrollment);
  const override = getEnrollmentProgressOverride(enrollmentId);
  if (override !== null) return override;
  const raw = Number(enrollment?.progress ?? enrollment?.progress_percentage ?? 0);
  return Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
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

function getStoredEnrollmentRating(enrollment) {
  const map = getEnrollmentRatingMap();
  const enrollmentId = enrollment?.id;
  const courseId = getEnrollmentCourseId(enrollment);
  return Number(
    map[`enrollment:${enrollmentId}`]
    ?? map[`course:${courseId}`]
    ?? 0
  );
}

function getEnrollmentScheduleLabel(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.scheduleLabel) return stored.scheduleLabel;
  const weekly = enrollment?.weeklySchedule || enrollment?.weekly_schedule;
  if (weekly?.label) return weekly.label;
  if (Array.isArray(weekly?.days)) return formatDays(weekly.days);
  return 'Schedule selected';
}

function getEnrollmentTimeLabel(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.timeLabel) return stored.timeLabel;
  const slot = enrollment?.timeSlot || enrollment?.time_slot;
  if (slot?.label) return slot.label;
  if (slot?.startTime && slot?.endTime) return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
  return 'Time selected';
}

function getEnrollmentSessionTypeLabel(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.sessionLabel) return stored.sessionLabel;
  const type = enrollment?.sessionType || enrollment?.session_type;
  return type?.name || 'Session selected';
}

function getEnrollmentLocationLabel(enrollment) {
  const stored = getStoredEnrollmentSelection(enrollment);
  if (stored?.locationLabel) return stored.locationLabel;
  const type = enrollment?.sessionType || enrollment?.session_type;
  return type?.location || 'Location not specified';
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const stringValue = String(value).trim();
    if (stringValue.length > 0) return stringValue;
  }
  return '';
}

function collectMissingProfileFields(user) {
  const fullName = firstNonEmpty(user?.full_name, user?.fullName, user?.name, user?.username);
  const mobile = firstNonEmpty(
    user?.mobile,
    user?.mobile_number,
    user?.mobileNumber,
    user?.phone,
    user?.phone_number,
    user?.phoneNumber,
    user?.mobile_local,
    user?.phone_local
  );
  const ageRaw = Number(user?.age ?? user?.user_age ?? user?.years);
  const age = Number.isFinite(ageRaw) ? ageRaw : null;

  const missing = [];
  if (!fullName) missing.push('full name');
  if (!mobile) missing.push('mobile');
  if (age === null || age < 16) missing.push('age (16+)');
  return missing;
}

function normalizeGeorgianMobile(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^5\d{8}$/.test(digits)) {
    return {
      local: digits,
      international: `+995${digits}`,
    };
  }
  if (/^9955\d{8}$/.test(digits)) {
    const local = digits.slice(3);
    return {
      local,
      international: `+${digits}`,
    };
  }
  return null;
}

function readProfileDraft() {
  const parsed = readJsonStorage(PROFILE_DRAFT_KEY, null);
  return parsed && typeof parsed === 'object' ? parsed : null;
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
          <div class="course-detail-selection-panel" data-selection-panel>
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
            <p class="course-detail-enroll-error" data-enroll-error></p>
          </div>
          </div>

          <div class="course-detail-enrolled-panel is-hidden" data-enrolled-panel>
            <p class="course-detail-enrolled-badge" data-enrolled-badge>Enrolled</p>
            <p class="course-detail-enrolled-line" data-enrolled-schedule>Schedule selected</p>
            <p class="course-detail-enrolled-line" data-enrolled-time>Time selected</p>
            <p class="course-detail-enrolled-line" data-enrolled-session>Session selected</p>
            <p class="course-detail-enrolled-line" data-enrolled-location>Location not specified</p>
            <p class="course-detail-enrolled-progress-text"><span data-enrolled-progress>0%</span> Complete</p>
            <div class="course-detail-enrolled-progressbar"><span data-enrolled-progress-fill style="width: 0%"></span></div>
            <button type="button" class="course-detail-enrolled-complete-btn" data-complete-course-btn>Complete Course</button>
            <button type="button" class="course-detail-enrolled-retake-btn is-hidden" data-retake-course-btn>Retake Course</button>
            <div class="course-detail-rating-panel is-hidden" data-rating-panel>
              <button type="button" class="course-detail-rating-close" data-rating-close aria-label="Close rating panel">&times;</button>
              <p class="course-detail-rating-title">Rate your experience</p>
              <div class="course-detail-rating-stars" data-rating-stars>
                <button type="button" class="course-detail-rating-star" data-rating-star="1" aria-label="Rate 1 star">&#9733;</button>
                <button type="button" class="course-detail-rating-star" data-rating-star="2" aria-label="Rate 2 stars">&#9733;</button>
                <button type="button" class="course-detail-rating-star" data-rating-star="3" aria-label="Rate 3 stars">&#9733;</button>
                <button type="button" class="course-detail-rating-star" data-rating-star="4" aria-label="Rate 4 stars">&#9733;</button>
                <button type="button" class="course-detail-rating-star" data-rating-star="5" aria-label="Rate 5 stars">&#9733;</button>
              </div>
            </div>
            <p class="course-detail-rating-thanks is-hidden" data-rating-thanks>Thank you for your feedback.</p>
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
  const enrollErrorNode = root.querySelector('[data-enroll-error]');
  const accordionRoot = root.querySelector('[data-accordion-root]');
  const selectionPanel = root.querySelector('[data-selection-panel]');
  const enrolledPanel = root.querySelector('[data-enrolled-panel]');
  const enrolledBadgeNode = root.querySelector('[data-enrolled-badge]');
  const enrolledScheduleNode = root.querySelector('[data-enrolled-schedule]');
  const enrolledTimeNode = root.querySelector('[data-enrolled-time]');
  const enrolledSessionNode = root.querySelector('[data-enrolled-session]');
  const enrolledLocationNode = root.querySelector('[data-enrolled-location]');
  const enrolledProgressNode = root.querySelector('[data-enrolled-progress]');
  const enrolledProgressFillNode = root.querySelector('[data-enrolled-progress-fill]');
  const completeCourseBtn = root.querySelector('[data-complete-course-btn]');
  const retakeCourseBtn = root.querySelector('[data-retake-course-btn]');
  const ratingPanel = root.querySelector('[data-rating-panel]');
  const ratingStarsRoot = root.querySelector('[data-rating-stars]');
  const ratingThanksNode = root.querySelector('[data-rating-thanks]');

  let basePrice = 0;
  let selectedWeeklyId = null;
  let selectedTimeSlotId = null;
  let selectedSessionType = null;
  let weeklySchedules = [];
  let timeSlots = [];
  let sessionTypes = [];
  let isSubmittingEnrollment = false;
  let isEnrolledInCurrentSelection = false;
  let currentEnrollment = null;
  let enrollErrorMessage = '';
  let currentRating = 0;

  function getErrorMessage(error) {
    const fallback = 'Enrollment failed. Please try again.';
    if (!error || typeof error !== 'object') return fallback;
    const errorsObj = error?.data?.errors;
    if (errorsObj && typeof errorsObj === 'object') {
      const allMessages = Object.values(errorsObj)
        .flatMap((value) => (Array.isArray(value) ? value : []))
        .filter(Boolean)
        .map((value) => String(value));
      if (allMessages.length > 0) {
        return allMessages.join(' ');
      }
    }
    const message = String(error?.data?.message || '').trim();
    if (message) return message;
    return fallback;
  }

  function updatePriceCard() {
    const modifier = Number(selectedSessionType?.priceModifier || 0) || 0;
    const total = basePrice + modifier;

    if (totalPriceNode) totalPriceNode.textContent = `$${total.toFixed(0)}`;
    if (basePriceNode) basePriceNode.textContent = `$${basePrice.toFixed(0)}`;
    if (modifierNode) modifierNode.textContent = `+ $${modifier.toFixed(0)}`;
    if (seatCountNode) seatCountNode.textContent = String(getAvailableSeats(selectedSessionType));

    if (enrollBtn instanceof HTMLButtonElement) {
      const isLoggedIn = authStore.isAuthenticated();
      const availableSeats = getAvailableSeats(selectedSessionType);
      enrollBtn.textContent = isSubmittingEnrollment
        ? 'Enrolling...'
        : (isEnrolledInCurrentSelection ? 'Enrolled' : 'Enroll Now');
      enrollBtn.classList.toggle('is-ready', isEnrolledInCurrentSelection || !isLoggedIn || availableSeats > 0);
      enrollBtn.classList.toggle('btn-login', !isLoggedIn);
      enrollBtn.disabled = isSubmittingEnrollment || isEnrolledInCurrentSelection || (isLoggedIn && availableSeats <= 0);
    }

    if (enrollErrorNode instanceof HTMLElement) {
      enrollErrorNode.textContent = enrollErrorMessage;
    }
  }

  function extractUser(payload) {
    return payload?.data || payload?.user || payload || {};
  }

  function getCurrentSelectionSnapshot() {
    const selectedWeekly = weeklySchedules.find((item) => item?.id === selectedWeeklyId) || null;
    const selectedTime = timeSlots.find((item) => item?.id === selectedTimeSlotId) || null;
    const selectedType = sessionTypes.find((item) => item?.id === selectedSessionType?.id) || selectedSessionType || null;

    const scheduleLabel = selectedWeekly
      ? (formatDays(selectedWeekly.days) || selectedWeekly.label || 'Schedule selected')
      : 'Schedule selected';
    const timeLabel = selectedTime
      ? (selectedTime.label || `${formatTime(selectedTime.startTime)} - ${formatTime(selectedTime.endTime)}`)
      : 'Time selected';
    const sessionLabel = selectedType?.name || 'Session selected';
    const locationLabel = selectedType?.location || 'Location not specified';

    return { scheduleLabel, timeLabel, sessionLabel, locationLabel };
  }

  function persistSelectionForEnrollment(enrollment) {
    if (!enrollment) return;
    const map = getEnrollmentSelectionMap();
    const snapshot = getCurrentSelectionSnapshot();
    const enrollmentId = enrollment?.id;
    const mappedCourseId = getEnrollmentCourseId(enrollment);

    if (enrollmentId !== null && enrollmentId !== undefined) {
      map[`enrollment:${enrollmentId}`] = snapshot;
    }
    if (Number.isFinite(mappedCourseId)) {
      map[`course:${mappedCourseId}`] = snapshot;
    }
    setEnrollmentSelectionMap(map);
  }

  function persistRatingForEnrollment(enrollment, ratingValue) {
    if (!enrollment) return;
    const map = getEnrollmentRatingMap();
    const enrollmentId = enrollment?.id;
    const mappedCourseId = getEnrollmentCourseId(enrollment);
    const normalized = Math.max(0, Math.min(5, Number(ratingValue) || 0));

    if (enrollmentId !== null && enrollmentId !== undefined) {
      map[`enrollment:${enrollmentId}`] = normalized;
    }
    if (Number.isFinite(mappedCourseId)) {
      map[`course:${mappedCourseId}`] = normalized;
    }
    setEnrollmentRatingMap(map);
  }

  function clearRatingForEnrollment(enrollment) {
    if (!enrollment) return;
    const map = getEnrollmentRatingMap();
    const enrollmentId = enrollment?.id;
    const mappedCourseId = getEnrollmentCourseId(enrollment);

    delete map[`enrollment:${enrollmentId}`];
    delete map[`course:${mappedCourseId}`];
    setEnrollmentRatingMap(map);
  }

  function renderRatingStars(ratingValue) {
    if (!(ratingStarsRoot instanceof HTMLElement)) return;
    const normalized = Math.max(0, Math.min(5, Number(ratingValue) || 0));
    ratingStarsRoot.querySelectorAll('[data-rating-star]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      const starValue = Number(button.dataset.ratingStar);
      button.classList.toggle('is-active', Number.isFinite(starValue) && starValue <= normalized);
    });
  }

  async function resolveCurrentEnrollmentFromPayload(enrollmentPayload) {
    const createdEnrollment = extractRecord(enrollmentPayload);
    if (createdEnrollment) {
      currentEnrollment = createdEnrollment;
      return;
    }

    const enrollmentsPayload = await fetchEnrollments();
    const enrollments = extractList(enrollmentsPayload);
    currentEnrollment = enrollments.find((enrollment) => getEnrollmentCourseId(enrollment) === Number(courseId)) || null;
  }

  async function tryRepairProfileFromDraft() {
    const draft = readProfileDraft();
    if (!draft) return false;

    const username = String(draft.username || '').trim();
    const normalized = normalizeGeorgianMobile(draft.mobile);
    const age = Number(draft.age);
    if (!normalized || !Number.isFinite(age) || age < 16) return false;

    const mobileCandidates = [normalized.local, `995${normalized.local}`, normalized.international];
    const endpoints = ['/profile', '/me', '/user/profile'];
    const methods = ['PUT', 'POST', 'PATCH'];

    for (const mobileValue of mobileCandidates) {
      const payloadBuilders = [
        () => {
          const body = new FormData();
          body.append('full_name', username);
          body.append('fullName', username);
          body.append('name', username);
          body.append('age', String(age));
          body.append('user_age', String(age));
          body.append('years', String(age));
          body.append('mobile', mobileValue);
          body.append('mobile_number', mobileValue);
          body.append('phone', mobileValue);
          body.append('phone_number', mobileValue);
          body.append('mobile_local', normalized.local);
          body.append('phone_local', normalized.local);
          return body;
        },
        () => ({
          full_name: username,
          fullName: username,
          name: username,
          age,
          user_age: age,
          years: age,
          mobile: mobileValue,
          mobile_number: mobileValue,
          phone: mobileValue,
          phone_number: mobileValue,
          mobile_local: normalized.local,
          phone_local: normalized.local,
        }),
        () => ({
          full_name: username,
          age,
          mobile: mobileValue,
          phone: mobileValue,
        }),
      ];

      for (const buildPayload of payloadBuilders) {
        for (const endpoint of endpoints) {
          for (const method of methods) {
            try {
              await updateProfile(buildPayload(), { method, endpoint });
              const mePayload = await fetchCurrentUser();
              const me = extractUser(mePayload);
              const missing = collectMissingProfileFields(me);
              const missingCritical = missing.includes('mobile') || missing.includes('age (16+)');
              if (!missingCritical) {
                return true;
              }
            } catch (_error) {
              // Try next combination.
            }
          }
        }
      }
    }

    return false;
  }

  function renderEnrolledPanel() {
    if (!(selectionPanel instanceof HTMLElement) || !(enrolledPanel instanceof HTMLElement) || !currentEnrollment) return;

    selectionPanel.classList.add('is-hidden');
    enrolledPanel.classList.remove('is-hidden');

    const progress = getEnrollmentProgress(currentEnrollment);
    if (enrolledScheduleNode) enrolledScheduleNode.textContent = getEnrollmentScheduleLabel(currentEnrollment);
    if (enrolledTimeNode) enrolledTimeNode.textContent = getEnrollmentTimeLabel(currentEnrollment);
    if (enrolledSessionNode) enrolledSessionNode.textContent = getEnrollmentSessionTypeLabel(currentEnrollment);
    if (enrolledLocationNode) enrolledLocationNode.textContent = getEnrollmentLocationLabel(currentEnrollment);
    if (enrolledProgressNode) enrolledProgressNode.textContent = `${progress}%`;
    if (enrolledProgressFillNode instanceof HTMLElement) {
      enrolledProgressFillNode.style.width = `${progress}%`;
    }

    currentRating = getStoredEnrollmentRating(currentEnrollment);
    renderRatingStars(currentRating);

    if (enrolledBadgeNode instanceof HTMLElement) {
      const isCompleted = progress >= 100;
      enrolledBadgeNode.textContent = isCompleted ? 'Completed' : 'Enrolled';
      enrolledBadgeNode.classList.toggle('is-completed', isCompleted);
    }

    if (completeCourseBtn instanceof HTMLButtonElement) {
      completeCourseBtn.classList.toggle('is-hidden', progress >= 100);
      completeCourseBtn.textContent = 'Complete Course';
      completeCourseBtn.disabled = false;
    }

    if (retakeCourseBtn instanceof HTMLButtonElement) {
      retakeCourseBtn.classList.toggle('is-hidden', progress < 100);
    }

    if (ratingPanel instanceof HTMLElement) {
      const shouldShow = progress >= 100 && currentRating === 0;
      ratingPanel.classList.toggle('is-hidden', !shouldShow);
    }

    if (ratingThanksNode instanceof HTMLElement) {
      const shouldShowThanks = progress >= 100 && currentRating > 0;
      ratingThanksNode.classList.toggle('is-hidden', !shouldShowThanks);
    }
  }

  async function loadSessionTypes() {
    if (!sessionOptionsRoot || !selectedWeeklyId || !selectedTimeSlotId) return;
    sessionOptionsRoot.innerHTML = '<span class="course-detail-pill">Loading...</span>';

    try {
      const payload = await fetchCourseSessionTypes(courseId, selectedWeeklyId, selectedTimeSlotId);
      sessionTypes = extractList(payload);

      if (sessionTypes.length === 0) {
        selectedSessionType = null;
        isEnrolledInCurrentSelection = false;
        sessionOptionsRoot.innerHTML = '<span class="course-detail-pill">No session types</span>';
        updatePriceCard();
        return;
      }

      if (!selectedSessionType || !sessionTypes.some((it) => it.id === selectedSessionType.id)) {
        selectedSessionType = sessionTypes.find((it) => getAvailableSeats(it) > 0) || sessionTypes[0];
      }

      sessionOptionsRoot.innerHTML = sessionTypes.map((type) => {
        const isActive = selectedSessionType?.id === type.id;
        const modifier = Number(type.priceModifier || 0);
        const seats = getAvailableSeats(type);
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
      isEnrolledInCurrentSelection = false;
      updatePriceCard();
    }
  }

  async function loadTimeSlots() {
    if (!timeOptionsRoot || !selectedWeeklyId) return;
    timeOptionsRoot.innerHTML = '<span class="course-detail-pill">Loading...</span>';

    try {
      const payload = await fetchCourseTimeSlots(courseId, selectedWeeklyId);
      timeSlots = extractList(payload);

      if (timeSlots.length === 0) {
        selectedTimeSlotId = null;
        selectedSessionType = null;
        isEnrolledInCurrentSelection = false;
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
      isEnrolledInCurrentSelection = false;
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
      weeklySchedules = schedules;

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

  if (authStore.isAuthenticated()) {
    try {
      const enrollmentsPayload = await fetchEnrollments();
      const enrollments = extractList(enrollmentsPayload);
      currentEnrollment = enrollments.find((enrollment) => getEnrollmentCourseId(enrollment) === Number(courseId)) || null;
      if (currentEnrollment) {
        isEnrolledInCurrentSelection = true;
        renderEnrolledPanel();
      }
    } catch (_error) {
      currentEnrollment = null;
    }
  }

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
      isEnrolledInCurrentSelection = false;
      enrollErrorMessage = '';
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
      isEnrolledInCurrentSelection = false;
      enrollErrorMessage = '';
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
      isEnrolledInCurrentSelection = false;
      enrollErrorMessage = '';
      sessionOptionsRoot?.querySelectorAll('[data-session-id]').forEach((btn) => {
        btn.classList.toggle('is-active', Number(btn.getAttribute('data-session-id')) === nextId);
      });
      updatePriceCard();
      return;
    }

    if (target.closest('[data-enroll-btn]')) {
      if (!authStore.isAuthenticated()) {
        uiStore.openModal('login');
        return;
      }

      if (isSubmittingEnrollment || !selectedWeeklyId || !selectedTimeSlotId || !selectedSessionType?.id) {
        return;
      }

      try {
        isSubmittingEnrollment = true;
        enrollErrorMessage = '';
        updatePriceCard();

        const enrollmentPayload = await createEnrollment({
          courseId,
          courseScheduleId: selectedSessionType?.courseScheduleId ?? selectedSessionType?.course_schedule_id,
          weeklyScheduleId: selectedWeeklyId,
          timeSlotId: selectedTimeSlotId,
          sessionTypeId: selectedSessionType.id,
        });

        isEnrolledInCurrentSelection = true;
        await resolveCurrentEnrollmentFromPayload(enrollmentPayload);

        persistSelectionForEnrollment(currentEnrollment);

        if (currentEnrollment) {
          renderEnrolledPanel();
        }

        uiStore.openSidebar('enrolled-courses');
      } catch (_error) {
        enrollErrorMessage = getErrorMessage(_error);

        if (enrollErrorMessage.toLowerCase().includes('complete your profile')) {
          const repaired = await tryRepairProfileFromDraft();
          if (repaired) {
            try {
              const retryEnrollmentPayload = await createEnrollment({
                courseId,
                courseScheduleId: selectedSessionType?.courseScheduleId ?? selectedSessionType?.course_schedule_id,
                weeklyScheduleId: selectedWeeklyId,
                timeSlotId: selectedTimeSlotId,
                sessionTypeId: selectedSessionType.id,
              });

              await resolveCurrentEnrollmentFromPayload(retryEnrollmentPayload);

              persistSelectionForEnrollment(currentEnrollment);

              isEnrolledInCurrentSelection = true;
              enrollErrorMessage = '';
              if (currentEnrollment) {
                renderEnrolledPanel();
              }
              uiStore.openSidebar('enrolled-courses');
              return;
            } catch (retryError) {
              enrollErrorMessage = getErrorMessage(retryError);
            }
          }

          try {
            const userPayload = await fetchCurrentUser();
            const user = extractUser(userPayload);
            const missing = collectMissingProfileFields(user);
            if (missing.length > 0) {
              enrollErrorMessage = `Please complete your profile: ${missing.join(', ')}.`;
            }
          } catch (_fetchProfileError) {
            // Keep original message if profile fetch fails.
          }
        }
      } finally {
        isSubmittingEnrollment = false;
        updatePriceCard();
      }
      return;
    }

    if (target.closest('[data-complete-course-btn]')) {
      if (!currentEnrollment) return;
      const enrollmentId = currentEnrollment?.id || getEnrollmentCourseId(currentEnrollment);
      const current = getEnrollmentProgress(currentEnrollment);
      const next = Math.min(100, current + 10);
      setEnrollmentProgressOverride(enrollmentId, next);
      currentEnrollment = {
        ...currentEnrollment,
        progress: next,
      };
      renderEnrolledPanel();
      return;
    }

    if (target.closest('[data-retake-course-btn]')) {
      if (!currentEnrollment) return;
      const enrollmentId = currentEnrollment?.id || getEnrollmentCourseId(currentEnrollment);
      setEnrollmentProgressOverride(enrollmentId, 0);
      clearRatingForEnrollment(currentEnrollment);
      currentRating = 0;
      currentEnrollment = {
        ...currentEnrollment,
        progress: 0,
      };
      renderEnrolledPanel();
      return;
    }

    if (target.closest('[data-rating-close]')) {
      if (ratingPanel instanceof HTMLElement) {
        ratingPanel.classList.add('is-hidden');
      }
      return;
    }

    const ratingStarButton = target.closest('[data-rating-star]');
    if (ratingStarButton instanceof HTMLButtonElement) {
      if (!currentEnrollment) return;
      const selectedRating = Number(ratingStarButton.dataset.ratingStar);
      if (!Number.isFinite(selectedRating) || selectedRating < 1 || selectedRating > 5) return;
      currentRating = selectedRating;
      persistRatingForEnrollment(currentEnrollment, selectedRating);
      renderRatingStars(selectedRating);
      if (ratingPanel instanceof HTMLElement) {
        ratingPanel.classList.add('is-hidden');
      }
      if (ratingThanksNode instanceof HTMLElement) {
        ratingThanksNode.classList.remove('is-hidden');
      }
      return;
    }

  });
}

export { renderCourseDetailPage, initCourseDetailPage };
