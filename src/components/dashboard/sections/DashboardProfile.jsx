import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Shield, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardProfile() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await base44.entities.User.list('-created_date', 100);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      toast.success(`Rôle mis à jour en ${newRole}`);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Utilisateurs</h2>
        <p className="text-white/60">Gestion des utilisateurs et des rôles</p>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Liste des Utilisateurs ({users.length})
        </h3>

        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 flex items-center justify-between hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
                  {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{user.full_name || user.email}</p>
                  <p className="text-white/50 text-sm">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      user.role === 'admin'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                    </span>
                    <span className="text-white/40 text-xs">
                      Inscrit le {new Date(user.created_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user.role === 'user' ? (
                  <Button
                    onClick={() => handleRoleChange(user.id, 'admin')}
                    size="sm"
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400"
                  >
                    <Shield className="w-3 h-3 mr-2" />
                    Promouvoir Admin
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleRoleChange(user.id, 'user')}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <User className="w-3 h-3 mr-2" />
                    Rétrograder
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}