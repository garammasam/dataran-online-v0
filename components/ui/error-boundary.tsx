'use client';

import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="font-mono text-2xl font-bold mb-4 uppercase">
              Something went wrong
            </h1>
            <p className="font-mono text-sm text-brutalist-grey mb-6">
              We encountered an error while loading this page. Please try refreshing or go back to the home page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => typeof window !== 'undefined' && window.location.reload()}
                className="w-full bg-brutalist-black text-brutalist-white px-6 py-3 font-mono text-sm font-medium hover:bg-brutalist-grey transition-colors uppercase rounded-none"
              >
                Refresh Page
              </button>
              <button
                onClick={() => typeof window !== 'undefined' && (window.location.href = '/')}
                className="w-full bg-brutalist-grey bg-opacity-10 text-brutalist-black px-6 py-3 font-mono text-sm font-medium hover:bg-brutalist-grey hover:bg-opacity-20 transition-colors uppercase rounded-none"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="font-mono text-sm cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-4 bg-brutalist-grey bg-opacity-10 rounded-none text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by handler:', error, errorInfo);
    // In a real app, you might send this to an error reporting service
  };
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Specific error boundaries for common scenarios
export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-gray-200 rounded bg-gray-50">
          <p className="font-mono text-sm text-gray-600">
            Unable to load component
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}