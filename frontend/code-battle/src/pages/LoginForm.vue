<!-- frontend\code-battle\src\pages\LoginForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import router from "@/router";
import api from "@/clients/crud.api";

import EyeHide from "@/assets/icons.svg/EyeHide.vue";
import EyeUnhide from "@/assets/icons.svg/EyeUnhide.vue";

const email = ref("");
const password = ref("");
const showPassword = ref(false);

const successMessage = ref("");
const failMessage = ref("");
const loading = ref(false);

import { loginPlayer } from "@/stores/auth";
import KeyIcon from "@/assets/icons.svg/KeyIcon.vue";
import EnvelopeIcon from "@/assets/icons.svg/EnvelopeIcon.vue";

async function handleLogin() {
  if (!email.value || !password.value) {
    failMessage.value = "Please enter both email and password.";
    successMessage.value = "";
    return;
  }

  loading.value = true;
  try {
    const response = await api.post("/players/login", {
      email: email.value,
      password: password.value,
    }, { withCredentials: true });

    const data = response.data;

    if (data.token && data.player_info) {
      loginPlayer({
        token: data.token,
        id: data.player_info.id,
        name: data.player_info.username,
        email: data.player_info.email,
      });

      successMessage.value = "Login successful.";
      failMessage.value = "";
      router.push("/");
    } else {
      failMessage.value = data.errorMessage || "Invalid login response.";
      successMessage.value = "";
    }
  } catch (err: any) {
    const msg =
      err?.response?.data?.error_message ||
      "Login service unavailable. Please try again later.";

    failMessage.value = msg;
    successMessage.value = "";
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="container">
    <form @submit.prevent="handleLogin" class="form-box">
      <h2 class="form-title">Login</h2>

      <div class="inputs-wrapper">

        <div class="inputs">
          <label>Email :</label>
          <div class="input-with-icon">
            <EnvelopeIcon class="input-icon" />
            <input type="email" v-model="email" placeholder="Type your Email" required />
          </div>
        </div>

        <div class="inputs">
          <label>Password :</label>
          <div class="input-with-icon">
            <KeyIcon class="input-icon" />
            <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Type your Password"
              required />
            <button type="button" @click="showPassword = !showPassword" class="eye-toggle">
              <component :is="showPassword ? EyeHide : EyeUnhide" class="eye-icon" />
            </button>
          </div>
        </div>

      </div>

      <p class="success-message" v-if="successMessage">{{ successMessage }}</p>
      <p class="fail-message" v-if="failMessage">{{ failMessage }}</p>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? "Logging in..." : "Login" }}
      </button>

      <p class="small-text">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped src="@/styles/forms.css"></style>

<!-- Overwrite css block -->
<style scoped>
.submit-btn {
  margin-top: 4rem;
}
</style>
