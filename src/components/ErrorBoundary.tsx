import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Game crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full gap-6 p-8 text-center">
          <span className="text-8xl" role="img" aria-label="Fejl">😵</span>
          <h2 className="font-pixel text-base text-white">Spillet gik i stykker!</h2>
          <p className="text-white/70 text-lg">Prøv at genindlæse siden.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-white/20 hover:bg-white/30 text-white font-bold text-xl px-10 py-5 rounded-3xl shadow-lg active:scale-95 transition-transform touch-manipulation border-2 border-white/30"
            style={{ minHeight: '72px' }}
          >
            Prøv igen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
