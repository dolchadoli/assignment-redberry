class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentRoute = null;
    this.params = {};

    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute(); // Handle initial route
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes.find(r => this.matchRoute(r.path, hash));

    if (route) {
      this.currentRoute = route;
      this.params = this.getParams(route.path, hash);
      route.handler(this.params);
    } else {
      // Default to not found or dashboard
      const notFoundRoute = this.routes.find(r => r.path === '/not-found');
      if (notFoundRoute) {
        notFoundRoute.handler({});
      }
    }
  }

  matchRoute(path, hash) {
    const pathParts = path.split('/');
    const hashParts = hash.split('/');

    if (pathParts.length !== hashParts.length) return false;

    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i].startsWith(':')) continue;
      if (pathParts[i] !== hashParts[i]) return false;
    }

    return true;
  }

  getParams(path, hash) {
    const params = {};
    const pathParts = path.split('/');
    const hashParts = hash.split('/');

    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i].startsWith(':')) {
        const paramName = pathParts[i].slice(1);
        params[paramName] = hashParts[i];
      }
    }

    return params;
  }

  navigate(path) {
    window.location.hash = path;
  }
}

export default Router;