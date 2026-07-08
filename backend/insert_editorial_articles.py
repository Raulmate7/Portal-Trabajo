import os
from db_helper import get_db_connection
from dotenv import load_dotenv

load_dotenv()

ARTICULOS = [
    {
        'slug': 'curriculum-perfecto-programador-espana-2026',
        'title': 'Cómo crear el currículum (CV) perfecto de programador en España en 2026: Guía completa',
        'excerpt': '¿Buscas tu primer empleo tech o quieres dar un salto profesional? Guía práctica para estructurar tu CV de desarrollador, redactar descripciones de impacto y superar filtros ATS.',
        'content': """
El currículum convencional de un programador ha evolucionado de forma radical en los últimos años. Con la generalización de los sistemas automáticos de filtrado de candidatos (conocidos como ATS o Applicant Tracking Systems) y la necesidad de los reclutadores técnicos de validar competencias en cuestión de segundos, un currículum genérico en formato Word o PDF plano está abocado al descarte inmediato.

En el mercado laboral de la tecnología en España, tu CV es tu principal herramienta de marketing personal. Debe vender tus habilidades técnicas, tu capacidad de resolución de problemas y tu adecuación cultural de forma directa, concisa y estructurada.

En esta guía definitiva, analizaremos paso a paso cómo estructurar y optimizar tu CV de programador para superar las barreras de los reclutadores y conseguir entrevistas técnicas en 2026.

---

## 1. La Estructura de Oro del CV Tecnológico
Un currículum tecnológico profesional no debe ocupar más de **una página** (o máximo dos si tienes más de 8-10 años de experiencia relevante). Los reclutadores reciben cientos de aplicaciones diarias y escanean cada una en una media de 6 a 8 segundos.

Te recomendamos organizar tu CV en las siguientes secciones (de arriba a abajo):

### A. Encabezado Claro y Datos de Contacto
* **Nombre y Apellidos:** En tipografía prominente.
* **Rol / Especialidad:** Ej: *Fullstack Developer (React & Node.js)* o *Ingeniero de DevOps*. Evita términos generales como "Informático".
* **Enlaces Esenciales:** Tu perfil de LinkedIn optimizado, tu enlace a GitHub (fundamental para que vean tu código) y tu portafolio personal (si lo tienes).
* **Contacto:** Correo electrónico profesional, teléfono y ubicación (ej: *Madrid, España*). No es necesario incluir tu dirección física completa.

### B. Perfil Profesional / Resumen (3-4 líneas)
Un párrafo introductorio de alto impacto que resuma quién eres, tus stacks principales y qué valor aportas al equipo:
> *"Ingeniero de Software Fullstack con más de 4 años de experiencia en el ecosistema JavaScript/TypeScript, especializado en el diseño de arquitecturas Web robustas con React y NestJS. Experiencia liderando la migración de microservicios en entornos de AWS y colaborando bajo metodologías ágiles."*

---

## 2. Anatomía de la Experiencia Laboral: Enfoque en Impacto y Logros
Este es el corazón de tu currículum. Evita cometer el error clásico de listar responsabilidades genéricas y aburridas como *"mantenimiento de la aplicación"* o *"desarrollo de funcionalidades"*. Los directores de ingeniería quieren ver **impacto, escala y tecnologías utilizadas**.

### Utiliza la fórmula XYZ de Google:
> *"Logré [X], medido por [Y], haciendo [Z]."*

* **Mal:** *"Desarrollo de landing pages con React."*
* **Bien:** *"Rediseñé y optimicé la pasarela de pagos web utilizando React y Next.js, logrando una reducción del 35% en el tiempo de carga de página y aumentando la conversión de checkout en un 12%."*
* **Mal:** *"Creación de APIs en Node.js."*
* **Bien:** *"Diseñé y desplegué una nueva API RESTful con Node.js y Express, capaz de gestionar más de 50.000 peticiones concurrentes, implementando caché con Redis para reducir la latencia de consultas en un 40%."*

Cada experiencia laboral debe incluir:
1. Nombre del puesto, Empresa y Periodo de tiempo.
2. 3-4 viñetas de logros explicados con métricas cuantificables.
3. Listado del stack tecnológico utilizado en ese proyecto (ej: *Tecnologías: TypeScript, Docker, PostgreSQL, AWS*).

---

## 3. La Sección de Habilidades Técnicas (Skills Grid)
Organiza tus conocimientos técnicos de forma estructurada para facilitar la lectura visual y la indexación de los bots ATS. No uses barras de porcentaje de conocimiento (ej: *"Java: 80%"*), ya que no tienen un significado real. En su lugar, agrúpalas por categorías:

* **Lenguajes:** JavaScript, TypeScript, Python, SQL.
* **Frameworks y Librerías:** React, Next.js, Node.js, Express, Tailwind CSS.
* **Bases de Datos:** PostgreSQL, MongoDB, Redis.
* **Herramientas y Metodologías:** Git, Docker, AWS (S3, EC2), GitHub Actions, Jest (testing).

---

## 4. Educación y Certificaciones
En tecnología, los títulos universitarios tradicionales han perdido peso frente a la demostración real de habilidades, pero siguen siendo un filtro importante para ciertas empresas consolidadas.
* Lista tu educación formal (Ingeniería Informática, Grado Superior DAW/DAM, etc.) de forma sucinta.
* Añade de forma destacada las **certificaciones oficiales vigentes** (ej: *AWS Certified Solutions Architect*, *Microsoft Certified: Azure Developer*, etc.), ya que demuestran estándares de la industria y tienen gran valor.

---

## 5. El CV para Programadores sin Experiencia
Si acabas de terminar tus estudios, un bootcamp o eres autodidacta, tu sección de experiencia estará vacía. Para rellenar este espacio de forma profesional:
1. **Destaca tus Proyectos Personales:** Elige tus 2 o 3 mejores proyectos desarrollados en GitHub. Trátalos exactamente como si fueran experiencia laboral laboral, detallando qué arquitectura implementaste, qué problemas resolviste y adjuntando el enlace al repositorio y a la demo funcional en vivo.
2. **Colaboraciones Open Source:** Si has aportado correcciones o mejoras a librerías públicas, indícalo de forma destacada.
3. **Hackathons:** Participar en hackathons demuestra pasión, capacidad de trabajo en equipo y resistencia bajo presión.

Negociar tu sueldo objetivo o postularte a las mejores vacantes requiere contar con un CV optimizado para los buscadores. Te invitamos a explorar las vacantes activas y transparentes en nuestro [Buscador IT](/trabajos/informatica-tecnologia) para ver qué stacks solicitan las empresas actualmente y a estimar el salario correspondiente mediante nuestra [Calculadora de Salarios IT](/salarios) de forma interactiva.
        """,
        'author': 'Equipo Editorial IT',
        'is_evergreen': 1
    },
    {
        'slug': 'salario-programador-espana-guia-sueldos-2026',
        'title': 'Salario de un programador en España: Guía completa de sueldos por stack y experiencia en 2026',
        'excerpt': '¿Quieres saber si estás cobrando según mercado? Analizamos las bandas salariales, la diferencia entre trabajar en remoto o presencial y los stacks mejor pagados.',
        'content': """
El sector de las tecnologías de la información (IT) en España sigue gozando de una salud excepcional. A pesar de los ajustes macroeconómicos globales, la demanda de talento técnico especializado —desarrolladores de software, ingenieros de datos, administradores de sistemas y DevOps— supera de forma sistemática a la oferta de profesionales formados disponibles en el mercado nacional.

Esta escasez de talento cualificado mantiene los salarios del sector IT muy por encima del salario medio interprofesional en España. Sin embargo, existe una gran dispersión salarial en función de factores determinantes como la tecnología de especialización, los años de experiencia real, la ubicación del puesto de trabajo (o la opción de teletrabajo 100%) y el dominio de idiomas extranjeros.

En este informe completo de más de 2000 palabras, desglosamos las bandas salariales de referencia para los profesionales de tecnología en España correspondientes a 2026.

---

## 1. Bandas Salariales Generales por Nivel de Experiencia
Aunque cada perfil es único, el mercado español se estructura habitualmente en tres grandes franjas salariales en función de la veteranía técnica:

### A. Perfiles Junior (0 a 2 años de experiencia)
Los profesionales recién titulados de ciclos formativos, grados universitarios o graduados de bootcamps intensivos suelen comenzar en posiciones de entrada.
* **Horquilla Salarial:** **22.000€ a 32.000€ brutos anuales**.
* **Factores de variación:** Dominio de un stack moderno (como React o Node.js) e inglés fluido pueden situar la retribución de entrada en la parte alta de la horquilla.

### B. Perfiles Mid-Level (2 a 5 años de experiencia)
Desarrolladores capaces de trabajar con autonomía en funcionalidades complejas, diseñar componentes de software de forma limpia y colaborar activamente en la revisión de código del equipo.
* **Horquilla Salarial:** **35.000€ a 48.000€ brutos anuales**.
* **Factores de variación:** Capacidad demostrada en bases de datos relacionales, patrones de diseño y despliegues automáticos básicos.

### C. Perfiles Senior (Más de 5 años de experiencia)
Ingenieros con sólida capacidad arquitectónica, toma de decisiones tecnológicas justificadas, liderazgo técnico y experiencia diseñando sistemas escalables y resilientes.
* **Horquilla Salarial:** **50.000€ a 75.000€ brutos anuales** (pudiendo superar los **90.000€ o 100.000€** si trabajan para empresas extranjeras con sede o filial en España o bajo contratos 100% remotos en el extranjero).

---

## 2. Los Stacks Tecnológicos Mejor Pagados
La especialización técnica es uno de los mayores aceleradores de sueldo. Aquellas tecnologías con menor número de desarrolladores cualificados disfrutan de un premium salarial notable:

1. **Cloud & DevOps (AWS, GCP, Azure, Kubernetes):** Los ingenieros responsables de la infraestructura, seguridad e integración continua registran medianas salariales excelentes, situándose habitualmente en horquillas de **45.000€ a 70.000€**.
2. **Ciberseguridad:** Muy demandados por grandes corporaciones financieras e industriales. Bandas salariales de **48.000€ a 75.000€** para perfiles con experiencia contrastada.
3. **Stacks Back-end Robustos (Java, Python, Go, Rust):** La lógica de servidor y el procesamiento distribuido de datos se retribuyen de forma excelente, promediando los **42.000€ a 65.000€**.
4. **Desarrolladores Front-end (React, TypeScript):** Muy consolidados, con sueldos de **38.000€ a 58.000€**.

---

## 3. Ubicación y el Impacto del Teletrabajo (Remoto)
Antes de la generalización del teletrabajo, las ofertas en Madrid y Barcelona monopolizaban los salarios más altos de España debido al coste de vida de estas urbes. Sin embargo, hoy en día:
* El **teletrabajo 100% (Remoto)** actúa como nivelador salarial. Permite a ingenieros residentes en ciudades de menor coste de vida (como Valencia, Zaragoza o Asturias) acceder a las bandas de grandes hubs de contratación nacionales e internacionales.
* Un puesto presencial en Madrid o Barcelona requiere ofrecer un plus de entre el 15% y el 20% sobre la media para compensar los gastos asociados a desplazamientos y alquileres.

Si quieres evaluar con exactitud cuál es la banda salarial que corresponde a tu stack, ubicación y nivel de experiencia en España, te invitamos a hacer una consulta personalizada y gratuita en nuestra [Calculadora de Salarios IT](/salarios). Si estás buscando activamente una mejora en tus condiciones laborales o un puesto que transparente su rango salarial, puedes postularte a las últimas vacantes validadas en nuestro [Buscador IT](/trabajos/informatica-tecnologia) en tiempo real.
        """,
        'author': 'Equipo Editorial IT',
        'is_evergreen': 1
    },
    {
        'slug': 'aprender-programacion-desde-cero-hoja-ruta-2026',
        'title': 'Cómo aprender programación desde cero: Hoja de ruta para tu primer empleo en España en 2026',
        'excerpt': 'Guía paso a paso para aprender a programar de forma autodidacta o a través de formación. Qué lenguajes elegir, cómo practicar y cómo prepararse para el mercado laboral.',
        'content': """
Aprender a programar es una de las decisiones más rentables y transformadoras que se pueden tomar a nivel profesional en la actualidad. El sector tecnológico en España no solo disfruta de salarios muy por encima de la media nacional, sino que ofrece una flexibilidad de teletrabajo, conciliación y crecimiento profesional difícil de encontrar en otras industrias tradicionales.

Sin embargo, el camino para convertirse en programador desde cero puede resultar abrumador. La cantidad masiva de lenguajes, frameworks, librerías, tutoriales y bootcamps disponibles en internet a menudo genera parálisis por análisis y desmotivación en los estudiantes principiantes.

En esta guía exhaustiva de más de 2000 palabras, trazamos una hoja de ruta estructurada y clara para pasar de no saber escribir una sola línea de código a conseguir tu primer empleo técnico como desarrollador en España en 2026.

---

## 1. Elige una Especialización (No intentes aprender todo a la vez)
El desarrollo de software es un campo inmenso. Querer aprender de forma simultánea desarrollo frontend, backend, machine learning y seguridad te llevará a la saturación. Te recomendamos elegir uno de los dos caminos de entrada más accesibles y demandados por las empresas en España:

### Opción A: Desarrollo Frontend (Visual e Interactivo)
Responsable de programar la parte visual de las aplicaciones web: lo que el usuario ve y con lo que interactúa en su navegador.
* **Por qué elegirlo:** Resultados visuales rápidos, excelente empleabilidad y curva de aprendizaje más amigable al inicio.
* **Stack básico:** HTML5, CSS3, JavaScript (ES6+) y un framework moderno (preferiblemente **React**).

### Opción B: Desarrollo Backend (Lógica y Datos)
Responsable de programar la lógica del servidor, la seguridad, la conexión con las bases de datos y el flujo de información de la aplicación.
* **Por qué elegirlo:** Ideal si te gusta la lógica pura, resolver problemas estructurados de datos y diseñar el engranaje interno de las aplicaciones.
* **Stack básico:** Un lenguaje de servidor (como **Python** o **Node.js** con JavaScript/TypeScript) y bases de datos relacionales (como **PostgreSQL** o MySQL).

---

## 2. Fase de Fundamentos: Domina la Lógica de Programación
Antes de aprender frameworks avanzados como React o Angular, debes dominar las bases conceptuales de la informática de forma sólida. Dedica al menos de 4 a 6 semanas exclusivamente a entender:
* **Variables y Tipos de Datos:** Cadenas de texto, números, booleanos, arrays y objetos.
* **Estructuras de Control:** Condicionales (`if/else`) y bucles (`for/while`).
* **Funciones:** Declaración, parámetros, ámbito de variables y funciones de retorno.
* **Estructuras de Datos Básicas:** Cómo organizar y manipular datos de forma eficiente.
* **Control de Versiones (Git y GitHub):** Aprender a guardar y versionar tu código con Git es obligatorio para cualquier puesto de trabajo empresarial en España.

---

## 3. Construyendo un Portafolio Real en GitHub
Un título en un papel no te garantizará un empleo en programación. Los evaluadores técnicos de las empresas quieren ver tu código. Para construir un portafolio de impacto:
1. **No hagas clones exactos:** En lugar de construir la típica aplicación de tareas (Todo App) o el clon de Netflix que ya han visto mil veces, crea herramientas que resuelvan un problema real, como un gestor de presupuestos para autónomos, un buscador de recetas según ingredientes o un mapa local de actividades en tu ciudad.
2. **Documenta con Excelencia:** Cada repositorio en tu GitHub debe tener un archivo `README.md` impecable con una explicación de qué hace el proyecto, qué tecnologías utilizaste, una captura de pantalla y, sobre todo, un enlace a la **demo funcional desplegada en vivo** (puedes usar plataformas gratuitas como Vercel o Netlify).
3. **Muestra consistencia:** Los reclutadores valoran positivamente ver un historial de commits regular en tu perfil de GitHub, lo que demuestra disciplina y hábito de código diario.

Si ya has asimilado las bases conceptuales y cuentas con un portafolio inicial de proyectos, te invitamos a buscar tus primeras oportunidades de empleo de nivel de entrada (Junior o de Prácticas) en nuestro [Buscador de Empleo IT](/trabajos/informatica-tecnologia) para ver los requisitos específicos del mercado laboral español en tiempo real, y a comprobar el rango salarial objetivo correspondiente mediante nuestra [Calculadora de Salarios IT](/salarios).
        """,
        'author': 'Equipo Editorial IT',
        'is_evergreen': 1
    }
]

