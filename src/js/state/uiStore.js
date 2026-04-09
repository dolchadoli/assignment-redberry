class UIStore {
  constructor() {
    this.modal = null;
    this.sidebar = null;
    this.listeners = [];
  }

  getState() {
    return { modal: this.modal, sidebar: this.sidebar };
  }

  openModal(modalName) {
    this.modal = modalName;
    this.notify();
  }

  closeModal() {
    this.modal = null;
    this.notify();
  }

  openSidebar(sidebarName) {
    this.sidebar = sidebarName;
    this.notify();
  }

  closeSidebar() {
    this.sidebar = null;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(item => item !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }
}

const uiStore = new UIStore();
export { uiStore };
