'use client';
import { motion } from 'framer-motion';

export default function GameContainer({ children, className = '', overlay = true }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative min-h-screen pt-24 pb-32 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-violet pointer-events-none" />
      {overlay && (
        <div className="absolute inset-0 crt-overlay pointer-events-none" />
      )}
      <div className="relative z-10 container mx-auto px-4">
        {children}
      </div>
    </motion.section>
  );
}
