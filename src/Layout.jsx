import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Grid3X3, 
  User, 
  Gamepad2,
  Menu,
  X,
  Search,
  Bell,
  Puzzle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Social', icon: Users, page: 'Social' },
  { name: 'Collection', icon: Grid3X3, page: 'Collection' },
  { name: 'Online', icon: Gamepad2, page: 'OnlinePuzzles' },
  { name: 'Profile', icon: User, page: 'Profile' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-white/[0.06] bg-[#000019]/80 backdrop-blur-xl z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              PuzzleHub
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-orange-500/10 text-orange-400' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'group-hover:text-orange-400'}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/[0.06]">
          <Link 
            to={createPageUrl('Profile')}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Doe</p>
              <p className="text-xs text-white/40 truncate">@puzzlemaster</p>
            </div>
          </Link>
        </div>
      </aside>

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
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/60 hover:text-white hover:bg-white/5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-16 bottom-0 w-64 bg-[#000019] border-l border-white/[0.06] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-orange-500/10 text-orange-400' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

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
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}