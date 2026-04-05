import { uiStore } from '../../state/uiStore.js';
import { authStore } from '../../state/authStore.js';
import { login } from '../../services/authService.js';
import { isValidEmail, isRequired, hasMinLength } from '../../utils/validators.js';
import { createOverlayModal } from './modalBase.js';

function createLoginModal() {
  const html = `
    <div class="modal-header">
      <h2>Log In</h2>
      <button class="modal-close" data-modal-close>&times;</button>
    </div>
    <div class="modal-body">
      <form class="form form-login">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" placeholder="Enter your email" required />
        </div>
        <div class="form-group">
          <label for="login-password">Password</label>
          <input id="login-password" name="password" type="password" placeholder="Enter your password" required />
        </div>
        <div class="form-error" aria-live="polite"></div>
        <button class="btn btn-primary" type="submit">Log In</button>
      </form>
      <p class="modal-switch">Don't have an account? <button class="modal-link" type="button">Sign Up</button></p>
    </div>
  `;

  const overlay = createOverlayModal(html, () => uiStore.closeModal());
  const form = overlay.querySelector('.form-login');
  const errorBox = overlay.querySelector('.form-error');
  const switchButton = overlay.querySelector('.modal-link');

  switchButton.addEventListener('click', () => {
    uiStore.openModal('register');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!isRequired(email) || !isValidEmail(email)) {
      errorBox.textContent = 'Please enter a valid email address.';
      return;
    }

    if (!isRequired(password) || !hasMinLength(password, 3)) {
      errorBox.textContent = 'Password must be at least 3 characters.';
      return;
    }

    try {
      const response = await login(email, password);
      const token = response.token || response.accessToken || null;
      const user = response.user || response;

      if (!token) {
        throw new Error('Unable to log in. Please try again.');
      }

      authStore.setAuth(token, user);
      uiStore.closeModal();
    } catch (error) {
      const message = error?.data?.message || error?.message || 'Login failed. Check your credentials.';
      errorBox.textContent = message;
    }
  });

  return overlay;
}

export default { createModal: createLoginModal };

