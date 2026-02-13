import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Send, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FloatingChat() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [openChats, setOpenChats] = useState([]);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    loadUser();
    const interval = setInterval(checkUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadFriends(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const loadFriends = async (currentUser) => {
    try {
      const friendshipsData = await base44.entities.Friendship.filter({
        status: 'accepted'
      });

      const myFriends = friendshipsData
        .filter(f => 
          f.requester_email === currentUser.email || 
          f.addressee_email === currentUser.email
        )
        .map(f => ({
          email: f.requester_email === currentUser.email ? f.addressee_email : f.requester_email,
          name: f.requester_email === currentUser.email ? f.addressee_name : f.requester_name
        }));

      setFriends(myFriends);
      checkUnreadMessages();
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const checkUnreadMessages = async () => {
    if (!user) return;
    
    try {
      const messages = await base44.entities.DirectMessage.filter({
        receiver_email: user.email,
        is_read: false
      });

      const counts = {};
      messages.forEach(msg => {
        counts[msg.sender_email] = (counts[msg.sender_email] || 0) + 1;
      });

      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  const openChat = (friend) => {
    if (!openChats.find(c => c.email === friend.email)) {
      setOpenChats([...openChats, friend]);
    }
    setShowFriendsList(false);
  };

  const closeChat = (friendEmail) => {
    setOpenChats(openChats.filter(c => c.email !== friendEmail));
  };

  if (!user || friends.length === 0) return null;

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="fixed bottom-0 right-4 z-50 hidden lg:flex gap-2 items-end">
      {/* Open Chat Windows */}
      {openChats.map((friend) => (
        <ChatWindow
          key={friend.email}
          friend={friend}
          user={user}
          onClose={() => closeChat(friend.email)}
          unreadCount={unreadCounts[friend.email] || 0}
        />
      ))}

      {/* Friends List Popup */}
      <AnimatePresence>
        {showFriendsList && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-72 h-96 bg-[#0a0a2e] border border-white/10 rounded-t-xl shadow-2xl overflow-hidden flex flex-col mb-14"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Amis</h3>
              <button onClick={() => setShowFriendsList(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {friends.map((friend) => (
                <button
                  key={friend.email}
                  onClick={() => openChat(friend)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                      {friend.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium truncate">{friend.name}</p>
                  </div>
                  {unreadCounts[friend.email] > 0 && (
                    <Badge className="bg-red-500 text-white">{unreadCounts[friend.email]}</Badge>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Button */}
      <button
        onClick={() => setShowFriendsList(!showFriendsList)}
        className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all relative"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}

function ChatWindow({ friend, user, onClose, unreadCount }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [friend.email]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const conversationId = [user.email, friend.email].sort().join('_');
      const msgs = await base44.entities.DirectMessage.filter({
        conversation_id: conversationId
      });

      // Mark as read
      const unreadMessages = msgs.filter(
        m => !m.is_read && m.receiver_email === user.email
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.DirectMessage.update(msg.id, { is_read: true });
      }

      setMessages(msgs.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const conversationId = [user.email, friend.email].sort().join('_');
      
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        receiver_email: friend.email,
        receiver_name: friend.name,
        message: newMessage.trim(),
        conversation_id: conversationId,
        is_read: false
      });

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-80 bg-[#0a0a2e] border border-white/10 rounded-t-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ height: isMinimized ? '56px' : '400px' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-orange-600/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
              {friend.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-medium truncate">{friend.name}</span>
          {unreadCount > 0 && !isMinimized && (
            <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/60 hover:text-white p-1"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => {
              const isMine = msg.sender_email === user.email;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-white/5 border-white/20 text-white text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </motion.div>
  );
}