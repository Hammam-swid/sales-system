import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { t } from '../i18n'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

// Without a boundary, an error while drawing any screen unmounts the whole app and
// leaves a blank window. This keeps the damage to the one screen and offers a way back.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Screen failed to render:', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children

    return (
      <Card className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
        <TriangleAlert aria-hidden className="size-10 text-warning" />
        <h2 className="type-h3">{t.crash.title}</h2>
        <p className="type-body text-ink-muted">{t.crash.body}</p>
        <Button onClick={() => this.setState({ failed: false })}>{t.common.retry}</Button>
      </Card>
    )
  }
}
