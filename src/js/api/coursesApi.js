import { request } from './client.js';

function fetchCourses({ sort = 'newest', page = 1 } = {}) {
  const query = new URLSearchParams({
    sort,
    page: String(page),
  });

  return request(`/courses?${query.toString()}`);
}

function fetchFeaturedCourses() {
  return request('/courses/featured');
}

function fetchInProgressCourses() {
  return request('/courses/in-progress');
}

function fetchCourseById(courseId) {
  return request(`/courses/${courseId}`);
}

function fetchCourseWeeklySchedules(courseId) {
  return request(`/courses/${courseId}/weekly-schedules`);
}

function fetchCourseTimeSlots(courseId, weeklyScheduleId) {
  const query = new URLSearchParams({
    weekly_schedule_id: String(weeklyScheduleId),
  });
  return request(`/courses/${courseId}/time-slots?${query.toString()}`);
}

function fetchCourseSessionTypes(courseId, weeklyScheduleId, timeSlotId) {
  const query = new URLSearchParams({
    weekly_schedule_id: String(weeklyScheduleId),
    time_slot_id: String(timeSlotId),
  });
  return request(`/courses/${courseId}/session-types?${query.toString()}`);
}

export {
  fetchCourses,
  fetchFeaturedCourses,
  fetchInProgressCourses,
  fetchCourseById,
  fetchCourseWeeklySchedules,
  fetchCourseTimeSlots,
  fetchCourseSessionTypes,
};
