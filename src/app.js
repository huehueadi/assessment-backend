import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDatabase from './config/database.js';
import assessmentRoutes from './routes/assessmentRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'Assessment Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /',
      createSample: 'POST /api/assessments/sample',
      submit: 'POST /api/assessments/submit',
      results: 'GET /api/assessments/results/:responseId',
      share: 'GET /api/assessments/share/:responseId',
      compare: 'POST /api/assessments/compare'
    }
  });
});

app.use('/api/assessments', assessmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log(`API Docs: http://localhost:${PORT}/\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;