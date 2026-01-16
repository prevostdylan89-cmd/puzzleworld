import React, { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  fr: {
    // Layout & Navigation
    home: 'Accueil', social: 'Social', collection: 'Collection', online: 'En Ligne', profile: 'Profil',
    logOut: 'Déconnexion', logIn: 'Connexion',
    
    // Home Page
    heroTitle: 'Votre Communauté Puzzle Ultime',
    heroSubtitle: 'Connectez-vous avec des milliers de passionnés de puzzles, partagez vos créations et découvrez de nouveaux défis passionnants',
    startCollection: 'Commence Ta Collection',
    exploreCollection: 'Explorer la Collection',
    featuredPuzzles: 'Puzzles en Vedette',
    mostPlayed: 'Les Plus Joués',
    monthlyEvents: 'Événements Mensuels',
    communityFeed: 'Fil de la Communauté',
    viewAll: 'Voir Tout',
    
    // Collection Page
    puzzleCollection: 'Collection de Puzzles',
    collectionSubtitle: 'Découvrez notre vaste collection de puzzles soigneusement sélectionnés',
    searchPlaceholder: 'Rechercher des puzzles...',
    filters: 'Filtres', categories: 'Catégories', allCategories: 'Toutes',
    landscapes: 'Paysages', abstract: 'Abstrait', animals: 'Animaux', architecture: 'Architecture', art: 'Art', nature: 'Nature',
    difficulty: 'Difficulté', allDifficulties: 'Toutes', easy: 'Facile', medium: 'Moyen', hard: 'Difficile',
    pieces: 'Pièces', sortBy: 'Trier par', popular: 'Populaire', newest: 'Nouveau', rating: 'Note',
    viewMode: 'Affichage', grid: 'Grille', large: 'Grand', backToTop: 'Retour en Haut',
    puzzlesFound: 'puzzles trouvés',
    
    // Puzzle Detail
    playOnline: 'Jouer en Ligne', download: 'Télécharger', overview: 'Aperçu', leaderboard: 'Classement', reviews: 'Avis',
    downloadSoon: 'Téléchargement bientôt disponible!',
    followSoon: 'Fonction de suivi bientôt disponible!', follow: 'Suivre', viewProfile: 'Voir le Profil',
    report: 'Signaler ce puzzle', reportSoon: 'Fonction de signalement bientôt disponible.',
    
    // Online Puzzles
    onlinePuzzles: 'Puzzles en Ligne', searchGames: 'Rechercher des jeux...',
    platform: 'Plateforme', all: 'Tout', web: 'Web', mobile: 'Mobile', crossPlatform: 'Multi-plateforme',
    playNow: 'Jouer Maintenant', gameSoon: 'Ce jeu sera bientôt disponible!',
    trending: 'Tendances', allGames: 'Tous les Jeux', suggestGame: 'Suggérer un Jeu',
    suggestSoon: 'Merci! Fonction de suggestion bientôt disponible.',
    
    // Social
    shareJourney: 'Partagez votre parcours puzzle...', post: 'Publier', posting: 'Publication...',
    completionPost: 'Ceci est une publication de complétion de puzzle',
    puzzleName: 'Nom du Puzzle', brand: 'Marque',
    loginToCreate: 'Veuillez vous connecter pour créer des publications',
    loginToLike: 'Veuillez vous connecter pour aimer', addedToWishlist: 'Ajouté à la liste!',
    alreadyInWishlist: 'Déjà dans la liste', postCreated: 'Publication créée!',
    addContent: 'Ajoutez du contenu', completed: 'Complété',
    writeComment: 'Écrire un commentaire...', noComments: 'Pas de commentaires',
    noPosts: 'Pas de publications', reachedEnd: 'Fin atteinte!',
    communityGuidelines: 'Règles Communauté',
    guidelinesText: 'Soyez respectueux et aidez les autres! 🧩',
    communityStats: 'Statistiques', totalPosts: 'Publications', activeToday: 'Actifs', live: 'Direct',
    
    // Profile
    welcomeTo: 'Bienvenue sur PuzzleHub',
    loginToView: 'Connectez-vous pour voir votre profil',
    welcomeDashboard: 'Bienvenue sur votre tableau de bord!',
    completedPuzzles: 'Puzzles Complétés', achievements: 'Succès', wishlist: 'Liste Souhaits',
    searchPuzzles: 'Rechercher...', noAchievements: 'Pas de succès',
    unlockBadges: 'Débloquez des badges!', noPuzzlesYet: 'Pas de puzzles',
    wishlistEmpty: 'Liste vide', remove: 'Retirer',
    removedFromWishlist: 'Retiré', low: 'Basse', high: 'Haute',
    
    // Events
    joinEvent: 'Rejoindre', eventSoon: 'Bientôt disponible!',
    
    // Common
    loading: 'Chargement...', hours: 'Heures', completed: 'Complétés',
  },
  
  en: {
    // Layout & Navigation
    home: 'Home', social: 'Social', collection: 'Collection', online: 'Online', profile: 'Profile',
    logOut: 'Log Out', logIn: 'Log In',
    
    // Home Page
    heroTitle: 'Your Ultimate Puzzle Community',
    heroSubtitle: 'Connect with thousands of puzzle enthusiasts, share your creations, and discover exciting new challenges',
    startCollection: 'Start Your Collection',
    exploreCollection: 'Explore Collection',
    featuredPuzzles: 'Featured Puzzles',
    mostPlayed: 'Most Played',
    monthlyEvents: 'Monthly Events',
    communityFeed: 'Community Feed',
    viewAll: 'View All',
    
    // Collection Page
    puzzleCollection: 'Puzzle Collection',
    collectionSubtitle: 'Discover our vast collection of carefully curated puzzles',
    searchPlaceholder: 'Search puzzles...',
    filters: 'Filters', categories: 'Categories', allCategories: 'All',
    landscapes: 'Landscapes', abstract: 'Abstract', animals: 'Animals', architecture: 'Architecture', art: 'Art', nature: 'Nature',
    difficulty: 'Difficulty', allDifficulties: 'All', easy: 'Easy', medium: 'Medium', hard: 'Hard',
    pieces: 'Pieces', sortBy: 'Sort by', popular: 'Popular', newest: 'Newest', rating: 'Rating',
    viewMode: 'View Mode', grid: 'Grid', large: 'Large', backToTop: 'Back to Top',
    puzzlesFound: 'puzzles found',
    
    // Puzzle Detail
    playOnline: 'Play Online', download: 'Download', overview: 'Overview', leaderboard: 'Leaderboard', reviews: 'Reviews',
    downloadSoon: 'Download feature coming soon!',
    followSoon: 'Follow feature coming soon!', follow: 'Follow', viewProfile: 'View Profile',
    report: 'Report this puzzle', reportSoon: 'Report feature coming soon.',
    
    // Online Puzzles
    onlinePuzzles: 'Online Puzzles', searchGames: 'Search games...',
    platform: 'Platform', all: 'All', web: 'Web', mobile: 'Mobile', crossPlatform: 'Cross-Platform',
    playNow: 'Play Now', gameSoon: 'This game will be available soon!',
    trending: 'Trending', allGames: 'All Games', suggestGame: 'Suggest a Game',
    suggestSoon: 'Thank you! Game suggestion feature coming soon.',
    
    // Social
    shareJourney: 'Share your puzzle journey...', post: 'Post', posting: 'Posting...',
    completionPost: 'This is a puzzle completion post',
    puzzleName: 'Puzzle Name', brand: 'Brand',
    loginToCreate: 'Please log in to create posts',
    loginToLike: 'Please log in to like', addedToWishlist: 'Added to wishlist!',
    alreadyInWishlist: 'Already in wishlist', postCreated: 'Post created!',
    addContent: 'Add content', completed: 'Completed',
    writeComment: 'Write a comment...', noComments: 'No comments',
    noPosts: 'No posts yet', reachedEnd: 'You reached the end!',
    communityGuidelines: 'Community Guidelines',
    guidelinesText: 'Be respectful and help fellow puzzlers! 🧩',
    communityStats: 'Community Stats', totalPosts: 'Total Posts', activeToday: 'Active Today', live: 'Live',
    
    // Profile
    welcomeTo: 'Welcome to PuzzleHub',
    loginToView: 'Log in to view your profile',
    welcomeDashboard: 'Welcome to your puzzle dashboard!',
    completedPuzzles: 'Completed Puzzles', achievements: 'Achievements', wishlist: 'Wishlist',
    searchPuzzles: 'Search...', noAchievements: 'No achievements',
    unlockBadges: 'Unlock badges!', noPuzzlesYet: 'No puzzles yet',
    wishlistEmpty: 'Wishlist empty', remove: 'Remove',
    removedFromWishlist: 'Removed', low: 'Low', high: 'High',
    
    // Events
    joinEvent: 'Join', eventSoon: 'Coming soon!',
    
    // Common
    loading: 'Loading...', hours: 'Hours', completed: 'Completed',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}