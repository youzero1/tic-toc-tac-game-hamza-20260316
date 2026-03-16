import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GameRecord } from './entities/GameRecord';
import path from 'path';
import fs from 'fs';

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const dbPath = process.env.DATABASE_PATH || './data/tictactoe.db';
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dataSource = new DataSource({
    type: 'sqljs',
    location: dbPath,
    autoSave: true,
    entities: [GameRecord],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}
