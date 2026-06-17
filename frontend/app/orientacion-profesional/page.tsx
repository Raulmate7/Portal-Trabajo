"use client";
import React, { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

interface Question {
  id: number;
  title: string;
  options: {
    text: string;
    points: { frontend: number; backend: number; devops: number; data: number };
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "¿Qué tipo de tareas te resultan más interesantes o te gustaría realizar?",
    options: [
      { text: "Diseñar interfaces visuales dinámicas, interactividad y optimizar la experiencia de usuario (UX).", points: { frontend: 3, backend: 0, devops: 0, data: 0 } },
      { text: "Modelar bases de datos, crear APIs seguras, lógicas de negocio e integraciones de sistemas.", points: { frontend: 0, backend: 3, devops: 0, data: 0 } },
      { text: "Automatizar despliegues, gestionar servidores en la nube (AWS/Azure) y orquestar contenedores (Docker).", points: { frontend: 0, backend: 0, devops: 3, data: 0 } },
      { text: "Analizar grandes volúmenes de información, entrenar modelos de IA y visualizar tendencias de negocio.", points: { frontend: 0, backend: 0, devops: 0, data: 3 } }
    ]
  },
  {
    id: 2,
    title: "Si tuvieras que elegir una sintaxis de lenguaje para especializarte, ¿cuál preferirías?",
    options: [
      { text: "JavaScript o TypeScript (el estándar absoluto de la web moderna).", points: { frontend: 3, backend: 1, devops: 0, data: 0 } },
      { text: "Python (limpio, legible y rey indiscutible de la inteligencia artificial).", points: { frontend: 0, backend: 1, devops: 0, data: 3 } },
      { text: "Java, C# o PHP (robustos, estructurados y muy demandados por corporaciones).", points: { frontend: 0, backend: 3, devops: 0, data: 0 } },
      { text: "YAML, Go o Bash (enfocados en configuración, rendimiento y automatización de sistemas).", points: { frontend: 0, backend: 0, devops: 3, data: 0 } }
    ]
  },
  {
    id: 3,
    title: "¿Cómo describirías tu forma de resolver problemas?",
    options: [
      { text: "Me gusta ver el impacto visual inmediato de mi código y cómo interactúa el usuario con él.", points: { frontend: 3, backend: 0, devops: 0, data: 0 } },
      { text: "Prefiero enfocarme en la lógica matemática pura, eficiencia de consultas y flujos de información invisibles.", points: { frontend: 0, backend: 2, devops: 0, data: 2 } },
      { text: "Me apasiona la infraestructura resiliente, la automatización y asegurar que el sistema nunca se caiga.", points: { frontend: 0, backend: 0, devops: 3, data: 0 } }
    ]
  },
  {
    id: 4,
    title: "¿Cuál es tu nivel de experiencia en programación?",
    options: [
      { text: "Estoy empezando o en formación (Junior / Sin Experiencia profesional).", points: { frontend: 1, backend: 1, devops: 1, data: 1 } },
      { text: "Llevo entre 2 y 5 años trabajando activamente (Mid-level).", points: { frontend: 1, backend: 1, devops: 1, data: 1 } },
      { text: "Llevo más de 5 años liderando desarrollos (Senior / Tech Lead).", points: { frontend: 1, backend: 1, devops: 1, data: 1 } }
    ]
  },
  {
    id: 5,
    title: "¿Qué tipo de entorno de trabajo encaja mejor con tu estilo de vida?",
    options: [
      { text: "Trabajo 100% remoto, con flexibilidad total desde cualquier parte del mundo.", points: { frontend: 1, backend: 1, devops: 1, data: 1 } },
      { text: "Modelo híbrido (combinando oficina y teletrabajo para tener contacto presencial).", points: { frontend: 1, backend: 1, devops: 1, data: 1 } },
      { text: "Empresas multinacionales consolidadas con planes estables de carrera.", points: { frontend: 0, backend: 2, devops: 1, data: 1 } }
    ]
  }
];

interface Recommendation {
  title: string;
  category: string;
  avgSalary: string;
  description: string;
  slug: string;
  relatedTechs: string[];
}

const RECOMMENDATIONS: Record<string, Recommendation> = {
  frontend: {
    title: "Desarrollador/a Frontend (React / TypeScript)",
    category: "frontend",
    avgSalary: "41.000€",
    description: "Eres una persona con gran sensibilidad visual e interactiva. Te divierte ver el impacto inmediato de tu código en pantalla. Te recomendamos especializarte en React, TypeScript y herramientas de maquetación avanzada. El mercado Frontend es muy amplio y dinámico.",
    slug: "frontend",
    relatedTechs: ["react", "typescript", "vue", "nextjs"]
  },
  backend: {
    title: "Desarrollador/a Backend (Node.js / Python / Java)",
    category: "backend",
    avgSalary: "43.500€",
    description: "Tu fuerte es la lógica de negocio estructurada, las bases de datos y la velocidad del servidor. Te gusta resolver rompecabezas abstractos invisibles para el usuario. Te sugerimos profundizar en Node.js (Express/NestJS), Python (Django/FastAPI) o arquitecturas Java Spring Boot.",
    slug: "backend",
    relatedTechs: ["node", "python", "java", "sql", "csharp"]
  },
  devops: {
    title: "Ingeniero/a DevOps & Cloud (AWS / Docker / Kubernetes)",
    category: "cloud",
    avgSalary: "47.500€",
    description: "Te apasiona la estabilidad del sistema, la automatización extrema y la gestión de la infraestructura en la nube. Trabajas para que los desarrolladores desplieguen código sin fricciones. AWS, Docker, Terraform y Kubernetes son tus mejores aliados en tu día a día.",
    slug: "cloud",
    relatedTechs: ["aws", "docker", "kubernetes", "terraform"]
  },
  data: {
    title: "Analista de Datos / Especialista en IA (Python / SQL)",
    category: "data",
    avgSalary: "44.000€",
    description: "Eres analítico/a y te apasiona encontrar patrones donde otros solo ven caos de información. La Inteligencia Artificial, el machine learning y la estructuración de almacenes de datos son tu hábitat. Domina Python y SQL a nivel avanzado para destacar.",
    slug: "data",
    relatedTechs: ["python", "sql", "data-analyst"]
  }
};

export default function OrientacionQuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState({ frontend: 0, backend: 0, devops: 0, data: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);

  const handleAnswer = (points: { frontend: number; backend: number; devops: number; data: number }) => {
    const newScores = {
      frontend: scores.frontend + points.frontend,
      backend: scores.backend + points.backend,
      devops: scores.devops + points.devops,
      data: scores.data + points.data
    };
    setScores(newScores);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calcular el máximo
      let maxCat = 'frontend';
      let maxVal = newScores.frontend;

      if (newScores.backend > maxVal) {
        maxCat = 'backend';
        maxVal = newScores.backend;
      }
      if (newScores.devops > maxVal) {
        maxCat = 'devops';
        maxVal = newScores.devops;
      }
      if (newScores.data > maxVal) {
        maxCat = 'data';
      }

      setResult(RECOMMENDATIONS[maxCat]);
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setScores({ frontend: 0, backend: 0, devops: 0, data: 0 });
    setQuizFinished(false);
    setResult(null);
  };

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Orientación Profesional' }
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden p-6 md:p-10">
          {!quizFinished ? (
            <div>
              {/* Progreso */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 font-bold mb-1.5 uppercase">
                  <span>Pregunta {currentStep + 1} de {QUESTIONS.length}</span>
                  <span>{Math.round(((currentStep) / QUESTIONS.length) * 100)}% Completado</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Pregunta */}
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-6 leading-tight">
                {QUESTIONS[currentStep].title}
              </h2>

              {/* Opciones */}
              <div className="space-y-4">
                {QUESTIONS[currentStep].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option.points)}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all font-medium text-sm text-gray-700 hover:text-indigo-950 flex gap-3 group"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 group-hover:bg-indigo-600 group-hover:text-white font-bold text-xs transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <span className="text-6xl block">🏆</span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                ¡Tu perfil recomendado es!
              </h2>
              
              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 max-w-lg mx-auto">
                <h3 className="text-lg md:text-xl font-bold text-indigo-950 mb-1">
                  {result?.title}
                </h3>
                <p className="text-2xl font-extrabold text-indigo-600">
                  Sueldo medio: {result?.avgSalary} /año
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Estimado en base a ofertas activas en España
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mt-4">
                  {result?.description}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-sm">💡 ¿Qué puedes hacer ahora?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                  <Link 
                    href={`/trabajos/${result?.slug}`}
                    className="p-4 rounded-xl border border-gray-150 bg-gray-50 hover:bg-gray-100/50 flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-indigo-950 block">💼 Buscar Ofertas</span>
                      <span className="text-[11px] text-gray-500 mt-0.5 block leading-tight">Ver vacantes de empleo activas para este perfil</span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 mt-2 block">Ver Empleo →</span>
                  </Link>

                  <Link 
                    href={`/salarios/${result?.relatedTechs[0] || 'react'}`}
                    className="p-4 rounded-xl border border-gray-150 bg-gray-50 hover:bg-gray-100/50 flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-indigo-950 block">🧮 Comparar Sueldos</span>
                      <span className="text-[11px] text-gray-500 mt-0.5 block leading-tight">Ver estadísticas y percentiles salariales detallados</span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 mt-2 block">Calculadora Salarios →</span>
                  </Link>
                </div>
              </div>

              {/* Botón para resetear */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={resetQuiz}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-200 transition"
                >
                  🔄 Repetir Test
                </button>
                <Link
                  href="/"
                  className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold rounded-lg text-sm transition"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Banner de publicidad Inline */}
        <div className="mt-8">
          <AdBanner variant="inline" />
        </div>
      </div>
    </main>
  );
}
