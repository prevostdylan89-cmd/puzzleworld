import React, { useState, useEffect } from 'react';
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
  Puzzle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import AddPuzzleModal from '@/components/puzzle/AddPuzzleModal';

const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Social', icon: Users, page: 'Social' },
  { name: 'Collection', icon: Grid3X3, page: 'Collection' },
  { name: 'Online', icon: Gamepad2, page: 'OnlinePuzzles' },
  { name: 'Profile', icon: User, page: 'Profile' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddPuzzle, setShowAddPuzzle] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handlePuzzleAdded = () => {
    // Reload page or trigger refresh
    window.location.reload();
  };

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

      {/* Top Header Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#000019]/90 backdrop-blur-xl border-b border-white/[0.06] z-50">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent hidden sm:inline">
              PuzzleHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 relative ${
                    isActive 
                      ? 'text-orange-400' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <Button
                onClick={() => setShowAddPuzzle(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg hidden sm:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Puzzle
              </Button>
            )}
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white/60 hover:text-white hover:bg-white/5"
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 top-16"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden fixed top-16 left-0 right-0 bg-[#000019]/95 backdrop-blur-xl border-b border-white/[0.06] z-40 p-4"
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
                
                {currentUser && (
                  <Button
                    onClick={() => {
                      setShowAddPuzzle(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Puzzle
                  </Button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Add Puzzle Modal */}
      <AddPuzzleModal
        isOpen={showAddPuzzle}
        onClose={() => setShowAddPuzzle(false)}
        onPuzzleAdded={handlePuzzleAdded}
        user={currentUser}
      />
    </div>
  );
}