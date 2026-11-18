import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/lib/motion';

interface RevealProps {
  children: ReactNode;
  /** Milliseconds, kept for parity with the previous API. */
  delay?: number;
  className?: string;
  y?: number;
  once?: boolean;
}

/**
 * Editorial scroll reveal: a short lift and fade, choreographed slowly.
 * Uses whileInView so the browser only animates visible content.
 */
export default function Reveal({ children, delay = 0, className = '', y = 26, once = true }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.15, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.85, delay: delay / 1000, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
