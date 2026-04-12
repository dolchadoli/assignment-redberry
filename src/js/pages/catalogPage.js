import { fetchCourses } from '../api/coursesApi.js';

const ITEMS_PER_PAGE = 9;
const catalogState = {
  sort: 'newest',
  page: 1,
  total: 0,
  lastPage: 1,
  sourceCourses: [],
  selectedCategories: new Set(),
  selectedTopics: new Set(),
  selectedInstructors: new Set(),
};

const CATEGORIES = ['Development', 'Design', 'Business', 'Data Science', 'Marketing'];
const TOPICS = ['React', 'TypeScript', 'Python', 'UX/UI', 'Figma', 'JavaScript', 'Node.js', 'Machine Learning', 'SEO', 'Analytics'];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function extractCourses(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function extractTotal(payload, fallbackCount) {
  const rawTotal = Number(
    payload?.total
    ?? payload?.meta?.total
    ?? payload?.pagination?.total
    ?? payload?.data?.total
    ?? fallbackCount
  );
  return Number.isFinite(rawTotal) && rawTotal > 0 ? rawTotal : fallbackCount;
}

function extractLastPage(payload, totalCount) {
  const rawLast = Number(
    payload?.last_page
    ?? payload?.meta?.last_page
    ?? payload?.pagination?.last_page
    ?? payload?.data?.last_page
  );

  if (Number.isFinite(rawLast) && rawLast > 0) {
    return rawLast;
  }

  return Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
}

function getCourseImage(course) {
  return course?.cover_image || course?.image || course?.thumbnail || '/assets/images/slider1.svg';
}

function getCourseTitle(course) {
  return course?.title || course?.name || 'Untitled course';
}

function getCourseDescription(course) {
  return course?.description || course?.short_description || '';
}

function getCourseInstructor(course) {
  return course?.lecturer || course?.lecturer_name || course?.instructor_name || course?.instructor?.name || 'Marilyn Mango';
}

function getCourseInstructorAvatar(course) {
  return course?.instructor?.avatar || course?.lecturer_avatar || course?.instructor_avatar || '';
}

function getCourseDuration(course) {
  return course?.duration || course?.weeks || '12 Weeks';
}

function getCoursePrice(course) {
  const rawPrice = Number(course?.price);
  return Number.isFinite(rawPrice) ? rawPrice : 299;
}

function getCourseRating(course) {
  const rawRating = Number(course?.rating);
  return Number.isFinite(rawRating) ? rawRating.toFixed(1) : '4.9';
}

function listFromUnknown(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) return value.split(',').map((item) => item.trim());
  return [];
}

function toNameArray(list) {
  return list
    .map((item) => {
      if (typeof item === 'string') return item;
      return item?.name || item?.title || item?.label || '';
    })
    .map((item) => normalize(item))
    .filter(Boolean);
}

function inferCourseCategories(course) {
  const explicit = toNameArray([
    ...listFromUnknown(course?.categories),
    ...listFromUnknown(course?.category),
    ...listFromUnknown(course?.category_name),
    ...listFromUnknown(course?.category_names),
  ]);

  if (explicit.length > 0) {
    return explicit;
  }

  const haystack = normalize(`${getCourseTitle(course)} ${getCourseDescription(course)}`);
  if (haystack.includes('design') || haystack.includes('ui') || haystack.includes('ux') || haystack.includes('figma')) {
    return ['design'];
  }
  if (haystack.includes('business') || haystack.includes('management') || haystack.includes('marketing')) {
    return ['business'];
  }
  if (haystack.includes('data') || haystack.includes('machine') || haystack.includes('python')) {
    return ['data science'];
  }
  if (haystack.includes('marketing') || haystack.includes('seo')) {
    return ['marketing'];
  }
  return ['development'];
}

function inferCourseTopics(course) {
  const explicit = toNameArray([
    ...listFromUnknown(course?.topics),
    ...listFromUnknown(course?.topic),
    ...listFromUnknown(course?.topic_name),
    ...listFromUnknown(course?.topic_names),
    ...listFromUnknown(course?.tags),
  ]);

  if (explicit.length > 0) {
    return explicit;
  }

  const haystack = normalize(`${getCourseTitle(course)} ${getCourseDescription(course)}`);
  return TOPICS.map((topic) => normalize(topic)).filter((topic) => haystack.includes(topic));
}

function matchesSet(values, selectedSet) {
  if (selectedSet.size === 0) return true;
  return Array.from(selectedSet).some((selected) => values.some((value) => value.includes(selected)));
}

