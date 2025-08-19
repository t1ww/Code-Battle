<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
    modelValue: boolean
    label?: string
    disabled?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
    if (props.disabled) return
    emit('update:modelValue', !props.modelValue)
}
</script>

<template>
    <label :class="['checkbox-line', { disabled }]">
        <input type="checkbox" :checked="modelValue" @change="toggle" :disabled="disabled" />
        <span>{{ label }}</span>
    </label>
</template>

<style scoped>
.checkbox-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    position: relative;
}

.checkbox-line input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.checkbox-line span {
    flex-shrink: 0;
    position: relative;
    padding-left: 28px;
    line-height: 1.2;
}

.checkbox-line span::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border: 2px solid #559f55;
    border-radius: 4px;
    background: white;
    box-sizing: border-box;
    transition: background-color 0.3s, border-color 0.3s;
}

.checkbox-line input[type="checkbox"]:checked+span::before {
    background-color: #559f55;
    border-color: #3e783e;
}

.checkbox-line input[type="checkbox"]:checked+span::after {
    content: "";
    position: absolute;
    left: 6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 3px 3px 0;
    pointer-events: none;
}

.checkbox-line:hover span::before {
    border-color: #3e783e;
}

/* Disabled state */
.checkbox-line.disabled {
    cursor: default;
    opacity: 0.6;
}
.checkbox-line.disabled span::before {
    background: #e0e0e0;       /* lighter gray background */
    border-color: #aaa;         /* duller border */
}
</style>
