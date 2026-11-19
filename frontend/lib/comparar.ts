export const COMPARE_LABELS: Record<string, string> = {
  react: 'React',
  angular: 'Angular',
  vue: 'Vue',
  svelte: 'Svelte',
  node: 'Node.js',
  python: 'Python',
  java: 'Java',
  php: 'PHP',
  csharp: 'C# / .NET',
  go: 'Go',
  rust: 'Rust',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'Google Cloud',
  kubernetes: 'Kubernetes',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  flutter: 'Flutter',
  kotlin: 'Kotlin',
  swift: 'Swift',
  sql: 'SQL',
  nosql: 'NoSQL',
  docker: 'Docker',
  podman: 'Podman',
  nextjs: 'Next.js',
  nuxt: 'Nuxt',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  memcached: 'Memcached',
  kafka: 'Apache Kafka',
  rabbitmq: 'RabbitMQ',
  fastapi: 'FastAPI',
  flask: 'Flask',
  django: 'Django',
  'spring-boot': 'Spring Boot',
  express: 'Express',
  nestjs: 'NestJS',
  laravel: 'Laravel',
  symfony: 'Symfony',
  vite: 'Vite',
  webpack: 'Webpack',
  graphql: 'GraphQL',
  rest: 'REST API',
  ansible: 'Ansible',
  devops: 'DevOps',
  sre: 'SRE',
  'react-native': 'React Native',
  net: '.NET Core',
  ruby: 'Ruby',
  scala: 'Scala',
  elixir: 'Elixir',
  salesforce: 'Salesforce',
  cybersecurity: 'Ciberseguridad',
  terraform: 'Terraform',
  cobol: 'COBOL',
  scrum: 'Scrum',
  kanban: 'Kanban',
  pytorch: 'PyTorch',
  tensorflow: 'TensorFlow',
  spark: 'Apache Spark',
  airflow: 'Apache Airflow',
  dbt: 'dbt',
  // Ciudades
  madrid: 'Madrid',
  barcelona: 'Barcelona',
  valencia: 'Valencia',
  malaga: 'Málaga',
  bilbao: 'Bilbao',
  sevilla: 'Sevilla',
  zaragoza: 'Zaragoza',
  remoto: 'Remoto',
};

export const COMPARE_CITY_KEYS = new Set([
  'madrid',
  'barcelona',
  'valencia',
  'malaga',
  'bilbao',
  'sevilla',
  'zaragoza',
  'remoto',
]);

const TECH_GROUPS: string[][] = [
  ['react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt'],
  ['node', 'python', 'java', 'go', 'rust', 'php', 'csharp'],
  ['typescript', 'javascript', 'python', 'kotlin', 'swift', 'ruby', 'scala', 'elixir'],
  ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'podman', 'terraform', 'ansible', 'devops', 'sre'],
  ['postgresql', 'mysql', 'mongodb', 'redis', 'memcached', 'sql', 'nosql'],
  ['fastapi', 'django', 'flask', 'spring-boot', 'express', 'nestjs', 'laravel', 'symfony'],
  ['flutter', 'react-native', 'kotlin', 'swift'],
  ['kafka', 'rabbitmq', 'graphql', 'rest', 'vite', 'webpack'],
  ['pytorch', 'tensorflow', 'spark', 'airflow', 'dbt', 'python'],
];

const CITY_LIST = ['madrid', 'barcelona', 'valencia', 'malaga', 'bilbao', 'sevilla', 'zaragoza', 'remoto'];

function buildCompareSlugs(): string[] {
  const seen = new Set<string>();
  const add = (a: string, b: string) => {
    if (a === b) return;
    const slug = `${a}-vs-${b}`;
    if (!seen.has(slug)) seen.add(slug);
  };

  for (const group of TECH_GROUPS) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        add(group[i], group[j]);
      }
    }
  }

  for (let i = 0; i < CITY_LIST.length; i++) {
    for (let j = i + 1; j < CITY_LIST.length; j++) {
      add(CITY_LIST[i], CITY_LIST[j]);
    }
  }

  // Cross-domain high-intent pairs
  const extra: Array<[string, string]> = [
    ['scrum', 'kanban'],
    ['aws', 'terraform'],
    ['java', 'spring-boot'],
    ['csharp', 'net'],
    ['php', 'laravel'],
    ['python', 'javascript'],
    ['node', 'go'],
    ['python', 'rust'],
    ['devops', 'cybersecurity'],
    ['salesforce', 'sap'],
  ];
  for (const [a, b] of extra) add(a, b);

  return Array.from(seen).slice(0, 250);
}

export const ALL_COMPARE_SLUGS: string[] = buildCompareSlugs();
