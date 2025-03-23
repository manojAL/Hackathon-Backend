import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'GR', 'Notification', 'Guidelines', 'Amendment', 'Proposal', 
      'Standards', 'Checklist', 'Report', 'Act'
    ] // Ensuring valid categories
  },
  type: {
    type: String,
    required: true,
    enum: ['PDF', 'DOCX', 'XLSX'] // Limiting document types
  },
  date: {
    type: Date,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

export default Document;
