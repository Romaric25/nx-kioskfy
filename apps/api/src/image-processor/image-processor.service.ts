import { Injectable } from "@nestjs/common";
import sharp from "sharp";

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImageWithThumbnail extends ProcessedImage {
  thumbnail?: {
    buffer: Buffer;
    width: number;
    height: number;
    size: number;
  };
}

@Injectable()
export class ImageProcessorService {
  async processImage(
    inputBuffer: Buffer,
    options: ImageProcessingOptions = {},
  ): Promise<ProcessedImageWithThumbnail> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      createThumbnail = true,
      thumbnailSize = 300,
    } = options;

    const metadata = await sharp(inputBuffer).metadata();
    console.log(`[ImageProcessor] Originale: ${metadata.width}x${metadata.height}`);

    const processed = await sharp(inputBuffer)
      .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });

    const result: ProcessedImageWithThumbnail = {
      buffer: processed.data,
      width: processed.info.width,
      height: processed.info.height,
      format: "webp",
      size: processed.data.length,
    };

    if (createThumbnail) {
      const thumb = await sharp(inputBuffer)
        .resize(thumbnailSize, thumbnailSize, { fit: "cover", position: "center" })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });

      result.thumbnail = {
        buffer: thumb.data,
        width: thumb.info.width,
        height: thumb.info.height,
        size: thumb.data.length,
      };
    }

    return result;
  }

  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const meta = await sharp(buffer).metadata();
      return !!(meta.width && meta.height);
    } catch {
      return false;
    }
  }

  async getImageMetadata(buffer: Buffer) {
    return sharp(buffer).metadata();
  }

  async optimizeImage(buffer: Buffer, quality = 85): Promise<Buffer> {
    return sharp(buffer).webp({ quality }).toBuffer();
  }

  /** Convertit un fichier uploadé (Multer) en Buffer */
  fileToBuffer(file: { buffer: Buffer }): Buffer {
    return file.buffer;
  }

  isImageFile(file: { mimetype: string }): boolean {
    return file.mimetype.startsWith("image/");
  }
}
