const TRACK_COUNT = 8

let deck: number[] = []
let lastPlayed: number | undefined
let currentAudio: HTMLAudioElement | null = null

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

export function playMistAudio(): void {
  if (deck.length === 0) refillDeck()

  const n = deck.shift()!
  lastPlayed = n

  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  const audio = new Audio(`/audio/in-mist${n}.mp3`)
  audio.volume = Math.min(1, 0.85 * 1.4)
  currentAudio = audio
  void audio.play()
}
