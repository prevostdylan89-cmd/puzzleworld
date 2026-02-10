import React from 'react';
import { Grid3X3 } from 'lucide-react';

export default function DashboardMyCollection() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Ma Collection</h2>
        <p className="text-white/60">Outils de gestion des collections utilisateurs</p>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <div className="text-center py-12">
          <Grid3X3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Collections Utilisateurs</h3>
          <p className="text-white/60 mb-4">
            Statistiques, gestion des doublons, correction de données
          </p>
          <p className="text-white/40 text-sm">Section en développement</p>
        </div>
      </div>
    </div>
  );
}