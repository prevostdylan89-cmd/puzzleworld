import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Users, UserPlus, UserCheck, UserX, Loader2, Search, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Friends() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [friendshipsData, usersData] = await Promise.all([
        base44.entities.Friendship.filter({}),
        base44.entities.UserProfile.filter({})
      ]);

      // Amis acceptés
      const acceptedFriends = friendshipsData.filter(
        f => f.status === 'accepted' && 
        (f.requester_email === currentUser.email || f.addressee_email === currentUser.email)
      ).map(f => ({
        email: f.requester_email === currentUser.email ? f.addressee_email : f.requester_email,
        name: f.requester_email === currentUser.email ? f.addressee_name : f.requester_name,
        friendshipId: f.id
      }));

      // Demandes reçues
      const pending = friendshipsData.filter(
        f => f.status === 'pending' && f.addressee_email === currentUser.email
      );

      // Demandes envoyées
      const sent = friendshipsData.filter(
        f => f.status === 'pending' && f.requester_email === currentUser.email
      );

      setFriends(acceptedFriends);
      setPendingRequests(pending);
      setSentRequests(sent);

      // Utiliser UserProfile directement (accessible à tous les utilisateurs)
      const allProfiles = usersData.filter(u => u.email !== currentUser.email);
      setAllUsers(allProfiles);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (targetUser) => {
    try {
      await base44.entities.Friendship.create({
        requester_email: user.email,
        requester_name: user.full_name || user.email,
        addressee_email: targetUser.email,
        addressee_name: targetUser.full_name || targetUser.email,
        status: 'pending'
      });
      toast.success('Demande envoyée');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await base44.entities.Friendship.update(requestId, { status: 'accepted' });
      toast.success('Demande acceptée');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await base44.entities.Friendship.delete(requestId);
      toast.success('Demande refusée');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const removeFriend = async (friendshipId) => {
    try {
      await base44.entities.Friendship.delete(friendshipId);
      toast.success('Ami supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const isFriend = (email) => friends.some(f => f.email === email);
  const hasPendingRequest = (email) => 
    pendingRequests.some(r => r.requester_email === email) ||
    sentRequests.some(r => r.addressee_email === email);

  const filteredUsers = searchQuery.trim().length < 2 ? [] : allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.friend_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Amis</h1>
        </div>
        <p className="text-white/60">Gérez vos amis et demandes d'amitié</p>
      </motion.div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="friends" className="data-[state=active]:bg-orange-500/20">
            Mes amis ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-orange-500/20">
            Demandes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="find" className="data-[state=active]:bg-orange-500/20">
            Trouver des amis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Vous n'avez pas encore d'amis</p>
            </div>
          ) : (
            friends.map((friend) => (
              <motion.div
                key={friend.email}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {friend.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{friend.name}</p>
                    <p className="text-white/40 text-sm">{friend.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={createPageUrl(`Messages?friend=${friend.email}`)}>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => removeFriend(friend.friendshipId)}
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <UserPlus className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Aucune demande en attente</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {request.requester_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{request.requester_name}</p>
                    <p className="text-white/40 text-sm">{request.requester_email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => acceptRequest(request.id)}
                  >
                    <UserCheck className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => declineRequest(request.id)}
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="find" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              placeholder="Rechercher par nom, pseudo ou code ami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white"
            />
          </div>

          {searchQuery.trim().length < 2 && (
            <div className="text-center py-8 text-white/40 text-sm">
              Tapez au moins 2 caractères pour rechercher
            </div>
          )}

          {filteredUsers.map((targetUser) => (
            <motion.div
              key={targetUser.email}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    {(targetUser.full_name || targetUser.email)?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{targetUser.display_name || targetUser.full_name || targetUser.email}</p>
                  {targetUser.friend_code && (
                    <p className="text-orange-400/70 text-xs">{targetUser.friend_code}</p>
                  )}
                  <p className="text-white/40 text-sm">{targetUser.email}</p>
                </div>
              </div>
              {isFriend(targetUser.email) ? (
                <Button size="sm" variant="outline" disabled>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Ami
                </Button>
              ) : hasPendingRequest(targetUser.email) ? (
                <Button size="sm" variant="outline" disabled>
                  En attente
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => sendFriendRequest(targetUser)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}