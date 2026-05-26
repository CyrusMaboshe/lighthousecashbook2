/**
 * System Chat Component - In-built chat system for users
 * Supports: texts, instructions, updates, notices, highlighted comments
 * Redesigned for Premium Glass/iPhone Aesthetic
 */

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
  Paperclip
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Premium Gradient Colors for User Avatars
const USER_GRADIENTS = [
  'bg-gradient-to-br from-red-500 to-rose-600',
  'bg-gradient-to-br from-orange-500 to-amber-600',
  'bg-gradient-to-br from-amber-400 to-orange-500',
  'bg-gradient-to-br from-emerald-400 to-green-600',
  'bg-gradient-to-br from-teal-400 to-emerald-600',
  'bg-gradient-to-br from-cyan-400 to-blue-600',
  'bg-gradient-to-br from-indigo-400 to-violet-600',
  'bg-gradient-to-br from-violet-400 to-purple-600',
  'bg-gradient-to-br from-fuchsia-400 to-pink-600',
  'bg-gradient-to-br from-pink-400 to-rose-600',
  'bg-gradient-to-br from-slate-400 to-slate-600',
];

const getUserGradient = (username: string, role: string) => {
  if (role === 'admin' || role === 'super_admin') return 'bg-gradient-to-br from-blue-500 to-blue-700';
  if (!username) return 'bg-gradient-to-br from-gray-500 to-gray-700';

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
}

