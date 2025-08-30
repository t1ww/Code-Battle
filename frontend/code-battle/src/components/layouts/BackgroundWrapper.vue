<!-- frontend\code-battle\src\components\layouts\BackgroundWrapper.vue -->
<script setup lang="ts">
import { RouterView } from "vue-router";
import CodeRainBackground from "@/components/layouts/CodeRainBackground.vue";
import BackButton from "../etc/BackButton.vue";
</script>

<template>
    <div class="background-wrapper">
        <!-- code rain runs as background -->
        <CodeRainBackground />

        <!-- page content on top -->
        <div class="foreground">
            <BackButton />
            <RouterView :key="$route.fullPath" />
        </div>
    </div>
</template>

<style scoped>
.background-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

/* background stays behind */
.background-wrapper>*:first-child {
    position: absolute;
    inset: 0;
}

/* foreground content is above rain */
.foreground {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
}
</style>
