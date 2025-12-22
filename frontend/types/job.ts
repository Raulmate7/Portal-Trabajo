export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string | null;
  description_snippet?: string | null; // <--- Aquí estaba el fallo actual
  created_at: string;
  url_source: string;
}
