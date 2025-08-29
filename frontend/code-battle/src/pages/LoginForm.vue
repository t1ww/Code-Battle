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
          <input type="email" v-model="email" placeholder="Type your Email" required />
        </div>

        <div class="inputs">
          <label>Password :</label>
          <div class="password-container">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Type your Password"
              required />
            <button type="button" @click="showPassword = !showPassword">👁️</button>
            
          </div>
        </div>
      </div>

      <p class="success-message" v-if="successMessage">{{ successMessage }}</p>
      <p class="fail-message" v-if="failMessage">{{ failMessage }}</p>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? "Logging in..." : "Login" }}
      </button>

      <p class="small-text">
        Not have an account?
        <router-link to="/register">Register here</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped>
label {
  text-align: left;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background: #ccc;
}

.form-box {
  background: #171717;
  color: white;
  padding: 32px;
  width: 320px;
  display: flex;
  flex-direction: column;

  /* optional: main border */
  border: .1rem solid #3fff1d;
  border-radius: .5rem;
  /* outward fade */
  box-shadow: 0 0 .3rem .1rem #38F814;
}

.form-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 8px;
}

input {
  color: black;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  padding: 8px;
  border: none;
  border-bottom: 2px solid #7DD956;
  background: transparent;
  font-size: 14px;
  width: 100%;
}

.inputs {
  text-align: left;
  margin-top: 1rem;
  margin-right: 1rem;
}

.password-container {
  position: relative;
}

.password-container button {
  position: absolute;
  right: -.8rem;
  top: 0;
  height: 100%;
  width: 0rem;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
}

.password-container button:active {
  cursor: default;
}

.success-message {
  color: green;
  font-size: 13px;
  text-align: center;
}

.fail-message {
  color: rgb(128, 0, 0);
  font-size: 11px;
  text-align: center;
  text-decoration: underline;
}

.submit-btn {
  background: #666;
  color: #fff;
  padding: 10px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  margin-top: 4rem;
  margin-bottom: 1rem;
  margin-inline: 1.5rem;
}

.submit-btn:disabled {
  color: #646464;
  background: #272727;
  cursor: not-allowed;
  opacity: 0.7;
}

.submit-btn:active:not(:disabled) {
  background: #aaa;
  transform: scale(0.98);
}

.small-text {
  font-size: 13px;
  text-align: center;
}
</style>
