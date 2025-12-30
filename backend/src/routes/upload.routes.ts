import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const router = Router();

//upload dir
const upload_dir = path.join(process.cwd(), 'uploads');
if(!fs.existsSync(upload_dir)){
    fs.mkdirSync(upload_dir, {
        recursive: true
    });
}

//config multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, upload_dir);
    },
    filename: (req, file, cb) => {
        const unique_suffix = `${Date.now()} - ${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `voucher-${unique_suffix}${ext}`);
    },
});

//file filter for images only
