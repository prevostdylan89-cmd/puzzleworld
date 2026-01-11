import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ImagePlus, 
  Smile, 
  Hash, 
  Send,
  TrendingUp,
  Flame,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/shared/PostCard';

const posts = [
  {
    author: { name: 'PuzzlePro', initials: 'PP' },
    content: 'Just finished this beautiful 2000 piece puzzle in record time! The colors are absolutely stunning. It took me 3 days but totally worth it! 🎨✨',
    image: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=600&h=400&fit=crop',
    likes: 234,
    comments: 45,
    timeAgo: '2h ago',
    tags: ['completion', 'record', '2000pieces']
  },
  {
    author: { name: 'JigsawJane', initials: 'JJ' },
    content: 'Any tips for sorting edge pieces faster? Looking for strategies from the community! I always struggle with the border.',
    likes: 89,
    comments: 67,
    timeAgo: '4h ago',
    tags: ['tips', 'strategy', 'help']
  },
  {
    author: { name: 'PuzzleKing', initials: 'PK' },
    content: 'My new puzzle mat arrived! Game changer for those of us who don\'t have a dedicated puzzle table. Highly recommend!',
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600&h=400&fit=crop',
    likes: 567,
    comments: 123,
    timeAgo: '6h ago',
    tags: ['gear', 'recommendation']
  },
  {
    author: { name: 'NightOwlPuzzler', initials: 'NP' },
    content: 'Late night puzzle session! There\'s something so relaxing about puzzling with lo-fi music in the background. Anyone else a night puzzler? 🌙',
    likes: 342,
    comments: 78,
    timeAgo: '8h ago',
    tags: ['nightpuzzle', 'relaxation']
  },
  {
    author: { name: 'ArtLover22', initials: 'AL' },
    content: 'Looking for puzzle recommendations with Van Gogh artwork. Already completed Starry Night, want to expand my collection!',
    likes: 156,
    comments: 92,
    timeAgo: '12h ago',
    tags: ['recommendation', 'vangogh', 'art']
  },
  {
    author: { name: 'FamilyPuzzles', initials: 'FP' },
    content: 'Sunday puzzle time with the whole family! The kids are getting so good at finding pieces. Quality family time! 👨‍👩‍👧‍👦',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
    likes: 891,
    comments: 156,
    timeAgo: '1d ago',
    tags: ['family', 'sundayfun', 'quality time']
  }
];

const trendingTags = [
  { tag: 'winterpuzzles', count: 2847 },
  { tag: 'speedrun', count: 1523 },
  { tag: 'landscapes', count: 1289 },
  { tag: 'newyear2024', count: 987 },
  { tag: 'puzzleart', count: 756 }
];

const suggestedUsers = [
  { name: 'MasterPuzzler', initials: 'MP', followers: '12.5K' },
  { name: 'JigsawQueen', initials: 'JQ', followers: '8.2K' },
  { name: 'PuzzleArtist', initials: 'PA', followers: '6.7K' }
];

export default function Social() {
  const [postContent, setPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('trending');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">Community</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger 
                value="trending" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Flame className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger 
                value="latest"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger 
                value="following"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                Following
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            {/* Create Post */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 mb-6"
            >
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share your puzzle journey..."
                    className="bg-transparent border-none text-white placeholder:text-white/40 resize-none min-h-[80px] p-0 focus-visible:ring-0"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-white/40 hover:text-orange-400 hover:bg-orange-500/10">
                        <ImagePlus className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white/40 hover:text-orange-400 hover:bg-orange-500/10">
                        <Smile className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white/40 hover:text-orange-400 hover:bg-orange-500/10">
                        <Hash className="w-5 h-5" />
                      </Button>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-5"
                      disabled={!postContent.trim()}
                    >
                      Post
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Posts Feed */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {posts.map((post, index) => (
                <motion.div key={index} variants={item}>
                  <PostCard post={post} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 space-y-6">
            {/* Trending Tags */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-white">Trending Tags</h3>
              </div>
              <div className="space-y-3">
                {trendingTags.map((item, index) => (
                  <button 
                    key={index}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-orange-400 group-hover:text-orange-300">#{item.tag}</span>
                    <span className="text-white/40 text-sm">{item.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Users */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Suggested Puzzlers</h3>
              <div className="space-y-4">
                {suggestedUsers.map((user, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-sm">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-white/40">{user.followers} followers</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-full text-xs"
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-white/[0.06] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-2">Community Guidelines</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Be respectful, share your passion, and help fellow puzzlers. Let's keep this community awesome! 🧩
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}