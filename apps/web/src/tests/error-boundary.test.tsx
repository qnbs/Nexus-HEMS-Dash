import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { render, screen } from './test-utils';

// Mock i18next for ErrorBoundary (uses direct i18next.t)
vi.mock('i18next', () => ({
  default: {
    t: (key: string) => {
      const map: Record<string, string> = {
        'error.title': 'Something went wrong',
        'error.description': 'An unexpected error occurred',
        'error.details': 'Error Details',
        'error.message': 'Message',
        'error.stack': 'Stack',
        'error.componentStack': 'Component Stack',
        'error.tryAgain': 'Try Again',
        'error.reload': 'Reload Page',
        'error.goHome': 'Go Home',
      };
      return map[key] ?? key;
    },
  },
}));

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test crash');
  }
  return <div>Working</div>;
}

describe('ErrorBoundary', () => {
  // Suppress React's own error boundary console.error output
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
    return () => {
      console.error = originalConsoleError;
    };
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should show error fallback when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const handleError = vi.fn();
    render(
      <ErrorBoundary onError={handleError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(handleError).toHaveBeenCalledOnce();
    expect(handleError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(handleError.mock.calls[0][0].message).toBe('Test crash');
  });

  it('should have an accessible alert role', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should show retry and reload buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });
});
