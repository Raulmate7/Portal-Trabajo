"use client";

import { useState, useEffect } from "react";
import { reactToJob } from "@/app/actions";

interface Props {
  jobId: string;
  initialLikes: number;
  initialDislikes: number;
}

export default function ReactionButton({ jobId, initialLikes, initialDislikes }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`react:${jobId}`);
    if (saved === "like" || saved === "dislike") {
      setUserReaction(saved);
    }
  }, [jobId]);

  const handleReact = async (type: "like" | "dislike") => {
    if (userReaction || loading) return;

    setLoading(true);
    try {
      const res = await reactToJob(jobId, type);
      if (res.success) {
        localStorage.setItem(`react:${jobId}`, type);
        setUserReaction(type);
        if (type === "like") {
          setLikes((prev) => prev + 1);
        } else {
          setDislikes((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Fallo al enviar la reacción:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 shadow-sm">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
        ¿Te interesa?
      </span>
      
      <button
        onClick={() => handleReact("like")}
        disabled={!!userReaction || loading}
        title="Me interesa esta oferta"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
          userReaction === "like"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : userReaction
            ? "opacity-40 cursor-not-allowed text-gray-400"
            : "hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 hover:scale-105 active:scale-95 cursor-pointer"
        }`}
      >
        <span className="text-base">👍</span>
        <span className="font-mono text-xs">{likes}</span>
      </button>

      <button
        onClick={() => handleReact("dislike")}
        disabled={!!userReaction || loading}
        title="No me interesa"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
          userReaction === "dislike"
            ? "bg-rose-50 text-rose-700 border border-rose-200"
            : userReaction
            ? "opacity-40 cursor-not-allowed text-gray-400"
            : "hover:bg-rose-50 text-gray-650 hover:text-rose-600 hover:scale-105 active:scale-95 cursor-pointer"
        }`}
      >
        <span className="text-base">👎</span>
        <span className="font-mono text-xs">{dislikes}</span>
      </button>
    </div>
  );
}
