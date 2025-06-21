<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { loginPlayer } from "@/store/auth";


const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

const router = useRouter();

const handleLogin = async () => {
  error.value = "";
  loading.value = true;
  try {
    const { data } = await axios.post("/players/login", {
      email: email.value,
      password: password.value,
    });

    loginPlayer({
      token: data.token,
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    });

    router.push({ path: "/" });
  } catch (err: any) {
    error.value =
      err.response?.data?.error || "Login failed. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-box">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="input-group">
        <label>Email Address</label>
        <input type="email" v-model="email" required />
      </div>

      <div class="input-group">
        <label>Password</label>
        <div class="password-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            required
          />
          <span class="toggle" @click="showPassword = !showPassword">
            {{ showPassword ? "Hide" : "Show" }}
          </span>
        </div>
      </div>

      <div class="forgot-password">
        <a href="#">Forgot Password ?</a>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? "Logging in..." : "Login" }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
.login-box {
  max-width: 400px;
  margin: 100px auto;
  padding: 30px;
  border: 1px solid #f57c00;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  background-color: white;
}

h2 {
  color: #f57c00;
  margin-bottom: 25px;
  font-size: 24px;
  font-weight: bold;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 60px;
}

.toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #c15555;
  font-size: 0.85em;
  cursor: pointer;
  user-select: none;
}

.forgot-password {
  text-align: right;
  margin-top: -10px;
  margin-bottom: 20px;
}

.forgot-password a {
  font-size: 0.9em;
  color: #cc7c7c;
  text-decoration: none;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #f57c00;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 15px;
}
</style>
