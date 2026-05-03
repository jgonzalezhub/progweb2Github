import cloudinary from '../config/cloudinary.js';
import sharp from 'sharp';

export const uploadImage = async (buffer, options = {}) => {
  // Optimizar imagen con Sharp: resize + WebP
  const processedBuffer = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: options.folder || 'bildyapp', ...options },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(processedBuffer);
  });
};

export const uploadPDF = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: options.folder || 'bildyapp/pdfs',
          resource_type: 'raw',
          format: 'pdf',
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(buffer);
  });
};

export const deleteFile = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
