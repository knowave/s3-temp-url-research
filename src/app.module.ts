import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ImageModule } from './domains/image/image.module';
import { S3Module } from './domains/s3/s3.module';
import { UploadModule } from './domains/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    S3Module,
    UploadModule,
    ImageModule,
  ],
})
export class AppModule {}
