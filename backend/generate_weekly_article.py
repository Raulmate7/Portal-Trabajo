import os
import sys
import re
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

# Asegurar path de imports locales para reutilizar psycopg2 shim
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import psycopg2

# Lista rotativa de 30 temas de alto tráfico de SEO informativo para el sector IT
TOPICS = [
    {
        "slug": "como-preparar-entrevista-system-design",
        "title": "Cómo preparar una entrevista de System Design en 2026: Guía completa",
        "excerpt": "La entrevista de diseño de sistemas es el mayor filtro para posiciones Senior y Staff. Aprende a estructurar tus respuestas, diagramar arquitecturas escalables y responder preguntas de nivel maestro.",
        "keywords": ["system design", "diseño de sistemas", "entrevista técnica", "arquitectura de software", "empleo senior IT"],
        "prompt_outline": "Explica la estructura de una entrevista de System Design típica. Detalla los 4 pasos clave para responder (Entender requisitos, Diseño a alto nivel, Diseño detallado, Identificación de cuellos de botella). Habla de estimaciones de capacidad (QPS, almacenamiento), patrones de diseño comunes (Load Balancer, Caching, Sharding de base de datos) y pon un ejemplo paso a paso de cómo diseñar una aplicación a gran escala como Twitter o Netflix."
    },
    {
        "slug": "docker-kubernetes-guia-desarrolladores",
        "title": "Guía completa de Docker y Kubernetes para desarrolladores de software",
        "excerpt": "Domina la contenedorización y la orquestación. Aprende la diferencia entre contenedores y VMs, a escribir Dockerfiles eficientes y a entender pods, deployments y servicios en Kubernetes.",
        "keywords": ["docker", "kubernetes", "contenedorizacion", "devops para desarrolladores", "orquestacion de contenedores"],
        "prompt_outline": "Define qué es la contenedorización y por qué es superior a las máquinas virtuales clásicas. Explica los comandos fundamentales de Docker y cómo escribir un Dockerfile optimizado (multi-stage builds). Explica la arquitectura básica de Kubernetes (Node, Pod, Deployment, Service, Ingress) y cómo crear un pipeline local de desarrollo usando Minikube."
    },
    {
        "slug": "typescript-avanzado-tipos-genericos",
        "title": "TypeScript avanzado: Dominando tipos condicionales, genéricos y Mapped Types",
        "excerpt": "Lleva tus habilidades de TypeScript al siguiente nivel. Descubre cómo construir tipos robustos, seguros y reutilizables mediante utilidades avanzadas del compilador.",
        "keywords": ["typescript avanzado", "tipos condicionales", "mapped types", "genericos typescript", "tipado seguro"],
        "prompt_outline": "Habla de por qué TypeScript es vital en el desarrollo empresarial moderno. Detalla el uso de Genéricos complejos. Explica los tipos condicionales ('T extends U ? X : Y'), Mapped Types y Utility Types predefinidos como Pick, Omit, Record, y ReturnType. Muestra ejemplos prácticos reales de su uso para asegurar la tipificación de APIs y selectores."
    },
    {
        "slug": "convertirse-en-prompt-engineer-ia",
        "title": "Cómo convertirse en Prompt Engineer en 2026: Técnicas avanzadas y salidas",
        "excerpt": "La ingeniería de prompts ha pasado de ser una curiosidad a una habilidad técnica cotizada. Conoce las técnicas de prompting avanzadas y cómo aplicarlas al desarrollo.",
        "keywords": ["prompt engineering", "ingenieria de prompts", "inteligencia artificial", "desarrollo con IA", "salidas profesionales IA"],
        "prompt_outline": "Define la ingeniería de prompts y su importancia en la integración de LLMs. Explica técnicas como Few-Shot Prompting, Chain of Thought (CoT), ReAct, y prompt estructurado (JSON outputs). Muestra cómo los desarrolladores usan prompts sistemáticos para crear asistentes autónomos de software."
    },
    {
        "slug": "git-github-buenas-practicas-equipos",
        "title": "Guía de Git y GitHub para trabajar en equipos de desarrollo de alto rendimiento",
        "excerpt": "El control de versiones es el pilar de la colaboración. Descubre flujos de trabajo profesionales como Git Flow, Trunk-Based Development y buenas prácticas para Pull Requests.",
        "keywords": ["git flow", "github", "trunk-based development", "pull requests", "control de versiones profesional"],
        "prompt_outline": "Explica la diferencia entre Git Flow y Trunk-Based Development, indicando las ventajas de cada uno. Detalla cómo estructurar commits usando Conventional Commits. Explica cómo realizar revisiones de código de alto impacto mediante Pull Requests y el uso de GitHub Actions para CI/CD automático."
    },
    {
        "slug": "fastapi-vs-nestjs-elegir-backend",
        "title": "FastAPI vs NestJS: Comparativa técnica exhaustiva para APIs backend",
        "excerpt": "Comparamos los dos frameworks de backend de mayor crecimiento en Node.js y Python. Analizamos rendimiento, curva de aprendizaje y arquitectura en producción.",
        "keywords": ["fastapi", "nestjs", "comparativa backend", "apis backend", "arquitectura backend"],
        "prompt_outline": "Compara FastAPI (Python) y NestJS (TypeScript/Node.js). Analiza la velocidad de desarrollo, el rendimiento en crudo (asincronía, event loop vs hilos), la arquitectura (NestJS basada en Angular/modular vs la simplicidad y pydantic de FastAPI), y cuándo elegir cada uno para un proyecto de producción."
    },
    {
        "slug": "seo-nextjs-vercel-optimizacion-web",
        "title": "Cómo optimizar el SEO de una aplicación Next.js alojada en Vercel",
        "excerpt": "Aprende a exprimir el SEO técnico con Next.js. Domina la diferencia entre SSR, SSG e ISR, la optimización de metadatos dinámicos y la mejora de los Core Web Vitals.",
        "keywords": ["seo nextjs", "vercel seo", "core web vitals nextjs", "isr nextjs", "optimizar rendimiento seo"],
        "prompt_outline": "Describe las bondades de Next.js para SEO en comparación con SPAs clásicas de React. Explica en detalle los modos de renderizado (SSG, SSR, ISR) y cómo afectan al rastreo de bots. Habla de la optimización de fuentes y de imágenes con next/image, metadatos y sitemaps dinámicos."
    },
    {
        "slug": "negociar-aumento-sueldo-programador",
        "title": "Cómo negociar un aumento de sueldo como programador en tu empresa actual",
        "excerpt": "Pedir una subida salarial requiere preparación, datos de mercado y tacto. Descubre la estrategia basada en aportación de valor y la preparación de una reunión con éxito.",
        "keywords": ["negociar aumento sueldo", "salario programador", "negociacion laboral IT", "carrera programacion", "subida salarial"],
        "prompt_outline": "Explica por qué y cómo prepararse antes de pedir un aumento (no pedir por necesidades personales, sino por aportación de valor técnico/comercial). Enseña a recopilar métricas de tu impacto (proyectos completados, optimizaciones de coste, etc.). Muestra cómo estructurar la conversación con tu mánager paso a paso."
    },
    {
        "slug": "pruebas-unitarias-calidad-jest-testing",
        "title": "Cómo escribir pruebas unitarias de calidad con Jest y Testing Library",
        "excerpt": "El software sin pruebas es software roto en potencia. Aprende a escribir tests unitarios limpios, mantenibles y que garanticen la estabilidad de tu frontend.",
        "keywords": ["jest", "testing library", "pruebas unitarias frontend", "react testing", "codigo de calidad"],
        "prompt_outline": "Explica por qué escribir pruebas reduce la deuda técnica y mejora la mantenibilidad. Enseña la diferencia entre Unit Testing, Integration Testing y End-to-End. Muestra ejemplos reales de testeo de componentes React con Jest y React Testing Library simulando eventos y llamadas a APIs."
    },
    {
        "slug": "mejores-lenguajes-programacion-aprender",
        "title": "Los mejores lenguajes de programación para aprender en 2026 y por qué",
        "excerpt": "El panorama de lenguajes está cambiando. Comparamos la demanda de JavaScript/TypeScript, Python, Java, Rust y Go en el mercado de la tecnología.",
        "keywords": ["lenguajes de programación", "aprender a programar", "demanda empleo IT", "python vs rust", "futuro programacion"],
        "prompt_outline": "Analiza las tendencias de demanda en el mercado español. Describe el liderazgo de JavaScript/TypeScript en Web, Python en IA/Datos, Java en banca y enterprise, Go en infraestructura/microservicios, y la irrupción de Rust para la programación de sistemas eficientes."
    },
    {
        "slug": "bases-datos-relacionales-vs-nosql",
        "title": "Bases de datos relacionales vs NoSQL: Cuándo usar PostgreSQL o MongoDB",
        "excerpt": "Elegir el almacenamiento de datos correcto define el éxito del backend. Comparamos el modelo tabular relacional de SQL frente al modelo documental flexible de NoSQL.",
        "keywords": ["bases de datos", "postgresql vs mongodb", "sql vs nosql", "modelado de datos", "arquitectura backend"],
        "prompt_outline": "Compara las bases de datos relacionales (SQL) representadas por PostgreSQL con las no relacionales (NoSQL) documentales de MongoDB. Habla del teorema CAP, transacciones ACID, modelado de relaciones frente a documentos anidados y escalabilidad horizontal vs vertical."
    },
    {
        "slug": "preparar-certificacion-aws-solutions-architect",
        "title": "Cómo prepararse la certificación AWS Solutions Architect Associate en 2026",
        "excerpt": "Obtener una certificación de AWS abre las puertas de las mejores empresas tecnológicas. Te ofrecemos un plan de estudio guiado, recursos de estudio y consejos para aprobar.",
        "keywords": ["certificacion aws", "solutions architect associate", "preparar examen aws", "computacion cloud", "empleo devops"],
        "prompt_outline": "Presenta el examen SAA-C03 de AWS. Desglosa los dominios principales a estudiar (Arquitecturas resilientes, alto rendimiento, seguridad y optimización de costes). Da consejos sobre simulacros de examen y laboratorios prácticos recomendados."
    },
    {
        "slug": "impacto-inteligencia-artificial-empleo-tech",
        "title": "El impacto real de la Inteligencia Artificial en el empleo de desarrollo de software",
        "excerpt": "¿Reemplazará la IA a los programadores? Analizamos cómo la IA generativa está redefiniendo el rol del desarrollador convirtiéndolo en un multiplicador de productividad.",
        "keywords": ["inteligencia artificial empleo", "futuro del desarrollo de software", "copilot programacion", "productividad desarrollador", "habilidades tech"],
        "prompt_outline": "Analiza los temores del sector sobre la automatización. Explica cómo la IA (Github Copilot, ChatGPT, agentes) funciona como una herramienta de aumento cognitivo. Describe los nuevos perfiles híbridos y por qué los fundamentos de la computación son más vitales que nunca."
    },
    {
        "slug": "clean-code-principios-solid-desarrolladores",
        "title": "Clean Code y principios SOLID: Escribiendo código mantenible y escalable",
        "excerpt": "Escribir código que funciona no es suficiente; debe ser legible y fácil de cambiar. Domina los principios del código limpio y las 5 reglas de SOLID.",
        "keywords": ["clean code", "principios solid", "codigo limpio", "buenas practicas desarrollo", "refactorizacion"],
        "prompt_outline": "Define el concepto de Clean Code y deuda técnica. Desglosa cada una de las 5 letras de los principios SOLID con explicaciones teóricas y ejemplos cortos de refactorización. Da consejos sobre nomenclatura, funciones pequeñas y comentarios inútiles."
    },
    {
        "slug": "arquitectura-hexagonal-domain-driven-design",
        "title": "Guía de Arquitectura Hexagonal y Domain-Driven Design (DDD)",
        "excerpt": "Aprende a desacoplar el núcleo de tu negocio de los detalles técnicos. Entiende el patrón de Puertos y Adaptadores y cómo estructurar tus proyectos.",
        "keywords": ["arquitectura hexagonal", "domain driven design", "ddd", "puertos y adaptadores", "arquitectura limpia"],
        "prompt_outline": "Explica la motivación de separar la lógica de negocio de dependencias externas (BD, APIs, frameworks). Detalla la arquitectura hexagonal (Domain, Application, Infrastructure) y los conceptos clave de DDD (Ubiquitous Language, Bounded Contexts, Aggregates, Value Objects)."
    },
    {
        "slug": "rendimiento-web-optimizacion-core-web-vitals",
        "title": "Cómo optimizar el rendimiento web y los Core Web Vitals en producción",
        "excerpt": "La velocidad web impacta directamente en el SEO y la conversión. Domina LCP, INP y CLS con técnicas avanzadas de optimización de imágenes y CSS.",
        "keywords": ["core web vitals", "rendimiento web", "lcp", "inp", "cls", "optimizar velocidad de carga"],
        "prompt_outline": "Presenta las tres métricas Core Web Vitals (Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift). Explica paso a paso cómo medir y optimizar cada una mediante lazy loading, layouts fijos, optimización de fuentes y estrategias de renderizado."
    },
    {
        "slug": "seguridad-desarrollo-web-owasp-top-10",
        "title": "Seguridad en desarrollo web: Guía práctica para mitigar el OWASP Top 10",
        "excerpt": "Asegurar las aplicaciones es responsabilidad de todo el equipo de ingeniería. Descubre los riesgos de seguridad más comunes y cómo defender tus APIs.",
        "keywords": ["seguridad web", "owasp top 10", "ciberseguridad", "proteccion apis", "hacking etico"],
        "prompt_outline": "Define qué es OWASP y por qué su reporte es el estándar de seguridad. Analiza las principales vulnerabilidades (Inyección de código, autenticación rota, exposición de datos sensibles, XSS). Ofrece pautas prácticas en código para mitigarlas."
    },
    {
        "slug": "microservicios-patrones-diseno-comunicacion",
        "title": "Microservicios: Patrones de diseño de comunicación y resiliencia",
        "excerpt": "Pasar de un monolito a microservicios introduce complejidad de red. Conoce patrones como API Gateway, Circuit Breaker y Event Sourcing.",
        "keywords": ["microservicios", "patrones de diseño", "api gateway", "circuit breaker", "comunicacion asincrona"],
        "prompt_outline": "Habla de las ventajas y desventajas del patrón microservicios frente a monolitos. Detalla patrones clave de comunicación sincrónica/asincrónica (REST vs colas de mensajería como RabbitMQ/Kafka). Explica la resiliencia usando Circuit Breaker e idempotencia."
    },
    {
        "slug": "python-avanzado-generadores-decoradores",
        "title": "Python avanzado: Dominando generadores, decoradores y concurrencia",
        "excerpt": "Escribe un Python más eficiente y idiomático. Domina el uso de yield, metaclases y las diferencias entre asyncio, threading y multiprocessing.",
        "keywords": ["python avanzado", "decoradores python", "concurrencia python", "asyncio", "generadores python"],
        "prompt_outline": "Explica la memoria y optimización usando generadores (yield). Detalla el patrón decorador y cómo implementarlo paso a paso. Analiza las tres formas de concurrencia en Python (hilos, multiproceso con GIL y bucle de eventos con asyncio)."
    },
    {
        "slug": "ci-cd-github-actions-guias-practicas",
        "title": "Guía completa de CI/CD: Automatizando despliegues con GitHub Actions",
        "excerpt": "El despliegue manual ha muerto. Aprende a configurar pipelines de integración y entrega continua para subir tu código a producción automáticamente.",
        "keywords": ["ci-cd", "github actions", "automatizacion despliegue", "devops basico", "pipelines de integracion"],
        "prompt_outline": "Define el concepto y beneficios de Integración Continua (CI) y Despliegue Continuo (CD). Explica la estructura de un archivo workflow YAML de GitHub Actions. Muestra un pipeline práctico que ejecuta pruebas unitarias, linting y realiza el despliegue automático."
    }
]

