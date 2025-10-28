import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import 'multer';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly tempPreFix: string = 'temp/';
  private readonly permanentPreFix: string = 'permanent/';

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY')!,
        secretAccessKey: this.configService.get('AWS_SECRET_KEY')!,
      },
    });
    this.bucketName = this.configService.get('AWS_BUCKET_NAME')!;
  }

  // 임시 객체 생성
  async uploadTempImage(file: Express.Multer.File) {
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const key = `${this.tempPreFix}${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    const tempImageUrl = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;

    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: 60, // 1분
    });

    return { tempImageUrl, presignedUrl };
  }

  // 임시 객체에서 영구 객체로 변환
  async convertTempToPermanent(tempImageUrl: string) {
    const tempKey = this.extractKeyFromUrl(tempImageUrl);

    if (!tempKey.startsWith(this.tempPreFix))
      throw new BadRequestException('Invalid temporary image URL');

    const exists = await this.validateTempUrl(tempKey);
    if (!exists) throw new BadRequestException('Temporary image not found');

    const fileExtension = tempKey.split('.').pop() || 'bin';
    const permanentKey = `${this.permanentPreFix}${uuidv4()}.${fileExtension}`;

    await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${tempKey}`,
        Key: permanentKey,
      }),
    );

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: tempKey,
      }),
    );

    const permanentImageUrl = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${permanentKey}`;

    return permanentImageUrl;
  }

  private async validateTempUrl(tempImageUrl: string) {
    try {
      const key = tempImageUrl;
      if (!key.startsWith(this.tempPreFix)) return false;

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      throw new Error(`Invalid temp image URL: ${error}`);
    }
  }

  private extractKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  }

  private getContentType(fileExtension: string) {
    const types = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return (
      types[fileExtension.toLowerCase() as keyof typeof types] ||
      'application/octet-stream'
    );
  }
}
