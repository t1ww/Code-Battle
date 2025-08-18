<!-- frontend\code-battle\src\pages\RegisterForm.vue -->
<template>
  <div class="container">
    <form @submit.prevent="handleRegister" class="form-box">
      <h2 class="form-title">Register</h2>

      <label>Username :</label>
      <input type="text" v-model="username" placeholder="Type your Username" required />

      <label>Email :</label>
      <input type="email" v-model="email" placeholder="Type your Email" required />

      <label>Password :</label>
      <div class="password-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Type your Password"
          required />
        <button type="button" @click="showPassword = !showPassword">👁️</button>
      </div>

      <label>Confirm Password :</label>
      <div class="password-container">
        <input :type="showConfirm ? 'text' : 'password'" v-model="confirmPassword" placeholder="Type your Password"
          required />
        <button type="button" @click="showConfirm = !showConfirm">👁️</button>
      </div>

      <p class="success-message" v-if="successMessage">{{ successMessage }}</p>
      <p class="fail-message" v-if="failMessage">{{ failMessage }}</p>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? "Registering..." : "Register" }}
      </button>

      <p class="small-text">
        Already have account ?
        <router-link to="/login">Login here</router-link>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import router from "@/router";
import api from "@/clients/crud.api";

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirm = ref(false);

const successMessage = ref("");
const failMessage = ref("");

const loading = ref(false);

async function handleRegister() {
  loading.value = true;
  try {
    const response = await api.post(
      "/players/register",
      {
        username: username.value,
        email: email.value,
        password: password.value,
        confirm_password: confirmPassword.value
      },
      { withCredentials: true }
    );

    successMessage.value = "Registration successful.";
    failMessage.value = "";
    console.log("res:", response.data);
    // Redirect to login
    setTimeout(() => {
      router.push("/login");
    }, 600)
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.error_message ||
      "Registration service unavailable. Please try again later.";

    failMessage.value = errorMsg;
    successMessage.value = "";
    console.error(err);
  }
  finally {
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

.small-text {
  font-size: 13px;
  text-align: center;
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
</style>
