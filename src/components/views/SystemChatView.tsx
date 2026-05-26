import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Send,
  Bell,
  AlertTriangle,
  Info,
  Star,
  Clock,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Activity,
  ShieldCheck,
  Zap,
  Layout,
  ArrowRightCircle,
  Hash
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const USER_GRADIENTS = [
  'bg-gradient-to-br from-red-500/20 to-rose-600/20 text-rose-400 border-rose-500/30',
  'bg-gradient-to-br from-orange-500/20 to-amber-600/20 text-amber-400 border-amber-500/30',
  'bg-gradient-to-br from-emerald-400/20 to-green-600/20 text-emerald-400 border-emerald-500/30',
  'bg-gradient-to-br from-teal-400/20 to-emerald-600/20 text-teal-400 border-teal-500/30',
  'bg-gradient-to-br from-cyan-400/20 to-blue-600/20 text-cyan-400 border-cyan-500/30',
  'bg-gradient-to-br from-indigo-400/20 to-violet-600/20 text-indigo-400 border-indigo-500/30',
  'bg-gradient-to-br from-violet-400/20 to-purple-600/20 text-purple-400 border-purple-500/30',
  'bg-gradient-to-br from-fuchsia-400/20 to-pink-600/20 text-pink-400 border-pink-500/30',
  'bg-gradient-to-br from-slate-400/20 to-slate-600/20 text-slate-400 border-slate-500/30',
];

const getUserGradient = (username: string, role: string) => {
  if (role === 'admin' || role === 'super_admin') return 'bg-gradient-to-br from-blue-500/20 to-blue-700/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
  if (!username) return 'bg-gradient-to-br from-gray-500/20 to-gray-700/20 text-gray-400 border-gray-500/30';

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_GRADIENTS[Math.abs(hash) % USER_GRADIENTS.length];
};

type MessageType = 'text' | 'instruction' | 'update' | 'notice' | 'highlight';

interface ChatMessage {
  id: string;
  sender: string;
  sender_role: string;
  sender_user_id?: string;
  message: string;
  message_type: MessageType;
  priority: 'low' | 'moderate' | 'high';
  created_at: string;
  is_read: boolean;
  title?: string;
}

