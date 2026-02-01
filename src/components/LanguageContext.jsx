import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  fr: {
    // Navigation
    home: 'Accueil',
    social: 'Social',
    collection: 'Collection',
    online: 'En Ligne',
    profile: 'Profil',
    logOut: 'Déconnexion',
    logIn: 'Connexion',
    
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
    explorePuzzles: 'Explorer {count} puzzles',
    searchPuzzles: 'Rechercher des puzzles...',
    filters: 'Filtres',
    all: 'Tout',
    nature: 'Nature',
    abstract: 'Abstrait',
    urban: 'Urbain',
    space: 'Espace',
    architecture: 'Architecture',
    vintage: 'Vintage',
    animals: 'Animaux',
    art: 'Art',
    pieceCount: 'Nombre de Pièces',
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    clearAllFilters: 'Effacer Tous les Filtres',
    mostPopular: 'Plus Populaire',
    newest: 'Plus Récent',
    highestRated: 'Mieux Noté',
    piecesLowToHigh: 'Pièces: Bas à Haut',
    piecesHighToLow: 'Pièces: Haut à Bas',
    backToTop: 'Retour en Haut',
    sortBy: 'Trier par',
    
    // Social Page
    community: 'Communauté',
    trending: 'Tendances',
    latest: 'Récent',
    following: 'Abonnements',
    createPost: 'Créer une Publication',
    whatsOnYourMind: 'Quoi de neuf?',
    shareYourThoughts: 'Partagez vos pensées...',
    uploadImage: 'Télécharger une Image',
    completedPuzzle: 'Puzzle Complété?',
    puzzleName: 'Nom du Puzzle',
    brand: 'Marque',
    pieces: 'Pièces',
    post: 'Publier',
    posting: 'Publication...',
    logInToPost: 'Veuillez vous connecter pour créer des publications et interagir avec la communauté',
    noPosts: 'Aucune publication pour le moment. Soyez le premier à partager!',
    youveReachedEnd: 'Vous avez atteint la fin!',
    communityGuidelines: 'Règles de la Communauté',
    guidelinesText: 'Soyez respectueux, partagez votre passion et aidez les autres puzzleurs. Gardons cette communauté géniale! 🧩',
    communityStats: 'Statistiques de la Communauté',
    totalPosts: 'Total Publications',
    activeToday: 'Actif Aujourd\'hui',
    live: 'En Direct',
    
    // Profile Page
    welcomeProfile: 'Bienvenue sur PuzzleWorld',
    logInToViewProfile: 'Connectez-vous pour voir votre profil, suivre les puzzles complétés et gérer votre liste de souhaits',
    joined: 'Inscrit',
    completed: 'Complétés',
    hours: 'Heures',
    achievements: 'Succès',
    wishlist: 'Liste de Souhaits',
    level: 'Niveau',
    puzzleEnthusiast: 'Passionné de Puzzles',
    puzzleExpert: 'Expert en Puzzles',
    puzzleMaster: 'Maître des Puzzles',
    noAchievements: 'Aucun succès pour le moment',
    completeToUnlock: 'Complétez des puzzles pour débloquer des badges!',
    welcomeToDashboard: 'Bienvenue sur votre tableau de bord de puzzle! Suivez vos puzzles complétés et construisez votre liste de souhaits.',
    myEvents: 'Mes Événements',
    upcomingEvents: 'Événements à venir',
    noEvents: 'Aucun événement inscrit',
    
    // Online Puzzles Page
    onlinePuzzles: 'Puzzles En Ligne',
    playInBrowser: 'Jouez aux puzzles directement dans votre navigateur',
    searchGames: 'Rechercher des jeux...',
    web: 'Web',
    mobile: 'Mobile',
    crossPlatform: 'Multi-Plateforme',
    featured: 'En Vedette',
    playNow: 'Jouer Maintenant',
    players: 'joueurs',
    trendingNow: 'Tendances Actuelles',
    popularThisWeek: 'Jeux de puzzle les plus populaires cette semaine',
    allOnlineGames: 'Tous les Jeux En Ligne',
    browseCollection: 'Parcourir notre collection complète',
    wantToAddGame: 'Vous voulez ajouter un jeu?',
    addGameText: 'Connaissez-vous un jeu de puzzle en ligne incroyable qui devrait être présenté ici? Faites-le nous savoir et nous l\'examinerons!',
    suggestGame: 'Suggérer un Jeu',
    
    // Puzzle Detail Page
    backToCollection: 'Retour à la Collection',
    playOnline: 'Jouer En Ligne',
    download: 'Télécharger',
    overview: 'Aperçu',
    leaderboard: 'Classement',
    reviews: 'Avis',
    aboutPuzzle: 'À Propos de ce Puzzle',
    avgTime: 'Temps Moyen',
    bestTime: 'Meilleur Temps',
    createdBy: 'Créé par',
    followers: 'abonnés',
    follow: 'Suivre',
    viewProfile: 'Voir le Profil',
    reportPuzzle: 'Signaler ce puzzle',
    youMightLike: 'Vous Pourriez Aussi Aimer',
    viewMore: 'Voir Plus',
    foundHelpful: 'trouvé utile',
    
    // Common
    loading: 'Chargement...',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    share: 'Partager',
    like: 'J\'aime',
    comment: 'Commenter',
    comments: 'Commentaires',
    addComment: 'Ajouter un commentaire...',
    noComments: 'Aucun commentaire pour le moment',
    search: 'Rechercher',
    close: 'Fermer',
  },
  en: {
    // Navigation
    home: 'Home',
    social: 'Social',
    collection: 'Collection',
    online: 'Online',
    profile: 'Profile',
    logOut: 'Log Out',
    logIn: 'Log In',
    
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
    explorePuzzles: 'Explore {count} puzzles',
    searchPuzzles: 'Search puzzles...',
    filters: 'Filters',
    all: 'All',
    nature: 'Nature',
    abstract: 'Abstract',
    urban: 'Urban',
    space: 'Space',
    architecture: 'Architecture',
    vintage: 'Vintage',
    animals: 'Animals',
    art: 'Art',
    pieceCount: 'Piece Count',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    clearAllFilters: 'Clear All Filters',
    mostPopular: 'Most Popular',
    newest: 'Newest',
    highestRated: 'Highest Rated',
    piecesLowToHigh: 'Pieces: Low to High',
    piecesHighToLow: 'Pieces: High to Low',
    backToTop: 'Back to Top',
    sortBy: 'Sort by',
    
    // Social Page
    community: 'Community',
    trending: 'Trending',
    latest: 'Latest',
    following: 'Following',
    createPost: 'Create Post',
    whatsOnYourMind: 'What\'s on your mind?',
    shareYourThoughts: 'Share your thoughts...',
    uploadImage: 'Upload Image',
    completedPuzzle: 'Completed Puzzle?',
    puzzleName: 'Puzzle Name',
    brand: 'Brand',
    pieces: 'Pieces',
    post: 'Post',
    posting: 'Posting...',
    logInToPost: 'Please log in to create posts and interact with the community',
    noPosts: 'No posts yet. Be the first to share!',
    youveReachedEnd: 'You\'ve reached the end!',
    communityGuidelines: 'Community Guidelines',
    guidelinesText: 'Be respectful, share your passion, and help fellow puzzlers. Let\'s keep this community awesome! 🧩',
    communityStats: 'Community Stats',
    totalPosts: 'Total Posts',
    activeToday: 'Active Today',
    live: 'Live',
    
    // Profile Page
    welcomeProfile: 'Welcome to PuzzleWorld',
    logInToViewProfile: 'Log in to view your profile, track completed puzzles, and manage your wishlist',
    joined: 'Joined',
    completed: 'Completed',
    hours: 'Hours',
    achievements: 'Achievements',
    wishlist: 'Wishlist',
    level: 'Level',
    puzzleEnthusiast: 'Puzzle Enthusiast',
    puzzleExpert: 'Puzzle Expert',
    puzzleMaster: 'Puzzle Master',
    noAchievements: 'No achievements yet',
    completeToUnlock: 'Complete puzzles to unlock badges!',
    welcomeToDashboard: 'Welcome to your puzzle journey dashboard! Track your completed puzzles and build your wishlist.',
    myEvents: 'My Events',
    upcomingEvents: 'Upcoming Events',
    noEvents: 'No events registered',
    
    // Online Puzzles Page
    onlinePuzzles: 'Online Puzzles',
    playInBrowser: 'Play puzzles directly in your browser',
    searchGames: 'Search games...',
    web: 'Web',
    mobile: 'Mobile',
    crossPlatform: 'Cross-Platform',
    featured: 'Featured',
    playNow: 'Play Now',
    players: 'players',
    trendingNow: 'Trending Now',
    popularThisWeek: 'Most popular puzzle games this week',
    allOnlineGames: 'All Online Games',
    browseCollection: 'Browse our complete collection',
    wantToAddGame: 'Want to add a game?',
    addGameText: 'Know of an amazing online puzzle game that should be featured here? Let us know and we\'ll review it for inclusion!',
    suggestGame: 'Suggest a Game',
    
    // Puzzle Detail Page
    backToCollection: 'Back to Collection',
    playOnline: 'Play Online',
    download: 'Download',
    overview: 'Overview',
    leaderboard: 'Leaderboard',
    reviews: 'Reviews',
    aboutPuzzle: 'About this Puzzle',
    avgTime: 'Average Time',
    bestTime: 'Best Time',
    createdBy: 'Created by',
    followers: 'followers',
    follow: 'Follow',
    viewProfile: 'View Profile',
    reportPuzzle: 'Report this puzzle',
    youMightLike: 'You Might Also Like',
    viewMore: 'View More',
    foundHelpful: 'found helpful',
    
    // Common
    loading: 'Loading...',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    like: 'Like',
    comment: 'Comment',
    comments: 'Comments',
    addComment: 'Add a comment...',
    noComments: 'No comments yet',
    search: 'Search',
    close: 'Close',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Trigger a custom event when language changes
    window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
  }, [language]);

  const t = (key, params = {}) => {
    let text = translations[language][key] || key;
    // Replace {param} placeholders
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    return text;
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