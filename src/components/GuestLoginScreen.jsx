import React from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function GuestLoginScreen({ onContinueAsGuest }) {
  return (
    <div className="fixed inset-0 bg-[#000019] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4">
          <img
            src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png"
            alt="PuzzleWorld"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-white">PuzzleWorld</h1>
        <p className="text-white/50 mt-2 text-center">Votre communauté puzzle ultime</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-white font-semibold text-lg">Rejoindre PuzzleWorld</h2>
          <p className="text-white/40 text-sm mt-1">Connectez-vous pour profiter de toutes les fonctionnalités</p>
        </div>

        {/* Login button */}
        <Button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl text-base"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Se connecter avec Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Guest button */}
        <Button
          onClick={onContinueAsGuest}
          variant="outline"
          className="w-full h-12 border-white/20 text-white/70 hover:bg-white/5 hover:text-white rounded-xl text-sm"
        >
          Continuer en mode invité
        </Button>

        <p className="text-white/30 text-xs text-center">
          En mode invité, certaines fonctionnalités sont limitées
        </p>
      </div>

      {/* Features preview */}
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm text-center">
        {[
          { icon: '🧩', label: 'Explorer les puzzles' },
          { icon: '🌍', label: 'Voir la communauté' },
          { icon: '🎉', label: 'Découvrir les events' },
        ].map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{f.icon}</span>
            <span className="text-white/40 text-xs">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}