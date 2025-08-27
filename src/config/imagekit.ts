import ImageKit from 'imagekit';
import { Request } from 'express';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export default imagekit;

// Authentication endpoint for ImageKit
export const imagekitAuth = (req: Request) => {
  const token = imagekit.getAuthenticationParameters();
  return token;
};