def select_next_topic(conn):
    """
    Compara la lista predefinida de temas con los posts publicados en la base de datos
    y devuelve el primer tema no publicado.
    """
    cur = conn.cursor()
    cur.execute("SELECT slug FROM blog_posts")
    published_slugs = {row[0] for row in cur.fetchall()}
    cur.close()

    print(f"📊 Encontrados {len(published_slugs)} posts de blog en la base de datos.")
    
    for topic in TOPICS:
        if topic["slug"] not in published_slugs:
            return topic
            
    return None

def generate_article_with_gemini(api_key, topic):
    """
    Realiza una petición HTTP a la API de Gemini para generar un artículo estructurado
    de más de 2000 palabras en formato JSON mediante Structured Outputs.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}"
    
    prompt = f"""
Escribe un artículo de blog técnico completo, exhaustivo y de nivel profesional en español de más de 2000 palabras sobre el tema: "{topic['title']}".

Guía técnica a cubrir obligatoriamente:
{topic['prompt_outline']}

Instrucciones de formato e interlinking para maximizar el SEO y AdSense (E-E-A-T):
1. El artículo debe estar escrito en formato Markdown (usa encabezados H2, H3, negritas, listas y bloques de código con sintaxis resaltada de forma muy detallada).
2. Debe ser extremadamente largo, detallado y exhaustivo, explicando los conceptos técnicos y de carrera a fondo, proporcionando ejemplos de código funcionales y detallados de producción.
3. El tono debe ser profesional, con autoridad técnica, preciso y didáctico (marca personal: Raúl M., experto en ingeniería de software).
4. Incluye comparaciones claras (una tabla en formato Markdown) o un diagrama Mermaid para ilustrar conceptos de infraestructura o arquitectura.
5. Integra de forma natural y orgánica enlaces de interlinking html exactos para el usuario:
   - Para calcular o estimar salarios de perfiles IT, enlaza a: [/salarios](/salarios) (enlace clickable con texto descriptivo como "Calculadora de Salarios IT").
   - Para buscar ofertas de empleo o ver vacantes IT activas, enlaza a: [/trabajos/informatica-tecnologia](/trabajos/informatica-tecnologia) (enlace clickable con texto descriptivo como "Buscador de Empleo IT").
