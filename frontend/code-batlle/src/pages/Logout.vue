<script setup lang="ts">
import { logoutPlayer } from "@/store/auth";
import { onMounted } from "vue";

onMounted(() => {
  logoutPlayer();
});
</script>