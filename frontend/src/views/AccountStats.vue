<template>

    <div class="content-page">
        <h2>Your Account Stats</h2>

        <h3>Gemini API usage</h3>
        <p>Check your statistics at <a href="https://aistudio.google.com/usage">Google AI Studio</a>:
            Select time range 1 day, choose one TTS model and check request count.</p>
        <p>Free tier has strict limits for the number of <strong>requests per day</strong> (RPD) - <strong>{{
            freeTierRequestPerDay
                }}</strong>. The quota resets at midnight Pacific time - that's <strong>{{ localResetTimeString
                }}</strong> in
            your timezone. </p>
        <p>Check RPD value at <a href="https://ai.google.dev/gemini-api/docs/rate-limits#free-tier">rate limits docs</a>
            to confirm. Look for "Gemini 2.5 Flash Preview TTS".</p>
        <p>If you enable billing, you will enjoy higher limits and access to the Pro TTS model.</p>

        <h3>Estimated API usage</h3>
        <p>The app tracks each time you hit the Generate button. It should be the same as the number of requests to
            Gemini API.</p>
        <p>Request count since last reset ({{ localResetDtString }}): {{ requestCountSinceReset }}</p>
        <p>Remaining requests: {{ freeTierRequestPerDay - requestCountSinceReset }}</p>
        <p>Next reset at: {{ nextLocalResetDtString }}</p>

    </div>


</template>

<script setup>
import { onMounted, ref } from 'vue';

import { formatDatetime } from '@/utils/formatDatetime';

// Constants
const DAY_MILISECONDS = 24 * 60 * 60 * 1000;

// Usage count
const freeTierRequestPerDay = 15;
const requestCountSinceReset = ref(null);

// Calculate RPD reset date time
const resetDt = new Date();
resetDt.setUTCHours(7, 0, 0, 0);

const localResetTimeString = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
}).format(resetDt);
const localResetDtString = formatDatetime(resetDt);

const nextResetDt = new Date(resetDt.getTime() + DAY_MILISECONDS)
const nextLocalResetDtString = formatDatetime(nextResetDt);

// Lifecycle
onMounted(async () => {
    fetchRequestCount(resetDt);
});

// API
async function fetchRequestCount(lastResetDt) {
    const sinceDt = lastResetDt.toISOString();
    const params = new URLSearchParams({ sinceDt: sinceDt });
    const response = await fetch(`/api/metrics/request-count?${params}`);
    const result = await response.json();
    requestCountSinceReset.value = result;
}

</script>

<style scoped></style>