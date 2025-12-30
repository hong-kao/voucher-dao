import express, {} from 'express';
import { env } from './config/env.config.js';
const app = express();
const PORT = env.PORT;
const api_prefix = "/api/v1/";
//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//health route
app.get(`${api_prefix}/health`, (req, res) => {
    res.json({
        status: "ok",
        message: "voucher dao backend is running!"
    });
});
//start 
app.listen(PORT, () => {
    console.log(`Voucher DAO backend server is running on port: ${PORT}`);
});
//# sourceMappingURL=index.js.map