function getFilteredCourses() {
  return catalogState.sourceCourses.filter((course) => {
    const categories = inferCourseCategories(course);
    const topics = inferCourseTopics(course);
    const instructor = normalize(getCourseInstructor(course));

    const matchesCategories = matchesSet(categories, catalogState.selectedCategories);
    const matchesTopics = matchesSet(topics, catalogState.selectedTopics);
    const matchesInstructor = catalogState.selectedInstructors.size === 0
      ? true
      : Array.from(catalogState.selectedInstructors).some((selected) => instructor.includes(selected));

    return matchesCategories && matchesTopics && matchesInstructor;
  });
}

function buildCourseCard(course) {
  const id = course?.id ?? '';
  const image = escapeHtml(getCourseImage(course));
  const title = escapeHtml(getCourseTitle(course));
  const instructor = escapeHtml(getCourseInstructor(course));
  const duration = escapeHtml(getCourseDuration(course));
  const price = escapeHtml(getCoursePrice(course));
  const rating = escapeHtml(getCourseRating(course));
  const detailsLink = id ? `#/courses/${id}` : '#/courses';

  return `
    <article class="catalog-course-card">
      <img class="catalog-course-image" src="${image}" alt="${title}" />
      <div class="catalog-course-topline">
        <span>${instructor} | ${duration}</span>
        <span class="catalog-course-rating"><span class="catalog-course-rating-star">&#9733;</span> ${rating}</span>
      </div>
      <h3 class="catalog-course-title">${title}</h3>
      <div class="catalog-course-tag-row">
        <span class="catalog-course-tag">&lt;/&gt; Development</span>
      </div>
      <div class="catalog-course-footer">
        <div>
          <p class="catalog-course-price-label">Starting from</p>
          <p class="catalog-course-price">$${price}</p>
        </div>
        <a class="catalog-course-details" href="${detailsLink}">Details</a>
      </div>
    </article>
  `;
}

function buildPagination(currentPage, lastPage) {
  if (lastPage <= 1) return '';

  const pages = [];
  pages.push(1);
  if (lastPage >= 2) pages.push(2);
  if (lastPage >= 3) pages.push(3);
  if (lastPage > 4) pages.push('...');
  if (lastPage > 3) pages.push(lastPage);

  const uniquePages = pages.filter((value, index) => pages.indexOf(value) === index);

  return `
    <button class="catalog-pagination-btn ${currentPage === 1 ? 'is-disabled' : ''}" data-page="${Math.max(1, currentPage - 1)}" type="button" ${currentPage === 1 ? 'disabled' : ''}>&larr;</button>
    ${uniquePages.map((value) => {
      if (value === '...') {
        return '<span class="catalog-pagination-ellipsis">...</span>';
      }

      const page = Number(value);
      const isActive = page === currentPage;
      return `<button class="catalog-pagination-btn ${isActive ? 'is-active' : ''}" data-page="${page}" type="button">${page}</button>`;
    }).join('')}
    <button class="catalog-pagination-btn ${currentPage === lastPage ? 'is-disabled' : ''}" data-page="${Math.min(lastPage, currentPage + 1)}" type="button" ${currentPage === lastPage ? 'disabled' : ''}>&rarr;</button>
  `;
}

function renderFilterChips(chips, type, className) {
  return chips.map((chip) => {
    const value = normalize(chip);
    return `<button type="button" class="${className}" data-filter-type="${type}" data-filter-value="${escapeHtml(value)}">${escapeHtml(chip)}</button>`;
  }).join('');
}

function renderCatalogPage() {
  return `
    <section class="catalog-page">
      <div class="catalog-top-breadcrumb">Home <span>&gt;</span> Browse</div>
      <div class="catalog-layout">
        <aside class="catalog-filters">
          <div class="catalog-filters-header">
            <h2>Filters</h2>
            <button type="button" data-clear-filters>Clear All Filters &times;</button>
          </div>

          <div class="catalog-filter-group">
            <h3>Categories</h3>
            <div class="catalog-chip-grid">${renderFilterChips(CATEGORIES, 'category', 'catalog-chip')}</div>
          </div>

          <div class="catalog-filter-group">
            <h3>Topics</h3>
            <div class="catalog-chip-grid">${renderFilterChips(TOPICS, 'topic', 'catalog-chip')}</div>
          </div>

          <div class="catalog-filter-group">
            <h3>Instructor</h3>
            <div class="catalog-instructor-list" data-instructor-list></div>
          </div>

          <p class="catalog-filter-count" data-filter-count>0 Filters Active</p>
        </aside>

        <section class="catalog-content">
          <div class="catalog-content-topbar">
            <p class="catalog-showing" data-catalog-showing>Showing 0 out of 0</p>
            <label class="catalog-sort-wrap">
              <span>Sort By:</span>
              <select data-catalog-sort>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="title_asc">Title: A-Z</option>
              </select>
            </label>
          </div>

          <div class="catalog-courses-grid" data-catalog-cards>
            <p class="catalog-loading">Loading courses...</p>
          </div>

          <div class="catalog-pagination" data-catalog-pagination></div>
        </section>
      </div>
    </section>
  `;
}

