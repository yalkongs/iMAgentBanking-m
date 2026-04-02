import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#f87171', background: '#0D0F1A', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>오류가 발생했습니다</div>
          <div style={{ fontSize: '13px', opacity: 0.65, marginBottom: '16px', wordBreak: 'break-all' }}>
            {this.state.error?.message || '알 수 없는 오류'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', background: '#00C9A7', color: '#0D0F1A', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
