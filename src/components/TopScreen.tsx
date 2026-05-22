import MistCanvas from './MistCanvas'

interface TopScreenProps {
  onPlace: () => void
  onStay: () => void
}

export default function TopScreen({ onPlace, onStay }: TopScreenProps) {
  return (
    <div className="screen">
      <div className="mist-layer">
        <MistCanvas />
      </div>
      <div className="ui-layer">
        <div className="top-content">
        <h1 className="top-title">in-mist</h1>
        <p className="top-subtitle">向き合うことも逃げることも、間違いじゃなかった。</p>
        <div className="top-buttons">
          <button type="button" className="entry-btn" onClick={onPlace}>
            ざわつく気持ちを書いてください
          </button>
          <button type="button" className="entry-btn" onClick={onStay}>
            ここにいるだけでいい。
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
