// Banco de preguntas de entrevista técnica por tecnología
// Cada entrada tiene preguntas con nivel de dificultad y respuesta completa

export interface InterviewQuestion {
  id: string;
  level: 'junior' | 'mid' | 'senior';
  question: string;
  answer: string;
}

export interface InterviewTech {
  slug: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  jobsSlug: string;
  salariesSlug?: string;
  questions: InterviewQuestion[];
  url?: string;
  image?: string;
}

export const INTERVIEW_TECHS: InterviewTech[] = [
  {
    slug: 'react',
    name: 'React',
    emoji: '⚛️',
    category: 'Frontend',
    description: 'React es la biblioteca de JavaScript más demandada en España. Estas preguntas cubren hooks, ciclo de vida, optimización y arquitectura de componentes.',
    jobsSlug: 'react',
    salariesSlug: 'react',
    questions: [
      { id: 'r1', level: 'junior', question: '¿Qué es React y cuál es su principal ventaja frente a JavaScript vanilla?', answer: 'React es una biblioteca de JavaScript para construir interfaces de usuario mediante componentes reutilizables. Su principal ventaja es el Virtual DOM: en lugar de manipular el DOM real directamente (operación costosa), React mantiene una representación virtual en memoria, calcula los cambios mínimos necesarios (reconciliación) y aplica solo esas diferencias al DOM real, lo que mejora drásticamente el rendimiento en aplicaciones con actualizaciones frecuentes.' },
      { id: 'r2', level: 'junior', question: '¿Cuál es la diferencia entre estado (state) y props en React?', answer: 'Las **props** son datos que un componente padre pasa a un componente hijo y son de solo lectura (inmutables desde el componente que los recibe). El **state** es un estado interno y mutable del propio componente que, cuando cambia, provoca un re-render. La regla general: si un dato puede cambiar y tiene que provocar una actualización de la UI, debe ser state; si es un valor externo que el componente no debe modificar, debe ser prop.' },
      { id: 'r3', level: 'junior', question: '¿Qué es JSX y cómo lo transforma el compilador?', answer: 'JSX es una extensión de sintaxis de JavaScript que permite escribir estructuras similares a HTML dentro del código JS. Babel (o Vite con esbuild/SWC) transforma cada elemento JSX en una llamada a `React.createElement(type, props, ...children)` en tiempo de compilación. Por ejemplo, `<div className="foo">Hola</div>` se convierte en `React.createElement("div", { className: "foo" }, "Hola")`. Desde React 17, con el nuevo JSX Transform, ya no es necesario importar React en cada archivo que use JSX.' },
      { id: 'r4', level: 'mid', question: '¿Qué son los React Hooks y por qué se introdujeron?', answer: 'Los Hooks son funciones especiales que permiten usar estado y otras características de React en componentes funcionales, eliminando la necesidad de clases. Se introdujeron en React 16.8 para resolver problemas de los componentes de clase: lógica difícil de reutilizar entre componentes (Custom Hooks), código complejo en los métodos de ciclo de vida, y el comportamiento confuso de `this`. Los hooks más importantes son: `useState` (estado local), `useEffect` (efectos secundarios), `useContext` (contexto), `useMemo`/`useCallback` (optimización de rendimiento) y `useRef` (referencias al DOM).' },
      { id: 'r5', level: 'mid', question: '¿Cuándo usarías useMemo vs useCallback?', answer: '`useMemo` memoriza el **resultado** de una función costosa y solo lo recalcula cuando cambian sus dependencias: `const result = useMemo(() => expensiveCalc(a, b), [a, b])`. `useCallback` memoriza la **referencia** a una función para que no se cree una nueva en cada render: `const fn = useCallback(() => doSomething(id), [id])`. Usa `useCallback` cuando pasas una función como prop a un componente hijo memoizado (React.memo), para evitar que el hijo re-renderice innecesariamente. Usa `useMemo` cuando tienes un cálculo computacionalmente costoso.' },
      { id: 'r6', level: 'mid', question: '¿Qué es el lifting state up y cuándo es necesario?', answer: 'El "lifting state up" (elevar el estado) consiste en mover el estado a un componente ancestro común cuando varios componentes hijos necesitan compartir o sincronizar el mismo dato. Si el componente A y el componente B (hermanos) necesitan el mismo estado, la solución correcta en React es mover ese estado al padre de ambos y pasarlo como props. Es la alternativa básica a soluciones de estado global como Context API o Redux para casos sencillos.' },
      { id: 'r7', level: 'senior', question: '¿Cómo funciona la reconciliación en React y qué rol juega la prop key?', answer: 'La reconciliación es el algoritmo que React usa para comparar el Virtual DOM anterior con el nuevo y determinar los cambios mínimos a aplicar al DOM real. React usa dos heurísticas: (1) elementos de diferente tipo generan árboles completamente nuevos; (2) dentro de listas, usa la prop `key` para identificar qué elementos se añadieron, eliminaron o reordenaron. Una `key` estable (como un ID de BD) permite que React reutilice los nodos del DOM existentes en lugar de destruirlos y recrearlos, lo cual es crucial para el rendimiento en listas largas y para mantener el estado interno de los elementos.' },
      { id: 'r8', level: 'senior', question: '¿Qué es React Fiber y cómo mejora el rendimiento respecto al algoritmo de reconciliación anterior?', answer: 'React Fiber (introducido en React 16) es una reescritura completa del motor de reconciliación. El algoritmo anterior era síncrono: una vez iniciado, no se podía interrumpir, lo que causaba "jank" en la UI si la actualización tardaba mucho. Fiber introduce un motor de renderizado incremental y asíncrono: el trabajo de renderizado se divide en unidades pequeñas (fibers) que pueden ser pausadas, priorizadas o descartadas. Esto permitió las features de Concurrent Mode, Suspense y Transitions en React 18, donde React puede interrumpir un renderizado de baja prioridad para atender una interacción del usuario de alta prioridad.' },
      { id: 'r9', level: 'senior', question: '¿Cómo optimizarías el rendimiento de una lista de 10.000 elementos en React?', answer: 'El enfoque estándar es la virtualización de listas (windowing): solo renderizar los elementos que son visibles en el viewport, no los 10.000. Las bibliotecas más usadas son `react-window` (más ligera) o `react-virtual`. Además: (1) usar `React.memo` para memoizar cada item de la lista; (2) usar `useCallback` para los event handlers; (3) asegurarse de que las `key` sean estables; (4) evitar objetos y arrays inline en las props. En React 18, puedes envolver actualizaciones de baja prioridad con `startTransition` para que no bloqueen las interacciones del usuario.' },
    ]
  },
  {
    slug: 'python',
    name: 'Python',
    emoji: '🐍',
    category: 'Backend / Data',
    description: 'Python es el lenguaje más versátil del mercado: domina en data science, machine learning y backend. Preguntas de entrevista técnica para roles de backend y data.',
    jobsSlug: 'python',
    salariesSlug: 'python',
    questions: [
      { id: 'p1', level: 'junior', question: '¿Cuál es la diferencia entre una lista y una tupla en Python?', answer: 'Las listas (`list`) son mutables: puedes añadir, eliminar o modificar elementos después de crearlas. Las tuplas (`tuple`) son inmutables: una vez creadas no se pueden modificar. Esto hace que las tuplas sean más eficientes en memoria y más rápidas de iterar, además de ser hashables (pueden usarse como claves de diccionario). Usa tuplas para datos que no deben cambiar (coordenadas, registros de BD), y listas para colecciones que se modifican.' },
      { id: 'p2', level: 'junior', question: '¿Qué son los decoradores en Python y para qué sirven?', answer: 'Un decorador es una función que recibe otra función como argumento, añade funcionalidad y devuelve la función modificada. Es un patrón que sigue el principio Open/Closed. Se usa con la sintaxis `@mi_decorador`. Ejemplos comunes: `@property` (convertir un método en atributo), `@staticmethod`/`@classmethod`, decoradores de logging, caché (`@functools.lru_cache`), autenticación en Flask/FastAPI (`@login_required`). Los decoradores son azúcar sintáctico para `funcion = decorador(funcion)`.' },
      { id: 'p3', level: 'junior', question: '¿Qué es el GIL de Python y cómo afecta al multithreading?', answer: 'El GIL (Global Interpreter Lock) es un mutex que protege el acceso al intérprete de CPython, permitiendo que solo un hilo ejecute bytecode Python a la vez. Esto significa que el multithreading de Python NO escala en CPU-bound tasks (tareas que usan mucha CPU) porque los hilos no se ejecutan en paralelo real. Sin embargo, el GIL se libera durante operaciones de I/O (lectura de archivos, requests HTTP, BD), por lo que el multithreading SÍ es útil para I/O-bound tasks. Para paralelismo real en CPU-bound tasks, usa el módulo `multiprocessing` (procesos separados, cada uno con su propio GIL).' },
      { id: 'p4', level: 'mid', question: '¿Cuál es la diferencia entre yield y return en Python? ¿Qué es un generador?', answer: '`return` finaliza la función y devuelve un valor. `yield` pausa la función y devuelve un valor, pero mantiene su estado interno. Una función con `yield` es un **generador**: al llamarla, devuelve un objeto generator sin ejecutar el cuerpo. Cada llamada a `next()` ejecuta hasta el siguiente `yield`. Los generadores son lazy (calculan valores bajo demanda) y muy eficientes en memoria: en lugar de crear una lista de 1 millón de elementos, un generador produce un elemento a la vez. Son perfectos para procesar ficheros grandes, streams de datos o pipelines de transformación.' },
      { id: 'p5', level: 'mid', question: '¿Qué es asyncio en Python y cuándo usarías async/await?', answer: 'asyncio es la biblioteca de Python para programación asíncrona basada en un event loop. `async def` define una corrutina; `await` suspende su ejecución hasta que la operación asíncrona termine, liberando el event loop para ejecutar otras corrutinas. Úsalo cuando tienes muchas operaciones de I/O concurrentes (requests HTTP, consultas a BD, lectura de ficheros): en lugar de un hilo por request, un único hilo gestiona miles de conexiones concurrentes de forma eficiente. Frameworks como FastAPI, aiohttp y SQLAlchemy 2.0 están completamente orientados a asyncio.' },
      { id: 'p6', level: 'senior', question: '¿Cómo funciona la gestión de memoria en Python? ¿Qué es el garbage collector?', answer: 'Python usa conteo de referencias como mecanismo principal: cada objeto tiene un contador de cuántas variables apuntan a él. Cuando llega a 0, la memoria se libera inmediatamente. El problema es que el conteo de referencias no puede detectar ciclos (A → B → A). Para eso, Python incluye un garbage collector cíclico (módulo `gc`) que periódicamente busca y rompe ciclos de referencias. Puedes forzar una recolección con `gc.collect()` o deshabilitar el GC temporal para mejorar rendimiento en scripts de corta duración. El profiler `tracemalloc` es útil para detectar memory leaks.' },
      { id: 'p7', level: 'senior', question: '¿Qué patrones de diseño usarías para crear una API REST escalable con FastAPI?', answer: 'Para una API FastAPI escalable: (1) **Repository Pattern**: abstraer el acceso a datos detrás de una interfaz para desacoplar la lógica de negocio de SQLAlchemy; (2) **Dependency Injection**: usar `Depends()` de FastAPI para gestionar sesiones de BD, autenticación y servicios; (3) **Schema Separation**: Pydantic schemas separados para input (Create/Update), output (Read) y modelo interno; (4) **Async all the way**: usar `async def` y SQLAlchemy async para no bloquear el event loop; (5) **Middleware para cross-cutting concerns**: logging, CORS, rate limiting, auth; (6) **Background Tasks o Celery** para operaciones lentas que no deben bloquear el response.' },
    ]
  },
  {
    slug: 'java',
    name: 'Java',
    emoji: '☕',
    category: 'Backend',
    description: 'Java sigue siendo el rey del desarrollo backend empresarial en España. Preguntas que cubren Spring Boot, JVM, concurrencia y patrones de diseño.',
    jobsSlug: 'java',
    salariesSlug: 'java',
    questions: [
      { id: 'j1', level: 'junior', question: '¿Cuál es la diferencia entre una clase abstracta y una interfaz en Java?', answer: 'Una **clase abstracta** puede tener métodos con implementación y sin ella (abstract), puede tener estado (atributos), y una clase solo puede extender UNA clase abstracta. Una **interfaz** (desde Java 8) puede tener métodos default con implementación, pero no puede tener estado mutable. Una clase puede implementar MÚLTIPLES interfaces. Regla de uso: usa clase abstracta cuando las subclases comparten comportamiento y estado común; usa interfaz para definir un contrato (capacidad) que clases no relacionadas pueden implementar.' },
      { id: 'j2', level: 'junior', question: '¿Qué es el heap y el stack en la JVM?', answer: 'El **stack** almacena marcos de pila (stack frames) de cada llamada a método: variables locales, referencias y el contador de programa. Cada hilo tiene su propio stack. La memoria se asigna y libera automáticamente con las llamadas LIFO. El **heap** es la memoria compartida entre todos los hilos donde se almacenan todos los objetos creados con `new`. El Garbage Collector gestiona el heap, liberando objetos sin referencias. Los errores comunes: `StackOverflowError` (demasiada recursión) para el stack, y `OutOfMemoryError: Java heap space` para el heap.' },
      { id: 'j3', level: 'mid', question: '¿Cómo funciona el Garbage Collector de la JVM y qué diferencia hay entre G1GC y ZGC?', answer: 'El GC de la JVM divide el heap en generaciones: **Young Generation** (objetos recientes, GC frecuente y rápido) y **Old Generation** (objetos longevos, GC menos frecuente pero más costoso). **G1GC** (default desde Java 9): divide el heap en regiones iguales, prioriza las regiones con más basura para minimizar las pausas. Latencia de pausas: 10-200ms. Ideal para la mayoría de aplicaciones. **ZGC** (Java 15+): GC de baja latencia que ejecuta casi toda la recolección de forma concurrente con la aplicación. Pausas < 1ms, incluso con heaps de cientos de GB. Ideal para aplicaciones que requieren latencia ultra-baja (trading, gaming).' },
      { id: 'j4', level: 'mid', question: '¿Cuál es la diferencia entre Callable y Runnable en Java?', answer: 'Ambos representan tareas que puede ejecutar un thread. `Runnable` tiene un único método `run()` que no devuelve valor y no puede lanzar checked exceptions. `Callable<V>` tiene el método `call()` que devuelve un valor de tipo V y puede lanzar checked exceptions. Al enviar un `Callable` a un `ExecutorService` con `submit()`, obtienes un `Future<V>` que permite obtener el resultado asíncrono con `future.get()` (bloqueante) o combinar resultados con `CompletableFuture`.' },
      { id: 'j5', level: 'senior', question: '¿Cómo funciona Spring Boot internamente? ¿Qué es la auto-configuración?', answer: 'Spring Boot usa el mecanismo de **Spring\'s @Conditional annotations** y los archivos `spring.factories` (o `AutoConfiguration.imports` en Spring Boot 3) para detectar qué clases están en el classpath y configurar beans automáticamente. Al arrancar, `SpringApplication.run()` crea el ApplicationContext, escanea los `@SpringBootApplication` (que combina `@Configuration`, `@EnableAutoConfiguration` y `@ComponentScan`), carga todas las `@AutoConfiguration` que cumplan sus condiciones (`@ConditionalOnClass`, `@ConditionalOnMissingBean`), y registra los beans. El comando `--debug` o la propiedad `spring.autoconfigure.report=true` muestra un informe de qué se autoconfigura y por qué.' },
    ]
  },
  {
    slug: 'typescript',
    name: 'TypeScript',
    emoji: '📘',
    category: 'Frontend / Backend',
    description: 'TypeScript ha dejado de ser opcional y es el estándar en el mercado laboral. Preguntas sobre sistema de tipos, genéricos y patrones avanzados.',
    jobsSlug: 'typescript',
    questions: [
      { id: 't1', level: 'junior', question: '¿Cuál es la diferencia entre type e interface en TypeScript?', answer: 'Ambos definen formas de objetos, pero tienen diferencias clave: (1) **Extensión**: las interfaces se extienden con `extends`; los types se combinan con `&` (intersection). (2) **Declaration merging**: múltiples `interface` con el mismo nombre se fusionan automáticamente; los `type` no admiten redeclaración. (3) **Capacidades**: los `type` pueden representar uniones (`string | number`), tuplas, tipos mapeados y literales; las interfaces no. Regla general: usa `interface` para objetos/clases que se pueden extender; usa `type` para todo lo demás (uniones, aliases, tipos utilitarios).' },
      { id: 't2', level: 'mid', question: '¿Qué son los Generic Types en TypeScript y cuándo se usan?', answer: 'Los genéricos permiten crear componentes reutilizables que funcionan con cualquier tipo, manteniendo la seguridad de tipos. Se declaran con `<T>`: `function identity<T>(arg: T): T { return arg; }`. Úsalos cuando: (1) una función o clase debe funcionar con múltiples tipos manteniendo la relación entre input y output; (2) para crear tipos utilitarios como `Array<T>`, `Promise<T>`, `Record<K, V>`. Con constraints: `<T extends object>` limita T a tipos que sean objetos. Los genéricos son la base de todos los utility types de TypeScript: `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`, `ReturnType<T>`, etc.' },
      { id: 't3', level: 'senior', question: '¿Qué es el sistema de tipos estructural de TypeScript y cómo difiere del nominal?', answer: 'TypeScript usa un sistema de tipos **estructural** (duck typing): dos tipos son compatibles si tienen la misma estructura, independientemente de su nombre. Si el tipo A tiene las mismas propiedades que el tipo B, A es asignable a B. Esto contrasta con los sistemas **nominales** (Java, C#) donde la compatibilidad depende del nombre/jerarquía explícita. En TypeScript: `class Cat { meow() {} }` y `class Dog { meow() {} }` son mutuamente asignables aunque no compartan herencia. Para simular tipos nominales, se usan técnicas como las "branded types": `type UserId = string & { readonly _brand: "UserId" }`.' },
    ]
  },
  {
    slug: 'node',
    name: 'Node.js',
    emoji: '🟢',
    category: 'Backend',
    description: 'Node.js es el runtime de JavaScript más usado en backend. Preguntas sobre el event loop, streams, Express y arquitectura de APIs.',
    jobsSlug: 'node',
    questions: [
      { id: 'n1', level: 'junior', question: '¿Qué es el Event Loop de Node.js y por qué hace que Node sea no bloqueante?', answer: 'Node.js ejecuta JavaScript en un único hilo, pero puede manejar miles de conexiones simultáneas gracias al Event Loop y a libuv (biblioteca de I/O asíncrona en C++). El Event Loop tiene varias fases: timers (setTimeout/setInterval), pending callbacks, idle/prepare, poll (espera eventos de I/O), check (setImmediate), close callbacks. Cuando Node realiza una operación de I/O (leer un archivo, query a BD), delega la operación al sistema operativo a través de libuv, libera el hilo para procesar otros eventos, y cuando la operación termina, coloca el callback en la cola del Event Loop. El hilo nunca se bloquea esperando I/O.' },
      { id: 'n2', level: 'mid', question: '¿Cuándo usarías Node.js streams y qué ventaja ofrecen sobre buffers?', answer: 'Los Streams permiten procesar datos en fragmentos (chunks) en lugar de cargar todo en memoria. Sin streams, leer un fichero de 2GB requiere 2GB de RAM. Con streams, se procesa chunk a chunk con uso de memoria constante. Tipos: Readable (lectura), Writable (escritura), Duplex (lectura y escritura), Transform (transforma mientras fluye). Ejemplo: `fs.createReadStream("grande.csv").pipe(csvParser()).pipe(dbWriter)`. Úsalos para: procesamiento de ficheros grandes, subida/descarga de ficheros, proxies HTTP, compresión, cifrado en tiempo real.' },
    ]
  },
  {
    slug: 'aws',
    name: 'AWS',
    emoji: '☁️',
    category: 'Cloud / DevOps',
    description: 'Amazon Web Services es la nube más demandada del mercado. Preguntas sobre arquitectura, servicios principales y buenas prácticas para entrevistas de DevOps y Cloud.',
    jobsSlug: 'aws',
    questions: [
      { id: 'a1', level: 'junior', question: '¿Cuál es la diferencia entre EC2, Lambda y ECS en AWS?', answer: '**EC2** (Elastic Compute Cloud): servidor virtual completo. Tú gestionas el SO, parches, escalado. Control total, mayor complejidad. Perfecto para aplicaciones con estado o que requieren configuraciones específicas. **Lambda**: computación serverless basada en eventos. Solo pagas por el tiempo de ejecución (100ms de precisión). Escala automáticamente a 0. Ideal para tareas cortas, APIs con tráfico variable o procesamiento de eventos. Límite de 15 min de ejecución. **ECS** (Elastic Container Service): orquestación de contenedores Docker. Intermedio entre EC2 y Lambda: levantas contenedores sin gestionar VMs. Puede correr sobre EC2 (gestionas los nodos) o Fargate (serverless, sin gestionar nodos).' },
      { id: 'a2', level: 'mid', question: '¿Qué es IAM y cómo implementas el principio de mínimo privilegio?', answer: 'IAM (Identity and Access Management) gestiona quién puede hacer qué en AWS. El principio de mínimo privilegio significa otorgar solo los permisos necesarios para cada tarea. Implementación: (1) nunca usar el usuario root; (2) crear usuarios/roles específicos por función; (3) usar políticas managed solo si son restrictivas; (4) preferir roles de IAM sobre credenciales estáticas para servicios; (5) usar `Condition` en políticas para restringir por IP, hora o MFA; (6) rotar credenciales regularmente; (7) usar AWS Access Analyzer para detectar accesos no intencionados; (8) aplicar SCP (Service Control Policies) a nivel de organización para poner límites duros.' },
    ]
  },
  {
    slug: 'docker',
    name: 'Docker / DevOps',
    emoji: '🐳',
    category: 'DevOps',
    description: 'Docker y los principios DevOps son imprescindibles en cualquier stack moderno. Preguntas sobre contenedores, Kubernetes, CI/CD y prácticas de operaciones.',
    jobsSlug: 'docker',
    questions: [
      { id: 'd1', level: 'junior', question: '¿Cuál es la diferencia entre una imagen Docker y un contenedor?', answer: 'Una **imagen** Docker es una plantilla de solo lectura que contiene el SO base, dependencias, código y configuración de la aplicación. Es inmutable y se construye con un Dockerfile usando `docker build`. Un **contenedor** es una instancia en ejecución de una imagen. Es mutable durante su vida (puedes escribir en su capa de contenedor), pero esos cambios se pierden al eliminarlo, a menos que uses volúmenes. Analogía: la imagen es el plano de un edificio; el contenedor es el edificio construido a partir de ese plano. Puedes tener múltiples contenedores corriendo desde la misma imagen.' },
      { id: 'd2', level: 'mid', question: '¿Qué es Kubernetes y para qué sirve? ¿Cuál es la diferencia con Docker Compose?', answer: '**Docker Compose** orquesta múltiples contenedores en una sola máquina, principalmente para entornos de desarrollo local. Define los servicios en un fichero `docker-compose.yml`. **Kubernetes** es un orquestador de contenedores para producción que gestiona clústeres de múltiples nodos: distribuye los contenedores (Pods) entre nodos, gestiona el escalado automático (HPA), self-healing (reinicia Pods caídos), rolling deployments sin downtime, service discovery, load balancing y gestión de secretos. Kubernetes es el estándar de la industria para ejecutar contenedores a escala en producción.' },
    ]
  },
  {
    slug: 'angular',
    name: 'Angular',
    emoji: '🅰️',
    category: 'Frontend',
    description: 'Angular es el framework empresarial de Google preferido por bancos y grandes corporaciones en España. Preguntas que cubren componentes, inyección de dependencias, RxJS y señales (Signals).',
    jobsSlug: 'angular',
    salariesSlug: 'angular',
    questions: [
      { id: 'an1', level: 'junior', question: '¿Qué es Angular y cuál es la diferencia clave con React?', answer: 'Angular es un framework completo (opinado) estructurado en TypeScript, mientras que React es una librería enfocada solo en la vista. Angular viene con herramientas integradas de fábrica como router, cliente HTTP, gestión de formularios (Reactive Forms) y validaciones, lo que garantiza consistencia arquitectónica en equipos grandes sin depender de librerías externas.' },
      { id: 'an2', level: 'mid', question: '¿Qué es RxJS en Angular y cómo funciona un Observable?', answer: 'RxJS es una librería de programación reactiva para gestionar flujos de datos asíncronos mediante colecciones observables. Un **Observable** es una función que produce una secuencia de valores a lo largo del tiempo para suscriptores (`Subscribe`). A diferencia de las Promesas, los Observables pueden emitir múltiples valores, son cancelables usando `unsubscribe` y permiten encadenar transformaciones complejas mediante operadores declarativos como `map`, `filter`, `switchMap` y `catchError`.' },
      { id: 'an3', level: 'senior', question: '¿Qué son las Signals en Angular y cómo mejoran la detección de cambios frente a Zone.js?', answer: 'Las **Signals** (introducidas en Angular 16+) son un sistema de reactividad granular que rastrea el estado de la aplicación. Con Zone.js clásico, Angular intercepta cualquier evento asíncrono y ejecuta una detección de cambios en todo el árbol de componentes de arriba a abajo. Con Signals, Angular sabe exactamente qué parte específica de la UI depende de qué Signal, actualizando el DOM de manera quirúrgica y local, eliminando la necesidad de Zone.js y mejorando drásticamente el rendimiento de renderizado.' }
    ]
  },
  {
    slug: 'vue',
    name: 'Vue.js',
    emoji: '💚',
    category: 'Frontend',
    description: 'Vue.js destaca por su curva de aprendizaje suave y rendimiento. Estas preguntas abarcan Vue 3, Composition API, reactividad y Pinia.',
    jobsSlug: 'vue',
    salariesSlug: 'vue',
    questions: [
      { id: 'v1', level: 'junior', question: '¿Cuál es la diferencia entre Options API y Composition API en Vue 3?', answer: 'Options API organiza el código mediante objetos y propiedades predefinidas (`data`, `methods`, `computed`, `mounted`). Composition API (estándar en Vue 3) organiza el código por funcionalidad lógica utilizando la función `setup` o la etiqueta `<script setup>`. Esto facilita enormemente la reutilización de código (Composables) y mejora el tipado de TypeScript en proyectos complejos.' },
      { id: 'v2', level: 'mid', question: '¿Cómo funciona el sistema de reactividad de Vue 3 mediante ref y reactive?', answer: 'Vue 3 utiliza **Proxies de JavaScript** (ES6) para interceptar accesos y modificaciones en el estado de forma transparente. `ref` se usa para valores primitivos (número, string, boolean) y requiere acceder a `.value` en el script (aunque se desenvuelve automáticamente en el template). `reactive` se usa exclusivamente para objetos y arrays, haciendo que todo el objeto sea reactivo directamente.' },
      { id: 'v3', level: 'senior', question: '¿Qué es Pinia y cómo optimizarías el estado global frente a renderizados innecesarios?', answer: 'Pinia es la librería oficial de gestión de estado ligero para Vue 3. Para optimizar el rendimiento, debes evitar desestructurar el estado directamente en el componente para no perder la reactividad; en su lugar, utiliza `storeToRefs(store)`. Adicionalmente, se deben estructurar Getters eficientes que actúen como propiedades computadas memorizadas y dividir la lógica en módulos independientes para facilitar el code-splitting.' }
    ]
  },
  {
    slug: 'php',
    name: 'PHP / Laravel',
    emoji: '🐘',
    category: 'Backend',
    description: 'PHP y Laravel sustentan una porción masiva de la web activa en España. Preguntas sobre arquitectura MVC, Eloquent ORM, colas y rendimiento.',
    jobsSlug: 'php',
    salariesSlug: 'php',
    questions: [
      { id: 'ph1', level: 'junior', question: '¿Qué es Laravel y qué ventajas ofrece su ORM Eloquent?', answer: 'Laravel es el framework backend más popular de PHP. Su ORM **Eloquent** implementa el patrón Active Record, donde cada clase representa una tabla de la base de datos y cada objeto representa una fila. Ofrece una sintaxis limpia orientada a objetos para realizar operaciones CRUD, validaciones y relaciones sin escribir SQL manual.' },
      { id: 'ph2', level: 'mid', question: '¿Qué es el problema de consultas N+1 en Laravel Eloquent y cómo se soluciona?', answer: 'El problema N+1 ocurre al listar elementos y acceder a sus relaciones de forma perezosa (lazy loading). Por ejemplo, cargar 100 posts y en un bucle obtener el autor de cada uno genera 1 consulta inicial + 100 consultas adicionales a la BD (101 totales). Se soluciona aplicando **Eager Loading** mediante el método `with()`: `Post::with(\'author\')->get()`, reduciendo las peticiones a solo 2 consultas (una para los posts y otra con un `IN (...)` para los autores).' },
      { id: 'ph3', level: 'senior', question: '¿Cómo escalarías el procesamiento de tareas pesadas en una aplicación Laravel?', answer: 'Para tareas lentas (envío de emails masivos, procesamiento de imágenes o reportes), se debe utilizar el **sistema de colas (Queue System)** de Laravel apoyado en un broker de mensajería como Redis o Amazon SQS. El backend delega la tarea a la cola de forma instantánea liberando la petición HTTP del usuario, y múltiples procesos de consola en segundo plano (`php artisan queue:work`) procesan la cola de forma asíncrona distribuyendo la carga de CPU de forma controlada.' }
    ]
  },
  {
    slug: 'go',
    name: 'Go (Golang)',
    emoji: '🐹',
    category: 'Backend',
    description: 'Go es el lenguaje de Google predilecto para microservicios de alto rendimiento y herramientas cloud. Preguntas sobre goroutines, canales, interfaces y concurrencia.',
    jobsSlug: 'go',
    salariesSlug: 'go',
    questions: [
      { id: 'go1', level: 'junior', question: '¿Cuál es la diferencia principal entre una Goroutine y un Thread del Sistema Operativo?', answer: 'Las **Goroutines** son hilos lógicos gestionados por el propio runtime de Go (Scheduler), no por el kernel del SO. Tienen una huella de memoria inicial minúscula (unos 2KB) y el cambio de contexto entre ellas se realiza en el espacio de usuario, lo que permite ejecutar cientos de miles de goroutines concurrentes con un impacto mínimo frente a los hilos de SO clásicos (que consumen ~1MB y requieren cambios de contexto costosos).' },
      { id: 'go2', level: 'mid', question: '¿Cómo se comunican las Goroutines de forma segura? ¿Qué son los Channels?', answer: 'En Go, la regla de concurrencia es "No te comuniques compartiendo memoria; en su lugar, comparte memoria comunicándote". Se utilizan los **Channels** (canales) como conductos con tipos seguros para enviar y recibir datos entre goroutines de manera síncrona o asíncrona (canales con buffer), evitando condiciones de carrera (race conditions) sin necesidad de recurrir a semáforos o bloqueos manuales.' },
      { id: 'go3', level: 'senior', question: '¿Cómo funciona la gestión de interfaces en Go (Tipado Estructural) y cómo influye en el diseño de dependencias?', answer: 'Las interfaces en Go se implementan de forma implícita (satisfacción estructural): una struct cumple con una interfaz si implementa todos sus métodos, sin usar la palabra clave `implements`. Esto permite un acoplamiento extremadamente débil. En diseño de arquitectura, permite inyectar dependencias y mocks fácilmente siguiendo el principio de segregación de interfaces de SOLID, definiendo las interfaces en el punto de uso (cliente) y no en el de implementación.' }
    ]
  },
  {
    slug: 'sql',
    name: 'SQL / Bases de Datos',
    emoji: '📊',
    category: 'Bases de Datos',
    description: 'El dominio de SQL es indispensable para cualquier rol de desarrollo e ingeniería. Preguntas que abarcan índices, joins, normalización y optimización de consultas.',
    jobsSlug: 'sql',
    salariesSlug: 'sql',
    questions: [
      { id: 'sq1', level: 'junior', question: '¿Cuál es la diferencia entre un INNER JOIN y un LEFT JOIN en SQL?', answer: '**INNER JOIN** devuelve únicamente las filas que tienen coincidencias exactas en ambas tablas unidas. **LEFT JOIN** devuelve todas las filas de la tabla de la izquierda (primera tabla) y las filas coincidentes de la tabla de la derecha; si no hay coincidencia, las columnas de la tabla derecha se rellenan con valores `NULL`.' },
      { id: 'sq2', level: 'mid', question: '¿Qué es un índice de base de datos y cómo acelera las consultas? ¿Qué contrapartida tiene?', answer: 'Un **índice** es una estructura de datos física (normalmente un árbol B+ o tabla Hash) asociada a una columna que permite realizar búsquedas rápidas sin escanear toda la tabla fila por fila (Full Table Scan). La contrapartida es que ralentiza las operaciones de escritura (`INSERT`, `UPDATE`, `DELETE`) porque la base de datos debe actualizar el índice físico en disco con cada modificación de datos, además de ocupar espacio adicional de almacenamiento.' },
      { id: 'sq3', level: 'senior', question: '¿Cómo optimizarías una consulta SELECT que tarda más de 5 segundos en ejecutarse sobre una tabla de 20 millones de filas?', answer: 'El proceso sería: (1) Ejecutar la consulta con el prefijo `EXPLAIN` para analizar el plan de ejecución y ver si hay escaneos completos de tabla. (2) Asegurar que las columnas del filtro `WHERE` y del `JOIN` cuentan con índices adecuados (o índices compuestos si se filtran por varios campos). (3) Evitar el uso de comodines al inicio de strings (`LIKE \'%texto%\'`) porque invalidan el uso del índice. (4) Limitar las columnas solicitadas evitando `SELECT *`. (5) Estudiar la necesidad de particionamiento físico de la tabla por fecha o ID, o desnormalizar campos agregados recurrentes.' }
    ]
  },
  {
    slug: 'csharp',
    name: 'C# / .NET',
    emoji: '🔷',
    category: 'Backend',
    description: 'C# y el ecosistema .NET Core sustentan backend modernos de alto rendimiento en España. Preguntas sobre CLR, inyección, Entity Framework y optimización.',
    jobsSlug: 'csharp',
    salariesSlug: 'csharp',
    questions: [
      { id: 'cs1', level: 'junior', question: '¿Qué es el CLR en .NET y cuál es su función?', answer: 'El CLR (Common Language Runtime) es el motor de ejecución virtual de .NET. Se encarga de compilar el código intermedio (IL - Intermediate Language) a código máquina nativo mediante compilación Just-In-Time (JIT), gestionar la memoria (Garbage Collector), manejar hilos y asegurar la seguridad de tipos del código ejecutable.' },
      { id: 'cs2', level: 'mid', question: '¿Cuáles son las diferencias de ciclo de vida de los servicios inyectados: Transient, Scoped y Singleton?', answer: 'En el contenedor de DI de .NET: **Transient** crea una nueva instancia del servicio cada vez que se solicita. **Scoped** crea una instancia única por cada solicitud HTTP de cliente (compartida entre los componentes durante esa llamada). **Singleton** crea una instancia única la primera vez que se solicita y se comparte de forma transversal para toda la vida de la aplicación.' },
      { id: 'cs3', level: 'senior', question: '¿Cómo optimizarías el rendimiento de consultas masivas con Entity Framework Core?', answer: 'Para optimizar consultas masivas en EF Core: (1) Usar `.AsNoTracking()` para consultas de solo lectura para evitar el coste del tracking de cambios. (2) Aplicar paginación con `.Skip()` y `.Take()`. (3) Cargar relaciones mediante `.Include()` (Eager Loading) solo cuando sea necesario para evitar el problema N+1. (4) Traducir proyecciones específicas mediante `.Select()` para consultar solo las columnas estrictamente necesarias en lugar de entidades completas.' }
    ]
  },
  {
    slug: 'preguntas-conductuales',
    name: 'Preguntas Conductuales (Método STAR)',
    emoji: '🎯',
    category: 'Soft Skills / HR',
    description: 'Respuestas estratégicas para preguntas de comportamiento en entrevistas IT usando el método STAR (Situación, Tarea, Acción, Resultado).',
    jobsSlug: 'informatica-tecnologia',
    questions: [
      {
        id: 'bh1',
        level: 'junior',
        question: 'Cuéntame sobre una ocasión en la que cometiste un error técnico en producción y cómo lo resolviste.',
        answer: 'Utiliza la estructura STAR: (1) **Situación**: Describe brevemente el contexto sin culpar a nadie. (2) **Tarea**: Identificar el fallo rápidamente para minimizar el impacto en los usuarios. (3) **Acción**: Explica cómo aplicaste un rollback inmediato o hotfix, cómo comunicaste el incidente de forma transparente al equipo y qué prueba añadiste para que no volviera a ocurrir. (4) **Resultado**: El servicio se restableció en 5 minutos y se creó un test de integración automático en la pipeline.'
      },
      {
        id: 'bh2',
        level: 'mid',
        question: '¿Cómo manejas un desacuerdo técnico sobre arquitectura con un compañero o Tech Lead?',
        answer: 'Muestra madurez técnica: (1) Enfócate en datos y métricas objetivas (rendimiento, mantenibilidad, tiempo de entrega) en lugar de opiniones personales. (2) Escucha activamente los argumentos del compañero. (3) Propón realizar una pequeña prueba de concepto (PoC) para comparar ambas opciones. (4) Si la decisión final tomada por el equipo difiere de tu propuesta, comprométete al 100% con la opción elegida (principio "Disagree and Commit").'
      },
      {
        id: 'bh3',
        level: 'senior',
        question: '¿Cómo priorizas tareas cuando tienes múltiples fechas límite ajustadas e imprevistos de producción?',
        answer: 'Explica tu marco de trabajo: (1) Evalúa el impacto de negocio y la gravedad de cada tarea. (2) Comunica inmediatamente los cuellos de botella al Product Manager y a los interesados de forma proactiva. (3) Aplica negociación de alcance (descomponer tareas en MVPs pequeños) para entregar valor crítico a tiempo sin comprometer la estabilidad del sistema.'
      }
    ]
  },
  {
    slug: 'preguntas-trampa',
    name: 'Las 20 Preguntas Trampa más Difíciles',
    emoji: '⚠️',
    category: 'Entrevistas IT',
    description: 'Respuestas preparadas para responder con éxito a las preguntas trampa y comprometedoras más habituales de los reclutadores IT.',
    jobsSlug: 'informatica-tecnologia',
    questions: [
      {
        id: 'tr1',
        level: 'junior',
        question: '¿Cuál es tu mayor defecto o punto débil como desarrollador?',
        answer: 'Evita respuestas cliché como "soy demasiado perfeccionista". En su lugar, nombra un área técnica real que estés mejorando activamente. Ejemplo: "En el pasado tendía a intentar resolver los problemas de código de forma 100% individual antes de pedir ayuda. Ahora me he puesto la regla de consultar al equipo si me quedo atascado durante más de 30 minutos, lo que ha mejorado mi velocidad de entrega."'
      },
      {
        id: 'tr2',
        level: 'mid',
        question: '¿Por qué quieres dejar tu empresa actual?',
        answer: 'Mantén un tono 100% positivo hacia tu empresa anterior o actual. Centra tu respuesta en el **crecimiento futuro** y no en frustraciones pasadas. Ejemplo: "He aprendido muchísimo en mi empresa actual y estoy muy agradecido por las oportunidades, pero busco un nuevo reto donde pueda trabajar con arquitecturas cloud nativas a mayor escala, como las que desarrolláis aquí."'
      },
      {
        id: 'tr3',
        level: 'senior',
        question: '¿Cuánto esperas ganar en este puesto?',
        answer: 'Investiga previamente las bandas salariales del mercado para tu nivel y tecnología en portales como el nuestro. Responde con un rango fundamentado: "Basándome en mi experiencia de 5 años con React y TypeScript y en el mercado actual en España, busco una horquilla de entre 42.000€ y 48.000€ brutos anuales, negociable en función del paquete global de beneficios (remoto, formación, bonus)."'
      }
    ]
  },
  {
    slug: 'system-design',
    name: 'Diseño de Sistemas (System Design)',
    emoji: '🏗️',
    category: 'Arquitectura',
    description: 'Guía fundamental para superar entrevistas de diseño de sistemas a gran escala para roles Mid, Senior y Staff Engineer.',
    jobsSlug: 'backend',
    salariesSlug: 'java',
    questions: [
      {
        id: 'sd1',
        level: 'mid',
        question: '¿Cómo diseñarías un servicio acortador de URLs (tipo bit.ly)?',
        answer: 'Pasos clave: (1) **Requisitos y estimaciones**: Calcular peticiones de lectura/escritura (ej. 100:1 ratio). (2) **Algoritmo de codificación**: Usar hash Base62 (A-Z, a-z, 0-9) sobre un auto-increment o ID único (Snowflake) para generar slugs de 7 caracteres (62^7 = 3.5 billones de URLs). (3) **Base de datos**: Base de datos NoSQL clave-valor (Redis para caché de alta velocidad + Cassandra/DynamoDB para persistencia). (4) **Redirección**: Retornar cabecera HTTP 301 (Permanent) para caché en navegador o 302 (Found) para contar analíticas por clic.'
      },
      {
        id: 'sd2',
        level: 'senior',
        question: '¿Cómo diseñarías un sistema de chat en tiempo real a escala global (tipo WhatsApp / Slack)?',
        answer: 'Componentes clave: (1) **Conexiones bidireccionales**: WebSockets mantenidos por servidores de Gateway. (2) **Presencia y Sesiones**: Redis Pub/Sub o Apache Pulsar para enrutar mensajes al Gateway adecuado donde el usuario receptor tiene su conexión activa. (3) **Almacenamiento de Mensajes**: HBase o Cassandra para escrituras secuenciales masivas y lecturas paginadas por chat. (4) **Notificaciones Push**: Integración con APNs (Apple) y FCM (Google) para enviar alertas cuando el usuario está offline.'
      },
      {
        id: 'sd3',
        level: 'senior',
        question: '¿Cómo implementarías un Rate Limiter distribuido para proteger una API?',
        answer: 'Estrategia: (1) **Algoritmo**: Leaky Bucket, Token Bucket o Sliding Window Counter. (2) **Almacenamiento en memoria**: Redis centralizado utilizando scripts Lua atómicos para incrementar contadores por IP o API Key de forma segura sin condiciones de carrera. (3) **Manejo de respuestas**: Si se supera el límite, devolver código HTTP 429 Too Many Requests con la cabecera `Retry-After: 60`.'
      }
    ]
  }
];

