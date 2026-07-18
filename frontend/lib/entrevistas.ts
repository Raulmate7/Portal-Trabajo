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
];

export function getInterviewTech(slug: string): InterviewTech | undefined {
  return INTERVIEW_TECHS.find(t => t.slug === slug);
}
