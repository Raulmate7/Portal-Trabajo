'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgressBar() {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const updateScrollCompletion = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const pct = Math.min(100, Math.max(0, (currentProgress / scrollHeight) * 100));
        setCompletion(pct);
      }
    };

    window.addEventListener('scroll', updateScrollCompletion, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollCompletion);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-indigo-100/50 dark:bg-slate-800 z-50 pointer-events-none">
      <div 
        className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-400 transition-all duration-150 ease-out"
        style={{ width: `${completion}%` }}
      />
    </div>
  );
}
