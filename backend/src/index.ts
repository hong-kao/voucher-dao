import express, {type Request, type Response} from 'express';
import { env } from './config/env.config.js';
import voucher_meta_routes from './routes/voucher-meta.routes.js'
import redemption_routes from './routes/redemption.routes.js';

const app = express();
const PORT = env.PORT;

const api_prefix = "/api/v1";

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

//start 
app.listen(PORT, () => {
    console.log(`Voucher DAO backend server is running on port: ${PORT}`);
});