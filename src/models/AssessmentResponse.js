
import mongoose from 'mongoose';

const assessmentResponseSchema = new mongoose.Schema({
  
  responseId: {
    type: String,
    required: true,
    unique: true
  },
  
  userId: {
    type: String,
    required: true
  },
  
  assessmentId: {
    type: String,
    required: true
  },
  
  answers: [
    {
      itemId: String,           // Question ID (like "q1")
      value: Number,            // Their answer (1-5)
      answeredAt: {
        type: Date,
        default: Date.now       // When they answered
      }
    }
  ],
  
  scores: {
    dimensions: [
      {
        dimensionId: String,           // Like "extraversion"
        name: String,                  // Display name
        rawScore: Number,              // Original calculated score
        normalizedScore: Number,       // Converted to 0-100 scale
        percentile: Number             // Compared to others (0-100)
      }
    ],
    
    overallScore: Number,
    
    computedAt: Date
  },
  
  reliability: {
    isUsable: Boolean,
    
    // Rating: "excellent", "good", "questionable", "poor"
    overallRating: String,
    
    checks: [
      {
        checkName: String,         // Like "straightlining"
        passed: Boolean,           // Did it pass?
        score: Number,             // Score for this check
        message: String            // Explanation
      }
    ],
    
    // List of failed checks
    flags: [String],
    
    // When checks were done
    checkedAt: Date
  },
  
  // Extra information
  metadata: {
    startedAt: Date,              // When user started
    completedAt: Date,            // When user finished
    timeSpent: Number,            // Seconds taken
    ipAddress: String,            // User's IP (optional)
    userAgent: String             // Browser info (optional)
  },
  
  // When this record was created
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster searching
assessmentResponseSchema.index({ userId: 1, assessmentId: 1 });
assessmentResponseSchema.index({ 'reliability.isUsable': 1 });

// Create Model and export
const AssessmentResponse = mongoose.model('AssessmentResponse', assessmentResponseSchema);

export default AssessmentResponse;