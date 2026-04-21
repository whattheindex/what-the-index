"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  // Optional callback — useful for shipping errors to Sentry or just
  // logging in dev. Intentionally does not receive componentStack because
  // we don't want to rely on it (it's a dev-only thing).
  onError?: (error: Error) => void;
};

type State = { hasError: boolean };

// Class component because only class components can implement the React
// error-boundary contract (componentDidCatch / getDerivedStateFromError).
// React 19 did not change that. Hook-based boundaries don't exist.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Swallow the stack in prod, log it in dev so we notice.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
