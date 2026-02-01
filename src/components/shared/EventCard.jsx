import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EventCard({ event }) {
  const {
    title = 'Monthly Challenge',
    description = 'Complete the puzzle in record time',
    image = 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&h=200&fit=crop',
    date = 'Jan 15-31',
    participants = 1234,
    timeLeft = '5 days left',
    type = 'challenge'
  } = event || {};

  const typeColors = {
    challenge: 'from-orange-500 to-red-500',
    tournament: 'from-purple-500 to-indigo-500',
    community: 'from-blue-500 to-cyan-500'
  };

  const handleCardClick = () => {
    window.location.href = '/Events';
  };

  return (
    <motion.button
      onClick={handleCardClick}
      whileHover={{ scale: 1.02 }}
      className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] hover:border-orange-500/30 transition-all cursor-pointer text-left"
    >
      {/* Image Header */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000019] to-transparent" />
        
        {/* Type Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${typeColors[type]}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-white/50 text-sm line-clamp-2">{description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-white/40 text-xs">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
            {date}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            {participants.toLocaleString()}
          </span>
        </div>

        {/* Time Left & CTA */}
        <div className="flex items-center justify-between pt-2">
          <span className="flex items-center gap-1.5 text-orange-400 text-sm font-medium">
            <Clock className="w-4 h-4" />
            {timeLeft}
          </span>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              toast.success('Event registration coming soon! Stay tuned.');
            }}
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4"
          >
            Join
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </motion.button>
  );
}