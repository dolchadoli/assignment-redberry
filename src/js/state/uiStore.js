class UIStore {
  constructor() {
    this.modal = null;
    this.listeners = [];
  }

  getState() {
    return { modal: this.modal };
  }

  openModal(modalName) {
    this.modal = modalName;
    this.notify();
  }

  closeModal() {
    this.modal = null;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }
}

const uiStore = new UIStore();
export { uiStore };