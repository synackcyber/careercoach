import React from 'react';
import { motion } from 'framer-motion';

export default function PageTitle({ children, className = '' }) {
  const prefersReduced =
    typeof window !== 'undefined' &&
    (document.documentElement.classList.contains('reduce-motion') ||
      (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches));

  if (prefersReduced) {
    return <h1 className={className}>{children}</h1>;
  }

  return (
    <motion.h1
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.h1>
  );
}


