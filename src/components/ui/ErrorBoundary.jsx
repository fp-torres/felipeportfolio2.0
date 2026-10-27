import { Component } from 'react';

// Keeps one broken section (or a lazy chunk that failed to load) from blanking the whole page.
// fallback: optional render function ({ error, reset }) => node; defaults to rendering nothing.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { fallback = null, children } = this.props;
    if (error) return typeof fallback === 'function' ? fallback({ error, reset: this.reset }) : fallback;
    return children;
  }
}
