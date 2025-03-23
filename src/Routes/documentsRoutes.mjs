import express from 'express';
import { Router } from "express";
import Document from '../Schemas/documentSchema.mjs';
const router=Router();
router.get('/',async(req,res)=>{
    try {
        const documents = await Document.find();
        res.json(documents);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
})


export default router;
