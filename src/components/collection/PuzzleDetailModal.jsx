import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, X, ShoppingCart, CheckCircle, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const AFFILIATE_TAG = 'MON_PUZZLE_ID-21';

export default function PuzzleDetailModal({ open, onClose, puzzle }) {
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (open && puzzle) {
      loadUserData();
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
      checkLikeAndWishlistStatus();
      setLoading(false);
    } else {
      setProductData(null);
      setIsLiked(false);
      setIsWishlisted(false);
    }
  }, [open, puzzle]);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const checkLikeAndWishlistStatus = async () => {
    if (!puzzle?.asin) return;
    
    try {
      const currentUser = await base44.auth.me();
      
      // Check if liked
      const likes = await base44.entities.UserPuzzleLike.filter({
        puzzle_asin: puzzle.asin,
        created_by: currentUser.email
      });
      setIsLiked(likes.length > 0);
      
      // Check if wishlisted
      const wishlists = await base44.entities.Wishlist.filter({
        puzzle_name: puzzle.title,
        created_by: currentUser.email
      });
      setIsWishlisted(wishlists.length > 0);
    } catch (error) {
      console.log('Error checking status:', error);
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

  const handleLike = async () => {
    if (!user) {
      toast.error('Connectez-vous pour liker ce puzzle');
      return;
    }
    
    try {
      if (isLiked) {
        // Unlike
        const likes = await base44.entities.UserPuzzleLike.filter({
          puzzle_asin: puzzle.asin,
          created_by: user.email
        });
        if (likes.length > 0) {
          await base44.entities.UserPuzzleLike.delete(likes[0].id);
          setIsLiked(false);
          toast.success('Retiré de vos likes');
        }
      } else {
        // Like
        await base44.entities.UserPuzzleLike.create({
          puzzle_asin: puzzle.asin,
          puzzle_name: puzzle.title,
          puzzle_brand: puzzle.brand
        });
        setIsLiked(true);
        toast.success('Ajouté à vos likes ❤️');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erreur lors du like');
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter à votre wishlist');
      return;
    }
    
    try {
      if (isWishlisted) {
        // Remove from wishlist
        const wishlists = await base44.entities.Wishlist.filter({
          puzzle_name: puzzle.title,
          created_by: user.email
        });
        if (wishlists.length > 0) {
          await base44.entities.Wishlist.delete(wishlists[0].id);
          setIsWishlisted(false);
          toast.success('Retiré de votre wishlist');
        }
      } else {
        // Add to wishlist
        await base44.entities.Wishlist.create({
          puzzle_name: puzzle.title,
          puzzle_brand: puzzle.brand,
          puzzle_pieces: puzzle.piece_count,
          image_url: puzzle.image_hd,
          priority: 'medium'
        });
        setIsWishlisted(true);
        toast.success('Ajouté à votre wishlist ⭐');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Erreur lors de l\'ajout à la wishlist');
    }
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



              {/* Like & Wishlist Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleLike}
                  variant="outline"
                  className={`flex-1 h-12 border-2 transition-all ${
                    isLiked 
                      ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30' 
                      : 'border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liké' : 'Liker'}
                </Button>
                
                <Button
                  onClick={handleWishlist}
                  variant="outline"
                  className={`flex-1 h-12 border-2 transition-all ${
                    isWishlisted 
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30' 
                      : 'border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  ⭐ {isWishlisted ? 'En wishlist' : 'Wishlist'}
                </Button>
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