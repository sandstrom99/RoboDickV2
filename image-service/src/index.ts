import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import imagesRouter from './routes/images';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({ origin: '*' }));

// serve uploads
app.use('/images', express.static(path.join(__dirname, '..', 'uploads')));

// parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/images', imagesRouter);

// error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));