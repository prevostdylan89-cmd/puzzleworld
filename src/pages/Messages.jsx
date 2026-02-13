import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend.email);
      const interval = setInterval(() => loadMessages(selectedFriend.email), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedFriend]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

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

      // Check URL params for pre-selected friend
      const urlParams = new URLSearchParams(window.location.search);
      const friendEmail = urlParams.get('friend');
      if (friendEmail) {
        const friend = myFriends.find(f => f.email === friendEmail);
        if (friend) setSelectedFriend(friend);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (friendEmail) => {
    if (!user) return;
    
    try {
      const conversationId = [user.email, friendEmail].sort().join('_');
      const msgs = await base44.entities.DirectMessage.filter({
        conversation_id: conversationId
      });
      
      // Mark messages as read
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
    if (!newMessage.trim() || !selectedFriend || !user) return;

    try {
      const conversationId = [user.email, selectedFriend.email].sort().join('_');
      
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        receiver_email: selectedFriend.email,
        receiver_name: selectedFriend.name,
        message: newMessage.trim(),
        conversation_id: conversationId,
        is_read: false
      });

      setNewMessage('');
      loadMessages(selectedFriend.email);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Aucun ami</h2>
          <p className="text-white/60 mb-6">
            Ajoutez des amis pour commencer à discuter
          </p>
          <Link to={createPageUrl('Friends')}>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Trouver des amis
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] p-4 lg:p-8">
      <div className="h-full bg-white/5 border border-white/10 rounded-xl overflow-hidden flex">
        {/* Friends List */}
        <div className="w-80 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {friends.map((friend) => (
              <button
                key={friend.email}
                onClick={() => setSelectedFriend(friend)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                  selectedFriend?.email === friend.email ? 'bg-white/10' : ''
                }`}
              >
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    {friend.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{friend.name}</p>
                  <p className="text-white/40 text-sm truncate">{friend.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    {selectedFriend.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{selectedFriend.name}</p>
                  <p className="text-white/40 text-sm">{selectedFriend.email}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isMine = msg.sender_email === user.email;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-2xl ${
                          isMine
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-white/40'}`}>
                          {new Date(msg.created_date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Sélectionnez un ami pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}