
import Assessment from '../models/Assessment.js';
import AssessmentResponse from '../models/AssessmentResponse.js';
import scoringService from '../services/scoringService.js';
import reliabilityService from '../services/reliabilityService.js';
import shareService from '../services/shareService.js';

import { randomUUID } from 'crypto';



export const submitAssessment = async (req, res) => {
  try {
    const { userId, assessmentId, answers, metadata } = req.body;
    
    if (!userId || !assessmentId || !answers) {
      return res.status(400).json({
        error: 'Missing required fields: userId, assessmentId, answers'
      });
    }
    
    const assessment = await Assessment.findOne({ assessmentId });
    
    if (!assessment) {
      return res.status(404).json({
        error: 'Assessment not found'
      });
    }
    
    const validatedAnswers = validateAnswers(answers, assessment.items);
    
    const scores = await scoringService.scoreAssessment(
      assessment,
      validatedAnswers
    );
    
    const reliability = await reliabilityService.checkReliability(
      assessment,
      validatedAnswers,
      metadata
    );
    
    const responseData = {
      responseId: randomUUID(),
      userId,
      assessmentId,
      answers: validatedAnswers,
      scores,
      reliability,
      metadata: {
        ...metadata,
        completedAt: new Date()
      },
      createdAt: new Date()
    };
    
    const assessmentResponse = new AssessmentResponse(responseData);
    await assessmentResponse.save();
    
    return res.status(201).json({
      responseId: assessmentResponse.responseId,
      isUsable: reliability.isUsable,
      overallRating: reliability.overallRating,
      overallScore: scores.overallScore,
      message: reliability.isUsable 
        ? 'Assessment completed successfully'
        : 'Assessment completed but quality concerns detected'
    });
    
  } catch (error) {
    console.error('Submit assessment error:', error);
    return res.status(500).json({
      error: 'Failed to process assessment',
      details: error.message
    });
  }
};


export const getResults = async (req, res) => {
  try {
    const { responseId } = req.params;
    
    const response = await AssessmentResponse.findOne({ responseId });
    
    if (!response) {
      return res.status(404).json({
        error: 'Assessment response not found'
      });
    }
    
    return res.json({
      responseId: response.responseId,
      userId: response.userId,
      scores: response.scores,
      reliability: response.reliability,
      completedAt: response.metadata?.completedAt
    });
    
  } catch (error) {
    console.error('Get results error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve results',
      details: error.message
    });
  }
};


export const getShareProfile = async (req, res) => {
  try {
    const { responseId } = req.params;
    
    const response = await AssessmentResponse.findOne({ responseId });
    
    if (!response) {
      return res.status(404).json({
        error: 'Assessment response not found'
      });
    }
    
    const sharePayload = shareService.generateSharePayload(response);
    
    return res.json(sharePayload);
    
  } catch (error) {
    console.error('Get share profile error:', error);
    return res.status(500).json({
      error: 'Failed to generate share profile',
      details: error.message
    });
  }
};



export const createSampleAssessment = async (req, res) => {
  try {
    const existing = await Assessment.findOne({ assessmentId: 'personality-v1' });
    
    if (existing) {
      return res.json({
        message: 'Sample assessment already exists',
        assessmentId: existing.assessmentId
      });
    }
    
    const sampleAssessment = new Assessment({
      assessmentId: 'personality-v1',
      title: 'Big Five Personality Test',
      description: 'Measures personality across five major dimensions',
      
      dimensions: [
        {
          dimensionId: 'extraversion',
          name: 'Extraversion',
          description: 'Tendency to seek stimulation and enjoy company of others',
          itemIds: ['q1', 'q2', 'q3']
        },
        {
          dimensionId: 'agreeableness',
          name: 'Agreeableness',
          description: 'Tendency to be compassionate and cooperative',
          itemIds: ['q4', 'q5', 'q6']
        },
        {
          dimensionId: 'conscientiousness',
          name: 'Conscientiousness',
          description: 'Tendency to be organized and dependable',
          itemIds: ['q7', 'q8', 'q9']
        }
      ],
      
      items: [
        { 
          itemId: 'q1', 
          text: 'I am the life of the party', 
          dimensionId: 'extraversion', 
          isReversed: false, 
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        { 
          itemId: 'q2', 
          text: 'I prefer to be alone', 
          dimensionId: 'extraversion', 
          isReversed: true,  // This is reversed!
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        { 
          itemId: 'q3', 
          text: 'I talk to many people at parties', 
          dimensionId: 'extraversion', 
          isReversed: false, 
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        
        // Agreeableness questions
        { 
          itemId: 'q4', 
          text: 'I am interested in people', 
          dimensionId: 'agreeableness', 
          isReversed: false, 
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        { 
          itemId: 'q5', 
          text: 'I insult people', 
          dimensionId: 'agreeableness', 
          isReversed: true,  // This is reversed!
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        { 
          itemId: 'q6', 
          text: 'I sympathize with others', 
          dimensionId: 'agreeableness', 
          isReversed: false, 
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        
        // Conscientiousness questions
        { 
          itemId: 'q7', 
          text: 'I am always prepared', 
          dimensionId: 'conscientiousness', 
          isReversed: false, 
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        { 
          itemId: 'q8', 
          text: 'I leave my belongings around', 
          dimensionId: 'conscientiousness', 
          isReversed: true,  // This is reversed!
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        },
        { 
          itemId: 'q9', 
          text: 'I pay attention to details', 
          dimensionId: 'conscientiousness', 
          isReversed: false, 
          weight: 1.0, 
          minValue: 1, 
          maxValue: 5 
        }
      ],
      
      createdAt: new Date()
    });
    
    // Save to database
    await sampleAssessment.save();
    
    return res.status(201).json({
      message: 'Sample assessment created successfully',
      assessmentId: sampleAssessment.assessmentId,
      itemCount: sampleAssessment.items.length,
      dimensionCount: sampleAssessment.dimensions.length
    });
    
  } catch (error) {
    console.error('Create sample assessment error:', error);
    return res.status(500).json({
      error: 'Failed to create sample assessment',
      details: error.message
    });
  }
};



const validateAnswers = (answers, items) => {
  const itemMap = {};
  items.forEach(item => {
    itemMap[item.itemId] = item;
  });
  
  return answers.map(answer => {
    const item = itemMap[answer.itemId];
    
    if (!item) {
      throw new Error(`Invalid itemId: ${answer.itemId}`);
    }
    
    if (answer.value !== null && answer.value !== undefined) {
      if (answer.value < item.minValue || answer.value > item.maxValue) {
        throw new Error(
          `Value ${answer.value} out of range for item ${answer.itemId} (valid: ${item.minValue}-${item.maxValue})`
        );
      }
    }
    
    return {
      itemId: answer.itemId,
      value: answer.value,
      answeredAt: answer.answeredAt || new Date()
    };
  });
};



export default {
  submitAssessment,
  getResults,
  getShareProfile,
  createSampleAssessment
};