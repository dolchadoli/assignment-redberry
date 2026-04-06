import { uiStore } from '../../state/uiStore.js';
import { authStore } from '../../state/authStore.js';
import { register } from '../../services/authService.js';
import { isValidEmail, isRequired, hasMinLength } from '../../utils/validators.js';
import { createOverlayModal } from './modalBase.js';

function createRegisterModal() {
  const html = `
    <div class="modal-header">
      <h2>Sign Up</h2>
      <button class="modal-close" data-modal-close>&times;</button>
    </div>
    <div class="modal-body">
      <form class="form form-register" enctype="multipart/form-data">
        <div class="form-group">
          <label for="register-username">Username</label>
          <input id="register-username" name="username" type="text" placeholder="Choose a username" required />
        </div>
        <div class="form-group">
          <label for="register-email">Email</label>
          <input id="register-email" name="email" type="email" placeholder="Enter your email" required />
        </div>
        <div class="form-group">
          <label for="register-password">Password</label>
          <input id="register-password" name="password" type="password" placeholder="Create a password" required />
        </div>
        <div class="form-group">
          <label for="register-confirm-password">Confirm Password</label>
          <input id="register-confirm-password" name="confirmPassword" type="password" placeholder="Confirm your password" required />
        </div>
        <div class="form-group">
          <label for="register-avatar">Avatar (optional)</label>
          <input id="register-avatar" name="avatar" type="file" accept="image/*" />
          <div class="avatar-preview"></div>
        </div>
        <div class="form-error" aria-live="polite"></div>
        <button class="btn btn-primary" type="submit">Sign Up</button>
      </form>
      <p class="modal-switch">Already have an account? <button class="modal-link" type="button">Log In</button></p>
    </div>
  `;

  const overlay = createOverlayModal(html, () => uiStore.closeModal());
  const form = overlay.querySelector('.form-register');
  const errorBox = overlay.querySelector('.form-error');
  const switchButton = overlay.querySelector('.modal-link');
  const avatarInput = overlay.querySelector('#register-avatar');
  const previewContainer = overlay.querySelector('.avatar-preview');

  switchButton.addEventListener('click', () => {
    uiStore.openModal('login');
  });

  avatarInput.addEventListener('change', () => {
    previewContainer.innerHTML = '';
    const file = avatarInput.files[0];
    if (!file) return;

    const image = document.createElement('img');
    image.src = URL.createObjectURL(file);
    image.alt = 'Avatar preview';
    image.className = 'avatar-image';
    previewContainer.appendChild(image);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';

    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    if (!isRequired(username) || !hasMinLength(username, 3)) {
      errorBox.textContent = 'Username must be at least 3 characters.';
      return;
    }

    if (!isRequired(email) || !isValidEmail(email)) {
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

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    const file = avatarInput.files[0];
    if (file) {
      formData.append('avatar', file);
    }

    try {
      const response = await register(formData);
      const token = response.token || response.accessToken || null;
      const user = response.user || response;

      if (!token) {
        throw new Error('Registration failed. Please try again.');
      }

      authStore.setAuth(token, user);
      uiStore.closeModal();
    } catch (error) {
      const backendMessage = error?.data?.message || error?.data?.errors || error?.message;
      const message = typeof backendMessage === 'string' ? backendMessage : 'Registration failed. Please check your input.';
      errorBox.textContent = message;
    }
  });

  return overlay;
}

export default { createModal: createRegisterModal };
