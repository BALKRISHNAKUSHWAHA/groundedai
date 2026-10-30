import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  BrainCircuit, 
  User as UserIcon, 
  Sparkles, 
  Quote, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  Bookmark, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { api, ChatMessage, Source } from '../services/api';

interface ChatInterfaceProps {
  projectId: string;
  projectTitle: string;
  sources: Source[];
}

const SAMPLE_QUESTIONS = [
  'What are the primary methodologies used in the ingested papers?',
  'How do the findings compare regarding computational efficiency and accuracy?',
  'What specific limitations or experimental constraints were highlighted?',
  'Summarize the key differences between the approaches evaluated.',
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  projectId,
  projectTitle,
  sources,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCitationQuote, setActiveCitationQuote] = useState<{ title: string; quote: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChat();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadChat = async () => {
    try {
      const data = await api.getChat(projectId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text || text.trim().length === 0 || isLoading) return;

    const userTempMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      project_id: projectId,
      sender: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userTempMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await api.sendChatMessage(projectId, text);
      setMessages((prev) => [...prev.filter((m) => m.id !== userTempMsg.id), userTempMsg, aiResponse]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        project_id: projectId,
        sender: 'ai',
        message: 'Error communicating with AI Research Assistant: ' + (err.message || 'Please verify connection and retry.'),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all conversation messages in this project?')) return;
    try {
      await api.clearChat(projectId);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <span>Gemini RAG Research Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {sources.length} Sources Grounded
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Strictly grounded answers with explicit citations and verified chunks.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition flex items-center space-x-1"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        )}
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-200 mb-1">
              Ask Your Research Corpus
            </h4>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Every response is synthesized directly from your ingested documents, returning precise paper citations and chunk excerpts.
            </p>

            <div className="w-full space-y-2 text-left">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Suggested Research Queries:
              </div>
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/30 text-xs text-slate-300 hover:text-indigo-300 transition flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <BrainCircuit className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.message}</div>

                {/* Citations Badges if AI message */}
                {msg.sender === 'ai' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                      <Bookmark className="w-3 h-3 text-indigo-400" />
                      <span>Verified Evidence Citations:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cite, cIdx) => (
                        <div key={cIdx} className="relative group">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCitationQuote({
                                title: cite.source_title,
                                quote: cite.quote || 'Exact text excerpt referenced from source chunk.',
                              })
                            }
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-indigo-400" />
                            <span className="max-w-[200px] truncate">{cite.source_title}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-indigo-500/20 rounded font-mono text-indigo-200">
                              Chunk #{cite.chunk_index}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-400 flex items-center space-x-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Synthesizing chunks & attributing sources...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Citation Quote Modal Popup */}
      {activeCitationQuote && (
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs flex items-start justify-between space-x-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="font-semibold text-indigo-300 flex items-center space-x-1.5">
              <Quote className="w-3.5 h-3.5" />
              <span>Evidence Quote: {activeCitationQuote.title}</span>
            </div>
            <p className="text-slate-300 italic text-[11px] leading-relaxed">
              "{activeCitationQuote.quote}"
            </p>
          </div>
          <button
            onClick={() => setActiveCitationQuote(null)}
            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder={
              sources.length === 0
                ? 'Upload research sources first to enable RAG chat...'
                : 'Ask questions across all ingested papers (e.g. Compare methodology and results)...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />

          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center space-x-1.5 transition cursor-pointer"
            aria-label="Send message"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
