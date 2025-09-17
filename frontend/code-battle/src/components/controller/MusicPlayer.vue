<!-- frontend\code-battle\src\components\controller\MusicPlayer.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineExpose, computed } from "vue"
import radional from "@/assets/mp3/music/Radional - FilFar.mp3"
import natroleum from "@/assets/mp3/music/Natroleum - FilFar.mp3"

const tracks = [radional, natroleum]
const musicPaths = ["Radional - FilFar.mp3", "Natroleum - FilFar.mp3"]

let audioCtx: AudioContext | null = null
let gainNode: GainNode | null = null
let audio: HTMLAudioElement | null = null
let source: MediaElementAudioSourceNode | null = null

const currentTrackIndex = ref(0)
const isPlaying = ref(false)
const volume = ref(0.5)

const fadeDuration = 0.5
let fadeTimeout: number | null = null

// --- track progress array ---
const trackProgress: number[] = tracks.map(() => 0)

// crossfade temp elements
let crossfadeAudio: HTMLAudioElement | null = null
let crossfadeGain: GainNode | null = null
const crossfadeDuration = 2

function getSongName(index: number) {
    return musicPaths[index].replace(/\.[^/.]+$/, "")
}

const currentSongName = computed(() => getSongName(currentTrackIndex.value))
const buttonLabel = computed(() => (isPlaying.value ? "Pause" : "Play"))

function setupAudio() {
    if (!audioCtx) audioCtx = new AudioContext()
    if (!audio) {
        audio = new Audio(tracks[currentTrackIndex.value])
        audio.loop = true
        audio.crossOrigin = "anonymous"
    }
    if (!gainNode) {
        gainNode = audioCtx.createGain()
        gainNode.connect(audioCtx.destination)
        gainNode.gain.value = 0
    }
    if (!source && audio) {
        source = audioCtx.createMediaElementSource(audio)
        source.connect(gainNode)
    }
}

function fade(to: number) {
    if (!gainNode || !audioCtx) return
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime)
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(to, audioCtx.currentTime + fadeDuration)
}

function playTrack(index?: number) {
    if (fadeTimeout) { clearTimeout(fadeTimeout); fadeTimeout = null }
    if (crossfadeAudio) { crossfadeAudio.pause(); crossfadeAudio = null; crossfadeGain = null }

    setupAudio()
    if (audioCtx?.state === "suspended") audioCtx.resume()

    if (typeof index === "number" && index !== currentTrackIndex.value) {
        if (isPlaying.value) {
            crossfade(index)
            return
        }
        // paused: just switch and load saved position
        currentTrackIndex.value = index
        if (audio) {
            audio.src = tracks[index]
            audio.onloadedmetadata = () => {
                audio!.currentTime = trackProgress[index] || 0
                audio!.onloadedmetadata = null
            }
        }
    }

    isPlaying.value = true
    audio?.play()
    fade(volume.value)
}

function pauseTrack() {
    if (!audio || !gainNode) return
    if (fadeTimeout) { clearTimeout(fadeTimeout); fadeTimeout = null }
    isPlaying.value = false
    fade(0)
    fadeTimeout = window.setTimeout(() => {
        audio?.pause()
        fadeTimeout = null
    }, fadeDuration * 1000)
}

function toggleTrack() {
    if (isPlaying.value) pauseTrack()
    else playTrack()
}

function setVolume(v: number) {
    volume.value = v
    if (gainNode && isPlaying.value) gainNode.gain.setValueAtTime(v, audioCtx!.currentTime)
}

// --- CROSSFADE FUNCTION ---
function crossfade(toIndex: number) {
    if (toIndex === currentTrackIndex.value) return
    setupAudio()
    if (audioCtx?.state === "suspended") audioCtx.resume()

    // save old track progress
    if (audio) trackProgress[currentTrackIndex.value] = audio.currentTime

    // create new track
    const newTrack = new Audio(tracks[toIndex])
    newTrack.loop = true
    newTrack.crossOrigin = "anonymous"
    crossfadeAudio = newTrack
    crossfadeGain = audioCtx!.createGain()
    crossfadeGain.gain.value = 0

    const sourceNode = audioCtx!.createMediaElementSource(newTrack)
    sourceNode.connect(crossfadeGain).connect(audioCtx!.destination)

    // load saved progress for new track
    const applyProgress = () => {
        newTrack.currentTime = trackProgress[toIndex] || 0
        newTrack.onloadedmetadata = null
    }
    if (newTrack.readyState >= 1) applyProgress()
    else newTrack.onloadedmetadata = applyProgress

    newTrack.play()

    const now = audioCtx!.currentTime
    crossfadeGain.gain.cancelScheduledValues(now)
    crossfadeGain.gain.setValueAtTime(0, now)
    crossfadeGain.gain.linearRampToValueAtTime(volume.value, now + crossfadeDuration)

    // fade out old track
    fade(0)
    if (fadeTimeout) clearTimeout(fadeTimeout)
    fadeTimeout = window.setTimeout(() => {
        audio?.pause()
        audio = crossfadeAudio
        gainNode = crossfadeGain
        currentTrackIndex.value = toIndex
        crossfadeAudio = null
        crossfadeGain = null
        fadeTimeout = null
    }, crossfadeDuration * 1000)

    isPlaying.value = true
}

onMounted(() => {
    window.addEventListener("click", () => playTrack(0), { once: true })
})

onBeforeUnmount(() => {
    audio?.pause()
    audio = null
    gainNode?.disconnect()
    audioCtx?.close()
})

defineExpose({ playTrack, pauseTrack, toggleTrack, crossfade, currentTrackIndex, isPlaying })
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
    bottom: -2.5rem;
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