function getAvailableInstructors(courses) {
  const seen = new Map();

  courses.forEach((course) => {
    const name = String(getCourseInstructor(course) ?? '').trim();
    if (!name) return;

    const key = normalize(name);
    const avatar = getCourseInstructorAvatar(course);
    const existing = seen.get(key);

    if (!existing || (!existing.avatar && avatar)) {
      seen.set(key, { name, avatar });
    }
  });

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function renderInstructorFilters(root) {
  const instructorRoot = root.querySelector('[data-instructor-list]');
  if (!(instructorRoot instanceof HTMLElement)) return;

  const instructors = getAvailableInstructors(catalogState.sourceCourses);

  // Keep only selected instructors that still exist in current dataset.
  const existingNormalized = new Set(instructors.map((item) => normalize(item.name)));
  catalogState.selectedInstructors.forEach((value) => {
    if (!existingNormalized.has(value)) {
      catalogState.selectedInstructors.delete(value);
    }
  });

  instructorRoot.innerHTML = instructors.map(({ name, avatar }) => `
    <button
      type="button"
      class="catalog-instructor-item ${catalogState.selectedInstructors.has(normalize(name)) ? 'is-active' : ''}"
      data-filter-type="instructor"
      data-filter-value="${escapeHtml(normalize(name))}"
    >
      <span class="catalog-instructor-avatar">
        ${avatar
    ? `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}" loading="lazy" />`
    : escapeHtml(name.charAt(0))}
      </span>
      <span>${escapeHtml(name)}</span>
    </button>
  `).join('');
}

function applyFilterStyles(root) {
  root.querySelectorAll('[data-filter-type="category"]').forEach((button) => {
    const value = normalize(button.getAttribute('data-filter-value'));
    button.classList.toggle('is-active', catalogState.selectedCategories.has(value));
  });

  root.querySelectorAll('[data-filter-type="topic"]').forEach((button) => {
    const value = normalize(button.getAttribute('data-filter-value'));
    button.classList.toggle('is-active', catalogState.selectedTopics.has(value));
  });

  root.querySelectorAll('[data-filter-type="instructor"]').forEach((button) => {
    const value = normalize(button.getAttribute('data-filter-value'));
    button.classList.toggle('is-active', catalogState.selectedInstructors.has(value));
  });

  const countRoot = root.querySelector('[data-filter-count]');
  if (countRoot) {
    const totalActive = catalogState.selectedCategories.size + catalogState.selectedTopics.size + catalogState.selectedInstructors.size;
    countRoot.textContent = `${totalActive} Filters Active`;
  }
}

function renderCatalogResults(root) {
  const cardsRoot = root.querySelector('[data-catalog-cards]');
  const showingRoot = root.querySelector('[data-catalog-showing]');
  const paginationRoot = root.querySelector('[data-catalog-pagination]');

  if (!(cardsRoot instanceof HTMLElement) || !(showingRoot instanceof HTMLElement) || !(paginationRoot instanceof HTMLElement)) {
    return;
  }

  const filteredCourses = getFilteredCourses();
  const outOfCount = filteredCourses.length;
  const computedLastPage = Math.max(1, Math.ceil(outOfCount / ITEMS_PER_PAGE));
  catalogState.page = Math.min(catalogState.page, computedLastPage);
  const startIndex = (catalogState.page - 1) * ITEMS_PER_PAGE;
  const visibleCourses = filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  showingRoot.textContent = `Showing ${visibleCourses.length} out of ${outOfCount}`;

  if (visibleCourses.length === 0) {
    cardsRoot.innerHTML = `
      <div class="catalog-empty-state">
        <p class="catalog-loading">No courses found.</p>
      </div>
    `;
  } else {
    cardsRoot.innerHTML = visibleCourses.map(buildCourseCard).join('');
  }

  paginationRoot.innerHTML = buildPagination(catalogState.page, computedLastPage);

  renderInstructorFilters(root);
  applyFilterStyles(root);
}

async function loadCatalogCourses(root) {
  const cardsRoot = root.querySelector('[data-catalog-cards]');
  if (cardsRoot instanceof HTMLElement) {
    cardsRoot.innerHTML = '<p class="catalog-loading">Loading courses...</p>';
  }

  try {
    const firstPayload = await fetchCourses({
      sort: catalogState.sort,
      page: 1,
    });

    const firstPageCourses = extractCourses(firstPayload);
    const total = extractTotal(firstPayload, firstPageCourses.length);
    const lastPage = extractLastPage(firstPayload, total);

    const pageRequests = [];
    for (let page = 2; page <= lastPage; page += 1) {
      pageRequests.push(fetchCourses({ sort: catalogState.sort, page }));
    }

    const restPayloads = pageRequests.length > 0 ? await Promise.all(pageRequests) : [];
    const restCourses = restPayloads.flatMap((payload) => extractCourses(payload));
    const allCourses = [...firstPageCourses, ...restCourses];

    const uniqueById = new Map();
    allCourses.forEach((course) => {
      const key = course?.id ?? `${getCourseTitle(course)}-${getCourseInstructor(course)}`;
      if (!uniqueById.has(key)) uniqueById.set(key, course);
    });

    catalogState.sourceCourses = Array.from(uniqueById.values());
    catalogState.total = catalogState.sourceCourses.length;
    catalogState.lastPage = Math.max(1, Math.ceil(catalogState.total / ITEMS_PER_PAGE));

    renderCatalogResults(root);
  } catch (_error) {
    const showingRoot = root.querySelector('[data-catalog-showing]');
    const paginationRoot = root.querySelector('[data-catalog-pagination]');
    if (cardsRoot instanceof HTMLElement) {
      cardsRoot.innerHTML = '<p class="catalog-loading">Unable to load courses right now.</p>';
    }
    if (showingRoot instanceof HTMLElement) {
      showingRoot.textContent = 'Showing 0 out of 0';
    }
    if (paginationRoot instanceof HTMLElement) {
      paginationRoot.innerHTML = '';
    }
  }
}

function toggleSetValue(set, value) {
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

function clearAllFilters(root) {
  catalogState.selectedCategories.clear();
  catalogState.selectedTopics.clear();
  catalogState.selectedInstructors.clear();
  renderCatalogResults(root);
}

function initCatalogPage() {
  const pageRoot = document.querySelector('.catalog-page');
  if (!(pageRoot instanceof HTMLElement)) return;

  const sortSelect = pageRoot.querySelector('[data-catalog-sort]');
  const paginationRoot = pageRoot.querySelector('[data-catalog-pagination]');

  if (sortSelect instanceof HTMLSelectElement) {
    sortSelect.value = catalogState.sort;
    sortSelect.addEventListener('change', () => {
      catalogState.sort = sortSelect.value;
      catalogState.page = 1;
      loadCatalogCourses(pageRoot);
    });
  }

  pageRoot.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clearButton = target.closest('[data-clear-filters]');
    if (clearButton) {
      clearAllFilters(pageRoot);
      return;
    }

    const filterButton = target.closest('[data-filter-type][data-filter-value]');
    if (filterButton) {
      const type = filterButton.getAttribute('data-filter-type');
      const value = normalize(filterButton.getAttribute('data-filter-value'));

      if (type === 'category') {
        toggleSetValue(catalogState.selectedCategories, value);
      } else if (type === 'topic') {
        toggleSetValue(catalogState.selectedTopics, value);
      } else if (type === 'instructor') {
        toggleSetValue(catalogState.selectedInstructors, value);
      }

      renderCatalogResults(pageRoot);
      return;
    }

    const pageButton = target.closest('[data-page]');
    if (pageButton instanceof HTMLButtonElement) {
      const nextPage = Number(pageButton.dataset.page);
      if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage === catalogState.page) return;
      catalogState.page = nextPage;
      renderCatalogResults(pageRoot);
    }
  });

  if (paginationRoot instanceof HTMLElement) {
    paginationRoot.innerHTML = '';
  }

  loadCatalogCourses(pageRoot);
}

export { renderCatalogPage, initCatalogPage };
