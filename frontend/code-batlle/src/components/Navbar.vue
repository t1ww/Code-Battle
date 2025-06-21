<script setup lang="ts">
import { computed } from "vue"
import router from "@/router"
import { getPlayerData, isAuthenticated } from "@/store/auth"

const filteredRoutes = computed(() => {
  const userRole = getPlayerData()?.role

  // Filter routes for navbar display based on their meta fields in router.ts
  // (e.g., hidden, requiresAuth, hideAuth, allowedRoles)
  return router.getRoutes().filter(route => {
    if (route.meta?.hidden) return false
    if (route.meta?.requiresAuth && !isAuthenticated.value) return false
    if (route.meta?.hideAuth && isAuthenticated.value) return false
    if (route.meta?.allowedRoles?.length && userRole != null && !route.meta.allowedRoles.includes(userRole)) {
      return false
    }
    return true
  })
})
</script>

<template>
  <nav class="navbar">
    <router-link to="/">
      <img
        src="https://smartoffice.camt.cmu.ac.th/v1r/img/camt_logo.png"
        class="logo" to="/view-question">
    </router-link>
    <ul class="nav-links">
      <li v-for="item in filteredRoutes" :key="item.path">


        <router-link :to="item.path">
          <div :class="{ 'green-text': item.path === $route.path }">
            {{ item.name }}
          </div>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.green-text {
  color: #7b6e5a;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 100%;
  background: #ff9233;
  padding: 1rem 2rem;
  color: rgb(255, 255, 255);
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  list-style: none;
}

.nav-links a {
  text-decoration: none;
  color: white;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #9d7643;
}
</style>
