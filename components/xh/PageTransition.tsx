"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      // 前摇压到最短：位移小、时长短，点一下就出来，不要让人等
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.32 }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
