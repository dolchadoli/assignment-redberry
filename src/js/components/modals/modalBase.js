export function createOverlayModal(innerHtml, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      ${innerHtml}
    </div>
  `;

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      onClose();
    }
  });

  const closeButton = overlay.querySelector('[data-modal-close]');
  if (closeButton) {
    closeButton.addEventListener('click', (event) => {
      event.preventDefault();
      onClose();
    });
  }

  return overlay;
}