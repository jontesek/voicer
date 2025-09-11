export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;   // placed in /.env
export const DB_FILE_PATH = process.env.DB_FILE_PATH || './../files/db/voicer.db';
export const VOICER_BUCKET = 'voicer';
export const FILES_PATH = 'generated_files';
// conversion when run via docker, localhost otherwise
export const CONVERTER_API_URL = `http://${process.env.CONVERSION_HOST}:3001`;
// minio when run via docker, localhost otherwise
export const MINIO_HOST = process.env.MINIO_HOST
