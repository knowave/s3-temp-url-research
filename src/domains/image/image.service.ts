import { Injectable } from '@nestjs/common';
import { CreateImageBodyDto } from 'src/domains/image/dto/create-image.body';
import { S3Service } from '../s3/s3.service';
import { ImageRepository } from './image.repository';

@Injectable()
export class ImageService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly imageRepository: ImageRepository,
  ) {}

  async createImage({ imageUrl }: CreateImageBodyDto) {
    const permanentImageUrl =
      await this.s3Service.convertTempToPermanent(imageUrl);

    const image = this.imageRepository.create({
      url: permanentImageUrl,
    });

    return this.imageRepository.save(image);
  }
}
