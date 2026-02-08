import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (event, info) => {
    if (info.offset.y > 100 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleRefresh}
      className="h-full"
    >
      {isRefreshing && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
      )}
      {children}
    </motion.div>
  );
}