import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import catRoute from './routes/category.routes.js';
import { fileURLToPath } from 'url';
import path from 'path';
import galleryRoute from './routes/gallery.routes.js';
import eventRoute from './routes/event.routes.js';
import userRoute from './routes/users.routes.js';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  '/api/uploads',
  express.static(path.join(__dirname, '../public/uploads')),
);

const port = process.env.PORT || 3000;

app.use('/api/category', catRoute);
app.use('/api/gallery', galleryRoute);
app.use('/api/events', eventRoute);
app.use('/api/users', userRoute);

app.get('/', (req, res) => {
  res.send('All goes well');
});


app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
