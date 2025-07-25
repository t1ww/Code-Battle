import { createRouter, createWebHistory } from "vue-router";

// Importing all page components
import Home from "@/pages/Home.vue";
import Login from "@/pages/LoginForm.vue";
import Logout from "@/pages/Logout.vue";
import Register from "@/pages/RegisterForm.vue";
import PveLevelSelect from "./pages/pve/PveLevelSelect.vue";

import NProgress from "nprogress";
import "nprogress/nprogress.css"; // import the style
import PvpTypeSelect from "./pages/pvp/PvpTypeSelect.vue";
import PveLevelView from "./pages/pve/PveQuestionView.vue";
import Matchmaking from "./pages/pvp/Matchmaking.vue";
import PveGameplay from "./pages/pve/PveGameplay.vue";

/**
 * Meta Field Usage:
 *
 * - hidden:         Exclude the route from the navigation bar completely.
 * - hideAuth:       Hide route from navbar if user is already authenticated (e.g., login page).
 * - requiresAuth:   Route is only accessible when the user is logged in.
 * - allowedRoles:   Restrict access to users with specific roles (e.g., professors only).
 */
const routes = [
  // root / home
  { name: "Home", path: "/", component: Home },

  // pve
  { name: "PveLevelSelect", path: "/pveSelect", component: PveLevelSelect },
  { name: "PveLevelView", path: "/pveView", component: PveLevelView },
  { name: "PveGameplay", path: "/pveGameplay", component: PveGameplay },
  
  // pvp
  { name: "PvpTypeSelect", path: "/pvpSelect", component: PvpTypeSelect },
  { name: "Matchmaking", path: "/matchmaking", component: Matchmaking },
  
  // Account
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
