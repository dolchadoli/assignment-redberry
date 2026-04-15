import { uiStore } from '../../state/uiStore.js';
import { authStore } from '../../state/authStore.js';
import { register, login, updateProfile, fetchCurrentUser } from '../../services/authService.js';
import { isValidEmail, isRequired, hasMinLength } from '../../utils/validators.js';
import { createOverlayModal } from './modalBase.js';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_DRAFT_KEY = 'pendingProfileDraft';

const REGISTER_ERROR_PRIORITY = [
  'username',
  'email',
  'mobile',
  'mobile_number',
  'phone',
  'phone_number',
  'age',
  'password',
  'password_confirmation',
];

function getErrorMessage(error, priority = REGISTER_ERROR_PRIORITY) {
  const validationErrors = error?.data?.errors;
  if (validationErrors && typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
    for (const key of priority) {
      const value = validationErrors[key];
      const firstMessage = Array.isArray(value) ? value.find(Boolean) : value;
      if (firstMessage) {
        return String(firstMessage);
      }
    }

    for (const value of Object.values(validationErrors)) {
      const firstMessage = Array.isArray(value) ? value.find(Boolean) : value;
      if (firstMessage) {
        return String(firstMessage);
      }
    }
  }

  if (typeof error?.data?.message === 'string' && error.data.message.trim()) {
    return error.data.message;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return 'Request failed. Please try again.';
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

function saveProfileDraft({ username, mobile, age }) {
  const payload = {
    username: String(username || '').trim(),
    mobile: String(mobile || '').trim(),
    age: Number(age),
    savedAt: Date.now(),
  };

  localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(payload));
}

function extractToken(payload) {
  return (
    payload?.token ??
    payload?.accessToken ??
    payload?.access_token ??
    payload?.data?.token ??
    payload?.data?.accessToken ??
    payload?.data?.access_token ??
    null
  );
}

function extractUser(payload) {
  return payload?.user ?? payload?.data?.user ?? payload ?? null;
}

async function syncProfileAfterAuth({
  username,
  mobile,
  age,
  avatarFile,
}) {
  const normalizedMobile = normalizeGeorgianMobile(mobile);
  if (!normalizedMobile) {
    throw new Error('Please enter a valid Georgian mobile number.');
  }

  const readUser = (payload) => payload?.data ?? payload?.user ?? payload ?? {};
  const getMobile = (user) => String(
    user?.mobile
    ?? user?.mobile_number
    ?? user?.mobileNumber
    ?? user?.phone
    ?? user?.phone_number
    ?? user?.phoneNumber
    ?? user?.phone_local
    ?? user?.mobile_local
    ?? ''
  ).trim();
  const getAge = (user) => Number(user?.age ?? user?.user_age ?? user?.years ?? NaN);

  async function hasRequiredProfileFields() {
    try {
      const userPayload = await fetchCurrentUser();
      const user = readUser(userPayload);
      const mobileValue = getMobile(user);
      const ageValue = getAge(user);
      return mobileValue.length > 0 && Number.isFinite(ageValue) && ageValue >= 16;
    } catch (_error) {
      return false;
    }
  }

  const mobileCandidates = [
    normalizedMobile.local,
    `995${normalizedMobile.local}`,
    normalizedMobile.international,
  ];
  const endpoints = ['/profile', '/me', '/user/profile'];
  const methods = ['PUT', 'POST', 'PATCH'];
  let lastError = null;
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
        body.append('mobile_local', normalizedMobile.local);
        body.append('phone_local', normalizedMobile.local);
        if (avatarFile) {
          body.append('avatar', avatarFile);
        }
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
        mobile_local: normalizedMobile.local,
        phone_local: normalizedMobile.local,
      }),
      () => ({
        full_name: username,
        age,
        mobile: mobileValue,
        phone: mobileValue,
      }),
    ];

    for (const makePayload of payloadBuilders) {
      for (const endpoint of endpoints) {
        for (const method of methods) {
          try {
            await updateProfile(makePayload(), { method, endpoint });
            if (await hasRequiredProfileFields()) {
              return;
            }
          } catch (error) {
            lastError = error;
          }
        }
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
}

function createRegisterModal() {
  const html = `
    <div class="modal-header">
      <button class="modal-back" type="button" data-modal-back aria-label="Go back">&larr;</button>
      <h2>Create Account</h2>
      <button class="modal-close" data-modal-close>&times;</button>
    </div>
    <div class="modal-body">
      <p class="modal-subtitle">Join and start learning today</p>
      <div class="register-steps" aria-hidden="true">
        <span class="register-step"></span>
        <span class="register-step"></span>
        <span class="register-step"></span>
      </div>
      <form class="form form-register" enctype="multipart/form-data">
        <div class="register-step-pane" data-step-pane="1">
          <div class="form-group">
            <label for="register-email">Email*</label>
            <input id="register-email" name="email" type="email" placeholder="you@example.com" />
          </div>
        </div>

        <div class="register-step-pane" data-step-pane="2" hidden>
          <div class="form-group">
            <label for="register-password">Password*</label>
            <div class="input-with-toggle">
              <input id="register-password" name="password" type="password" placeholder="Password" />
              <button class="password-toggle" type="button" data-password-toggle="register-password" aria-label="Show password"></button>
            </div>
          </div>
          <div class="form-group">
            <label for="register-confirm-password">Confirm Password*</label>
            <div class="input-with-toggle">
              <input id="register-confirm-password" name="confirmPassword" type="password" placeholder="Confirm password" />
              <button class="password-toggle" type="button" data-password-toggle="register-confirm-password" aria-label="Show password"></button>
            </div>
          </div>
        </div>

        <div class="register-step-pane" data-step-pane="3" hidden>
          <div class="form-group">
            <label for="register-username">Username*</label>
            <input id="register-username" name="username" type="text" placeholder="Username" />
          </div>
          <div class="register-inline-fields">
            <div class="form-group">
              <label for="register-mobile">Mobile Number*</label>
              <input id="register-mobile" name="mobile" type="text" placeholder="599123456" />
            </div>
            <div class="form-group register-age-field">
              <label for="register-age">Age*</label>
              <input id="register-age" name="age" type="number" min="16" max="99" placeholder="29" />
            </div>
          </div>
          <div class="form-group">
            <label for="register-avatar">Upload Avatar</label>
            <div class="avatar-dropzone" data-avatar-dropzone>
              <input id="register-avatar" class="avatar-input-hidden" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" />
              <span class="avatar-dropzone-icon" aria-hidden="true"></span>
              <p class="avatar-dropzone-text">Drag and drop or <button type="button" class="avatar-browse-btn" data-avatar-browse>Upload file</button></p>
              <p class="avatar-dropzone-hint">JPG, PNG or WebP</p>
            </div>
            <div class="avatar-preview" data-avatar-preview></div>
          </div>
        </div>

        <div class="form-error" aria-live="polite"></div>
        <button class="btn btn-primary" type="submit" data-register-submit>Next</button>
      </form>
      <div class="modal-divider"><span>or</span></div>
      <p class="modal-switch">Already have an account? <button class="modal-link" type="button">Log In</button></p>
    </div>
  `;

  const overlay = createOverlayModal(html, () => uiStore.closeModal());
  const modalCard = overlay.querySelector('.modal-card');
  const form = overlay.querySelector('.form-register');
  const errorBox = overlay.querySelector('.form-error');
  const switchButton = overlay.querySelector('.modal-link');
  const backButton = overlay.querySelector('[data-modal-back]');
  const submitButton = overlay.querySelector('[data-register-submit]');
  const stepPanes = overlay.querySelectorAll('[data-step-pane]');
  const stepIndicators = overlay.querySelectorAll('.register-step');
  const passwordToggleButtons = overlay.querySelectorAll('[data-password-toggle]');
  const avatarInput = overlay.querySelector('#register-avatar');
  const avatarDropzone = overlay.querySelector('[data-avatar-dropzone]');
  const avatarBrowseButton = overlay.querySelector('[data-avatar-browse]');
  const avatarPreview = overlay.querySelector('[data-avatar-preview]');
  let currentStep = 1;
  let isSubmitting = false;

  switchButton.addEventListener('click', () => {
    uiStore.openModal('login');
  });

  passwordToggleButtons.forEach((toggleButton) => {
    const targetInputId = toggleButton.getAttribute('data-password-toggle');
    const targetInput = overlay.querySelector(`#${targetInputId}`);

    if (!targetInput) {
      return;
    }

    toggleButton.addEventListener('click', () => {
      const isVisible = targetInput.type === 'text';
      targetInput.type = isVisible ? 'password' : 'text';
      toggleButton.classList.toggle('is-visible', !isVisible);
      toggleButton.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    });
  });

  function renderStep() {
    if (modalCard) {
      modalCard.classList.add('modal-card--register');
      modalCard.dataset.step = String(currentStep);
    }

    stepPanes.forEach((pane, index) => {
      pane.hidden = index + 1 !== currentStep;
    });

    stepIndicators.forEach((indicator, index) => {
      const stepNumber = index + 1;
      const isComplete = stepNumber < currentStep;
      const isActive = currentStep < 3 && stepNumber === currentStep;
      indicator.classList.toggle('is-active', isActive);
      indicator.classList.toggle('is-complete', isComplete);
    });

    backButton.hidden = currentStep === 1;
    submitButton.textContent = currentStep === 3 ? 'Sign Up' : 'Next';
    submitButton.disabled = isSubmitting;
  }

  backButton.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep -= 1;
      errorBox.textContent = '';
      renderStep();
    }
  });

  function showAvatarPreview(file) {
    avatarPreview.innerHTML = '';
    const previewImage = document.createElement('img');
    previewImage.className = 'avatar-image';
    previewImage.alt = 'Avatar preview';
    previewImage.src = URL.createObjectURL(file);
    avatarPreview.appendChild(previewImage);
  }

  function setAvatarInputFile(file) {
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      avatarInput.files = transfer.files;
    } catch {
      // Ignore assignment failures in older browsers.
    }
  }

  function handleAvatarFile(file) {
    errorBox.textContent = '';
    avatarDropzone.classList.remove('is-dragover');

    if (!file) {
      avatarPreview.innerHTML = '';
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      errorBox.textContent = 'Avatar must be jpg, png, or webp.';
      avatarInput.value = '';
      avatarPreview.innerHTML = '';
      return;
    }

    showAvatarPreview(file);
  }

  avatarBrowseButton.addEventListener('click', () => {
    avatarInput.click();
  });

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    handleAvatarFile(file);
  });

  avatarDropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    avatarDropzone.classList.add('is-dragover');
  });

  avatarDropzone.addEventListener('dragleave', () => {
    avatarDropzone.classList.remove('is-dragover');
  });

  avatarDropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      avatarDropzone.classList.remove('is-dragover');
      return;
    }

    setAvatarInputFile(file);
    handleAvatarFile(file);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    errorBox.textContent = '';

    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    const username = form.username.value.trim();
    const mobileRaw = form.mobile?.value?.trim() || '';
    const ageRaw = form.age?.value?.trim() || '';
    const avatarFile = avatarInput.files?.[0];

    const normalizedMobile = normalizeGeorgianMobile(mobileRaw);
    const age = Number(ageRaw);

    if (currentStep === 1) {
      if (!isRequired(email) || !hasMinLength(email, 3) || !isValidEmail(email)) {
        errorBox.textContent = 'Please enter a valid email address.';
        return;
      }

      currentStep = 2;
      renderStep();
      return;
    }

    if (currentStep === 2) {
      if (!isRequired(password) || !hasMinLength(password, 3)) {
        errorBox.textContent = 'Password must be at least 3 characters.';
        return;
      }

      if (!isRequired(confirmPassword) || !hasMinLength(confirmPassword, 3)) {
        errorBox.textContent = 'Confirm password must be at least 3 characters.';
        return;
      }

      if (password !== confirmPassword) {
        errorBox.textContent = 'Passwords do not match.';
        return;
      }

      currentStep = 3;
      renderStep();
      return;
    }

    if (!isRequired(username) || !hasMinLength(username, 3)) {
      errorBox.textContent = 'Username must be at least 3 characters.';
      return;
    }

    if (!normalizedMobile) {
      errorBox.textContent = 'Mobile number must be 9 digits and start with 5.';
      return;
    }

    if (!Number.isFinite(age) || age < 16) {
      errorBox.textContent = 'Age must be at least 16.';
      return;
    }

    if (!isRequired(email) || !hasMinLength(email, 3) || !isValidEmail(email)) {
      errorBox.textContent = 'Please enter a valid email address.';
      return;
    }

    if (!isRequired(password) || !hasMinLength(password, 3)) {
      errorBox.textContent = 'Password must be at least 3 characters.';
      return;
    }

    if (password !== confirmPassword) {
      errorBox.textContent = 'Passwords do not match.';
      return;
    }

    if (avatarFile && !ALLOWED_AVATAR_TYPES.includes(avatarFile.type)) {
      errorBox.textContent = 'Avatar must be jpg, png, or webp.';
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', confirmPassword);

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      isSubmitting = true;
      renderStep();
      saveProfileDraft({
        username,
        mobile: normalizedMobile.local,
        age,
      });

      const response = await register(formData);
      const token = extractToken(response);
      const user = extractUser(response);

      if (!token) {
        const loginResponse = await login(email, password);
        const loginToken = extractToken(loginResponse);
        const loginUser = extractUser(loginResponse);

        if (!loginToken) {
          throw new Error('Registration succeeded but login token was not returned.');
        }

        authStore.setAuth(loginToken, loginUser);
        try {
          await syncProfileAfterAuth({
            username,
            mobile: normalizedMobile.local,
            age,
            avatarFile,
          });
        } catch (_profileError) {
          // Registration/login already succeeded; do not block the user in modal.
        }
        uiStore.closeModal();
        return;
      }

      authStore.setAuth(token, user);
      try {
        await syncProfileAfterAuth({
          username,
          mobile: normalizedMobile.local,
          age,
          avatarFile,
        });
      } catch (_profileError) {
        // Registration/login already succeeded; do not block the user in modal.
      }
      uiStore.closeModal();
    } catch (error) {
      errorBox.textContent = getErrorMessage(error);
    } finally {
      isSubmitting = false;
      renderStep();
    }
  });

  renderStep();

  return overlay;
}

export default { createModal: createRegisterModal };
