import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches JavaScript errors thrown during rendering anywhere in the
 * child component tree and shows a fallback UI instead of a blank
 * white screen. Also used as the router's `errorElement` for route-level
 * failures.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught error in component tree:', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="max-w-md text-sm text-gray-500">
            {this.state.error?.message ?? 'An unexpected error occurred. Please try again.'}
          </p>
          <button type="button" onClick={this.handleReload} className="btn-primary">
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
