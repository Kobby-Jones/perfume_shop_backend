// src/utils/upload.ts
import multer from "multer";
import { Request } from "express";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (.png, .jpg, .jpeg, .webp) are allowed."));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});
