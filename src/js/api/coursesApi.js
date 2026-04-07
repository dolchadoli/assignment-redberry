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

export { fetchCourses, fetchFeaturedCourses, fetchInProgressCourses, fetchCourseById };