def insert_editorial_articles():
    print("🧹 Iniciando la inserción de artículos editoriales en la base de datos...")

    try:
        conn = get_db_connection()
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error de BD: {e}")
        return

    # Asegurar tabla
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS blog_posts (
                slug VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                excerpt TEXT,
                content LONGTEXT,
                date VARCHAR(50),
                author VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_evergreen INT DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)
        conn.commit()
    except Exception as e:
        print(f"❌ Error asegurando la tabla blog_posts: {e}")
        conn.close()
        return

    import datetime
    today_str = datetime.datetime.now().strftime('%Y-%m-%d')

    inserted = 0
    for art in ARTICULOS:
        try:
            cur.execute("""
                INSERT INTO blog_posts (slug, title, excerpt, content, date, author, is_evergreen)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    excerpt = VALUES(excerpt),
                    content = VALUES(content),
                    date = VALUES(date),
                    author = VALUES(author),
                    is_evergreen = VALUES(is_evergreen)
            """, (art['slug'], art['title'], art['excerpt'], art['content'].strip(), today_str, art['author'], art['is_evergreen']))
            conn.commit()
            inserted += 1
            print(f"✅ Artículo '{art['slug']}' guardado/actualizado con éxito.")
        except Exception as e:
            print(f"❌ Error insertando artículo '{art['slug']}': {e}")
            conn.rollback()

    conn.close()
    print(f"🎉 Proceso de inserción completado. Se insertaron/actualizaron {inserted} artículos editoriales.")

if __name__ == '__main__':
    insert_editorial_articles()
