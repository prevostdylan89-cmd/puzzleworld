import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, X, ShoppingCart, CheckCircle, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

const AFFILIATE_TAG = 'MON_PUZZLE_ID-21';

function ImageZoomOverlay({ src, alt, onClose }) {
  const [mouse, setMouse] = useState(null);
  const imgRef = useRef(null);
  const LENS = 150;
  const ZOOM = 3;

  const handleMouseMove = useCallback((e) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, LENS / 2), rect.width - LENS / 2);
    const y = Math.min(Math.max(e.clientY - rect.top, LENS / 2), rect.height - LENS / 2);
    setMouse({ x, y, w: rect.width, h: rect.height });
  }, []);

  const handleMouseLeave = useCallback(() => setMouse(null), []);

  const ZOOM_PANEL = LENS * ZOOM;
  const zoomedW = mouse ? mouse.w * ZOOM : 0;
  const zoomedH = mouse ? mouse.h * ZOOM : 0;
  const bgX = mouse ? -(mouse.x * ZOOM - ZOOM_PANEL / 2) : 0;
  const bgY = mouse ? -(mouse.y * ZOOM - ZOOM_PANEL / 2) : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        onClick={onClose}
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div
        className="flex items-center gap-8"
        style={{ padding: '2rem', maxWidth: '100vw', maxHeight: '100vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image principale grande - prend tout l'espace disponible */}
        <div className="relative select-none flex-shrink-0">
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            draggable={false}
            style={{
              width: mouse ? '55vh' : '80vh',
              height: mouse ? '55vh' : '80vh',
              objectFit: 'contain',
              cursor: 'crosshair',
              display: 'block',
              transition: 'width 0.15s, height 0.15s',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          {/* Carré de sélection */}
          {mouse && (
            <div
              style={{
                position: 'absolute',
                left: mouse.x - LENS / 2,
                top: mouse.y - LENS / 2,
                width: LENS,
                height: LENS,
                border: '2px solid rgba(255,165,0,0.9)',
                backgroundColor: 'rgba(255,165,0,0.12)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Panneau zoomé */}
        {mouse && (
          <div
            style={{
              width: ZOOM_PANEL,
              height: ZOOM_PANEL,
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              backgroundColor: '#000',
              position: 'relative',
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                width: zoomedW,
                height: zoomedH,
                left: bgX,
                top: bgY,
                maxWidth: 'none',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {!mouse && (
          <p className="text-white/40 text-sm absolute bottom-8 left-1/2 -translate-x-1/2">
            Survolez l'image pour zoomer
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function PuzzleDetailModal({ open, onClose, puzzle }) {
  const { t } = useLanguage();
  const { isGuest } = useAuth(); // eslint-disable-line
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user, setUser] = useState(null);
  const [showImageZoom, setShowImageZoom] = useState(false);

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
      toast.error(t('loginToLikePuzzle'));
      return;
    }
    
    try {
      if (isLiked) {
        const likes = await base44.entities.UserPuzzleLike.filter({
          puzzle_asin: puzzle.asin,
          created_by: user.email
        });
        if (likes.length > 0) {
          await base44.entities.UserPuzzleLike.delete(likes[0].id);
          setIsLiked(false);
          toast.success(t('dislikeRemoved'));
        }
      } else {
        await base44.entities.UserPuzzleLike.create({
          puzzle_asin: puzzle.asin,
          puzzle_name: puzzle.title,
          puzzle_brand: puzzle.brand
        });
        setIsLiked(true);
        toast.success(t('puzzleAddedToWishlist').replace('wishlist', 'likes'));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('likeUpdateFailed'));
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error(t('loginToWishlist'));
      return;
    }
    
    try {
      if (isWishlisted) {
        const wishlists = await base44.entities.Wishlist.filter({
          puzzle_name: puzzle.title,
          created_by: user.email
        });
        if (wishlists.length > 0) {
          await base44.entities.Wishlist.delete(wishlists[0].id);
          setIsWishlisted(false);
          toast.success(t('puzzleRemovedFromWishlist'));
        }
      } else {
        await base44.entities.Wishlist.create({
          puzzle_name: puzzle.title,
          puzzle_brand: puzzle.brand,
          puzzle_pieces: puzzle.piece_count,
          image_url: puzzle.image_hd,
          priority: 'medium'
        });
        setIsWishlisted(true);
        toast.success(t('puzzleAddedToWishlist'));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error(t('wishlistUpdateFailed'));
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
            <div className="relative w-full bg-white/5 cursor-zoom-in" onClick={() => setShowImageZoom(true)}>
              <img
                src={productData.main_image?.link || puzzle.image_hd}
                alt={productData.title}
                className="w-full h-80 object-contain"
              />
              <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-1 text-xs text-white/70 flex items-center gap-1">
                <span>🔍</span> Agrandir
              </div>
            </div>

            {/* Image Zoom Overlay */}
            {showImageZoom && (
              <ImageZoomOverlay
                src={productData.main_image?.link || puzzle.image_hd}
                alt={productData.title}
                onClose={() => setShowImageZoom(false)}
              />
            )}

            {/* Content Section */}
            <div className="p-6 space-y-6">
              {/* Title & Brand */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {productData.title || puzzle.title}
                </h2>
                {productData.brand && (
                  <p className="text-orange-400 font-semibold">
                    {t('byBrand')}{productData.brand}
                  </p>
                )}
              </div>

              {/* Piece Count */}
              {puzzle.piece_count && (
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-2xl">🧩</span>
                  <span className="text-white font-semibold">{puzzle.piece_count} {t('puzzlePiecesCount')}</span>
                </div>
              )}

              {/* Key Features */}
              {productData.feature_bullets && productData.feature_bullets.length > 0 && (
                <div>
                  <h3 className="text-white/70 font-semibold mb-3">{t('features')}</h3>
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
                  {isLiked ? t('iLike') : t('like')}
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
                  ⭐ {isWishlisted ? t('wishlist') : 'Wishlist'}
                </Button>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => window.open(getAffiliateLink(), '_blank')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 text-lg font-semibold"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {t('viewOnAmazon')}
              </Button>



              <p className="text-white/40 text-xs text-center">
                {t('amazonDisclaimer')}
              </p>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-white/60">{t('loadError')}</p>
            <Button
              onClick={onClose}
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/5"
            >
              {t('close')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}