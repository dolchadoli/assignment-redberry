function renderCourseDetailPage(params = {}) {
  const courseId = params.id ?? 'Unknown';

  return `
    <section>
      <h1>Course Detail</h1>
      <p>Course ID: ${courseId}</p>
    </section>
  `;
}

export { renderCourseDetailPage };
