export default function CourseAffiliate({ title }: { title: string }) {
  const titleLower = title.toLowerCase();
  
  let courseName = "Fullstack Developer";
  let courseUrl = "https://www.udemy.com/topic/web-development/";

  if (titleLower.includes('python')) {
    courseName = "Master en Python";
    courseUrl = "https://www.udemy.com/topic/python/";
  } else if (titleLower.includes('react')) {
    courseName = "React de Cero a Experto";
    courseUrl = "https://www.udemy.com/topic/react/";
  } else if (titleLower.includes('java')) {
    courseName = "Java Profesional";
    courseUrl = "https://www.udemy.com/topic/java/";
  } else if (titleLower.includes('.net') || titleLower.includes('c#')) {
    courseName = "Desarrollo con .NET y C#";
    courseUrl = "https://www.udemy.com/topic/dotnet/";
  }

  return (
    <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
      <h3 className="text-indigo-900 font-bold text-lg mb-2">🎓 Mejora tus posibilidades</h3>
      <p className="text-indigo-800 text-sm mb-4">
        Prepárate para la entrevista técnica con el curso: <strong>{courseName}</strong>.
      </p>
      <a 
        href={courseUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Ver curso en oferta &rarr;
      </a>
    </div>
  );
}
