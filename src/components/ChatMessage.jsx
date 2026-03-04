import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, User } from 'lucide-react';

function processContent(content) {
  return content;
}

const MarkdownComponents = {
  h1: ({ children }) => (
    <h1 className="font-display text-2xl font-bold text-mahogany-700 dark:text-gold-400 mt-6 mb-3 pb-2 border-b border-gold-300/40">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-xl font-semibold text-mahogany-700 dark:text-gold-400 mt-5 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-lg font-semibold text-ink-800 dark:text-parchment-200 mt-4 mb-2">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gold-400 bg-gold-50/50 dark:bg-gold-900/10 pl-4 py-2 my-3 rounded-r-lg italic font-serif text-ink-800 dark:text-parchment-200">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="font-mono text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700/30">
      {children}
    </code>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-mahogany-700 dark:text-gold-400">{children}</strong>
  ),
  hr: () => <div className="gold-rule my-4" />,
  ul: ({ children }) => (
    <ul className="my-2 space-y-1 pl-5 list-none">
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 before:content-['✦'] before:text-gold-400 before:text-xs before:mt-1.5 before:flex-shrink-0 font-serif">
      <span>{children}</span>
    </li>
  ),
  p: ({ children }) => (
    <p className="font-serif leading-relaxed mb-3 text-ink-800 dark:text-parchment-100">
      {children}
    </p>
  ),
};

export function ChatMessage({ message, isStreaming = false }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 py-5 px-4 animate-slide-up ${isUser ? '' : 'bg-parchment-50/50 dark:bg-ink-800/20 rounded-xl'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isUser ? 'bg-ink-800 dark:bg-ink-700 text-parchment-100' : 'bg-gradient-to-br from-mahogany-700 to-mahogany-900 text-gold-300 shadow-md'}`}>
        {isUser ? <User size={14} /> : <BookOpen size={14} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-xs font-sans font-medium mb-2 ${isUser ? 'text-ink-800/50 dark:text-parchment-300/50' : 'text-gold-600 dark:text-gold-400'}`}>
          {isUser ? 'You' : 'Logos AI'}
        </div>

        {isUser ? (
          <p className="font-serif text-ink-800 dark:text-parchment-100 leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className={`prose-custom ${isStreaming ? 'streaming-cursor' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {processContent(message.content || '')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
