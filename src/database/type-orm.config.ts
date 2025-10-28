import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const TypeOrmConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../entities/*.entity.{js,ts}'],
  synchronize: true,
  migrationsRun: false,
  logging: true,
};

export const AppDataSource = new DataSource(TypeOrmConfig);
