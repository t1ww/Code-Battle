// frontend\code-battle\src\types\router.d.ts
import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    hidden?: boolean;
    hideAuth?: boolean;
    requiresAuth?: boolean;
    allowedRoles?: string[];
  }
}
