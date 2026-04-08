import { fetchCourses, fetchFeaturedCourses } from '../api/coursesApi.js';
import { authStore } from '../state/authStore.js';

const HERO_SLIDES = [
  '/assets/images/slider1.svg',
  '/assets/images/slider2.svg',
  '/assets/images/slider3.svg',
];

const ARROWS = {
  leftBright: '/assets/icons/arrow_left_bright.svg',
  leftDim: '/assets/icons/arrow_left_dim.svg',
  rightBright: '/assets/icons/arrow_right_bright.svg',
  rightDim: '/assets/icons/arrow_right_dim.svg',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function extractCourses(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.courses)) {
    return payload.courses;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function getCourseImage(course) {
  return (
    course?.cover_image
    || course?.image
    || course?.thumbnail
    || '/assets/images/slider1.svg'
  );
}

function getCourseTitle(course) {
  return course?.title || course?.name || 'Untitled course';
}

function getCourseDescription(course) {
  return (
    course?.description
    || course?.short_description
    || 'Learn practical skills with expert-led lessons.'
  );
}

function getCourseInstructor(course) {
  return (
    course?.lecturer
    || course?.lecturer_name
    || course?.instructor_name
    || course?.instructor?.name
    || 'Lecturer Marilyn Mango'
  );
}

function getCoursePrice(course) {
  const rawPrice = Number(course?.price);
  return Number.isFinite(rawPrice) ? rawPrice : 299;
}

function getCourseRating(course) {
  const rawRating = Number(course?.rating);
  return Number.isFinite(rawRating) ? rawRating.toFixed(1) : '4.9';
}

function renderCourseCards(courses) {
  return courses.map(course => {
    const id = course?.id ?? '';
    const image = escapeHtml(getCourseImage(course));
    const title = escapeHtml(getCourseTitle(course));
    const description = escapeHtml(getCourseDescription(course));
    const instructor = escapeHtml(getCourseInstructor(course));
    const rating = escapeHtml(getCourseRating(course));
    const price = escapeHtml(getCoursePrice(course));
    const detailsLink = id ? `#/courses/${id}` : '#/courses';

    return `
      <article class="dashboard-course-card">
        <img class="dashboard-course-image" src="${image}" alt="${title}" />
        <div class="dashboard-course-meta">
          <span class="dashboard-course-instructor">${instructor}</span>
          <span class="dashboard-course-rating"><span class="dashboard-course-rating-star">&#9733;</span> ${rating}</span>
        </div>
        <h3 class="dashboard-course-title">${title}</h3>
        <p class="dashboard-course-description">${description}</p>
        <div class="dashboard-course-footer">
          <div class="dashboard-course-price-wrap">
            <span class="dashboard-course-price-label">Starting from</span>
            <strong class="dashboard-course-price">$${price}</strong>
          </div>
          <a class="dashboard-course-details" href="${detailsLink}">Details</a>
        </div>
      </article>
    `;
  }).join('');
}

async function loadStartLearningCourses() {
  const cardsRoot = document.querySelector('[data-start-learning-cards]');
  if (!(cardsRoot instanceof HTMLElement)) {
    return;
  }

  cardsRoot.innerHTML = '<p class="dashboard-courses-message">Loading courses...</p>';

  try {
    const featuredPayload = await fetchFeaturedCourses();
    let courses = extractCourses(featuredPayload).slice(0, 3);

    if (courses.length === 0) {
      const fallbackPayload = await fetchCourses({ sort: 'newest', page: 1 });
      courses = extractCourses(fallbackPayload).slice(0, 3);
    }

    if (courses.length === 0) {
      cardsRoot.innerHTML = '<p class="dashboard-courses-message">No courses available right now.</p>';
      return;
    }

    cardsRoot.innerHTML = renderCourseCards(courses);
  } catch (_error) {
    cardsRoot.innerHTML = '<p class="dashboard-courses-message">Unable to load courses right now.</p>';
  }
}

function renderDashboardPage() {
  const continueLearningLockedMarkup = authStore.isAuthenticated()
    ? ''
    : `
      <section class="dashboard-continue-learning-locked">
        <div class="dashboard-continue-learning-locked-media">
          <img class="dashboard-continue-learning-locked-image" src="/assets/images/locked-state.svg" alt="Continue learning locked state" />
          <button type="button" class="dashboard-continue-learning-login-hitbox btn-login" aria-label="Log In"></button>
          <button type="button" class="dashboard-continue-learning-see-all-hitbox btn-login" aria-label="See all courses"></button>
        </div>
      </section>
    `;

  const slidesMarkup = HERO_SLIDES.map((src, index) => {
    const alt = index === 0 ? 'Featured course slider item 1' : 'Featured course slider item 2';
    return `
      <div class="dashboard-hero-slide">
        <img class="dashboard-hero-image" src="${src}" alt="${alt}" />
      </div>
    `;
  }).join('');

  const indicatorsMarkup = HERO_SLIDES.map((_, index) => `
    <button
      class="dashboard-hero-indicator ${index === 0 ? 'is-active' : ''}"
      data-hero-indicator="${index}"
      type="button"
      aria-label="Go to slide ${index + 1}"
    ></button>
  `).join('');

  return `
    <section class="dashboard-page">
      <div class="dashboard-hero" data-hero-slider>
        <div class="dashboard-hero-track" data-hero-track>
          ${slidesMarkup}
        </div>

        <a href="#/courses" class="dashboard-hero-cta" aria-label="Browse Courses"></a>

        <div class="dashboard-hero-indicators" data-hero-indicators>
          ${indicatorsMarkup}
        </div>

        <div class="dashboard-hero-arrows">
          <button class="dashboard-hero-arrow dashboard-hero-arrow--left" data-hero-prev type="button" aria-label="Previous slide">
            <img src="${ARROWS.leftDim}" alt="" />
          </button>
          <button class="dashboard-hero-arrow dashboard-hero-arrow--right" data-hero-next type="button" aria-label="Next slide">
            <img src="${ARROWS.rightBright}" alt="" />
          </button>
        </div>
      </div>

      <section class="dashboard-start-learning">
        <h2 class="dashboard-start-learning-title">Start Learning Today</h2>
        <p class="dashboard-start-learning-subtitle">Choose from our most popular courses and begin your journey</p>
        <div class="dashboard-courses-grid" data-start-learning-cards></div>
      </section>
      ${continueLearningLockedMarkup}
    </section>
  `;
}

function initDashboardPage() {
  const slider = document.querySelector('[data-hero-slider]');
  if (!(slider instanceof HTMLElement)) {
    return;
  }

  const track = slider.querySelector('[data-hero-track]');
  const prevButton = slider.querySelector('[data-hero-prev]');
  const nextButton = slider.querySelector('[data-hero-next]');
  const indicatorButtons = Array.from(slider.querySelectorAll('[data-hero-indicator]'));

  if (!(track instanceof HTMLElement) || !(prevButton instanceof HTMLButtonElement) || !(nextButton instanceof HTMLButtonElement)) {
    return;
  }

  let activeIndex = 0;
  const maxIndex = HERO_SLIDES.length - 1;
  const TRANSITION_MS = 420;
  let slideTimer = null;

  function setActiveSlide(index) {
    const previousIndex = activeIndex;
    activeIndex = Math.max(0, Math.min(index, maxIndex));

    if (activeIndex !== previousIndex) {
      slider.classList.add('is-sliding');
      if (slideTimer) {
        window.clearTimeout(slideTimer);
      }
      slideTimer = window.setTimeout(() => {
        slider.classList.remove('is-sliding');
      }, TRANSITION_MS);
    }

    slider.dataset.activeSlide = String(activeIndex);
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    const leftIcon = prevButton.querySelector('img');
    const rightIcon = nextButton.querySelector('img');

    if (leftIcon) {
      leftIcon.src = activeIndex === 0 ? ARROWS.leftDim : ARROWS.leftBright;
      leftIcon.classList.toggle('is-hidden-on-first', activeIndex === 0);
    }

    if (rightIcon) {
      rightIcon.src = activeIndex === maxIndex ? ARROWS.rightDim : ARROWS.rightBright;
    }

    prevButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === maxIndex;

    indicatorButtons.forEach((button, indicatorIndex) => {
      if (!(button instanceof HTMLButtonElement)) return;
      button.classList.toggle('is-active', indicatorIndex === activeIndex);
    });
  }

  prevButton.addEventListener('click', () => {
    setActiveSlide(activeIndex - 1);
  });

  nextButton.addEventListener('click', () => {
    setActiveSlide(activeIndex + 1);
  });

  indicatorButtons.forEach((button, index) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.addEventListener('click', () => setActiveSlide(index));
  });

  setActiveSlide(0);
  loadStartLearningCourses();
}

export { renderDashboardPage, initDashboardPage };





