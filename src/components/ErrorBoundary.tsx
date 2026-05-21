import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  screenName: string
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[in-mist] ${this.props.screenName} でエラー:`, error)
    console.error('[in-mist] component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="screen"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
          }}
        >
          <p style={{ color: '#7dd3fc', opacity: 0.7, fontSize: '0.9rem' }}>
            画面を表示できませんでした。
          </p>
          <button
            type="button"
            className="entry-btn"
            style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            もう一度
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
