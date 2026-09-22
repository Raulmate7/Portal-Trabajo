export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TechQuiz {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  timeMinutes: number;
  questions: QuizQuestion[];
  jobsSlug: string;
  salariesSlug?: string;
}

export const QUIZZES: Record<string, TechQuiz> = {
  'python': {
    slug: 'python',
    name: 'Test de Nivel Python',
    emoji: '🐍',
    description: 'Evalúa tus conocimientos en estructuras de datos, decoradores, generadores y concurrencia en Python.',
    timeMinutes: 5,
    jobsSlug: 'python',
    salariesSlug: 'python',
    questions: [
      {
        id: 1,
        question: '¿Qué devuelve la expresión [x * 2 for x in range(3)]?',
        options: ['[0, 1, 2]', '[0, 2, 4]', '[2, 4, 6]', '(0, 2, 4)'],
        correctAnswer: 1,
        explanation: 'range(3) genera 0, 1, 2. Al multiplicar cada número por 2 se obtiene la lista [0, 2, 4].'
      },
      {
        id: 2,
        question: '¿Cuál es la diferencia principal entre una lista y una tupla en Python?',
        options: ['Las listas son inmutables y las tuplas mutables', 'Las listas son mutables y las tuplas inmutables', 'Las tuplas solo aceptan números', 'No hay diferencia'],
        correctAnswer: 1,
        explanation: 'Las listas permiten modificar sus elementos tras la creación; las tuplas son inmutables.'
      },
      {
        id: 3,
        question: '¿Qué palabra clave se usa para crear un generador en lugar de una función regular?',
        options: ['return', 'yield', 'generate', 'async'],
        correctAnswer: 1,
        explanation: 'La instrucción yield pausa la ejecución de la función y devuelve un valor al iterador sin destruir el estado interno.'
      },
      {
        id: 4,
        question: '¿Qué es el GIL (Global Interpreter Lock) en CPython?',
        options: ['Un acelerador de la CPU', 'Un mutex que impide la ejecución simultánea de múltiples hilos en bytecode Python', 'El compilador Just-In-Time', 'Un gestor de paquetes'],
        correctAnswer: 1,
        explanation: 'El GIL asegura que solo un hilo del intérprete ejecute bytecode de Python a la vez.'
      },
      {
        id: 5,
        question: '¿Cómo se manejan excepciones múltiples en un solo bloque try en Python?',
        options: ['except (ValueError, TypeError):', 'except ValueError | TypeError:', 'catch (ValueError, TypeError):', 'except [ValueError, TypeError]:'],
        correctAnswer: 0,
        explanation: 'Se pasa una tupla con los tipos de excepciones entre paréntesis en la sentencia except.'
      }
    ]
  },
  'javascript': {
    slug: 'javascript',
    name: 'Test de Nivel JavaScript / ES6+',
    emoji: '🟨',
    description: 'Comprueba tu dominio de closures, promesas, event loop y destructuring en JavaScript moderno.',
    timeMinutes: 5,
    jobsSlug: 'javascript',
    salariesSlug: 'react',
    questions: [
      {
        id: 1,
        question: '¿Cuál es el resultado de typeof NaN en JavaScript?',
        options: ['"undefined"', '"nan"', '"number"', '"object"'],
        correctAnswer: 2,
        explanation: 'En el estándar ECMAScript, NaN (Not-a-Number) pertenece al tipo numérico primitive.'
      },
      {
        id: 2,
        question: '¿Qué diferencia hay entre == y ===?',
        options: ['No hay ninguna diferencia', '== compara tipo y valor; === solo valor', '=== compara valor y tipo sin coerción implícita', '=== convierte ambos a texto'],
        correctAnswer: 2,
        explanation: 'El operador de igualdad estricta (===) no realiza conversión implícita de tipos.'
      },
      {
        id: 3,
        question: '¿Qué es un closure en JavaScript?',
        options: ['Una función que no devuelve nada', 'Una función que recuerda el ámbito léxico donde fue creada', 'Un error de compilación', 'Un método de arrays'],
        correctAnswer: 1,
        explanation: 'Un closure le da a una función acceso a las variables del ámbito exterior incluso después de que la función exterior haya finalizado.'
      },
      {
        id: 4,
        question: '¿En qué orden se ejecutan las microtareas (Promises) y macrotareas (setTimeout)?',
        options: ['Las macrotareas se ejecutan antes que las microtareas', 'Las microtareas se ejecutan antes que las macrotareas en la cola del Event Loop', 'Se ejecutan al azar', 'Depende del navegador'],
        correctAnswer: 1,
        explanation: 'La cola de microtareas tiene prioridad absoluta sobre la cola de macrotareas al finalizar el script actual.'
      },
      {
        id: 5,
        question: '¿Qué hace la función Object.freeze(obj)?',
        options: ['Elimina el objeto de la memoria', 'Impide modificar, añadir o borrar propiedades del objeto', 'Convierte el objeto en JSON', 'Hace el objeto asíncrono'],
        correctAnswer: 1,
        explanation: 'Object.freeze congela un objeto para evitar cualquier mutación en sus propiedades directas.'
      }
    ]
  },
  'react': {
    slug: 'react',
    name: 'Test de Nivel React.js',
    emoji: '⚛️',
    description: 'Valida tu nivel de React: Hooks, Virtual DOM, useCallback, Server Components y reconciliación.',
    timeMinutes: 5,
    jobsSlug: 'react',
    salariesSlug: 'react',
    questions: [
      {
        id: 1,
        question: '¿Para qué sirve el Hook useEffect en React?',
        options: ['Para crear estados locales', 'Para ejecutar efectos secundarios (peticiones API, suscripciones, DOM)', 'Para mejorar el CSS', 'Para navegar entre páginas'],
        correctAnswer: 1,
        explanation: 'useEffect permite realizar efectos secundarios en componentes funcionales tras el renderizado.'
      },
      {
        id: 2,
        question: '¿Cuál es el propósito de la prop "key" en listas de React?',
        options: ['Dar estilo CSS', 'Ayudar a React a identificar qué elementos han cambiado, añadido o borrado', 'Definir el ID en la BD', 'No es obligatoria'],
        correctAnswer: 1,
        explanation: 'Las keys estables permiten al algoritmo de reconciliación reutilizar nodos del DOM eficientemente.'
      },
      {
        id: 3,
        question: '¿Cuándo deberías usar useCallback?',
        options: ['En todas las funciones', 'Para memorizar la referencia a una función pasada como prop a componentes memoizados', 'Para hacer peticiones HTTP', 'Para cambiar el título de la página'],
        correctAnswer: 1,
        explanation: 'useCallback evita la recreación de funciones entre renders cuando se pasan a componentes optimizados con React.memo.'
      },
      {
        id: 4,
        question: '¿Qué diferencia principal hay entre React Server Components (RSC) y el renderizado cliente tradicional?',
        options: ['RSC solo funciona en móbil', 'RSC se ejecuta exclusivamente en el servidor y no envía código JS de ese componente al cliente', 'RSC es más lento', 'No usan JSX'],
        correctAnswer: 1,
        explanation: 'Los componentes de servidor no añaden peso al bundle de JavaScript enviado al navegador del usuario.'
      },
      {
        id: 5,
        question: '¿Qué problema resuelve useReducer frente a useState?',
        options: ['Acelera las descargas', 'Gestión de estados complejos con múltiples sub-valores y transiciones compuestas', 'Permite usar MySQL', 'Elimina las props'],
        correctAnswer: 1,
        explanation: 'useReducer es ideal cuando la lógica del estado es compleja o cuando el siguiente estado depende del anterior.'
      }
    ]
  }
};

export function getQuiz(slug: string): TechQuiz | undefined {
  return QUIZZES[slug];
}
