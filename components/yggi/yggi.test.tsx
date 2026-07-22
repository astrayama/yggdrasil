import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YggiFab } from './YggiFab';
import { YggiDrawer } from './YggiDrawer';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { logYggiChatOpened, logYggiMessageSent } from '@/lib/analytics/client';
import { httpsCallable } from 'firebase/functions';

// Mock subscription hook
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: jest.fn(),
}));

// Mock auth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock analytics client
jest.mock('@/lib/analytics/client', () => ({
  logYggiChatOpened: jest.fn(),
  logYggiMessageSent: jest.fn(),
  logPaywallViewed: jest.fn(),
}));

// Mock firebase client — prevents Firebase Auth from initializing (needs fetch in Node)
jest.mock('@/lib/firebase/client', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
}));

// Mock firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

describe('YggiFab', () => {
  it('renders correctly and responds to clicks', () => {
    const handleClick = jest.fn();
    render(<YggiFab onClick={handleClick} isOpen={false} />);

    const fabButton = screen.getByRole('button', { name: /open yggi/i });
    expect(fabButton).toBeInTheDocument();

    fireEvent.click(fabButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows close label when open', () => {
    const handleClick = jest.fn();
    render(<YggiFab onClick={handleClick} isOpen={true} />);

    const fabButton = screen.getByRole('button', { name: /close yggi/i });
    expect(fabButton).toBeInTheDocument();
  });
});

describe('YggiDrawer', () => {
  const proSubscription = {
    tier: 'PRO',
    entitlement: 'PRO',
    status: 'active',
    billingPeriod: 'monthly',
    loading: false,
  };

  const freeSubscription = {
    tier: 'FREE',
    entitlement: 'FREE',
    status: 'none',
    billingPeriod: null,
    loading: false,
  };

  const defaultUser = {
    uid: 'user_123_test',
    email: 'test@example.com',
  };

  const mockCallable = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSubscription as jest.Mock).mockReturnValue(proSubscription);
    (useAuth as jest.Mock).mockReturnValue({ user: defaultUser });
    (httpsCallable as jest.Mock).mockReturnValue(mockCallable);
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('fires yggi_chat_opened event when drawer opens', () => {
    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);
    expect(logYggiChatOpened).toHaveBeenCalled();
  });

  it('does not fire yggi_chat_opened when drawer is closed', () => {
    render(<YggiDrawer isOpen={false} onClose={jest.fn()} />);
    expect(logYggiChatOpened).not.toHaveBeenCalled();
  });

  it('triggers onClose when backdrop is clicked', () => {
    const handleClose = jest.fn();
    render(<YggiDrawer isOpen={true} onClose={handleClose} />);

    const backdrop = screen.getByText((_, element) => {
      return element?.getAttribute('aria-hidden') === 'true' && !!element?.className.includes('bg-background');
    });

    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<YggiDrawer isOpen={true} onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: /close drawer/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose on Escape key', () => {
    const handleClose = jest.fn();
    render(<YggiDrawer isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows upgrade prompt for Free users', () => {
    (useSubscription as jest.Mock).mockReturnValue(freeSubscription);

    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/upgrade required/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ask yggi/i)).not.toBeInTheDocument();
  });

  it('displays initial greeting for Pro users', () => {
    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/the roots are listening/i)).toBeInTheDocument();
  });

  it('sends a message, receives a reply, and fires analytics', async () => {
    mockCallable.mockResolvedValue({
      data: {
        success: true,
        reply: 'You keep returning to the word "alignment" — three entries now. What shifted?',
      },
    });

    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);

    // Type and send
    const input = screen.getByPlaceholderText(/ask yggi/i);
    fireEvent.change(input, { target: { value: 'What patterns do you see?' } });

    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    // Loading indicator should appear
    expect(screen.getByText(/yggi is listening/i)).toBeInTheDocument();

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/you keep returning to the word/i)).toBeInTheDocument();
    });

    // Verify callable was invoked with correct params
    expect(mockCallable).toHaveBeenCalledWith({
      message: 'What patterns do you see?',
      userId: 'user_123_test',
      conversation_turn_count: 1,
      history: [
        {
          role: 'model',
          text: "The roots are listening. Ask me what you've been circling around — I'll look for the thread.",
        },
      ],
    });

    // Verify client-side analytics was fired
    expect(logYggiMessageSent).toHaveBeenCalledWith({ conversation_turn_count: 1 });
  });

  it('shows error toast when Cloud Function call fails', async () => {
    mockCallable.mockRejectedValue(new Error('Network error'));

    render(<YggiDrawer isOpen={true} onClose={jest.fn()} />);

    const input = screen.getByPlaceholderText(/ask yggi/i);
    fireEvent.change(input, { target: { value: 'test' } });

    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      const { toast } = jest.requireMock('sonner');
      expect(toast.error).toHaveBeenCalled();
    });

    // Should NOT fire analytics on failure
    expect(logYggiMessageSent).not.toHaveBeenCalled();
  });
});
