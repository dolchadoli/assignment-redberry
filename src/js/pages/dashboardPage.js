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

function renderDashboardPage() {
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
}

export { renderDashboardPage, initDashboardPage };
