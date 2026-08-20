import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'promanage',
  password: process.env.DB_PASSWORD || 'promanage',
  database: process.env.DB_NAME || 'promanage',
  entities: ['src/modules/**/domain/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
