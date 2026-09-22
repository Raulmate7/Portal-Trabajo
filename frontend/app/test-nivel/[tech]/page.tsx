'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getQuiz } from '@/lib/test-nivel';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function TestRunnerPage() {
  const params = useParams();
  const tech = typeof params.tech === 'string' ? params.tech : 'python';
  const quiz = getQuiz(tech);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz) {
    return (
      <main className="min-h-screen bg-gray-50 py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test no encontrado</h1>
        <Link href="/test-nivel" className="text-indigo-600 font-bold hover:underline">
          &larr; Volver al catálogo de tests
        </Link>
      </main>
    );
  }

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  const score = calculateScore();
  const total = quiz.questions.length;
  const percentage = Math.round((score / total) * 100);

  let levelText = 'Junior';
  let levelColor = 'text-emerald-600';
  if (percentage >= 80) {
    levelText = 'Senior';
    levelColor = 'text-purple-600';
  } else if (percentage >= 50) {
    levelText = 'Mid / Intermedio';
    levelColor = 'text-blue-600';
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-3xl mb-2">{quiz.emoji}</span>
          <h1 className="text-3xl font-black mb-2">{quiz.name}</h1>
          <p className="text-indigo-200 text-sm">{quiz.description}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Tests de Nivel', href: '/test-nivel' },
          { label: quiz.name }
        ]} />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
        {submitted ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm text-center space-y-6">
            <span className="text-5xl">🎉</span>
            <div>
              <h2 className="text-2xl font-black text-gray-900">¡Test Completado!</h2>
              <p className="text-gray-500 text-sm mt-1">Has acertado <strong>{score}</strong> de <strong>{total}</strong> preguntas ({percentage}%)</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 max-w-sm mx-auto">
              <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Nivel Técnico Estimado</span>
              <strong className={`text-xl font-black ${levelColor}`}>{levelText}</strong>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link 
                href={`/trabajos/${quiz.jobsSlug}`} 
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
              >
                Ver Ofertas de Nivel {levelText} &rarr;
              </Link>
              <button 
                onClick={() => { setSubmitted(false); setSelectedAnswers({}); }} 
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
              >
                Repetir Test
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-2 pl-9">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[q.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left p-3 text-xs md:text-sm rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-sm'
                            : 'bg-gray-50/50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition shadow-sm"
            >
              Finalizar y Ver Resultados
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
