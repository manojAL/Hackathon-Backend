import express from 'express';
import { Router } from "express";
import Document from '../Schemas/documentSchema.mjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const router=Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx|xlsx|doc|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Only PDF, DOCX, and XLSX files are allowed!');
    }
  }
});
const getNextId = async () => {
  const lastDoc = await Document.findOne().sort({ id: -1 });
  return lastDoc ? lastDoc.id + 1 : 1;
};
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, category, description } = req.body;
    const fileType = path.extname(req.file.originalname).substring(1).toUpperCase();
    const fileSize = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const filePath = `/uploads/${req.file.filename}`;
    const newDocument = new Document({
      id: await getNextId(),
      title: title || req.file.originalname,
      category: category || 'GR', // Default to GR if not specified
      type: fileType,
      date: new Date(),
      size: fileSize,
      location: filePath
    });

    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this route to serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.sendFile(
    filePath, {
      headers: {
        'Content-Disposition': `attachment; filename="${req.params.filename}"`
      }
    }
  );
});

router.get('/', async (req, res) => {
  try {
    const { type, category, date, page = 1, limit = 12 } = req.query;
    const query = {};
    let options = {};
    let applyPagination = false; // Flag to control pagination
    // Apply type filter
    if (type && type !== 'All Types') {
      query.type = type;
      applyPagination = true;// Apply pagination if any filter is used
    }

    // Apply category filter
    if (category && category !== 'All Categories') {
      query.category = category;
      applyPagination = true; // Apply pagination if any filter is used

    }

    // Apply date filter
    if (date && date !== 'All Time') {
      const currentDate = new Date();
      let startDate;

      if (date === 'Last 7 days') {
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
      } else if (date === 'Last 30 days') {
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 30));
      } else if (date === 'Last 90 days') {
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 90));
      } else if (date === 'This year') {
        startDate = new Date(currentDate.getFullYear(), 0, 1);
      }

      if (startDate) {
        query.date = { $gte: startDate };
        applyPagination = true; // Apply pagination if any filter is used
      }
    }
     // Apply pagination only if page and limit are provided
     if (applyPagination && page && limit) {
      options.limit = limit * 1;
      options.skip = (page - 1) * limit;
    }
    // Fetch documents with filtering and pagination
    let documents;
    if (options.limit && options.skip) {
      documents = await Document.find(query, null, options);
    } else {
      documents = await Document.find(query);
    }

    res.json(documents);
  } 
    catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
