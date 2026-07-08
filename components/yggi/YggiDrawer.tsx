'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FeatureGate } from '@/components/billing/FeatureGate';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { logYggiChatOpened, logYggiMessageSent } from '@/lib/analytics/client';
import { SacredGeometry } from '@/components/onboarding/SacredGeometry';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/client';
import { toast } from 'sonner';

interface YggiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export function YggiDrawer({ isOpen, onClose }: YggiDrawerProps) {
  const subscription = useSubscription();
  const isBlocked = subscription.entitlement !== 'PRO';
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fire analytics and set greeting on open
  useEffect(() => {
    if (isOpen) {
      logYggiChatOpened();
      if (messages.length === 0) {
        setMessages([
          {
            role: 'model',
            text: "The roots are listening. Ask me what you've been circling around — I'll look for the thread.",
          },
        ]);
      }
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom on new messages or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading || !user) return;

    const userText = inputValue.trim();
    const userMsg: ChatMessage = { role: 'user', text: userText };
    const newTurnCount = turnCount + 1;

    setInputValue('');
    setMessages(prev => [...prev, userMsg]);
    setTurnCount(newTurnCount);
    setLoading(true);

    try {
      const functions = getFunctions(app, 'us-central1');
      const yggiChatFn = httpsCallable<
        { message: string; userId: string; conversation_turn_count: number; history: ChatMessage[] },
        { success: boolean; reply: string }
      >(functions, 'yggiChat');

      const response = await yggiChatFn({
        message: userText,
        userId: user.uid,
        conversation_turn_count: newTurnCount,
        history: messages,
      });

      if (response.data?.success) {
        setMessages(prev => [...prev, { role: 'model', text: response.data.reply }]);
        // Fire client-side analytics for GA4 web stream
        logYggiMessageSent({ conversation_turn_count: newTurnCount });
      } else {
        throw new Error('Unexpected response format.');
      }
    } catch (err) {
      console.error('Failed to chat with Yggi', err);
      toast.error('Yggi couldn\'t respond right now. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-background/60 backdrop-blur-xs transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[440px] h-full
          bg-surface border-l border-border/80 shadow-2xl shadow-black/50
          transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        aria-label="Yggi chat companion"
      >
        {/* Header */}
        <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between shrink-0 bg-surface-2/30">
          <div className="flex items-center gap-2.5">
            <SacredGeometry size={22} breathe={isOpen} strokeWidth={1.5} />
            <h2 className="font-display text-xl tracking-wide text-foreground">Yggi</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-sm border border-transparent text-foreground/50 transition-all duration-300 hover:text-foreground hover:bg-muted/30 hover:border-border/30 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex flex-col min-h-0 bg-background">
          <FeatureGate
            blocked={isBlocked}
            requiredTier="PRO"
            label="Chatting with Yggi requires Pro access."
          >
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="shrink-0 mt-1">
                        <SacredGeometry size={24} breathe={false} strokeWidth={1.5} />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed border ${
                        msg.role === 'user'
                          ? 'bg-primary/45 border-sage/10 text-foreground font-sans'
                          : 'bg-surface-2/60 border-border/40 text-foreground font-display italic text-gold/90'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="shrink-0 mt-1">
                      <SacredGeometry size={24} breathe={true} strokeWidth={1.5} />
                    </div>
                    <div className="bg-surface-2/30 border border-border/20 rounded-lg px-3.5 py-2.5 text-xs text-sage animate-pulse font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block animate-ping" />
                      Yggi is listening...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-border/40 shrink-0">
                <div className="relative rounded-sm border border-border bg-surface-2/40 px-3.5 py-2.5 flex items-center gap-2 focus-within:border-gold/50 transition-colors">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask Yggi about your patterns..."
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputValue.trim()}
                    aria-label="Send message"
                    className={`p-1.5 rounded-sm border transition-all ${
                      inputValue.trim() && !loading
                        ? 'text-gold bg-gold/10 border-gold/30 hover:bg-gold/20'
                        : 'text-gold/30 bg-gold/5 border-gold/10 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </FeatureGate>
        </div>
      </aside>
    </>
  );
}
