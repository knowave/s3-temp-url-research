import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ImageEntity } from './entities/image.entity';

@Injectable()
export class ImageRepository extends Repository<ImageEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(ImageEntity, dataSource.createEntityManager());
  }
}
