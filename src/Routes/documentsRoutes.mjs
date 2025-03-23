import express from 'express';
import { Router } from "express";
import Document from '../Schemas/documentSchema.mjs';
const router=Router();

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
