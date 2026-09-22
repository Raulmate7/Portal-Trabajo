export interface ITEvent {
  slug: string;
  name: string;
  startDate: string;
  endDate: string;
  locationName: string;
  city: string;
  description: string;
  url: string;
  organizer: string;
  topics: string[];
}

export const IT_EVENTS: ITEvent[] = [
  {
    slug: 'aws-summit-madrid-2026',
    name: 'AWS Summit Madrid 2026',
    startDate: '2026-06-15',
    endDate: '2026-06-15',
    locationName: 'IFEMA Feria de Madrid',
    city: 'Madrid',
    description: 'El mayor evento anual de Amazon Web Services en España sobre arquitectura cloud, serverless, inteligencia artificial y DevOps.',
    url: 'https://aws.amazon.com/es/events/summits/madrid/',
    organizer: 'Amazon Web Services',
    topics: ['AWS', 'Cloud', 'DevOps', 'IA']
  },
  {
    slug: 'pycon-es-2026',
    name: 'PyCon ES 2026',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    locationName: 'Palacio de Congresos de Valencia',
    city: 'Valencia',
    description: 'La conferencia nacional de la comunidad Python en España. Ponencias sobre desarrollo backend, data science, aprendizaje automático y web.',
    url: 'https://es.pycon.org/',
    organizer: 'Python España',
    topics: ['Python', 'Data Science', 'Backend', 'IA']
  },
  {
    slug: 'bilbostack-2026',
    name: 'Bilbostack 2026',
    startDate: '2026-01-31',
    endDate: '2026-01-31',
    locationName: 'Palacio Euskalduna',
    city: 'Bilbao',
    description: 'Conferencia de desarrollo de software de referencia en el norte de España con 2 tracks paralelos y ponentes de primer nivel nacional.',
    url: 'https://bilbostack.com/',
    organizer: 'Comunidad Bilbostack',
    topics: ['Fullstack', 'Arquitectura', 'DevOps']
  },
  {
    slug: 'openexpo-europe-2026',
    name: 'OpenExpo Europe 2026',
    startDate: '2026-05-21',
    endDate: '2026-05-21',
    locationName: 'La Nave Madrid',
    city: 'Madrid',
    description: 'El evento líder en Innovación Abierta, Software Libre, Cybersecurity, Criptografía y Transformación Digital en Europa.',
    url: 'https://openexpoeurope.com/',
    organizer: 'OpenExpo Europe',
    topics: ['Open Source', 'Ciberseguridad', 'Cloud']
  },
  {
    slug: 't3chfest-2026',
    name: 'T3chFest 2026',
    startDate: '2026-03-12',
    endDate: '2026-03-13',
    locationName: 'Universidad Carlos III de Madrid (UC3M)',
    city: 'Madrid',
    description: 'Feria de informática y nuevas tecnologías organizada por estudiantes y graduados. Acceso gratuito y de gran impacto académico y profesional.',
    url: 'https://t3chfest.es/',
    organizer: 'UC3M & T3chFest Team',
    topics: ['Desarrollo', 'IA', 'Ciberseguridad', 'Estudiantes']
  }
];
