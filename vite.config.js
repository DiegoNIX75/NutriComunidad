import { globSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Aplicación multipágina: cada .html de la raíz y de Pages/ es una entrada del build.
const paginas = globSync(['*.html', 'Pages/**/*.html'], { cwd: import.meta.dirname })
  .map((archivo) => archivo.split('\\').join('/'));

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        paginas.map((archivo) => [archivo.replace(/\.html$/, ''), resolve(import.meta.dirname, archivo)]),
      ),
    },
  },
});
