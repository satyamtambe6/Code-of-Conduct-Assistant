import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  MessageSquare,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  FileText,
  ChevronRight,
  Shield,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useThemeAndLang } from '../contexts/ThemeAndLangContext.tsx';
import { api } from '../services/api.ts';
import { IChatMessage, IChatConversation } from '../types.ts';

interface ChatPageProps {
  initialPrompt?: string;
  onNavigatePolicy?: (policyId: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ initialPrompt, onNavigatePolicy }) => {
  const { user } = useAuth();
  const { language, t } = useThemeAndLang();

  const [conversations, setConversations] = useState<IChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackSuccessId, setFeedbackSuccessId] = useState<string | null>(null);
  const [activeFeedbackModal, setActiveFeedbackModal] = useState<{ messageId: string; helpful: boolean } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history if authenticated
  useEffect(() => {
    async function loadHistory() {
      if (user) {
        try {
          const list = await api.getChatHistory();
          setConversations(list);
          if (list.length > 0 && !currentConversationId) {
            // Load latest conversation
            loadConversation(list[0]._id);
          }
        } catch (err) {
          console.error('Failed to load history:', err);
        }
      }
    }
    loadHistory();
  }, [user]);

  // Handle initial prompt from navigation
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const loadConversation = async (convId: string) => {
    setCurrentConversationId(convId);
    try {
      const data = await api.getConversationMessages(convId);
      setMessages(data.messages);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const handleStartNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (currentConversationId === convId) {
        handleStartNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || loading) return;

    // Create optimistic user message
    const tempUserMsg: IChatMessage = {
      _id: `temp_${Date.now()}`,
      conversationId: currentConversationId || 'temp',
      sender: 'user',
      content: text,
      isOfficialPolicy: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text, currentConversationId || undefined, language);

      const assistantMsg: IChatMessage = {
        _id: response.messageId,
        conversationId: response.conversationId,
        sender: 'assistant',
        content: response.answer,
        citations: response.citations,
        isOfficialPolicy: response.isOfficialPolicy,
        followUpQuestions: response.followUpQuestions,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (response.conversationId && response.conversationId !== currentConversationId) {
        setCurrentConversationId(response.conversationId);
        if (user) {
          const updatedList = await api.getChatHistory();
          setConversations(updatedList);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: IChatMessage = {
        _id: `err_${Date.now()}`,
        conversationId: currentConversationId || 'temp',
        sender: 'assistant',
        content:
          'We encountered an issue processing your request against the policy knowledge base. Please verify network connectivity or contact the compliance desk.',
        isOfficialPolicy: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const submitMessageFeedback = async () => {
    if (!activeFeedbackModal) return;
    try {
      await api.rateMessage(activeFeedbackModal.messageId, activeFeedbackModal.helpful, feedbackComment);
      setFeedbackSuccessId(activeFeedbackModal.messageId);
      setActiveFeedbackModal(null);
      setFeedbackComment('');
      setTimeout(() => setFeedbackSuccessId(null), 3000);
    } catch (err) {
      console.error('Failed submitting feedback:', err);
    }
  };

  const suggestedQuestions = [
    'What are the institutional rules regarding workplace harassment?',
    'Is accepting a gift or free meal from a vendor allowed?',
    'What are the guidelines on generative AI for student assignments?',
    'How do I report misconduct safely and what protects me from retaliation?',
    'What are the requirements for handling confidential student or employee data?',
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Sidebar: Conversations (Desktop) */}
      <aside className="hidden md:flex w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Conversations
          </span>
          <button
            onClick={handleStartNewConversation}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-40" />
              <span>No saved chats yet. Inquiries will appear here.</span>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => loadConversation(conv._id)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  currentConversationId === conv._id
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-900/60'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv._id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Knowledge Status Badge */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Policy RAG Knowledge Base Active</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Responses strictly grounded in approved institutional policies.
          </p>
        </div>
      </aside>

      {/* Main Chat Stream */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="mx-auto max-w-2xl text-center py-12">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shadow-xs">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Institutional Policy Assistant
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Ask any question regarding student honor codes, workplace ethics, gifts, anti-harassment,
                or data privacy. All answers cite official policy sections.
              </p>

              <div className="mt-8 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
                  Select a starter inquiry:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-700 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 text-left transition-all shadow-2xs flex items-center justify-between group"
                    >
                      <span className="font-medium group-hover:text-teal-600 dark:group-hover:text-teal-400">
                        "{q}"
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages Stream */
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender identity */}
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1 px-1">
                    {msg.sender === 'user' ? (
                      <span>You</span>
                    ) : (
                      <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                        <Sparkles className="h-3 w-3" />
                        Code of Conduct Assistant
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-2xs max-w-[92%] sm:max-w-[85%] ${
                      msg.sender === 'user'
                        ? 'bg-teal-600 text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {/* Official Policy vs General Guidance Banner */}
                    {msg.sender === 'assistant' && (
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        {msg.isOfficialPolicy ? (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                            <Shield className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            <span>Official Policy Grounded</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Information Not in Current Policy Catalog</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-slate-400">
                          <button
                            onClick={() => handleCopy(msg._id, msg.content)}
                            className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Copy text"
                          >
                            {copiedId === msg._id ? (
                              <Check className="h-3.5 w-3.5 text-teal-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content text */}
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Citations Box */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          <BookOpen className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          <span>Official Sources & Citations</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.citations.map((cite, cIdx) => (
                            <div
                              key={cIdx}
                              className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-2 text-xs"
                            >
                              <div className="flex items-center justify-between text-slate-900 dark:text-white font-medium">
                                <span className="font-semibold text-teal-700 dark:text-teal-300">
                                  {cite.policyTitle}
                                </span>
                                {cite.pageNumber && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Page {cite.pageNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {cite.sectionTitle}
                              </div>
                              {cite.snippet && (
                                <p className="mt-1 text-[11px] italic text-slate-600 dark:text-slate-300 line-clamp-2">
                                  "{cite.snippet}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Questions Suggestions */}
                    {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                          Follow-up inquiries:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.followUpQuestions.map((fq, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSend(fq)}
                              className="rounded-md border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 px-2.5 py-1 text-[11px] font-medium text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors text-left"
                            >
                              {fq}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback Rating Bar */}
                    {msg.sender === 'assistant' && (
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400">
                        <span className="text-[10px]">Was this answer accurate & helpful?</span>
                        <div className="flex items-center gap-2">
                          {feedbackSuccessId === msg._id ? (
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                              Feedback recorded!
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveFeedbackModal({ messageId: msg._id, helpful: true })}
                                className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors p-1"
                                title="Mark as helpful"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                <span>Yes</span>
                              </button>
                              <button
                                onClick={() => setActiveFeedbackModal({ messageId: msg._id, helpful: false })}
                                className="inline-flex items-center gap-1 hover:text-rose-500 transition-colors p-1"
                                title="Needs improvement"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                <span>No</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs text-slate-500 shadow-2xs">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
                      <span>Retrieving authorized policy sections and generating grounded response...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Form */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="mx-auto max-w-3xl"
          >
            <div className="relative flex items-end rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-2 focus-within:border-teal-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-xs">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about official rules, sanctions, conflict of interest, reporting, or harassment policies..."
                className="w-full resize-none bg-transparent px-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition-colors shrink-0 shadow-2xs"
                aria-label="Send query"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                Answers are grounded in official institutional documents. Not legal advice.
              </span>
              <span className="hidden sm:inline">Press Enter to send · Shift+Enter for new line</span>
            </div>
          </form>
        </div>
      </div>

      {/* Feedback Comment Modal */}
      {activeFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {activeFeedbackModal.helpful ? 'Why was this answer helpful?' : 'How can we improve this answer?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Your feedback is audited to ensure institutional policy accuracy and eliminate ambiguity.
            </p>

            <textarea
              rows={3}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Optional: Mention if citations were accurate, missing context, or if wording was unclear..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveFeedbackModal(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Skip / Cancel
              </button>
              <button
                onClick={submitMessageFeedback}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-2xs"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
