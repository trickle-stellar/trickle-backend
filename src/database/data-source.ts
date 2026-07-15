import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import configuration from '../config/configuration';

config();

const options: DataSourceOptions = {
  type: 'postgres',
  host: configuration().database.host,
  port: configuration().database.port,
  username: configuration().database.username,
  password: configuration().database.password,
  database: configuration().database.name,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
};

export default new DataSource(options);