export function SystemChatView() {
  const { currentUser, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [priority, setPriority] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      const formattedData = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type || 'text'
      })) as ChatMessage[];

      setMessages(formattedData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`system_chat_messages_view-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = { ...payload.new, message_type: payload.new.message_type || 'text' } as ChatMessage;
            setMessages(prev => {
              if (prev.some(m => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updated = { ...payload.new, message_type: payload.new.message_type || 'text' } as ChatMessage;
            setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const messageToSend = newMessage.trim();
    const titleToSend = title.trim();

    const tempMessage: ChatMessage = {
      id: tempId,
      sender: currentUser.username,
      sender_role: currentUser.role || 'user',
      sender_user_id: currentUser.id,
      message: messageToSend,
      message_type: messageType,
      priority: priority,
      title: titleToSend || undefined,
      is_read: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setTitle('');
    scrollToBottom();

    setSending(true);
    try {
      const payload = {
        sender: currentUser.username,
        sender_role: currentUser.role || 'user',
        sender_user_id: currentUser.id,
        message: messageToSend,
        message_type: messageType,
        priority: priority,
        title: titleToSend || null,
        is_read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? data : m);
        });
      }

      setMessageType('text');
      setPriority('moderate');

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageToSend);
      setTitle(titleToSend);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string, messageSender: string) => {
    if (messageSender !== currentUser?.username && !isAdmin) {
      toast.error('You can only delete your own messages');
      return;
    }

    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      fetchMessages();
      toast.error('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'all') return true;
    const type = msg.message_type || 'text';
    return type === activeTab;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] w-full max-w-6xl mx-auto glass-card overflow-hidden animate-in fade-in duration-700 shadow-2xl">
      {/* Premium Header */}
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[80px] -mr-16 -mt-16" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4 border border-white/20 shadow-2xl shadow-blue-500/30">
            <MessageSquare className="w-full h-full text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter leading-none">Command Center</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Global Link
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="glass-card bg-white/[0.03] px-5 py-2.5 border-white/10 flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Buffer Sequence</span>
            <span className="text-sm font-black text-white tabular-nums tracking-tighter">{messages.length} PROTOCOLS</span>
          </div>
        </div>
      </div>

      {/* Protocol Filtering Navigation */}
      <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar scrollbar-hide">
        {['all', 'text', 'instruction', 'update', 'notice', 'highlight'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border whitespace-nowrap",
              activeTab === tab
                ? "bg-white/[0.08] text-white border-white/20 shadow-lg"
                : "bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.04]"
            )}
          >
            {tab === 'text' ? 'Communications' : tab === 'instruction' ? 'Directives' : tab}
          </button>
        ))}
      </div>

      {/* Synchronized Protocol Buffer (Messages Area) */}
      <ScrollArea className="flex-1 px-8 py-8 bg-transparent relative custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Protocol Buffer...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <Layout className="w-20 h-20 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
            <h4 className="text-xl font-black text-slate-600 uppercase tracking-tighter mb-2">No Active Streams</h4>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Buffer is currently empty in this sector</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {filteredMessages.map((msg, index) => {
              const isOwn = msg.sender === currentUser?.username;
              const isSequence = index > 0 && filteredMessages[index - 1].sender === msg.sender;
              const senderGradient = getUserGradient(msg.sender, msg.sender_role);

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex animate-in fade-in slide-in-from-bottom-5 duration-500",
                    isOwn ? "justify-end" : "justify-start",
                    isSequence ? "-mt-6" : ""
                  )}
                >
                  <div className={cn("flex max-w-[85%] md:max-w-[70%] gap-5", isOwn ? "flex-row-reverse" : "flex-row")}>
                    {/* High-Resolution Agent Avatar */}
                    {!isOwn && !isSequence && (
                      <div className={cn(
                        "w-12 h-12 rounded-[18px] flex items-center justify-center text-sm font-black border group-hover:scale-110 transition-transform duration-500 shadow-2xl",
                        senderGradient
                      )}>
                        {msg.sender.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    {/* Placeholder for sequence spacing */}
                    {!isOwn && isSequence && <div className="w-12 shrink-0" />}

                    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                      {/* Agent ID Tag */}
                      {!isSequence && (
                        <div className={cn(
                          "flex items-center gap-2 mb-2 px-1",
                          isOwn ? "flex-row-reverse" : ""
                        )}>
                          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                            {isOwn ? "Authorized Agent" : msg.sender}
                          </span>
                          {msg.sender_role === 'admin' && (
                            <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase tracking-tighter">CMD</span>
                          )}
                        </div>
                      )}

                      {/* Premium Glass Protocol Bubble */}
                      <div className="relative group">
                        <div
                          className={cn(
                            "p-6 rounded-[28px] border transition-all duration-500 shadow-2xl",
                            isOwn
                              ? "bg-blue-600/10 border-blue-500/30 text-white rounded-tr-sm hover:bg-blue-600/20"
                              : "bg-white/[0.03] border-white/10 text-slate-300 rounded-tl-sm hover:bg-white/[0.05]"
                          )}
                        >
                          {/* Formal Protocol Header */}
                          {msg.title && (
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center border",
                                msg.message_type === 'instruction' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                  msg.message_type === 'update' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                                    msg.message_type === 'notice' ? "bg-purple-500/10 border-purple-500/20 text-purple-500" :
                                      "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                              )}>
                                {msg.message_type === 'instruction' ? <AlertTriangle className="w-4 h-4" /> :
                                  msg.message_type === 'update' ? <Bell className="w-4 h-4" /> :
                                    msg.message_type === 'notice' ? <Info className="w-4 h-4" /> :
                                      <MessageSquare className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                                  Directive: {msg.message_type}
                                </p>
                                <h5 className="text-base font-black text-white tracking-tight leading-none uppercase">{msg.title}</h5>
                              </div>
                            </div>
                          )}

                          {/* Protocol Message Body */}
                          <p className="text-[15px] font-medium leading-relaxed tracking-tight whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>

                          {/* Temporal Verification Metadata */}
                          <div className={cn(
                            "mt-4 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em]",
                            isOwn ? "flex-row-reverse text-blue-400/60" : "text-slate-600"
                          )}>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(msg.created_at), 'HH:mm:ss')}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {msg.id.substring(0, 8)}
                            </span>
                            {isOwn && <CheckCheck className="w-3 h-3 text-blue-500" />}
                          </div>
                        </div>

                        {/* High-Level Authorization Actions */}
                        {(isOwn || isAdmin) && !msg.id.startsWith('temp-') && (
                          <div className={cn(
                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-300",
                            isOwn ? "-left-14" : "-right-14"
                          )}>
                            <button
                              onClick={() => handleDeleteMessage(msg.id, msg.sender)}
                              className="w-10 h-10 rounded-xl bg-white/[0.03] hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all duration-300 border border-white/5 flex items-center justify-center shadow-2xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Synchronized Uplink Interface (Input) */}
      <div className="p-8 bg-white/[0.03] backdrop-blur-3xl border-t border-white/5 z-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Metadata & Directives Control */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={messageType} onValueChange={(v: MessageType) => setMessageType(v)}>
                <SelectTrigger className="glass-input h-10 min-w-[160px] text-[10px] font-black uppercase tracking-widest border-white/10">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-select-content">
                  <SelectItem value="text">Standard Link</SelectItem>
                  <SelectItem value="instruction">Directive Protocol</SelectItem>
                  <SelectItem value="update">System Update</SelectItem>
                  <SelectItem value="notice">Tier-2 Notice</SelectItem>
                  <SelectItem value="highlight">Priority Flag</SelectItem>
                </SelectContent>
              </Select>

              {messageType !== 'text' && (
                <Select value={priority} onValueChange={(v: 'low' | 'moderate' | 'high') => setPriority(v)}>
                  <SelectTrigger className="glass-input h-10 min-w-[120px] text-[10px] font-black uppercase tracking-widest border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-select-content">
                    <SelectItem value="low">Standard</SelectItem>
                    <SelectItem value="moderate">Elevated</SelectItem>
                    <SelectItem value="high">Critical</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {messageType !== 'text' && (
              <div className="flex-1 min-w-[200px] animate-in slide-in-from-left-4 duration-500">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter Formal Protocol Subject..."
                  className="w-full glass-input h-10 px-4 text-[11px] font-black uppercase tracking-widest placeholder:text-slate-600"
                />
              </div>
            )}
          </div>

          {/* Unified Submission Terminal */}
          <div className="flex items-end gap-5">
            <div className="flex-1 relative group">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={messageType === 'instruction' ? "Synthesize directive parameters..." : "Initiate encrypted data uplink..."}
                className="min-h-[64px] max-h-[250px] glass-input p-6 text-base font-medium resize-none border-white/10 group-hover:bg-white/[0.04] transition-all duration-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="absolute right-4 bottom-4">
                <Paperclip className="w-5 h-5 text-slate-700 hover:text-slate-400 transition-colors cursor-pointer" />
              </div>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className={cn(
                "h-[64px] w-[64px] rounded-[22px] shadow-2xl transition-all duration-500 flex items-center justify-center shrink-0",
                !newMessage.trim()
                  ? "bg-white/[0.02] text-slate-800 border border-white/5 cursor-not-allowed"
                  : "bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border border-white/20 hover:scale-110 active:scale-95 shadow-blue-500/20"
              )}
            >
              <Send className={cn("w-7 h-7 ml-1 transition-transform", sending && "animate-pulse")} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
