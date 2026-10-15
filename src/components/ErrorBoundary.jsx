import React from 'react'

/**
 * 全局错误边界组件
 * 捕获子组件树中的 JavaScript 错误，显示降级 UI 而非白屏
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-icon">⚠️</div>
          <h2 className="error-boundary-title">页面出错了</h2>
          <p className="error-boundary-desc">
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <div className="error-boundary-actions">
            <button
              className="btn btn-primary"
              onClick={this.handleReset}
            >
              重试
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                this.handleReset()
                window.location.hash = '#/'
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}