"use client";
import { useEffect, useState } from 'react';
import { useIsDark } from './useIsDark';

interface WildBlade { id: number; height: number; width: number; delay: number; duration: number; opacity: number; left: string; isLeftCurve: boolean; }

export default function WindyGrass() {
  const [blades, setBlades] = useState<WildBlade[]>([]);
  // 订阅日夜状态（本站主题由 lib/theme 维护，这里只跟着 <html> 的标记走）
  const isDark = useIsDark();

  useEffect(() => {
    // 数量从 150 降到 96，减轻长页面上的渲染压力
    const generated: WildBlade[] = Array.from({ length: 96 }).map((_, i) => ({
      id: i, height: 30 + Math.random() * 50, width: 1 + Math.random() * 2,
      delay: Math.random() * -10, duration: 3 + Math.random() * 4,
      opacity: 0.2 + Math.random() * 0.4,
      left: `${(i / 96) * 100 + (Math.random() - 0.5) * 0.5}%`,
      isLeftCurve: Math.random() > 0.5
    }));
    setBlades(generated);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 w-full h-32 pointer-events-none z-10 overflow-hidden transition-colors duration-1000">
      <style>{`@keyframes swayWildGrass { 0% { transform: rotate(-5deg); } 100% { transform: rotate(15deg); } }`}</style>
      {blades.map(blade => (
        <div key={blade.id} className="absolute bottom-0 origin-bottom flex items-end"
             style={{ left: blade.left, height: `${blade.height}px`, width: `${blade.width * 4}px`, opacity: blade.opacity,
             animation: `swayWildGrass ${blade.duration}s ease-in-out infinite alternate`, animationDelay: `${blade.delay}s` }}>
          <div
            // 白天变绿，晚上变白
            className={`w-full h-full transition-all duration-1000 ${isDark ? 'bg-gradient-to-t from-white/80 to-transparent' : 'bg-gradient-to-t from-indigo-200/50 to-transparent'}`}
            style={{ width: `${blade.width}px`, borderRadius: blade.isLeftCurve ? '100% 0 0 100%' : '0 100% 100% 0', transform: blade.isLeftCurve ? 'translateX(50%)' : 'translateX(-50%)' }}
          ></div>
        </div>
      ))}
    </div>
  );
}
