import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Always fictional: never inline live Firebase configuration or private data.
await build({
  configFile: false,
  define: { 'import.meta.env.VITE_APP_MODE': JSON.stringify('demo') },
  plugins: [viteSingleFile()],
  build: { outDir: 'preview', target: 'es2022', emptyOutDir: true }
});
