import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, ShieldCheck } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

interface LiveChatPanelProps {
  messages: ChatMessage[];
  currentUserName: string;
  onSendMessage: (message: string) => void;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({
  messages,
  currentUserName,
  onSendMessage
}) => {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 flex flex-col h-72 sm:h-80 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>In-Interview Chat</span>
        </div>
        <span className="text-[11px] text-slate-500 flex items-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
          End-to-End Synced
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-center">
            <span>Chat is active. Send messages or share code snippets during the session.</span>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderName === currentUserName;
            return (
              <div
                key={m.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-400 font-medium">
                  <span className="font-bold text-slate-300">{m.senderName}</span>
                  <span className="text-indigo-400 uppercase">({m.senderRole})</span>
                  <span>&bull;</span>
                  <span>{formatTime(m.timestamp)}</span>
                </div>
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] break-words leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Send message or code link..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
          disabled={!text.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
