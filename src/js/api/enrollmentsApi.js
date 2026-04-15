import { request } from './client.js';

function fetchEnrollments() {
  return request('/enrollments');
}

async function createEnrollment({
  courseId,
  courseScheduleId,
  weeklyScheduleId,
  timeSlotId,
  sessionTypeId,
}) {
  const numericCourseId = Number(courseId);
  const numericCourseScheduleId = Number(courseScheduleId);
  const numericWeeklyScheduleId = Number(weeklyScheduleId);
  const numericTimeSlotId = Number(timeSlotId);
  const numericSessionTypeId = Number(sessionTypeId);

  if (!Number.isFinite(numericCourseId) || !Number.isFinite(numericCourseScheduleId)) {
    throw { status: 422, data: { message: 'Invalid enrollment payload.' } };
  }

  // Use FormData because this API validates multipart fields consistently.
  const body = new FormData();
  body.append('course_id', String(numericCourseId));
  body.append('course_schedule_id', String(numericCourseScheduleId));
  body.append('courseId', String(numericCourseId));
  body.append('courseScheduleId', String(numericCourseScheduleId));

  if (Number.isFinite(numericWeeklyScheduleId)) {
    body.append('weekly_schedule_id', String(numericWeeklyScheduleId));
    body.append('weeklyScheduleId', String(numericWeeklyScheduleId));
  }
  if (Number.isFinite(numericTimeSlotId)) {
    body.append('time_slot_id', String(numericTimeSlotId));
    body.append('timeSlotId', String(numericTimeSlotId));
  }
  if (Number.isFinite(numericSessionTypeId)) {
    body.append('session_type_id', String(numericSessionTypeId));
    body.append('sessionTypeId', String(numericSessionTypeId));
  }

  return request('/enrollments', {
    method: 'POST',
    body,
  });
}

export { fetchEnrollments, createEnrollment };
