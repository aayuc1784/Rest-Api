import express from 'express'   
const app = express();
import mongoose from 'mongoose'
import { APP_PORT, DB_URL } from './config/index.js'
import router from "./routes/index.js";
import errorHandler from './middlewares/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


global.appRoot = path.resolve(__dirname);
app.use(express.json());
app.use(express.urlencoded({extended:false}));
mongoose.connect(DB_URL);


const db = mongoose.connection;
db.on('error', ()=>console.log("aayush"));
db.once('open', () => {
    console.log('DB connected...');
});


app.use("/api", router); 
app.use('/uploads', express.static('uploads'));

app.use(errorHandler);
app.listen(APP_PORT, () => console.log(`Listening on port ${APP_PORT}`));