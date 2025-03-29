import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import routes
import documentsRoutes from './src/Routes/documentsRoutes.mjs';
import caseRoutes from './src/Routes/caseRoutes.mjs';
import dashboardRoutes from './src/Routes/dashboardRoutes.mjs'
// Import schemas
import Document from './src/Schemas/documentSchema.mjs';
import Case from './src/Schemas/caseSchema.mjs';

// Import default data
import documents from './src/Metadata/documentData.mjs';
import caseData from './src/Metadata/caseData.mjs';

// Initialize express and paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/labor_management_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Initialize collections
    await initializeCollections();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize database collections with default data
const initializeCollections = async () => {
  try {
    // Initialize documents collection
    const docCount = await Document.countDocuments();
    if (docCount === 0) {
      await Document.insertMany(documents);
      console.log('Default documents inserted successfully');
    }

    // Initialize cases collection
    const caseCount = await Case.countDocuments();
    if (caseCount === 0) {
      // Transform case data to match schema (remove id field if not in schema)
      const casesToInsert = caseData.map(({ id, date, dueDate, ...rest }) => ({
        ...rest,
        dateFiled: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null
      }));
      await Case.insertMany(casesToInsert);
      console.log('Default cases inserted successfully');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Uploads directory created');
    }
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
};

// Routes
app.use('/api/documents', documentsRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/dashboard',dashboardRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});