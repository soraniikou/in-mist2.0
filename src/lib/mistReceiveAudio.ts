import { stopMistTapAudio } from './mistAudio'

const RECEIVE_KEY = 'inMistReceiveCount'
const RECEIVE_COUNT = 3
const FADE_DURATION = 1.0
const BASE_VOLUME = 0.85

let currentReceiveAudio: HTMLAudioElement | null = null

const fadeHandlers = new WeakMap<
  HTMLAudioElement,
  { onTimeUpdate: () => void; onEnded: () => void }
>()

function detachFadeHandlers(audio: HTMLAudioElement) {
  const handlers = fadeHandlers.get(audio)
  if (!handlers) return
  audio.removeEventListener('timeupdate', handlers.onTimeUpdate)
  audio.removeEventListener('ended', handlers.onEnded)
  fadeHandlers.delete(audio)
}

function attachFadeHandlers(audio: HTMLAudioElement) {
  const onTimeUpdate = () => {
    const duration = audio.duration
    if (!Number.isFinite(duration) || duration <= 0) return
    const remaining = duration - audio.currentTime
    if (remaining <= FADE_DURATION && remaining > 0) {
      audio.volume = BASE_VOLUME * (remaining / FADE_DURATION)
    }
  }

  const onEnded = () => {
    audio.volume = 0
    if (currentReceiveAudio === audio) currentReceiveAudio = null
    detachFadeHandlers(audio)
  }

  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('ended', onEnded)
  fadeHandlers.set(audio, { onTimeUpdate, onEnded })
}

function stopReceiveAudio() {
  if (!currentReceiveAudio) return
  const audio = currentReceiveAudio
  audio.pause()
  detachFadeHandlers(audio)
  currentReceiveAudio = null
}

export function playReceiveVoice(): void {
  stopMistTapAudio()
  stopReceiveAudio()

  const countStr = localStorage.getItem(RECEIVE_KEY)
  const count = countStr ? parseInt(countStr, 10) : 0
  const index = (count % RECEIVE_COUNT) + 1

  const audio = new Audio(`/audio/in-mist-receive${index}.mp3`)
  audio.volume = BASE_VOLUME
  currentReceiveAudio = audio
  attachFadeHandlers(audio)
  void audio.play()

  localStorage.setItem(RECEIVE_KEY, String(count + 1))
}
