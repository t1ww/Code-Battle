<script setup lang="ts">
import { logoutPlayer } from "@/stores/auth";
import { onMounted } from "vue";

onMounted(() => {
  logoutPlayer();
});
</script>