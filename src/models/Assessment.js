
import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  
  assessmentId: {
    type: String,           // Must be text
    required: true,         // Cannot be empty
    unique: true            // No duplicates allowed
  },
  
  title: {
    type: String,
    required: true
  },
  
  description: {
    type: String
  },
  
  dimensions: [
    {
      dimensionId: String,        // Like "extraversion"
      name: String,               // Display name "Extraversion"
      description: String,        // What it measures
      itemIds: [String]           // List of question IDs in this dimension
    }
  ],
  
  items: [
    {
      itemId: String,             // Like "q1", "q2"
      text: String,               // Question text
      dimensionId: String,        // Which dimension this belongs to
      
      isReversed: {
        type: Boolean,
        default: false            // Default is false
      },
      
      weight: {
        type: Number,
        default: 1.0              // Default weight is 1
      },
      
      minValue: {
        type: Number,
        default: 1
      },
      
      maxValue: {
        type: Number,
        default: 5
      }
    }
  ],
  
  createdAt: {
    type: Date,
    default: Date.now             
  }
});

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;