// Drizzle-Migrationen werden per babel-plugin-inline-import als Text eingebunden
declare module '*.sql' {
  const content: string;
  export default content;
}
