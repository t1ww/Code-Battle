<script setup lang="ts">
defineProps<{
    questionData: {
        id: number; 
        questionName: string;
        questionDescription: string;
    }
}>();
</script>

<template>
    <div class="question-card">
        <h3>{{ questionData.questionName }}</h3>
        <p>{{ questionData.questionDescription }}</p>
    </div>
</template>

<style scoped>
.question-card {
    padding: 15px;
    background: #ffffff; /* White background */
    border-radius: 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s ease-in-out, transform 0.1s ease-in-out;
    text-align: left;
    color: #333; /* Dark gray text for readability */
    font-family: Arial, sans-serif;
}

.question-card:hover {
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

h3 {
    margin: 0;
    font-size: 18px;
    font-weight: bold;
    color: #222; /* Ensures header is readable */
}

p {
    margin-top: 5px;
    font-size: 14px;
    color: #555; /* Slightly lighter text for description */
}
</style>
