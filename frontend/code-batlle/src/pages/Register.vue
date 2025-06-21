<script setup lang="ts">
import { ref } from "vue";

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
</script>

<template>
  <div class="register-box">
    <h2>Register</h2>
    <form>
      <div class="input-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" v-model="email" required />
      </div>

      <div class="input-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? "Registering..." : "Register" }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
.register-box {
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
  font-family: monospace;
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
