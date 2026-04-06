import { uiStore } from '../../state/uiStore.js';
import { authStore } from '../../state/authStore.js';
import { register } from '../../services/authService.js';
import { isValidEmail, isRequired, hasMinLength } from '../../utils/validators.js';
import { createOverlayModal } from './modalBase.js';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getErrorMessage(error) {
  const source = error?.data?.errors ?? error?.data?.message ?? error?.message;

  if (typeof source === 'string') {
    return source;
  }

  if (Array.isArray(source) && source.length > 0) {
    return source.join(', ');
  }

  if (source && typeof source === 'object') {
    const values = Object.values(source).flat();
    if (values.length > 0) {
      return String(values[0]);
    }
  }

  return 'Registration failed. Please check your input.';
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
            <input id="register-password" name="password" type="password" placeholder="Password" />
          </div>
          <div class="form-group">
            <label for="register-confirm-password">Confirm Password*</label>
            <input id="register-confirm-password" name="confirmPassword" type="password" placeholder="Confirm password" />
          </div>
        </div>

        <div class="register-step-pane" data-step-pane="3" hidden>
          <div class="form-group">
            <label for="register-username">Username*</label>
            <input id="register-username" name="username" type="text" placeholder="Username" />
          </div>
          <div class="form-group">
            <label for="register-avatar">Upload Avatar</label>
            <input id="register-avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" />
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
  const avatarInput = overlay.querySelector('#register-avatar');
  const avatarPreview = overlay.querySelector('[data-avatar-preview]');
  let currentStep = 1;

  switchButton.addEventListener('click', () => {
    uiStore.openModal('login');
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
      indicator.classList.toggle('is-active', stepNumber === currentStep);
      indicator.classList.toggle('is-complete', stepNumber < currentStep);
    });

    backButton.hidden = currentStep === 1;
    submitButton.textContent = currentStep === 3 ? 'Sign Up' : 'Next';
  }

  backButton.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep -= 1;
      errorBox.textContent = '';
      renderStep();
    }
  });

  avatarInput.addEventListener('change', () => {
    errorBox.textContent = '';
    avatarPreview.innerHTML = '';

    const file = avatarInput.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      errorBox.textContent = 'Avatar must be jpg, png, or webp.';
      avatarInput.value = '';
      return;
    }

    const previewImage = document.createElement('img');
    previewImage.className = 'avatar-image';
    previewImage.alt = 'Avatar preview';
    previewImage.src = URL.createObjectURL(file);
    avatarPreview.appendChild(previewImage);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';

    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    const username = form.username.value.trim();
    const avatarFile = avatarInput.files?.[0];

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

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const response = await register(formData);
      const token = response?.token ?? response?.accessToken ?? null;
      const user = response?.user ?? response ?? null;

      if (!token) {
        throw new Error('Registration failed. Please try again.');
      }

      authStore.setAuth(token, user);
      uiStore.closeModal();
    } catch (error) {
      errorBox.textContent = getErrorMessage(error);
    }
  });

  renderStep();

  return overlay;
}

export default { createModal: createRegisterModal };
