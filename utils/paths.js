import { fileURLToPath } from 'url';

export const paths = {
  db: fileURLToPath(new URL('../db/', import.meta.url)),
};