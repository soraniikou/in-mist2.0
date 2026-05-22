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
        <div className="top-header">
          <h1 className="top-title">in-mist</h1>
          <p className="top-subtitle">
            <span className="top-subtitle-line">向き合うことも逃げることも、</span>
            <span className="top-subtitle-line">間違いじゃなかった。</span>
          </p>
        </div>
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
