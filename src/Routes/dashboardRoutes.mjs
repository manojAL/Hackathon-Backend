import express from 'express';
import Case from '../Schemas/caseSchema.mjs';
import Document from '../Schemas/documentSchema.mjs';
const router=express.Router();
// Dashboard stats endpoint
router.get('/stats', async (req, res) => {
    try {
      // Get counts from Cases database
      const activeCases = await Case.countDocuments({ status: { $in: ['Open', 'Urgent'] } });
      const pendingActions = await Case.countDocuments({ status: 'Pending' });
      const highPriority = await Case.countDocuments({ priority: 'High' });
      
      // Get count from Documents database
      const totalDocuments = await Document.countDocuments();
      
      res.json({
        stats: [
          { 
            title: 'Active Cases', 
            value: activeCases.toString(), 
            trend: 'up', 
            trendValue: '+12%', 
            icon: 'Briefcase' 
          },
          { 
            title: 'Total Documents', 
            value: totalDocuments.toString(), 
            trend: 'up', 
            trendValue: '+8%', 
            icon: 'FileText' 
          },
          { 
            title: 'Pending Actions', 
            value: pendingActions.toString(), 
            trend: 'down', 
            trendValue: '-6%', 
            icon: 'Clock' 
          },
          { 
            title: 'High Priority', 
            value: highPriority.toString(), 
            trend: 'up', 
            trendValue: '+4%', 
            icon: 'AlertTriangle' 
          },
        ]
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Recent cases endpoint
  router.get('/recent-cases', async (req, res) => {
    try {
      const recentCases = await Case.find()
        .sort({ createdAt: -1 })
        .limit(4)
        .select('caseNumber title status dateFiled dueDate priority category')
        .lean();
      
      // Format dates and map to match frontend structure
      const formattedCases = recentCases.map(caseItem => ({
        id: caseItem._id,
        caseNumber: caseItem.caseNumber,
        title: caseItem.title,
        status: caseItem.status,
        date: new Date(caseItem.dateFiled).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        dueDate: caseItem.dueDate ? new Date(caseItem.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null,
        priority: caseItem.priority,
        category: caseItem.category
      }));
      
      res.json({ cases: formattedCases });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Case distribution endpoint
  router.get('/case-distribution', async (req, res) => {
    try {
      const activeCases = await Case.countDocuments({ status: { $in: ['Open', 'Urgent'] } });
      const closedCases = await Case.countDocuments({ status: 'Closed' });
      const pendingReview = await Case.countDocuments({ status: 'Pending' });
      const totalCases = activeCases + closedCases + pendingReview;
      
      res.json({
        total: totalCases,
        activeCases,
        closedCases,
        pendingReview
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  export default router;
