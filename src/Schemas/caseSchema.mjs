// src/models/caseSchema.js
import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Open', 'Pending', 'Closed', 'Urgent']
  },
  dateFiled: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    required: true,
    enum: ['High', 'Medium', 'Low']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Labor Dispute',
      'Wage Dispute',
      'Safety Standards',
      'Benefits',
      'Industrial Dispute',
      'Compensation',
      'Work Policy'
    ]
  },dateFiled: { type: Date, default: Date.now },
  dueDate: { type: Date }
}, { timestamps: true });

// Add indexes for better performance
caseSchema.index({ caseNumber: 1 }, { unique: true });
caseSchema.index({ status: 1 });
caseSchema.index({ priority: 1 });
caseSchema.index({ category: 1 });

const Case = mongoose.model('Case', caseSchema);

export default Case;