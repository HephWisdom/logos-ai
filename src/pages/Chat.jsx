import { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, BookOpen } from 'lucide-react';
import { useAuth }         from '../hooks/useAuth';
import { usePlan }         from '../hooks/usePlan';
import { useConversation } from '../hooks/useConversation';
import { streamBibleAgent } from '../services/agent';
import { Sidebar }          from '../components/Sidebar';
import { ChatMessage }      from '../components/ChatMessage';
import { SuggestedPrompts } from '../components/SuggestedPrompts';
import { PlanGate }         from '../components/PlanGate';

export default function Chat() {
  const { user, profile } = useAuth();
  const { checkAndIncrementQuota, canAccess, plan, quota } = usePlan(profile);
  const conv = useConversation(user?.id);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [abortRef] = useState({ current: false });
  const [gate, setGate] = useState(null);
  const [clientError, setClientError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    conv.loadConversations();
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv.messages, streamContent]);

  async function handleSend(text) {
    const query = (text || input).trim();
    if (!query || streaming) return;
    setClientError('');
    setInput('');

    if (/greek|hebrew|strong|original language|transliteration/i.test(query) && !canAccess('wordStudy')) {
      setGate('wordStudy'); return;
    }

    const quotaResult = await checkAndIncrementQuota();
    if (!quotaResult.allowed) { setGate('dailyLimit'); return; }

    try {
      let convId = conv.activeId;
      if (!convId) {
        const newConv = await conv.newConversation();
        convId = newConv?.id;
        if (!convId) throw new Error('Failed to create conversation');
      }

      await conv.saveMessage(convId, 'user', query);

      const history = conv.messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: query });

      setStreaming(true);
      setStreamContent('');
      abortRef.current = false;

      let fullContent = '';
      const generator = streamBibleAgent(history, query);
      for await (const chunk of generator) {
        if (abortRef.current) break;
        fullContent += chunk;
        setStreamContent(fullContent);
      }
      if (!fullContent.trim()) {
        fullContent = 'No response was returned. Please try again.';
      }

      await conv.saveMessage(convId, 'assistant', fullContent);

      if (conv.messages.length === 0) {
        const shortTitle = query.length > 50 ? `${query.slice(0, 47)}…` : query;
        await conv.updateConversationTitle(convId, shortTitle);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setClientError(message);
    } finally {
      setStreamContent('');
      setStreaming(false);
    }
  }

  const isFirstMessage = conv.messages.length === 0 && !streaming;

  return (
    <div className="flex h-screen bg-parchment-50 dark:bg-ink-900 overflow-hidden">
      <Sidebar
        conversations={conv.conversations}
        activeId={conv.activeId}
        onNew={async () => { await conv.newConversation(); }}
        onSelect={conv.loadMessages}
        onDelete={conv.deleteConversation}
        profile={profile}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-parchment-200 dark:border-ink-800/60 px-6 py-3 flex items-center gap-3 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm">
          <BookOpen size={18} className="text-gold-500" />
          <h1 className="font-display text-lg font-semibold text-ink-800 dark:text-parchment-100">
            {conv.conversations.find(c => c.id === conv.activeId)?.title || 'Bible Study'}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 max-w-4xl mx-auto w-full">
          {isFirstMessage && (
            <div className="flex flex-col items-center justify-center min-h-full py-16 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-xl mb-6">
                <span className="text-3xl font-bold text-mahogany-900">Λ</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-800 dark:text-parchment-100 mb-2">What shall we study?</h2>
              <p className="font-serif italic text-ink-800/50 dark:text-parchment-300/50 text-center mb-10 text-sm">
                "Your word is a lamp to my feet and a light to my path" — Psalm 119:105
              </p>
              <SuggestedPrompts onSelect={handleSend} limit={8} />
            </div>
          )}

          <div className="py-4 space-y-1">
            {conv.messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {streaming && streamContent && (
              <ChatMessage message={{ role: 'assistant', content: streamContent }} isStreaming={true} />
            )}

            {streaming && !streamContent && (
              <div className="flex gap-4 py-5 px-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mahogany-700 to-mahogany-900 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={14} className="text-gold-300" />
                </div>
                <div className="flex items-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {!isFirstMessage && !streaming && (
          <div className="px-4 pb-2 max-w-4xl mx-auto w-full">
            <SuggestedPrompts onSelect={handleSend} limit={4} />
          </div>
        )}

        <div className="border-t border-parchment-200 dark:border-ink-800/60 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm px-4 md:px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 bg-parchment-50 dark:bg-ink-800 border border-parchment-200 dark:border-ink-700 rounded-2xl px-4 py-3 focus-within:border-gold-400 dark:focus-within:border-gold-600/50 transition-colors shadow-sm">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Ask about any verse, word, doctrine, or Biblical topic..." rows={1} className="flex-1 bg-transparent font-serif text-ink-800 dark:text-parchment-100 placeholder:text-ink-800/35 dark:placeholder:text-parchment-300/35 resize-none focus:outline-none max-h-36 overflow-y-auto text-base leading-relaxed" />
              {streaming ? (
                <button onClick={() => { abortRef.current = true; setStreaming(false); }} className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                  <StopCircle size={16}/>
                </button>
              ) : (
                <button onClick={() => handleSend()} disabled={!input.trim()} className="flex-shrink-0 w-9 h-9 rounded-xl bg-mahogany-700 hover:bg-mahogany-800 text-parchment-100 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  <Send size={15}/>
                </button>
              )}
            </div>
            <p className="text-center text-xs font-sans text-ink-800/30 dark:text-parchment-300/30 mt-2">
              {plan === 'free'
                ? `${quota.remaining} free questions remaining today`
                : 'Unlimited questions'}
            </p>
            {clientError && (
              <p className="text-center text-xs font-sans text-red-600 dark:text-red-400 mt-1">
                {clientError}
              </p>
            )}
          </div>
        </div>
      </main>

      {gate && <PlanGate feature={gate} onClose={() => setGate(null)} />}
    </div>
  );
}
