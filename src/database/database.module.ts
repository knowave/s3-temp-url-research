import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TypeOrmConfig } from './type-orm.config';

@Module({
  imports: [TypeOrmModule.forRoot(TypeOrmConfig)],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);
  constructor(private readonly dataSource: DataSource) {}

  onModuleInit() {
    const isInitialized = this.dataSource.isInitialized;
    const database = this.dataSource.options.database;

    try {
      if (isInitialized)
        this.logger.log(`Database connected: ${database as string}`);
    } catch (err) {
      this.logger.error(`Failed to initialize database: ${err}`);
    }
  }
}
