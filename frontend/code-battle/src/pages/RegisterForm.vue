<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-300">
    <form
      @submit.prevent="handleRegister"
      class="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4"
    >
      <h2 class="text-2xl font-semibold text-center">Register</h2>

      <div>
        <label class="block mb-1">Username :</label>
        <input
          type="text"
          v-model="username"
          placeholder="Type your Username"
          class="w-full border-b border-gray-500 focus:outline-none bg-transparent"
          required
        />
      </div>

      <div>
        <label class="block mb-1">Email :</label>
        <input
          type="email"
          v-model="email"
          placeholder="Type your Email"
          class="w-full border-b border-gray-500 focus:outline-none bg-transparent"
          required
        />
      </div>

      <div>
        <label class="block mb-1">Password :</label>
        <div class="relative">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Type your Password"
            class="w-full border-b border-gray-500 focus:outline-none bg-transparent pr-8"
            required
          />
          <button type="button" class="absolute right-0 top-0 h-full" @click="showPassword = !showPassword">
            👁️
          </button>
        </div>
      </div>

      <div>
        <label class="block mb-1">Confirm Password :</label>
        <div class="relative">
          <input
            :type="showConfirm ? 'text' : 'password'"
            v-model="confirmPassword"
            placeholder="Type your Password"
            class="w-full border-b border-gray-500 focus:outline-none bg-transparent pr-8"
            required
          />
          <button type="button" class="absolute right-0 top-0 h-full" @click="showConfirm = !showConfirm">
            👁️
          </button>
        </div>
      </div>

      <p v-if="successMessage" class="text-sm text-green-600 text-center">{{ successMessage }}</p>

      <button type="submit" class="w-full bg-gray-600 text-white py-2">Register</button>

      <p class="text-center text-sm mt-2">
        already have account ?
        <a href="#" class="text-black underline">login</a>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const successMessage = ref('');

function handleRegister() {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match');
    return;
  }

  // Simulate API call
  setTimeout(() => {
    successMessage.value = 'Registration successful.';
  }, 500);
}
</script>
