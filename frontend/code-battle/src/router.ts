import { createRouter, createWebHistory } from "vue-router";

// Importing all page components
import Home from "@/pages/Home.vue";
import Login from "@/pages/LoginForm.vue";
import Logout from "@/pages/Logout.vue";
import Register from "@/pages/RegisterForm.vue";

import NProgress from "nprogress";
import "nprogress/nprogress.css"; // import the style

/**
 * Meta Field Usage:
 *
 * - hidden:         Exclude the route from the navigation bar completely.
 * - hideAuth:       Hide route from navbar if user is already authenticated (e.g., login page).
 * - requiresAuth:   Route is only accessible when the user is logged in.
 * - allowedRoles:   Restrict access to users with specific roles (e.g., professors only).
 */
const routes = [
  { name: "Home", path: "/", component: Home },
  { name: "Login", path: "/login", component: Login, meta: { hideAuth: true } },
  { name: "Logout", path: "/logout", component: Logout, meta: { requiresAuth: true }},
  {
    name: "Register",
    path: "/register",
    component: Register,
    meta: { hidden: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes, 
});

// ⏳ Start progress before route changes
router.beforeEach((_to, _from, next) => {
  NProgress.start();
  next();
});

// Done progress after route fully loads
router.afterEach(() => {
  NProgress.done();
});

export default router;
