import express from 'express';
import assessmentController from '../controllers/assessmentController.js';
import AssessmentResponse from '../models/AssessmentResponse.js';
import shareService from '../services/shareService.js';

const router = express.Router();

// Create sample assessment (for testing)
router.post('/sample', assessmentController.createSampleAssessment);

router.post('/submit', assessmentController.submitAssessment);

router.get('/results/:responseId', assessmentController.getResults);

router.get('/share/:responseId', assessmentController.getShareProfile);

router.post('/compare', async (req, res) => {
  try {
    const { responseId1, responseId2 } = req.body;
    
    if (!responseId1 || !responseId2) {
      return res.status(400).json({
        error: 'Both responseId1 and responseId2 are required'
      });
    }
    
    const [response1, response2] = await Promise.all([
      AssessmentResponse.findOne({ responseId: responseId1 }),
      AssessmentResponse.findOne({ responseId: responseId2 })
    ]);
    
    if (!response1) {
      return res.status(404).json({
        error: 'First assessment response not found'
      });
    }
    
    if (!response2) {
      return res.status(404).json({
        error: 'Second assessment response not found'
      });
    }
    
    const comparePayload = shareService.generateComparePayload(response1, response2);
    
    return res.json(comparePayload);
    
  } catch (error) {
    console.error('Compare error:', error);
    return res.status(500).json({
      error: 'Failed to generate comparison',
      details: error.message
    });
  }
});

export default router;