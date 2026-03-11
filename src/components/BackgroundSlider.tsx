import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const IMAGES = [
  'https://picsum.photos/seed/factory/1920/1080',
  'https://picsum.photos/seed/food/1920/1080',
  'https://picsum.photos/seed/manufacturing/1920/1080',
  'https://picsum.photos/seed/technology/1920/1080',
  'https://picsum.photos/seed/production/1920/1080',
];

export default function BackgroundSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, 6000); // Change image every 6 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden bg-slate-950">
      <AnimatePresence>
        <motion.img
          key={currentIndex}
          src={IMAGES[currentIndex]}
          alt="Background"
          referrerPolicy="no-referrer"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950/90" />
      
      {/* Animated particles/overlay effect */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    </div>
  );
}
