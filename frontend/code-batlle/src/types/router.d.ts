import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    hidden?: boolean;
    hideAuth?: boolean;
    requiresAuth?: boolean;
    allowedRoles?: string[];
  }
}
