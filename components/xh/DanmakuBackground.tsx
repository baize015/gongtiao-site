"use client";

import { useEffect, useState } from 'react';
import { siteConfig } from '@/site.config';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

export default function DanmakuBackground() {
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);

  useEffect(() => {
    const list = siteConfig.danmakuList || [];
    if (list.length === 0) return;

    const generatedDanmakus: DanmakuItem[] = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      generatedDanmakus.push({
        id: i,
        text: list[Math.floor(Math.random() * list.length)],
        // 容器本身只有 30vh 高，这里的 0-100% 就是在这个 30vh 内部随机
        // 留一点边距 10-90，防止字被切掉一半
        top: Math.random() * 80 + 10,
        duration: Math.random() * 20 + 25,
        delay: Math.random() * 20,
      });
    }
    setDanmakus(generatedDanmakus);
  }, []);

  return (
    // 强制锁死容器高度 30vh，z-0 确保它在卡片矩阵的后面
    <div className="fixed top-28 h-[30vh] left-0 right-0 overflow-hidden pointer-events-none z-0">
      {danmakus.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap text-slate-500/25 dark:text-white/10 font-bold text-lg tracking-wider select-none"
          style={{
            top: `${item.top}%`,
            right: '-100%',
            animation: `float-left ${item.duration}s linear ${item.delay}s infinite`,
          }}
        >
          {item.text}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-left {
          0% {
            right: -100%;
            transform: translateX(100%);
          }
          100% {
            right: 100%;
            transform: translateX(-100%);
          }
        }
      `}} />
    </div>
  );
}
