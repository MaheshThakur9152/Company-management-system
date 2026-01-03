import React from 'react';

interface Props {
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<Props>, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Uncaught render error in component tree:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        // Compact inline fallback (used to isolate tab errors)
        return (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            <div className="font-bold">Error loading this section</div>
            <div className="mt-2 text-xs text-gray-600 max-h-28 overflow-auto whitespace-pre-wrap">{String(this.state.error?.message || this.state.error)}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={this.reset} className="px-2 py-1 border rounded text-xs">Dismiss</button>
              <button onClick={() => {
                window.location.reload();
              }} className="px-2 py-1 bg-primary text-white rounded text-xs">Reload</button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-white p-8 rounded-2xl shadow-md max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">An unexpected error occurred while rendering the application.</p>
            <details className="text-xs text-left text-gray-500 mb-4 whitespace-pre-wrap overflow-auto max-h-40 p-2 border rounded bg-gray-50">
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
              {/* Show last client-captured error (if any) to help debugging */}
              {(() => {
                try {
                  const raw = localStorage.getItem('last_client_error');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    return (
                      <div className="mt-3 text-xs text-left text-gray-700 bg-white p-2 rounded border">
                        <div className="font-bold text-gray-800">Last client error (captured)</div>
                        <div className="text-[12px] mt-1">{parsed.message}</div>
                        {parsed.stack && <pre className="text-[11px] mt-2 overflow-auto max-h-32">{parsed.stack}</pre>}
                      </div>
                    );
                  }
                } catch (e) { /* ignore */ }
                return null;
              })()}
            </details>
            <div className="flex gap-3 justify-center">
              <button onClick={() => {
                window.location.reload();
              }} className="px-4 py-2 bg-primary text-white rounded-lg">Reload</button>
              <button onClick={this.reset} className="px-4 py-2 border rounded-lg">Dismiss</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as JSX.Element;
  }
}

export default ErrorBoundary;
