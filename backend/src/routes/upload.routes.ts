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
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if(allowed_types.includes(file.mimetype)){
        cb(null, true);
    }else{
        cb(new Error("Invalid file type"));
    }
}

const upload = multer({
    storage, 
    fileFilter, 
    limits: {
        fileSize: 5 * 1024 * 1024, //5mb max bro
    }
})

//post - upload a single image
router.post("/", upload.single('file'), (req: Request, res: Response) => {
    try{
        if(!req.file){
            res.status(400).json({
                error: "No file uploaded"
            });
            return;
        }

        const file_url = `/uploads/${req.file.filename}`;

        res.status(201).json({
            message: 'file uploaded successfully',
            filename: req.file.filename,
            url: file_url,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    }catch(err: any){
        console.error("Error while uploading file: ", err);
        res.status(500).json({
            error: "Error failed to upload file"
        });
    }
});

//delete - an uploaded file
router.delete("/:filename", (req: Request, res: Response) => {
    try{
        const { filename } = req.params;
        const file_path = path.join(upload_dir, filename as string);

        if(!fs.existsSync(file_path)){
            res.status(404).json({
                error: "File not found"
            });
            return;
        }

        fs.unlinkSync(file_path);
        res.status(204).send();
    }catch(err: any){
        console.error("Error while deleting file: ", err);
        res.status(500).json({
            erorr: "Failed to delete file"
        });
    }
});

export default router;
