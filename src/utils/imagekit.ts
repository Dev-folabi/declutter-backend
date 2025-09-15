import imagekit from '../config/imagekit';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';

interface UploadOptions {
  file: Buffer | string;
  fileName: string;
  folder?: string;
  useUniqueFileName?: boolean;
  tags?: string[];
}

export const uploadToImageKit = async (options: UploadOptions): Promise<UploadResponse> => {
  try {
    const result = await imagekit.upload({
      file: options.file,
      fileName: options.fileName,
      folder: options.folder || '/uploads',
      useUniqueFileName: options.useUniqueFileName ?? true,
      tags: options.tags || [],
    });
    return result;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error('Failed to upload image to ImageKit');
  }
};

export const uploadMultipleToImageKit = async (
  files: Array<{ buffer: Buffer; originalname: string }>,
  folder?: string,
  tags?: string[]
): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file) =>
      uploadToImageKit({
        file: file.buffer,
        fileName: file.originalname,
        folder,
        tags,
      })
    );

    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.url);
  } catch (error) {
    console.error('Multiple ImageKit upload error:', error);
    throw new Error('Failed to upload images to ImageKit');
  }
};

export const deleteFromImageKit = async (fileId: string): Promise<void> => {
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw new Error('Failed to delete image from ImageKit');
  }
};