6. No utilices rodeos vacíos ni introducciones del estilo 'En este artículo vamos a hablar...'. Ve al grano con contenido de altísimo valor que responda a las intenciones de búsqueda de los programadores.
"""

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "title": {
                        "type": "STRING",
                        "description": "El título final optimizado para SEO del post de blog."
                    },
                    "excerpt": {
                        "type": "STRING",
                        "description": "Un resumen/entradilla de unas 2-3 frases del post (meta description)."
                    },
                    "content": {
                        "type": "STRING",
                        "description": "El contenido íntegro del post de blog en Markdown, de extensión superior a 2000 palabras."
                    }
                },
                "required": ["title", "excerpt", "content"]
            }
        }
    }

    print(f"🧠 Llamando a la API de Gemini (gemini-1.5-pro) para generar '{topic['title']}'...")
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=120)
    
    if response.status_code != 200:
        raise ValueError(f"Gemini API returned status {response.status_code}: {response.text}")
        
    res_json = response.json()
    
    try:
        text_response = res_json['candidates'][0]['content']['parts'][0]['text']
        parsed_article = json.loads(text_response)
        return parsed_article
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise ValueError(f"Error parseando la respuesta estructurada de Gemini: {e}. Respuesta completa: {res_json}")

def run_weekly_generator():
    load_dotenv()
    print("🤖 Iniciando Generador Semanal Inteligente de Artículos (Gemini + SEO)...")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: No se encontró GEMINI_API_KEY en las variables de entorno.")
        return
        
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Error: No se encontró DATABASE_URL.")
        return

    try:
        conn = psycopg2.connect(db_url)
        
        # --- Control de frecuencia (máximo 1 artículo cada 7 días) ---
        cur = conn.cursor()
        cur.execute("SELECT date FROM blog_posts ORDER BY date DESC LIMIT 1")
        row = cur.fetchone()
        cur.close()
        
        if row:
            last_date_val = row[0]
            if isinstance(last_date_val, str):
                last_date = datetime.strptime(last_date_val.split(' ')[0], "%Y-%m-%d")
            else:
                last_date = datetime.combine(last_date_val, datetime.min.time()) if hasattr(last_date_val, 'year') else datetime.now()
                
            days_since_last = (datetime.now() - last_date).days
            if days_since_last < 7:
                print(f"⏳ El último post fue publicado el {last_date.strftime('%Y-%m-%d')} (hace {days_since_last} días).")
                print("⏭️ Aún no han pasado 7 días desde la última publicación. Omitiendo generación.")
                conn.close()
                return
        # --------------------------------------------------------------
        
        # 1. Seleccionar el próximo tema a redactar
        topic = select_next_topic(conn)
        
        if not topic:
            print("🎉 ¡Todos los temas de la rotación ya han sido redactados e insertados! Finalizando proceso.")
            conn.close()
            return
            
        print(f"📌 Próximo tema seleccionado: '{topic['title']}' (Slug: {topic['slug']})")
        
        # 2. Generar el artículo llamando a Gemini
        article = generate_article_with_gemini(api_key, topic)
        
        # Validar la extensión del artículo
        word_count = len(article['content'].split())
        print(f"📊 Artículo generado con éxito. Extensión: {word_count} palabras.")
        
        # 3. Guardar el post en la base de datos
        cur = conn.cursor()
        date_str = datetime.now().strftime("%Y-%m-%d")
        
        # Insertar artículo
        print(f"✍️ Insertando artículo en la tabla 'blog_posts'...")
        cur.execute("""
            INSERT INTO blog_posts (slug, title, excerpt, content, date, author, is_evergreen)
            VALUES (%s, %s, %s, %s, %s, 'Equipo Portal Empleo', TRUE)
        """, (topic['slug'], article['title'], article['excerpt'], article['content'], date_str))
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"✅ ¡Articulo '{article['title']}' publicado y guardado exitosamente en base de datos!")
        
    except Exception as e:
        print(f"❌ Error durante la generación semanal del artículo: {e}")

if __name__ == "__main__":
    run_weekly_generator()
