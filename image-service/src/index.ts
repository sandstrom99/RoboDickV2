import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import imagesRouter from './routes/images';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve uploads statically
app.use(
  '/images',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/images', imagesRouter);

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
