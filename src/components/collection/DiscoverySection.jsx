import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, RefreshCw, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getTopValue(items, key) {
  const counts = {};
  items.forEach(i => {
    const v = i[key];
    if (v) counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DiscoveryPuzzleCard({ puzzle, onAddToCollection, onClick }) {
  return (
    <div
      className="relative bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/30 rounded-xl overflow-hidden transition-all group cursor-pointer active:scale-95 flex-shrink-0 w-36 lg:w-44"
      onClick={onClick}
    >
      <div className="absolute top-1.5 right-1.5 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10 z-50 min-w-[180px]">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddToCollection('wishlist'); }} className="text-white hover:bg-white/10 cursor-pointer">
              ⭐ Wishlist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddToCollection('inbox'); }} className="text-white hover:bg-white/10 cursor-pointer">
              📦 Dans sa boîte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddToCollection('done'); }} className="text-white hover:bg-white/10 cursor-pointer">
              🏆 Terminé
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="aspect-[3/4] overflow-hidden bg-white/5">
        {puzzle.image_hd ? (
          <img src={puzzle.image_hd} alt={puzzle.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/20 text-2xl">🧩</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-white text-[11px] font-semibold line-clamp-2 mb-0.5 leading-tight">{puzzle.title}</h3>
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span className="truncate max-w-[60%]">{puzzle.brand || ''}</span>
          <span>{puzzle.piece_count} pcs</span>
        </div>
      </div>
    </div>
  );
}

function HorizontalSection({ title, icon, puzzles, onAddToCollection, onPuzzleClick }) {
  if (!puzzles.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-4 lg:px-0">
        <span className="text-lg">{icon}</span>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        <span className="text-white/30 text-xs">({puzzles.length})</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 px-4 lg:px-0 scrollbar-hide">
        {puzzles.map(puzzle => (
          <DiscoveryPuzzleCard
            key={puzzle.id}
            puzzle={puzzle}
            onAddToCollection={(status) => onAddToCollection(puzzle, status)}
            onClick={() => onPuzzleClick(puzzle)}
          />
        ))}
      </div>
    </div>
  );
}

export default function DiscoverySection({ globalPuzzles }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [discovery, setDiscovery] = useState(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const buildDiscovery = async (catalogPuzzles) => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) { setLoading(false); return; }
      setUser(currentUser);

      const userPuzzles = await base44.entities.UserPuzzle.filter({ created_by: currentUser.email });

      // If user has no puzzles, show a varied selection from catalog
      if (userPuzzles.length === 0) {
        const validPuzzles = catalogPuzzles.filter(p => p.piece_count >= 500);
        const brandMap = {};
        validPuzzles.forEach(p => { if (p.brand) brandMap[p.brand] = (brandMap[p.brand] || []); brandMap[p.brand].push(p); });
        const variedSelection = shuffle(validPuzzles).slice(0, 30);
        setDiscovery({
          topBrand: null, topPieceBucket: null, topCategory: null,
          brandPuzzles: [], piecePuzzles: [], catPuzzles: [],
          discoveryPuzzles: variedSelection,
          isGeneric: true,
          total: variedSelection.length,
        });
        setLoading(false);
        return;
      }

      // Exclude already owned
      const ownedRefs = new Set(userPuzzles.map(p => p.puzzle_reference).filter(Boolean));
      const ownedNames = new Set(userPuzzles.map(p => p.puzzle_name?.toLowerCase().trim()).filter(Boolean));
      const available = catalogPuzzles.filter(p => {
        if (ownedRefs.has(p.asin) || ownedRefs.has(p.id)) return false;
        if (ownedNames.has(p.title?.toLowerCase().trim())) return false;
        return true;
      });

      // Top brand
      const topBrand = getTopValue(userPuzzles, 'puzzle_brand');

      // Top category
      const topCategory = getTopValue(userPuzzles, 'puzzle_category') || getTopValue(userPuzzles, 'category_tag');

      // User known brands & piece counts
      const userBrands = new Set(userPuzzles.map(p => p.puzzle_brand?.toLowerCase().trim()).filter(Boolean));
      const userPieceCounts = new Set(userPuzzles.map(p => p.puzzle_pieces).filter(Boolean));

      // 1. Top brand (10)
      const brandPuzzles = shuffle(
        available.filter(p => topBrand && p.brand?.toLowerCase().includes(topBrand.toLowerCase()))
      ).slice(0, 10);

      const usedIds = new Set(brandPuzzles.map(p => p.id));

      // 2. Varied piece counts ≥500, 5 puzzles with different piece counts
      const piecePool = shuffle(available.filter(p => {
        if (usedIds.has(p.id)) return false;
        if (!p.piece_count || p.piece_count < 500) return false;
        return true;
      }));
      const piecePuzzles = [];
      const usedPieceCounts = new Set();
      for (const p of piecePool) {
        if (piecePuzzles.length >= 5) break;
        if (!usedPieceCounts.has(p.piece_count)) {
          piecePuzzles.push(p);
          usedPieceCounts.add(p.piece_count);
        }
      }
      piecePuzzles.forEach(p => usedIds.add(p.id));

      // 3. Top category (5)
      const catPuzzles = shuffle(
        available.filter(p => {
          if (usedIds.has(p.id)) return false;
          if (!topCategory) return false;
          return p.category_tag?.toLowerCase() === topCategory.toLowerCase();
        })
      ).slice(0, 5);
      catPuzzles.forEach(p => usedIds.add(p.id));

      // 4. Nouveaux horizons (10) - brand unknown to user + min 500 pieces
      const discoveryPuzzles = shuffle(
        available.filter(p => {
          if (usedIds.has(p.id)) return false;
          if (!p.piece_count || p.piece_count < 500) return false;
          const brand = p.brand?.toLowerCase().trim();
          if (brand && userBrands.has(brand)) return false;
          if (userPieceCounts.has(p.piece_count)) return false;
          return true;
        })
      ).slice(0, 10);

      setDiscovery({
        topBrand,
        topCategory,
        brandPuzzles,
        piecePuzzles,
        catPuzzles,
        discoveryPuzzles,
        isGeneric: false,
        total: brandPuzzles.length + piecePuzzles.length + catPuzzles.length + discoveryPuzzles.length,
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (globalPuzzles.length > 0) buildDiscovery(globalPuzzles);
  }, [globalPuzzles.length]);

  const addToMyCollection = async (puzzle, status = 'inbox') => {
    if (!user) { toast.error('Connectez-vous pour ajouter à votre collection'); return; }
    const existing = await base44.entities.UserPuzzle.filter({ created_by: user.email, puzzle_reference: puzzle.asin || puzzle.id });
    if (existing.length > 0) { toast.info('Ce puzzle est déjà dans votre collection'); return; }
    await base44.entities.UserPuzzle.create({
      puzzle_name: puzzle.title,
      puzzle_brand: puzzle.brand || '',
      puzzle_pieces: puzzle.piece_count || 0,
      puzzle_reference: puzzle.asin || puzzle.id,
      image_url: puzzle.image_hd || '',
      status
    });
    const labels = { wishlist: 'wishlist', inbox: 'collection', done: 'terminés' };
    toast.success(`Ajouté en ${labels[status]} !`);
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-8 flex items-center gap-3 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
        <span className="text-sm">Calcul de vos recommandations...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 lg:px-8 py-8 text-center">
        <p className="text-white/40 text-sm">Connectez-vous pour voir vos recommandations personnalisées</p>
      </div>
    );
  }

  if (!discovery || discovery.total === 0) {
    return (
      <div className="px-4 lg:px-8 py-8 text-center">
        <p className="text-white/40 text-sm">Ajoutez des puzzles à votre collection personnelle pour voir vos recommandations</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="px-4 lg:px-8 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{discovery.isGeneric ? 'Sélection variée' : 'Découverte personnalisée'}</h2>
            <p className="text-white/40 text-xs">{discovery.total} puzzles {discovery.isGeneric ? 'à découvrir' : 'sélectionnés rien que pour vous'}</p>
          </div>
        </div>
        <button
          onClick={() => buildDiscovery(globalPuzzles)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {!discovery.isGeneric && (
        <div className="px-4 lg:px-8 mb-5 flex flex-wrap gap-2">
          {discovery.topBrand && <span className="bg-white/5 border border-white/10 text-xs text-white/50 px-2.5 py-1 rounded-full">🏷️ Marque favorite: <span className="text-orange-300 font-medium">{discovery.topBrand}</span></span>}
          {discovery.topCategory && <span className="bg-white/5 border border-white/10 text-xs text-white/50 px-2.5 py-1 rounded-full">🎨 Catégorie favorite: <span className="text-orange-300 font-medium">{discovery.topCategory}</span></span>}
        </div>
      )}
      {discovery.isGeneric && (
        <div className="px-4 lg:px-8 mb-5">
          <p className="text-white/30 text-xs">Ajoutez des puzzles à votre collection pour obtenir des recommandations personnalisées</p>
        </div>
      )}

      <div className="lg:px-8">
        <HorizontalSection
          title={`Puzzles ${discovery.topBrand || 'de votre marque préférée'}`}
          icon="🏷️"
          puzzles={discovery.brandPuzzles}
          onAddToCollection={addToMyCollection}
          onPuzzleClick={(p) => { setSelectedPuzzle(p); setShowModal(true); }}
        />
        <HorizontalSection
          title={`Puzzles ~${discovery.topPieceBucket} pièces`}
          icon="🧩"
          puzzles={discovery.piecePuzzles}
          onAddToCollection={addToMyCollection}
          onPuzzleClick={(p) => { setSelectedPuzzle(p); setShowModal(true); }}
        />
        <HorizontalSection
          title={`Catégorie ${discovery.topCategory || 'préférée'}`}
          icon="🎨"
          puzzles={discovery.catPuzzles}
          onAddToCollection={addToMyCollection}
          onPuzzleClick={(p) => { setSelectedPuzzle(p); setShowModal(true); }}
        />
        <HorizontalSection
          title="Nouveaux horizons"
          icon="🚀"
          puzzles={discovery.discoveryPuzzles}
          onAddToCollection={addToMyCollection}
          onPuzzleClick={(p) => { setSelectedPuzzle(p); setShowModal(true); }}
        />
      </div>

      <PuzzleDetailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        puzzle={selectedPuzzle}
      />
    </div>
  );
}