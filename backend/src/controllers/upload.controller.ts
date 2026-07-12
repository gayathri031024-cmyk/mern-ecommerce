import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { buildFileUrl } from '@middlewares/upload.middleware';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw AppError.badRequest('No image file was provided');

  const url = buildFileUrl(req, req.file.filename);

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: { url, filename: req.file.filename, size: req.file.size, mimeType: req.file.mimetype },
  });
});

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) throw AppError.badRequest('No image files were provided');

  const images = files.map((file) => ({
    url: buildFileUrl(req, file.filename),
    filename: file.filename,
    size: file.size,
    mimeType: file.mimetype,
  }));

  res.status(201).json({ success: true, message: `${images.length} image(s) uploaded successfully`, data: images });
});

export const deleteUploadedImage = asyncHandler(async (req: Request, res: Response) => {
  const filename = String(req.params.filename);

  // Guard against path traversal - only allow deleting files directly inside the upload dir.
  const safeName = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeName);
  if (!filePath.startsWith(UPLOAD_DIR)) throw AppError.badRequest('Invalid filename');

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  res.status(200).json({ success: true, message: 'Image deleted successfully' });
});
