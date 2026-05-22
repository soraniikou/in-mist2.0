const TRACK_COUNT = 8
const FADE_DURATION = 1.0
const BASE_VOLUME = Math.min(1, 0.85 * 1.4)

let deck: number[] = []
let lastPlayed: number | undefined
let currentAudio: HTMLAudioElement | null = null

const fadeHandlers = new WeakMap<
  HTMLAudioElement,
  { onTimeUpdate: () => void; onEnded: () => void }
>()

function shuffleDeck(avoidFirst?: number): number[] {
  const arr = Array.from({ length: TRACK_COUNT }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  if (avoidFirst !== undefined && arr.length > 1 && arr[0] === avoidFirst) {
    const swap = 1 + Math.floor(Math.random() * (arr.length - 1))
    ;[arr[0], arr[swap]] = [arr[swap], arr[0]]
  }
  return arr
}

function refillDeck() {
  deck = shuffleDeck(lastPlayed)
}

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
    if (currentAudio === audio) currentAudio = null
    detachFadeHandlers(audio)
  }

  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('ended', onEnded)
  fadeHandlers.set(audio, { onTimeUpdate, onEnded })
}

function stopCurrentAudio() {
  if (!currentAudio) return
  const audio = currentAudio
  audio.pause()
  detachFadeHandlers(audio)
  currentAudio = null
}

export function playMistAudio(): void {
  if (deck.length === 0) refillDeck()

  const n = deck.shift()!
  lastPlayed = n

  stopCurrentAudio()

  const audio = new Audio(`/audio/in-mist${n}.mp3`)
  audio.volume = BASE_VOLUME
  currentAudio = audio
  attachFadeHandlers(audio)
  void audio.play()
}
