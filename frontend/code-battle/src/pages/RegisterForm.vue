<!-- frontend\code-battle\src\pages\RegisterForm.vue -->
<script setup lang="ts">
import { ref } from "vue";
import router from "@/router";
import api from "@/clients/crud.api";

import EyeHide from "@/assets/icons.svg/EyeHide.vue";
import EyeUnhide from "@/assets/icons.svg/EyeUnhide.vue";
import UserIcon from "@/assets/icons.svg/UserIcon.vue";
import EnvelopeIcon from "@/assets/icons.svg/EnvelopeIcon.vue";
import KeyIcon from "@/assets/icons.svg/KeyIcon.vue";

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

<template>
  <div class="container">
    <form @submit.prevent="handleRegister" class="form-box">
      <h2 class="form-title">Register</h2>

      <div class="inputs">
        <label>Username :</label>
        <div class="input-with-icon">
          <UserIcon class="input-icon" />
          <input type="text" v-model="username" placeholder="Type your Username" required />
        </div>
      </div>

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

      <div class="inputs">
        <label>Confirm Password :</label>
        <div class="input-with-icon">
          <KeyIcon class="input-icon" />
          <input :type="showConfirm ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirm your Password"
            required />
          <button type="button" @click="showConfirm = !showConfirm" class="eye-toggle">
            <component :is="showConfirm ? EyeHide : EyeUnhide" class="eye-icon" />
          </button>
        </div>
      </div>

      <p class="success-message" v-if="successMessage">{{ successMessage }}</p>
      <p class="fail-message" v-if="failMessage">{{ failMessage }}</p>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? "Registering..." : "Register" }}
      </button>

      <p class="small-text">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped src="@/styles/forms.css"></style>