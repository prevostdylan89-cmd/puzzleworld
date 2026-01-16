import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Grid3X3, 
  User, 
  Gamepad2,
  Puzzle,
  LogOut,
  Languages
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const translations = {
    fr: {
      home: 'Accueil', social: 'Social', collection: 'Collection', online: 'En Ligne', profile: 'Profil',
      logOut: 'Déconnexion', logIn: 'Connexion',
    },
    en: {
      home: 'Home', social: 'Social', collection: 'Collection', online: 'Online', profile: 'Profile',
      logOut: 'Log Out', logIn: 'Log In',
    }
  };

  const t = (key) => translations[language][key] || key;

  const navItems = [
    { name: t('home'), icon: Home, page: 'Home' },
    { name: t('social'), icon: Users, page: 'Social' },
    { name: t('collection'), icon: Grid3X3, page: 'Collection' },
    { name: t('online'), icon: Gamepad2, page: 'OnlinePuzzles' },
    { name: t('profile'), icon: User, page: 'Profile' },
  ];

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const userInitials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#000019] text-white">
      <style>{`
        :root {
          --background: 0 0% 5%;
          --foreground: 0 0% 100%;
          --card: 0 0% 8%;
          --card-foreground: 0 0% 100%;
          --primary: 24 100% 50%;
          --primary-foreground: 0 0% 100%;
          --muted: 240 10% 15%;
          --muted-foreground: 240 5% 65%;
          --accent: 240 30% 20%;
          --accent-foreground: 0 0% 100%;
          --border: 240 10% 15%;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 107, 53, 0.3) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 53, 0.3);
          border-radius: 3px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 107, 53, 0.5);
        }
      `}</style>

      {/* Desktop Header */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 h-16 bg-[#000019]/90 backdrop-blur-xl border-b border-white/[0.06] z-50">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              PuzzleHub
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-orange-500/10 text-orange-400' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'group-hover:text-orange-400'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavDesktop"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Languages className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
                <DropdownMenuItem 
                  onClick={() => setLanguage('fr')}
                  className={language === 'fr' ? 'bg-orange-500/20 text-orange-400' : ''}
                >
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'bg-orange-500/20 text-orange-400' : ''}
                >
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white">{user.full_name || user.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
              >
                {t('logIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#000019]/90 backdrop-blur-xl border-b border-white/[0.06] z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Puzzle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">PuzzleHub</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg"
              >
                {t('logIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#000019]/90 backdrop-blur-xl border-t border-white/[0.06] z-40">
        <div className="flex items-center justify-around h-full">
          {navItems.slice(0, 5).map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-orange-400' : 'text-white/40'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen pt-16 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}