import express, {type Request, type Response} from 'express';
import { env } from './config/env.config.js';
import voucher_meta_routes from './routes/voucher-meta.routes.js'
import redemption_routes from './routes/redemption.routes.js';
import upload_routes from './routes/upload.routes.js';
import path from 'node:path';

const app = express();
const PORT = env.PORT;

const api_prefix = "/api/v1";

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

//health route
app.get(`${api_prefix}/health`, (req: Request, res: Response) => {
    res.json({
        status: "ok",
        message: "voucher dao backend is running!"
    });
});

//routes
app.use(`${api_prefix}/voucher-meta`, voucher_meta_routes);
app.use(`${api_prefix}/redemptions`, redemption_routes);
app.use(`${api_prefix}/upload`, upload_routes);

//start 
app.listen(PORT, () => {
    console.log(`Voucher DAO backend server is running on port: ${PORT}`);
});