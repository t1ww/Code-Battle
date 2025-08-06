import { createRouter, createWebHistory } from "vue-router";

// Importing all page components
import Home from "@/pages/Home.vue";
import Login from "@/pages/LoginForm.vue";
import Logout from "@/pages/Logout.vue";
import Register from "@/pages/RegisterForm.vue";
import PveLevelSelect from "./pages/pve/PveLevelSelect.vue";

import NProgress from "nprogress";
import "nprogress/nprogress.css"; // import the style
import PvpTypeSelect from "@/pages/pvp/PvpTypeSelect.vue";
import PveLevelView from "@/pages/pve/PveQuestionView.vue";
import Matchmaking from "@/pages/pvp/Matchmaking.vue";
import PveGameplay from "@/pages/pve/PveGameplay.vue";
import JoinTeamPage from "@/components/pvp/JoinTeamPage.vue";
import { isAuthenticated } from "@/stores/auth";

/**
 * Meta Field Usage:
 *
 * - hidden:         Exclude the route from the navigation bar completely.
 * - hideAuth:       Hide route from navbar if user is already authenticated (e.g., login page).
 * - requiresAuth:   Route is only accessible when the user is logged in.
 * - backTo:         Optional path the back button should navigate to from this route.
 */
const routes = [
  // root / home
  { name: "Home", path: "/", component: Home, meta: { requiresAuth: true } },

  // pve
  { name: "PveLevelSelect", path: "/pveSelect", component: PveLevelSelect, meta: { requiresAuth: true, backTo: "/" } },
  { name: "PveLevelView", path: "/pveView", component: PveLevelView, meta: { requiresAuth: true, backTo: "/pveSelect" } },
  { name: "PveGameplay", path: "/pveGameplay", component: PveGameplay, meta: { requiresAuth: true } },

  // pvp
  { name: "PvpTypeSelect", path: "/pvpSelect", component: PvpTypeSelect, meta: { requiresAuth: true, backTo: "/" } },
  { name: "Matchmaking", path: "/matchmaking", component: Matchmaking, meta: { requiresAuth: true } },

  // Account
  { name: "Login", path: "/login", component: Login, meta: { hideAuth: true } },
  { name: "Logout", path: "/logout", component: Logout, meta: { requiresAuth: true } },
  {
    name: "Register",
    path: "/register",
    component: Register,
    meta: { hideAuth: true, hidden: true, backTo: "/login" },
  },
  {
    path: "/join/:inviteId",
    name: "JoinTeam",
    component: JoinTeamPage,
    meta: { requiresAuth: true }
  },
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ⏳ Start progress before route changes
router.beforeEach((to, _from, next) => {
  NProgress.start();

  // Redirect to Login if route requires auth but user is not logged in
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'Login' });
    // Redirect away from Login/Register if already logged in (optional)
  } else if (to.meta.hideAuth && isAuthenticated.value) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

// Done progress after route fully loads
router.afterEach(() => {
  NProgress.done();
});

export default router;