export function getInterviewTech(slug: string): InterviewTech | undefined {
  return INTERVIEW_TECHS.find(t => t.slug === slug);
}

type CompactTechSeed = [
  slug: string,
  name: string,
  emoji: string,
  category: string,
  jobsSlug: string,
  salariesSlug: string,
  juniorQ: string,
  juniorA: string,
  midQ: string,
  midA: string,
  seniorQ: string,
  seniorA: string
];

const EXTRA_TECH_SEEDS: CompactTechSeed[] = [
  ['vue', 'Vue.js', '💚', 'Frontend', 'vue', 'react', '¿Cuál es la diferencia entre reactive() y ref() en Vue 3?', 'ref() envuelve primitivos u objetos con acceso vía .value; reactive() crea un Proxy profundo solo para objetos.', '¿Cómo funciona Composition API frente a Options API?', 'Permite agrupar lógica por funcionalidad mediante composables reutilizables y mejora el tipado con TypeScript.', '¿Cómo optimizarías el rendimiento de una app Vue grande?', 'Mediante defineAsyncComponent, v-memo, shallowRef para estructuras inmutables grandes y code splitting por rutas.'],
  ['angular', 'Angular', '🅰️', 'Frontend', 'angular', 'typescript', '¿Qué diferencia hay entre ngOnInit y el constructor en Angular?', 'El constructor inyecta dependencias; ngOnInit se ejecuta tras inicializar los @Input y es el lugar idóneo para peticiones iniciales.', '¿Qué son las Signals en Angular moderno?', 'Primitivas reactivas de grano fino que notifican cambios sin depender únicamente de Zone.js para detección de cambios.', '¿Cómo diseñarías una arquitectura escalable con NgRx y Standalone Components?', 'Lazy loading por feature con Standalone Components, estado normalizado con EntityAdapter y efectos desacoplados.'],
  ['nextjs', 'Next.js', '▲', 'Fullstack', 'react', 'react', '¿Qué diferencia hay entre Server Components y Client Components?', 'Los Server Components se ejecutan solo en servidor sin enviar JS al cliente; los Client Components ("use client") permiten estado y eventos.', '¿Cómo funciona la revalidación ISR en App Router?', 'Con export const revalidate = N o revalidateTag/revalidatePath para regenerar rutas cacheadas bajo demanda.', '¿Cómo evitarías fugas de datos o waterfalls en Next.js App Router?', 'Paralelizando fetches con Promise.all, usando server-only y validando sesiones dentro de cada Server Action.'],
  ['nuxt', 'Nuxt', '💚', 'Fullstack', 'vue', 'react', '¿Qué ventajas aporta Nuxt frente a Vue SPA?', 'SSR/SSG nativo para SEO, enrutamiento basado en archivos, auto-imports y Nitro como motor de servidor universal.', '¿Cuál es la diferencia entre useFetch y $fetch en Nuxt 3?', 'useFetch evita doble petición entre SSR e hidratación en cliente; $fetch es para acciones imperativas del usuario.', '¿Cómo configurarías renderizado híbrido por rutas en Nuxt?', 'Usando routeRules en nuxt.config.ts para combinar prerender, swr e isr según la naturaleza de cada página.'],
  ['svelte', 'Svelte', '🧡', 'Frontend', 'frontend', 'javascript', '¿Por qué Svelte no usa Virtual DOM?', 'Svelte compila los componentes en tiempo de build a instrucciones imperativas que actualizan el DOM directamente.', '¿Qué introducen las Runes ($state, $derived) en Svelte 5?', 'Reactividad explícita y portable basada en señales utilizable también fuera de archivos .svelte.', '¿Cómo manejarías SSR y formularios progresivos en SvelteKit?', 'Mediante load functions en +page.server.ts y form actions con use:enhance para progresión sin JS.'],
  ['tailwind', 'Tailwind CSS', '🎨', 'Frontend', 'frontend', 'react', '¿Cómo elimina Tailwind CSS las clases no usadas en producción?', 'Analizando estáticamente los archivos configurados en content para generar únicamente las utilidades empleadas.', '¿Cómo evitarías duplicación excesiva de utilidades en componentes?', 'Extrayendo componentes UI reutilizables en React/Vue y usando @theme o tokens CSS para variantes.', '¿Cómo estructurarías un Design System multi-tema con Tailwind v4?', 'Definiendo variables semánticas en CSS y mapeándolas en @theme para soportar dark mode y temas de marca sin recompilar.'],
  ['graphql', 'GraphQL', '◈', 'Backend / API', 'backend', 'node', '¿Qué problema resuelve GraphQL frente a REST?', 'Elimina el over-fetching y under-fetching permitiendo al cliente pedir exactamente los campos necesarios en una sola petición.', '¿Qué es el problema N+1 en GraphQL y cómo se resuelve?', 'Ocurre al resolver relaciones anidadas consulta por consulta; se soluciona agrupando y cacheando con DataLoader.', '¿Cómo protegerías una API GraphQL en producción?', 'Limitando profundidad de queries, calculando complejidad, desactivando introspección y aplicando persisted queries.'],
  ['rest-api', 'REST APIs', '🔌', 'Backend / API', 'backend', 'node', '¿Qué diferencia hay entre PUT y PATCH?', 'PUT reemplaza completamente el recurso; PATCH aplica una actualización parcial.', '¿Cómo diseñarías paginación eficiente para millones de filas?', 'Paginación por cursor (keyset pagination) en lugar de OFFSET para mantener latencia constante.', '¿Cómo implementarías idempotencia en endpoints de pago o creación?', 'Exigiendo una cabecera Idempotency-Key almacenada en Redis/BD con lock transaccional antes de procesar.'],
  ['mongodb', 'MongoDB', '🍃', 'Bases de Datos', 'backend', 'node', '¿Cuándo elegirías MongoDB frente a una base relacional?', 'Cuando el esquema evoluciona rápido, los datos son jerárquicos/documentales y se requiere escalado horizontal por sharding.', '¿Cómo funcionan los índices compuestos y la regla ESR?', 'Equality, Sort, Range: ordenar las columnas del índice en ese orden maximiza el uso eficiente del índice.', '¿Cómo diseñarías una estrategia de sharding sin hotspots?', 'Eligiendo una shard key de alta cardinalidad y distribución uniforme (hashed o compuesta) alineada con las lecturas frecuentes.'],
  ['postgresql', 'PostgreSQL', '🐘', 'Bases de Datos', 'backend', 'python', '¿Qué es el MVCC en PostgreSQL?', 'Multi-Version Concurrency Control permite lecturas sin bloquear escrituras manteniendo versiones de tuplas visibles por transacción.', '¿Cuándo usarías índices GIN frente a B-Tree?', 'GIN para búsquedas dentro de JSONB, arrays o Full-Text Search; B-Tree para comparaciones e igualdades escalares.', '¿Cómo diagnosticarías y resolverías table bloat y autovacuum lento?', 'Inspeccionando pg_stat_user_tables, ajustando autovacuum_vacuum_cost_limit y particionando tablas históricas grandes.'],
  ['mysql', 'MySQL', '🐬', 'Bases de Datos', 'backend', 'php', '¿Qué diferencia hay entre InnoDB y MyISAM?', 'InnoDB soporta transacciones ACID, claves foráneas y bloqueo a nivel de fila; MyISAM carece de transacciones y bloquea tablas completas.', '¿Cómo funciona el Clustered Index en InnoDB?', 'Los datos de la tabla se almacenan físicamente ordenados dentro de las hojas del índice de la PRIMARY KEY.', '¿Cómo optimizarías una consulta lenta con EXPLAIN ANALYZE?', 'Eliminando filesort/full table scans mediante covering indexes, evitando funciones sobre columnas indexadas y revisando cardinalidad.'],
  ['redis', 'Redis', '🔴', 'Bases de Datos', 'backend', 'go', '¿Por qué Redis es tan rápido si es single-threaded en ejecución de comandos?', 'Opera completamente en memoria RAM y usa I/O multiplexing (epoll/kqueue) evitando cambios de contexto.', '¿Qué diferencia hay entre RDB y AOF para persistencia?', 'RDB genera snapshots periódicos compactos; AOF registra cada operación de escritura para mayor durabilidad.', '¿Cómo evitarías Cache Stampede al expirar una clave caliente?', 'Con probabilistic early expiration, locks distribuidos (SET NX) o stale-while-revalidate en aplicación.'],
  ['elasticsearch', 'Elasticsearch', '🔍', 'Data & Search', 'data', 'java', '¿Qué es un índice invertido en Elasticsearch?', 'Estructura que mapea cada término tokenizado a la lista de documentos donde aparece, acelerando búsquedas full-text.', '¿Cuál es la diferencia entre query context y filter context?', 'Query calcula relevancia (_score); filter solo evalúa booleano y se cachea automáticamente.', '¿Cómo dimensionarías shards primarios y réplicas para evitar oversharding?', 'Manteniendo shards entre 10GB y 50GB, usando ILM (Index Lifecycle Management) y ajustando refresh_interval para ingesta masiva.'],
  ['kafka', 'Apache Kafka', '📨', 'Streaming / Data', 'data', 'java', '¿Qué es un Topic y una Partition en Kafka?', 'Un Topic es un flujo lógico de eventos dividido en Partitions ordenadas e inmutables que permiten paralelismo.', '¿Cómo garantiza Kafka el orden de los mensajes?', 'El orden solo está garantizado dentro de una misma Partition, usando la misma partition key.', '¿Cómo diseñarías consumidores idempotentes con entrega at-least-once?', 'Procesando offsets de forma transaccional o deduplicando por event_id en el sink antes de confirmar el commit.'],
  ['rabbitmq', 'RabbitMQ', '🐇', 'Mensajería', 'backend', 'python', '¿Qué diferencia hay entre un Exchange Direct, Fanout y Topic?', 'Direct enruta por routing key exacta; Fanout difunde a todas las colas; Topic usa patrones con comodines (* y #).', '¿Para qué sirve una Dead Letter Exchange (DLX)?', 'Para capturar mensajes rechazados, expirados o que superaron reintentos sin perderlos.', '¿Cómo asegurarías alta disponibilidad de colas en RabbitMQ?', 'Usando Quorum Queues basadas en Raft y confirmaciones de publicador (publisher confirms) + ack manuales.'],
  ['terraform', 'Terraform', '🏗️', 'Cloud & DevOps', 'cloud', 'aws', '¿Qué es el archivo terraform.tfstate y por qué es crítico?', 'Mapea los recursos declarados en HCL con la infraestructura real en cloud; debe guardarse en backend remoto con locking.', '¿Para qué sirve terraform plan antes de apply?', 'Muestra el grafo de cambios previstos (crear, modificar, destruir) sin alterar infraestructura real.', '¿Cómo estructurarías módulos Terraform multi-entorno sin drift?', 'Separando state por entorno/cuenta, versionando módulos en registro privado y ejecutando drift detection en CI.'],
  ['ansible', 'Ansible', '⚙️', 'Cloud & DevOps', 'cloud', 'aws', '¿Por qué se dice que Ansible es agentless e idempotente?', 'Se conecta por SSH/WinRM sin agente previo y sus módulos garantizan el mismo estado final tras múltiples ejecuciones.', '¿Qué diferencia hay entre Roles y Playbooks?', 'Un Playbook orquesta tareas sobre hosts; un Role empaqueta tareas, variables, handlers y plantillas reutilizables.', '¿Cómo gestionarías secretos en playbooks de producción?', 'Cifrando variables sensibles con Ansible Vault o integrando lookups dinámicos contra HashiCorp Vault/AWS Secrets Manager.'],
  ['jenkins', 'Jenkins', '🤵', 'CI/CD', 'cloud', 'java', '¿Qué diferencia hay entre Declarative y Scripted Pipeline?', 'Declarative ofrece sintaxis estructurada y validación temprana; Scripted usa Groovy puro para lógica compleja.', '¿Cómo evitas ejecutar builds pesados en el controlador de Jenkins?', 'Configurando agentes efímeros (Docker/Kubernetes) y restringiendo ejecutores en el nodo master.', '¿Cómo implementarías Shared Libraries reutilizables en Jenkins?', 'Centralizando pasos comunes en un repositorio Git versionado cargado mediante @Library en cada Jenkinsfile.'],
  ['github-actions', 'GitHub Actions', '🐙', 'CI/CD', 'cloud', 'aws', '¿Qué diferencia hay entre un Workflow, un Job y un Step?', 'Un Workflow se dispara por eventos y contiene Jobs paralelos/secuenciales, compuestos por Steps que ejecutan comandos o actions.', '¿Cómo acelerarías pipelines de Node/Python en GitHub Actions?', 'Cacheando dependencias con actions/cache y usando matrices solo cuando sea necesario.', '¿Cómo autenticarías despliegues a AWS/GCP sin guardar claves estáticas?', 'Mediante OIDC (id-token: write) asumiendo un rol IAM temporal con confianza limitada al repositorio y rama.'],
  ['gitlab-ci', 'GitLab CI/CD', '🦊', 'CI/CD', 'cloud', 'docker', '¿Cómo funcionan los stages y needs en .gitlab-ci.yml?', 'stages define orden secuencial global; needs crea un grafo DAG para ejecutar jobs apenas terminen sus dependencias.', '¿Qué tipos de Runners existen en GitLab?', 'Shared, Group y Project runners con ejecutores como Docker, Kubernetes o Shell.', '¿Cómo implementarías Review Apps automáticas por Merge Request?', 'Usando entornos dinámicos (environment: review/$CI_COMMIT_REF_SLUG) con on_stop para destruir recursos al cerrar el MR.'],
  ['azure', 'Microsoft Azure', '☁️', 'Cloud', 'cloud', 'csharp', '¿Qué es un Resource Group en Azure?', 'Contenedor lógico que agrupa recursos relacionados para gestionar ciclo de vida, RBAC y costes.', '¿Qué diferencia hay entre Azure Functions y App Service?', 'Functions es serverless orientado a eventos; App Service ofrece PaaS continuo para APIs y webs.', '¿Cómo diseñarías conectividad híbrida segura entre on-premise y Azure?', 'Mediante ExpressRoute o VPN Gateway con Private Endpoints, Azure Firewall y Hub-and-Spoke VNet.'],
  ['gcp', 'Google Cloud (GCP)', '🌩️', 'Cloud', 'cloud', 'python', '¿Qué jerarquía de recursos usa GCP?', 'Organización > Carpetas > Proyectos > Recursos, heredando políticas IAM hacia abajo.', '¿Cuándo elegirías Cloud Run frente a GKE?', 'Cloud Run para contenedores stateless serverless con escala a cero; GKE para control completo de clúster Kubernetes.', '¿Cómo optimizarías costes y latencia en BigQuery?', 'Particionando por fecha, clusterizando columnas de filtrado frecuente y evitando SELECT * usando vistas materializadas.'],
  ['linux', 'Linux', '🐧', 'Sistemas / SRE', 'sistemas', 'aws', '¿Qué diferencia hay entre un hard link y un symbolic link?', 'El hard link apunta al mismo inode que el archivo original; el symlink es un puntero por ruta que se rompe si se mueve el destino.', '¿Cómo diagnosticarías un servidor con alto load average?', 'Revisando top/htop, vmstat, iostat y pidstat para distinguir cuello de botella de CPU, RAM o I/O de disco.', '¿Cómo funcionan cgroups y namespaces en el aislamiento de contenedores?', 'Namespaces aíslan visibilidad (PID, net, mount, user) y cgroups limitan/contabilizan uso de CPU, memoria e I/O.'],
  ['bash', 'Bash Scripting', '💻', 'Sistemas / DevOps', 'sistemas', 'python', '¿Qué hace set -euo pipefail al inicio de un script?', 'Aborta si falla un comando (-e), al usar variables no definidas (-u) o si falla cualquier parte de un pipe (-o pipefail).', '¿Por qué es importante entrecomillar variables ("$var")?', 'Previene word splitting y globbing inesperado cuando el valor contiene espacios o caracteres especiales.', '¿Cómo escribirías un script seguro que cree archivos temporales sin race conditions?', 'Usando mktemp y registrando limpieza garantizada con trap cleanup EXIT.'],
  ['go', 'Go (Golang)', '🐹', 'Backend', 'go', 'go', '¿Qué diferencia hay entre una goroutine y un hilo del sistema operativo?', 'Las goroutines son multiplexadas por el runtime de Go sobre hilos OS con stack inicial de pocos KB.', '¿Por qué Go prefiere composición mediante interfaces implícitas frente a herencia?', 'Reduce acoplamiento: cualquier tipo que implemente los métodos satisface la interfaz sin declararlo explícitamente.', '¿Cómo evitarías goroutine leaks en servidores HTTP de alto tráfico?', 'Propagando context.Context con timeouts/cancelación y cerrando canales correctamente con select.',],
  ['rust', 'Rust', '🦀', 'Sistemas / Backend', 'rust', 'rust', '¿Qué es el Ownership y el Borrowing en Rust?', 'Cada valor tiene un único dueño; las referencias prestadas (&T o &mut T) garantizan en compilación ausencia de data races y use-after-free.', '¿Qué diferencia hay entre String y &str?', 'String es dueño de memoria heap redimensionable; &str es un slice inmutable prestado.', '¿Cuándo usarías Arc<Mutex<T>> frente a canales (mpsc) en código concurrente?', 'Canales para paso de mensajes desacoplado; Arc<Mutex<T>> cuando múltiples tareas necesitan mutar estado compartido.',],
  ['ruby', 'Ruby', '💎', 'Backend', 'ruby', 'ruby', '¿Qué diferencia hay entre Symbol y String en Ruby?', 'Los Symbols (:nombre) son inmutables y únicos en memoria; los Strings son mutables y crean nuevas instancias.', '¿Qué es un Block, Proc y Lambda?', 'Closures reutilizables; Lambda valida aridad estricta y return retorna solo de la lambda, a diferencia de Proc.', '¿Cómo detectarías y resolverías problemas N+1 en Ruby on Rails?', 'Usando includes/preload/eager_load en ActiveRecord y monitorizando con Bullet o logs SQL.',],
  ['rails', 'Ruby on Rails', '🛤️', 'Backend', 'ruby', 'ruby', '¿Qué significa Convention over Configuration en Rails?', 'Prioriza convenciones estándar de nombres y estructura para minimizar configuración repetitiva.', '¿Qué diferencia hay entre ActiveRecord callbacks y Service Objects?', 'Los callbacks acoplan lógica al ciclo de vida del modelo; los Service Objects encapsulan flujos de negocio complejos.', '¿Cómo escalarías trabajos en segundo plano en Rails con Sidekiq?', 'Diseñando jobs idempotentes pasando IDs primitivos, usando colas por prioridad y limitando transacciones abiertas.',],
  ['scala', 'Scala', '🔴', 'Backend / Data', 'scala', 'scala', '¿Por qué Scala favorece la inmutabilidad (val sobre var)?', 'Facilita el razonamiento funcional, evita efectos secundarios y simplifica la concurrencia.', '¿Qué diferencia hay entre Future y ZIO/Cats Effect?', 'Future es eager y se ejecuta al crearse; ZIO/IO describe efectos puros lazy componibles y cancelables.', '¿Cómo optimizarías un job de Apache Spark escrito en Scala?', 'Evitando shuffles innecesarios, aplicando broadcast joins en tablas pequeñas y evitando UDFs no vectorizadas.',],
  ['kotlin', 'Kotlin', '🟣', 'Mobile / Backend', 'mobile', 'java', '¿Qué aporta la null-safety de Kotlin en tiempo de compilación?', 'Distingue tipos nulables (String?) de no nulables (String), reduciendo drásticamente NullPointerException.', '¿Qué son las Coroutines y los Dispatchers?', 'Hilos ligeros suspendibles; Dispatchers.IO, Default y Main determinan el pool de ejecución.', '¿Cómo estructurarías una app Android moderna con MVVM y StateFlow?', 'ViewModels exponiendo StateFlow inmutable, casos de uso en dominio y repositorios con Room/Retrofit.',],
  ['swift', 'Swift', '🍎', 'Mobile / iOS', 'mobile', 'swift', '¿Qué diferencia hay entre struct (value type) y class (reference type) en Swift?', 'struct se copia por valor evitando estado compartido accidental; class se pasa por referencia y usa ARC.', '¿Cómo previenes retain cycles en closures?', 'Capturando [weak self] o [unowned self] según el ciclo de vida del objeto.', '¿Cómo funciona Swift Concurrency (async/await y actors)?', 'Los actors protegen estado mutable aislando accesos de forma asíncrona para garantizar seguridad ante data races.',],
  ['flutter', 'Flutter', '📱', 'Mobile', 'mobile', 'flutter', '¿Qué diferencia hay entre StatelessWidget y StatefulWidget?', 'StatelessWidget es inmutable según sus parámetros; StatefulWidget mantiene un objeto State mutable entre rebuilds.', '¿Por qué Flutter logra 60/120 fps constantes?', 'Renderiza directamente sus propios widgets mediante Skia/Impeller sin puente JS ni widgets nativos intermedios.', '¿Cómo manejarías estado global y navegación profunda en apps Flutter grandes?', 'Con Riverpod/BLoC para estado reactivo testable y GoRouter para deep links declarativos.',],
  ['react-native', 'React Native', '⚛️', 'Mobile', 'mobile', 'react', '¿Qué mejora la Nueva Arquitectura (JSI / Fabric / TurboModules) frente al Bridge antiguo?', 'Permite comunicación síncrona directa C++/JS vía JSI sin serialización JSON asíncrona.', '¿Cómo optimizarías una lista larga de miles de elementos en React Native?', 'Usando FlashList o FlatList con getItemLayout, memoización y evitando re-renders innecesarios.', '¿Cómo depurarías fugas de memoria o caídas de FPS en iOS y Android?', 'Perfilando JS/UI thread con Flipper/DevTools, Xcode Instruments y Android Studio Profiler.',],
  ['laravel', 'Laravel', '🔺', 'Backend', 'php', 'php', '¿Qué es el Service Container en Laravel?', 'Contenedor de Inyección de Dependencias que resuelve e inyecta clases automáticamente en controladores y servicios.', '¿Cómo evitarías problemas N+1 en Eloquent?', 'Usando eager loading con with() y activando Model::preventLazyLoading() en desarrollo.', '¿Cómo diseñarías colas robustas con Laravel Horizon?', 'Separando colas por SLA, configurando retries/backoff exponencial y supervisando workers con Horizon.',],
  ['symfony', 'Symfony', '⚫', 'Backend', 'php', 'php', '¿Cómo funciona la Arquitectura de Bundles y DependencyInjection en Symfony?', 'Organiza funcionalidades en componentes desacoplados configurados vía servicios autowired y YAML/atributos PHP.', '¿Qué diferencia hay entre EventDispatcher y Messenger en Symfony?', 'EventDispatcher es síncrono en memoria; Messenger permite buses asíncronos con colas RabbitMQ/Redis.', '¿Cómo optimizarías Doctrine ORM en procesos batch?', 'Limpiando el EntityManager periódicamente (clear/flush por lotes), usando DTOs read-only o DBAL directo.',],
  ['spring-boot', 'Spring Boot', '🍃', 'Backend', 'java', 'java', '¿Qué hace la anotación @SpringBootApplication?', 'Combina @Configuration, @EnableAutoConfiguration y @ComponentScan para arrancar la app automáticamente.', '¿Cómo funciona @Transactional y cuál es su trampa más común?', 'Usa proxies AOP; las llamadas internas dentro de la misma clase (self-invocation) saltan el proxy y no abren transacción.', '¿Cómo prepararías un microservicio Spring Boot para producción?', 'Configurando Actuator (health/readiness), Micrometer/Prometheus, graceful shutdown y pools HikariCP dimensionados.',],
  ['nestjs', 'NestJS', '🦁', 'Backend', 'node', 'node', '¿Cómo organiza NestJS una aplicación?', 'Mediante Modules, Controllers, Providers/Services, Guards, Interceptors y Pipes inspirados en Angular.', '¿Qué diferencia hay entre Middleware, Guard e Interceptor?', 'Middleware corre antes del routing; Guard decide autorización; Interceptor envuelve ejecución antes/después del handler.', '¿Cómo escalarías microservicios NestJS con transporte híbrido?', 'Combinando HTTP para API Gateway y Redis/Kafka/NATS para eventos internos con validación DTO global.',],
  ['fastapi', 'FastAPI', '⚡', 'Backend / IA', 'python', 'python', '¿Por qué FastAPI es tan rápido en Python?', 'Se apoya en Starlette (ASGI asíncrono) y Pydantic v2 (validación en Rust) con tipado nativo.', '¿Cuándo NO debes usar async def en un endpoint de FastAPI?', 'Cuando ejecutas librerías síncronas bloqueantes (requests, drivers sync), ya que bloquean el event loop; usa def normal.', '¿Cómo gestionarías sesiones de BD y dependencias en FastAPI a escala?', 'Mediante Depends con generadores yield para abrir/cerrar sesiones limpiamente y pools asyncpg/SQLAlchemy async.',],
  ['django', 'Django', '🎸', 'Backend', 'python', 'python', '¿Qué patrón arquitectónico sigue Django (MTV)?', 'Model-Template-View: el Model gestiona datos/ORM, la View la lógica de petición y el Template la presentación.', '¿Cómo proteges un proyecto Django frente a CSRF y XSS?', 'Con CsrfViewMiddleware activo y el auto-escaping activado por defecto en plantillas Django.', '¿Cómo escalarías Django para soportar picos altos de tráfico?', 'Sirviendo con Gunicorn/Uvicorn + Nginx, cacheando vistas/queries en Redis y delegando tareas pesadas a Celery.',],
  ['flask', 'Flask', '🧪', 'Backend', 'python', 'python', '¿Por qué Flask se considera un microframework?', 'Incluye lo esencial (routing, Jinja2, Werkzeug) dejando ORM, autenticación y estructura a elección del equipo.', '¿Qué son los Blueprints en Flask?', 'Permiten modularizar rutas, plantillas y estáticos por dominio funcional en aplicaciones medianas o grandes.', '¿Cómo migrarías un servicio Flask síncrono hacia alta concurrencia?', 'Ejecutando con workers gevent/gunicorn o migrando endpoints I/O-bound a ASGI con Quart/FastAPI.',],
  ['pandas', 'Pandas', '🐼', 'Data & AI', 'data', 'python', '¿Por qué se recomienda vectorización sobre iterrows() en Pandas?', 'Las operaciones vectorizadas ejecutan bucles en C/NumPy siendo órdenes de magnitud más rápidas que iterar filas en Python.', '¿Cómo reducirías el consumo de memoria de un DataFrame grande?', 'Casteando enteros/floats a tipos más pequeños, usando category para strings repetidos y leyendo por chunks.', '¿Cuándo migrarías de Pandas a Polars o DuckDB?', 'Cuando los datasets superan la RAM disponible o se requiere ejecución multihilo/lazy out-of-core.',],
  ['pytorch', 'PyTorch', '🔥', 'IA / ML', 'data', 'python', '¿Qué es Autograd en PyTorch?', 'Motor de diferenciación automática que construye un grafo dinámico de cómputo para calcular gradientes con .backward().', '¿Por qué usar model.eval() y torch.no_grad() en inferencia?', 'Desactiva Dropout/BatchNorm en modo entrenamiento y evita almacenar grafos de gradientes ahorrando VRAM.', '¿Cómo acelerarías el entrenamiento de modelos grandes en múltiples GPUs?', 'Usando DistributedDataParallel (DDP), precisión mixta automática (AMP fp16/bf16) y DataLoader con pin_memory.',],
  ['tensorflow', 'TensorFlow', '🧠', 'IA / ML', 'data', 'python', '¿Qué diferencia hay entre Keras Sequential, Functional API y Subclassing?', 'Sequential es lineal; Functional permite grafos DAG multi-input/output; Subclassing da control total imperativo.', '¿Para qué sirve @tf.function?', 'Compila funciones Python en grafos estáticos de TensorFlow (AutoGraph) para acelerar ejecución y exportación.', '¿Cómo desplegarías modelos TensorFlow en producción con baja latencia?', 'Exportando a SavedModel y sirviendo mediante TensorFlow Serving o convirtiendo a TensorRT/ONNX.',],
  ['langchain', 'LangChain / LLMs', '🦜', 'IA Generativa', 'data', 'python', '¿Qué es RAG (Retrieval-Augmented Generation)?', 'Patrón que recupera fragmentos relevantes desde una base vectorial para inyectarlos como contexto en el prompt del LLM.', '¿Cómo evitarías alucinaciones en un asistente empresarial?', 'Exigiendo citas de fuente del contexto recuperado, usando baja temperatura y evaluando faithfulness automáticamente.', '¿Cómo diseñarías un agente en producción con observabilidad y control de costes?', 'Con trazado de pasos/tokens, caché semántica, routing entre modelos pequeños/grandes y guardrails de salida.',],
  ['spark', 'Apache Spark', '✨', 'Big Data', 'data', 'python', '¿Qué diferencia hay entre Transformations (lazy) y Actions en Spark?', 'Las Transformations construyen el plan lógico DAG sin ejecutarse hasta que una Action (collect, count, write) dispara el job.', '¿Qué causa Data Skew y cómo lo mitigas?', 'Claves muy desbalanceadas concentran datos en pocas particiones; se mitiga con salting o AQE (Adaptive Query Execution).', '¿Cómo elegirías entre repartition() y coalesce()?', 'coalesce reduce particiones sin shuffle completo; repartition redistribuye uniformemente haciendo shuffle.',],
  ['dbt', 'dbt (Data Build Tool)', '🧱', 'Data Engineering', 'data', 'sql', '¿Qué papel cumple dbt en una arquitectura ELT moderna?', 'Gestiona la T (Transformación) dentro del Data Warehouse usando SQL modular, tests de calidad y documentación automática.', '¿Qué diferencia hay entre una materialización view, table e incremental?', 'view es consulta al vuelo; table reconstruye todo; incremental procesa solo registros nuevos/modificados.', '¿Cómo garantizarías calidad de datos en pipelines críticos con dbt?', 'Combinando schema tests (unique, not_null, relationships), freshness checks y contratos de modelos.',],
  ['airflow', 'Apache Airflow', '🌬️', 'Data Engineering', 'data', 'python', '¿Qué es un DAG en Airflow?', 'Directed Acyclic Graph que define tareas y dependencias sin ciclos para orquestar flujos de datos programados.', '¿Por qué es clave la idempotencia en tareas de Airflow?', 'Permite reejecutar backfills o reintentos de cualquier execution_date sin duplicar datos en destino.', '¿Cómo escalarías Airflow si tienes cientos de DAGs pesados?', 'Delegando el cómputo pesado fuera del worker (KubernetesPodOperator, Spark, BigQuery) y usando Celery/KubernetesExecutor.',],
];

const EXTRA_INTERVIEW_TECHS: InterviewTech[] = EXTRA_TECH_SEEDS.map(
  ([slug, name, emoji, category, jobsSlug, salariesSlug, jQ, jA, mQ, mA, sQ, sA]) => ({
    slug,
    name,
    emoji,
    category,
    description: `Preguntas reales de entrevista técnica para ${name} (${category}) desde nivel Junior hasta Senior.`,
    jobsSlug,
    salariesSlug,
    questions: [
      { id: `${slug}-1`, level: 'junior', question: jQ, answer: jA },
      { id: `${slug}-2`, level: 'mid', question: mQ, answer: mA },
      { id: `${slug}-3`, level: 'senior', question: sQ, answer: sA },
    ],
  })
);

for (const item of EXTRA_INTERVIEW_TECHS) {
  if (!INTERVIEW_TECHS.some((t) => t.slug === item.slug)) {
    INTERVIEW_TECHS.push(item);
  }
}

export const ALL_INTERVIEW_TECHS: InterviewTech[] = INTERVIEW_TECHS;

export function getExpandedInterviewTech(slug: string): InterviewTech | undefined {
  return INTERVIEW_TECHS.find((t) => t.slug === slug);
}
