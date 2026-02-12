import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, X, ShoppingCart, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import PopularityScore from '@/components/shared/PopularityScore';
import { base44 } from '@/api/base44Client';

const AFFILIATE_TAG = 'MON_PUZZLE_ID-21';

export default function PuzzleDetailModal({ open, onClose, puzzle }) {
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [popularityScore, setPopularityScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);

  useEffect(() => {
    if (open && puzzle) {
      // Use data from PuzzleCatalog instead of API call
      setProductData({
        title: puzzle.title,
        brand: puzzle.brand,
        main_image: { link: puzzle.image_hd },
        feature_bullets: puzzle.description ? [puzzle.description] : [],
        link: puzzle.amazon_link,
        buybox_winner: puzzle.amazon_price ? {
          price: { value: puzzle.amazon_price, currency: '€' },
          availability: { type: 'in_stock' }
        } : null
      });
      calculatePopularityScore();
      setLoading(false);
    } else {
      setProductData(null);
      setPopularityScore(null);
    }
  }, [open, puzzle]);

  const calculatePopularityScore = async () => {
    if (!puzzle) return;
    
    setLoadingScore(true);
    try {
      // Use socialScore from PuzzleCatalog
      const score = puzzle.socialScore || 0;
      setPopularityScore(score > 0 ? Math.min(100, Math.max(0, score * 10)) : 0);
    } catch (error) {
      console.error('Error calculating score:', error);
    } finally {
      setLoadingScore(false);
    }
  };

  const getAffiliateLink = () => {
    // Try amazon_link first, then construct from ASIN
    if (puzzle?.amazon_link) {
      return puzzle.amazon_link;
    }
    if (puzzle?.asin) {
      return `https://www.amazon.fr/dp/${puzzle.asin}?tag=${AFFILIATE_TAG}`;
    }
    return '#';
  };

  const getPriceInfo = () => {
    const price = puzzle?.amazon_price || puzzle?.price;
    if (price) {
      return {
        available: true,
        value: price,
        currency: '€'
      };
    }
    return null;
  };

  if (!puzzle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
          </div>
        ) : productData ? (
          <>
            {/* Image Section */}
            <div className="relative w-full bg-white/5">
              <img
                src={productData.main_image?.link || puzzle.image_hd}
                alt={productData.title}
                className="w-full h-80 object-contain"
              />
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-6">
              {/* Title & Brand */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {productData.title || puzzle.title}
                </h2>
                {productData.brand && (
                  <p className="text-orange-400 font-semibold">
                    par {productData.brand}
                  </p>
                )}
              </div>

              {/* Piece Count */}
              {puzzle.piece_count && (
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-2xl">🧩</span>
                  <span className="text-white font-semibold">{puzzle.piece_count} pièces</span>
                </div>
              )}

              {/* Popularity Score */}
              {!loadingScore && popularityScore !== null && popularityScore > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <PopularityScore score={popularityScore} size="default" />
                </div>
              )}

              {/* Key Features */}
              {productData.feature_bullets && productData.feature_bullets.length > 0 && (
                <div>
                  <h3 className="text-white/70 font-semibold mb-3">Caractéristiques :</h3>
                  <ul className="space-y-2">
                    {productData.feature_bullets.slice(0, 5).map((bullet, index) => (
                      <li key={index} className="flex items-start gap-2 text-white/80 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price Section */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-4 border border-orange-500/20">
                {(() => {
                  const priceInfo = getPriceInfo();
                  if (!priceInfo) {
                    return <p className="text-white/60 text-sm">Prix non disponible</p>;
                  }
                  if (!priceInfo.available) {
                    return (
                      <div className="text-center">
                        <p className="text-red-400 font-semibold">Indisponible actuellement</p>
                        <p className="text-white/50 text-xs mt-1">Consultez Amazon pour plus d'infos</p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Prix actuel</p>
                        <p className="text-3xl font-bold text-white">
                          {priceInfo.value.toFixed(2)} {priceInfo.currency}
                        </p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-orange-400" />
                    </div>
                  );
                })()}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => window.open(getAffiliateLink(), '_blank')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 text-lg font-semibold"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Voir le produit sur Amazon
              </Button>

              <p className="text-white/40 text-xs text-center">
                En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats qualifiés
              </p>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-white/60">Impossible de charger les détails</p>
            <Button
              onClick={onClose}
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/5"
            >
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}