interface SystemChatProps {
  isOpen: boolean;
  onClose: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function SystemChat({ isOpen, onClose, isFullscreen = false, onToggleFullscreen }: SystemChatProps) {
  const { currentUser, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [priority, setPriority] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [isOpen]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    // Small timeout to ensure DOM is updated
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
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('system_chat_messages')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as ChatMessage;
            setMessages(prev => {
              if (prev.some(m => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? (payload.new as ChatMessage) : m));
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

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const messageToSend = newMessage.trim();

    const tempMessage: ChatMessage = {
      id: tempId,
      sender: currentUser.username,
      sender_role: currentUser.role || 'user',
      sender_user_id: currentUser.id,
      message: messageToSend,
      message_type: messageType,
      priority: priority,
      is_read: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
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
    return msg.message_type === activeTab;
  });

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed z-[200] flex flex-col transition-all duration-300 backdrop-blur-2xl",
      // Premium Glass Container Styling
      "bg-[#0f172a]/95 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
      "rounded-2xl overflow-hidden",
      isFullscreen
        ? "inset-4 md:inset-8"
        : "bottom-4 right-4 w-[95vw] sm:w-[400px] h-[650px] max-h-[85vh]"
    )}>
      {/* Premium Header */}
      <div className="bg-white/5 border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">System Chat</h3>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
              Live Connected
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 transition-all"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-full h-8 w-8 transition-all"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Glass Tabs */}
      <div className="px-2 py-2 bg-white/[0.02]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-9 w-full justify-start gap-2 overflow-x-auto no-scrollbar p-0">
            {['all', 'text', 'instruction', 'update', 'notice'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="text-[11px] font-medium h-7 rounded-lg px-3 
                  data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:backdrop-blur-md 
                  text-white/50 hover:text-white/80 transition-all border border-transparent data-[state=active]:border-white/10 capitalize"
              >
                {tab === 'text' ? 'Chats' : tab === 'instruction' ? 'Tasks' : tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-transparent relative scroll-smooth">
        {/* Background Depth Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-white/30">
            <div className="bg-white/5 p-4 rounded-full mb-4 ring-1 ring-white/10">
              <MessageSquare className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium text-white/50">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation with your team.</p>
          </div>
        ) : (
          <div className="space-y-6 relative z-10 pb-4">
            {filteredMessages.map((msg, index) => {
              const isOwn = msg.sender === currentUser?.username;
              const isSequence = index > 0 && filteredMessages[index - 1].sender === msg.sender;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col animate-in slide-in-from-bottom-2 duration-300",
                    isOwn ? "items-end" : "items-start",
                    isSequence ? "mt-1" : "mt-5"
                  )}
                >
                  <div className={cn("flex max-w-[85%] gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
                    {/* Unique Avatar */}
                    {!isOwn && (
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg ring-1 ring-white/10 transform transition-all hover:scale-110 cursor-default mt-0.5",
                        !isSequence ? getUserGradient(msg.sender, msg.sender_role) : "opacity-0 h-0 w-8 overflow-hidden"
                      )}>
                        {!isSequence && msg.sender.substring(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                      {/* Sender Name */}
                      {!isOwn && !isSequence && (
                        <span className="text-[10px] text-white/40 ml-1 mb-1.5 flex items-center gap-1.5 tracking-wide font-medium">
                          {msg.sender}
                          {msg.sender_role === 'admin' &&
                            <span className="px-1.5 py-0.5 rounded-[4px] bg-blue-500/20 text-blue-300 text-[9px] border border-blue-500/30">ADMIN</span>
                          }
                        </span>
                      )}

                      {/* Message Bubble - Premium Styling */}
                      <div className="relative group">
                        <div
                          className={cn(
                            "px-4 py-3 shadow-lg backdrop-blur-sm text-[13px] leading-relaxed transition-all duration-200 border",
                            isOwn
                              ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm border-blue-500/50 hover:bg-blue-500"
                              : cn(
                                "rounded-2xl rounded-tl-sm text-white/90 border-white/5 hover:border-white/10",
                                // Dynamic subtle background based on user color but very dark/glassy
                                "bg-[#1e293b]/80"
                              )
                          )}
                        >
                          {/* Message Type Indicator */}
                          {msg.message_type !== 'text' && (
                            <div className={cn(
                              "flex items-center gap-1.5 mb-2 text-[10px] uppercase font-bold tracking-wider opacity-80 border-b pb-1.5 border-white/10",
                              msg.message_type === 'instruction' && "text-amber-400",
                              msg.message_type === 'update' && "text-blue-400",
                              msg.message_type === 'notice' && "text-purple-400",
                              msg.message_type === 'highlight' && "text-yellow-400",
                            )}>
                              {msg.message_type === 'instruction' && <AlertTriangle className="h-3 w-3" />}
                              {msg.message_type === 'update' && <Bell className="h-3 w-3" />}
                              {msg.message_type === 'notice' && <Info className="h-3 w-3" />}
                              {msg.message_type === 'highlight' && <Star className="h-3 w-3" />}
                              <span>{msg.message_type}</span>
                            </div>
                          )}

                          {/* Priority Indicator */}
                          {msg.priority !== 'moderate' && msg.priority !== 'low' && (
                            <div className="flex items-center gap-1 mb-2">
                              <span cn-override className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-bold border border-red-500/30 uppercase tracking-wider">
                                Urgent
                              </span>
                            </div>
                          )}

                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>

                        {/* Time & Read Status - Outside Bubble for cleaner look */}
                        <div className={cn(
                          "absolute -bottom-5 text-[9px] flex items-center gap-1 opacity-0 group-hover:opacity-60 transition-opacity duration-200",
                          isOwn ? "right-1 text-white" : "left-1 text-white"
                        )}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                          {isOwn && <CheckCheck className="h-2.5 w-2.5" />}
                        </div>

                        {/* Delete Action */}
                        {(isOwn || isAdmin) && !msg.id.startsWith('temp-') && (
                          <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1",
                            isOwn ? "-left-8" : "-right-8"
                          )}>
                            <button
                              onClick={() => handleDeleteMessage(msg.id, msg.sender)}
                              className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Premium Input Area */}
      <div className="p-4 bg-white/[0.03] backdrop-blur-xl border-t border-white/10">
        <div className="flex flex-col gap-3">
          {/* Controls Bar */}
          <div className="flex items-center gap-2">
            <Select value={messageType} onValueChange={(v: MessageType) => setMessageType(v)}>
              <SelectTrigger className="h-7 text-[10px] w-auto min-w-[80px] bg-white/5 border-white/10 text-white/70 hover:bg-white/10 focus:ring-0 focus:ring-offset-0 rounded-lg px-2 gap-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                <SelectItem value="text">Message</SelectItem>
                <SelectItem value="instruction">Task</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="notice">Notice</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
              </SelectContent>
            </Select>

            {messageType !== 'text' && (
              <Select value={priority} onValueChange={(v: 'low' | 'moderate' | 'high') => setPriority(v)}>
                <SelectTrigger className="h-7 text-[10px] w-auto bg-white/5 border-white/10 text-white/70 hover:bg-white/10 focus:ring-0 focus:ring-offset-0 rounded-lg px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="moderate">Normal</SelectItem>
                  <SelectItem value="high">Urgent</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="ml-auto flex items-center gap-1">
              {/* Placeholder for future attachment feature */}
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                <Paperclip className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Text Input & Send */}
          <div className="relative flex items-end gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-[120px] py-3 px-4 text-sm resize-none rounded-2xl 
                bg-black/20 border-white/10 text-white placeholder:text-white/30 
                focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 scrollbar-hide"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className={cn(
                "h-11 w-11 rounded-full shrink-0 shadow-lg transition-all duration-300",
                !newMessage.trim()
                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 hover:shadow-blue-500/25"
              )}
            >
              <Send className={cn("h-5 w-5 ml-0.5 transition-transform", sending && "animate-pulse")} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating Chat Button Component - Premium Style
export function ChatButton({ onClick, unreadCount = 0 }: { onClick: () => void; unreadCount?: number }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full 
        bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 
        shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.6)]
        transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10"
    >
      <MessageSquare className="h-6 w-6 text-white text-shadow-sm" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0f172a] animate-bounce shadow-md">
          {unreadCount}
        </span>
      )}
    </Button>
  );
}
