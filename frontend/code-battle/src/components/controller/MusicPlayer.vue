<!-- frontend\code-battle\src\components\controller\MusicPlayer.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineExpose, computed } from "vue"
import radional from "@/assets/mp3/music/Radional - FilFar.mp3"
import natroleum from "@/assets/mp3/music/Natroleum - FilFar.mp3"

const tracks = [radional, natroleum]
const trackNames = ["Radional - FilFar", "Natroleum - FilFar"]

let audioCtx: AudioContext | null = null
const fadeDuration = 0.5
const crossfadeDuration = 2

interface TrackState {
    audio: HTMLAudioElement
    gain: GainNode | null
    currentTime: number
}

const trackStates: TrackState[] = tracks.map(src => ({
    audio: new Audio(src),
    gain: null,
    currentTime: 0
}))

trackStates.forEach(t => t.audio.loop = true)

const currentTrackIndex = ref(0)
const isPlaying = ref(false)
const volume = ref(0.5)

const currentSongName = computed(() => trackNames[currentTrackIndex.value])
const buttonLabel = computed(() => isPlaying.value ? "Pause" : "Play")

function setupTrack(track: TrackState) {
    if (!audioCtx) audioCtx = new AudioContext()
    if (!track.gain) {
        track.gain = audioCtx.createGain()
        track.gain.gain.value = 0
        const source = audioCtx.createMediaElementSource(track.audio)
        source.connect(track.gain).connect(audioCtx.destination)
    }
}

function crossfade(toIndex: number) {
    if (toIndex === currentTrackIndex.value && isPlaying.value) return

    const fromTrack = trackStates[currentTrackIndex.value]
    const toTrack = trackStates[toIndex]

    setupTrack(toTrack)
    if (audioCtx?.state === "suspended") audioCtx.resume()

    // Start new track at saved time
    toTrack.audio.currentTime = toTrack.currentTime
    toTrack.audio.play()

    const now = audioCtx!.currentTime

    toTrack.gain!.gain.cancelScheduledValues(now)
    toTrack.gain!.gain.setValueAtTime(0, now)
    toTrack.gain!.gain.linearRampToValueAtTime(volume.value, now + crossfadeDuration)

    // Only fade out fromTrack if it's currently playing
    if (isPlaying.value) {
        fromTrack.gain?.gain.cancelScheduledValues(now)
        fromTrack.gain?.gain.setValueAtTime(fromTrack.gain.gain.value, now)
        fromTrack.gain?.gain.linearRampToValueAtTime(0, now + crossfadeDuration)
        setTimeout(() => {
            fromTrack.audio.pause()
            fromTrack.currentTime = fromTrack.audio.currentTime
        }, crossfadeDuration * 1000)
    }

    currentTrackIndex.value = toIndex
    isPlaying.value = true
}

function playTrack(index?: number) {
    const toIndex = index ?? currentTrackIndex.value
    // If nothing is playing yet, just fade in without fading out fromTrack
    if (!isPlaying.value) {
        setupTrack(trackStates[toIndex])
        if (audioCtx?.state === "suspended") audioCtx.resume()
        const track = trackStates[toIndex]
        track.audio.currentTime = track.currentTime
        track.audio.play()
        const now = audioCtx!.currentTime
        track.gain!.gain.setValueAtTime(0, now)
        track.gain!.gain.linearRampToValueAtTime(volume.value, now + fadeDuration)
        currentTrackIndex.value = toIndex
        isPlaying.value = true
        return
    }

    crossfade(toIndex)
}

function pauseTrack() {
    const track = trackStates[currentTrackIndex.value]
    if (!track.audio || !track.gain) return

    const now = audioCtx!.currentTime
    track.gain.gain.cancelScheduledValues(now)
    track.gain.gain.setValueAtTime(track.gain.gain.value, now)
    track.gain.gain.linearRampToValueAtTime(0, now + fadeDuration)

    setTimeout(() => {
        track.audio.pause()
        track.currentTime = track.audio.currentTime
    }, fadeDuration * 1000)

    isPlaying.value = false
}

function toggleTrack() {
    if (isPlaying.value) pauseTrack()
    else playTrack()
}

function setVolume(v: number) {
    volume.value = v
    const track = trackStates[currentTrackIndex.value]
    if (track.gain && isPlaying.value) track.gain.gain.setValueAtTime(v, audioCtx!.currentTime)
}

onMounted(() => {
    // first play must be triggered by user gesture
    const resume = () => { playTrack(0); window.removeEventListener("click", resume) }
    window.addEventListener("click", resume)
})

onBeforeUnmount(() => {
    trackStates.forEach(t => t.audio.pause())
    trackStates.forEach(t => t.gain?.disconnect())
    audioCtx?.close()
})

defineExpose({ playTrack, pauseTrack, toggleTrack, currentTrackIndex, isPlaying })
</script>


<template>
    <div class="music-player">
        <div class="peek">🎵 Now Playing: {{ currentSongName }}</div>
        <div class="controls">
            <button @click="toggleTrack">{{ buttonLabel }}</button>
            <input type="range" min="0" max="1" step="0.01" v-model="volume"
                @input="setVolume(($event.target as HTMLInputElement).valueAsNumber)" />
        </div>
    </div>
</template>

<style scoped>
.music-player {
    position: fixed;
    bottom: -2rem;
    left: 0;
    width: 18rem;
    color: white;
    transition: bottom 0.3s ease;
    z-index: 999;
    overflow: hidden;
    padding: 2.5rem 2.5rem 0 0;
}

.music-player:hover {
    bottom: 0;
}

.peek {
    height: 25px;
    line-height: 25px;
    font-size: 13px;
    text-align: left;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 6px 6px 0 0;
    white-space: nowrap;
    overflow: hidden;
    padding: 1rem 1rem 0 1rem;
}

.controls {
    display: flex;
    gap: 8px;
    align-items: center;
    background: rgba(0, 0, 0, 0.85);
    padding: 0 1rem 1rem 1rem;
}

.controls button {
    background: #000000bb;
    border: none;
    width: 6rem;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
}

.controls button:hover {
    background: #1d1c1cbb;
}

.controls button:active {
    background: #000000;
}

.controls input[type="range"] {
    flex: 1;
}
</style>
