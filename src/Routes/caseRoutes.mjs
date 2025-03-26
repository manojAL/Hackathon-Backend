import express from 'express';
import Case from '../Schemas/caseSchema.mjs';
import mongoose from 'mongoose';

const router = express.Router();

// Helper to generate case number
const generateCaseNumber = async () => {
  const currentYear = new Date().getFullYear();
  const lastCase = await Case.findOne().sort({ createdAt: -1 });
  
  if (!lastCase) {
    return `LC-${currentYear}-001`;
  }
  
  const lastNumber = parseInt(lastCase.caseNumber.split('-')[2]);
  return `LC-${currentYear}-${(lastNumber + 1).toString().padStart(3, '0')}`;
};

// Create new case
router.post('/', async (req, res) => {
    try {
        // Generate case number (LC-YYYY-NNN)
        const currentYear = new Date().getFullYear();
        const lastCase = await Case.findOne().sort({ createdAt: -1 });
        let caseNumber;
        
        if (!lastCase) {
          caseNumber = `LC-${currentYear}-001`;
        } else {
          const lastNumber = parseInt(lastCase.caseNumber.split('-')[2]);
          caseNumber = `LC-${currentYear}-${(lastNumber + 1).toString().padStart(3, '0')}`;
        }
    
        const newCase = new Case({
          caseNumber,
          ...req.body,
          dateFiled: new Date() // Automatically set filing date
        });
    
        await newCase.save();
        res.status(201).json(newCase);
      } catch (error) {
        res.status(400).json({ 
          message: error.message || 'Failed to create case',
          error: error.errors 
        });
      }
});

// Get all cases with filters
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category, 
      search,
      startDate,
      endDate,
      sortBy = 'dateFiled',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    
    if (status && status !== 'All Statuses') query.status = status;
    if (priority && priority !== 'All Priorities') query.priority = priority;
    if (category && category !== 'All Categories') query.category = category;
    
    if (startDate && endDate) {
      query.dateFiled = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (search) {
      query.$or = [
        { caseNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const cases = await Case.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit * 1);

    const count = await Case.countDocuments(query);

    res.json({
      cases,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCases: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single case
router.get('/:id', async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update case
router.patch('/:id', async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;