<template>
  <div class="container">
    <form @submit.prevent="handleLogin" class="form-box">
      <h2 class="form-title">Login</h2>

      <label>Email :</label>
      <input type="email" v-model="email" placeholder="Type your Email" required />

      <label>Password :</label>
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Type your Password"
          required />
        <button type="button" @click="showPassword = !showPassword">👁️</button>
      </div>

      <div class="forgot-text">
        <a href="#">Forgot password?</a>
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

<script setup lang="ts">
import { ref } from "vue";
import router from "@/router";
import api from "@/clients/crud.api";

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

    if (data.success && data.token && data.playerInfo) {
      loginPlayer({
        token: data.token,
        id: data.playerInfo.id,
        name: data.playerInfo.username,
        email: data.playerInfo.email,
      });

      successMessage.value = "Login successful.";
      failMessage.value = "";
      router.push("/");
    } else {
      failMessage.value = data.errorMessage || "Invalid login response.";
      successMessage.value = "";
    }
  } catch (err) {
    failMessage.value = "Login service unavailable. Please try again later.";
    successMessage.value = "";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background: #ccc;
}

.form-box {
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  border-bottom: 2px solid #666;
  background: transparent;
  font-size: 14px;
  width: 100%;
}

.password-container {
  position: relative;
}

.password-container button {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
}

.forgot-text {
  text-align: right;
  font-size: 13px;
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
