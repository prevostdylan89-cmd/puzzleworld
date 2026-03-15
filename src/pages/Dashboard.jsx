import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Home, Grid3X3, Users, Calendar, User, Settings, BarChart3, Gamepad2, Eye, BookOpen } from 'lucide-react';

// Import sections
import DashboardHome from '@/components/dashboard/sections/DashboardHome';
import DashboardMyCollection from '@/components/dashboard/sections/DashboardMyCollection';
import DashboardSocial from '@/components/dashboard/sections/DashboardSocial';
import DashboardEvents from '@/components/dashboard/sections/DashboardEvents';
import DashboardProfile from '@/components/dashboard/sections/DashboardProfile';
import DashboardSettings from '@/components/dashboard/sections/DashboardSettings';
import DashboardData from '@/components/dashboard/sections/DashboardData';
import DashboardOnline from '@/components/dashboard/sections/DashboardOnline';
import DashboardPendingPuzzles from '@/components/dashboard/sections/DashboardPendingPuzzles';
import DashboardPageVisibility from '@/components/dashboard/sections/DashboardPageVisibility';
import DashboardBlog from '@/components/dashboard/sections/DashboardBlog';

const SECTIONS = [
  { id: 'home', label: 'Accueil', icon: Home, component: DashboardHome },
  { id: 'mycollection', label: 'Ma Collection', icon: Grid3X3, component: DashboardMyCollection },
  { id: 'pending', label: 'En attente', icon: Grid3X3, component: DashboardPendingPuzzles },
  { id: 'social', label: 'Social', icon: Users, component: DashboardSocial },
  { id: 'events', label: 'Événements', icon: Calendar, component: DashboardEvents },
  { id: 'online', label: 'En Ligne', icon: Gamepad2, component: DashboardOnline },
  { id: 'data', label: 'Données', icon: BarChart3, component: DashboardData },
  { id: 'profile', label: 'Utilisateurs', icon: User, component: DashboardProfile },
  { id: 'visibility', label: 'Pages', icon: Eye, component: DashboardPageVisibility },
  { id: 'blog', label: 'Blog', icon: BookOpen, component: DashboardBlog },
  { id: 'settings', label: 'Paramètres', icon: Settings, component: DashboardSettings },
];

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') {
        setIsAdmin(true);
      } else {
        toast.error('Accès réservé aux administrateurs');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error checking admin:', error);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000019]">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const ActiveComponent = SECTIONS.find(s => s.id === activeSection)?.component;

  return (
    <div className="min-h-screen bg-[#000019] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a2e] border-r border-white/[0.06] fixed h-full overflow-y-auto">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white mb-2">Dashboard Admin</h1>
          <p className="text-white/50 text-xs">Gestion de la plateforme</p>
        </div>

        <nav className="px-3 pb-6">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  );
}