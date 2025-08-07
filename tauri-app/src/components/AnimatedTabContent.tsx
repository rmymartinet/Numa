import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTabContentProps {
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  activeTab,
  children,
  className = '',
}) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [currentTab, setCurrentTab] = useState(activeTab);

  useEffect(() => {
    const tabOrder = ['activity', 'prompts', 'settings'];
    const currentIndex = tabOrder.indexOf(currentTab);
    const newIndex = tabOrder.indexOf(activeTab);
    
    if (currentIndex !== newIndex) {
      setPage([newIndex, newIndex > currentIndex ? 1 : -1]);
      setCurrentTab(activeTab);
    }
  }, [activeTab, currentTab]);

  const paginate = (newDirection: number) => {
    const tabOrder = ['activity', 'prompts', 'settings'];
    const newIndex = Math.max(0, Math.min(page + newDirection, tabOrder.length - 1));
    setPage([newIndex, newDirection]);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e: any, { offset, velocity }: { offset: { x: number }; velocity: { x: number } }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Composant pour les transitions de contenu
export const FadeInContent: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{
      duration: 0.3,
      delay,
      ease: "easeOut",
    }}
  >
    {children}
  </motion.div>
);

// Composant pour les transitions de liste
export const StaggeredList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    }}
  >
    {children}
  </motion.div>
);

export const StaggeredItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    }}
    transition={{
      duration: 0.3,
      ease: "easeOut",
    }}
  >
    {children}
  </motion.div>
); 