import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageEntity } from 'src/domains/image/entities/image.entity';
import { S3Module } from '../s3/s3.module';
import { ImageController } from './image.controller';
import { ImageRepository } from './image.repository';
import { ImageService } from './image.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity]), S3Module],
  providers: [ImageRepository, ImageService],
  controllers: [ImageController],
  exports: [ImageService],
})
export class ImageModule {}
