
export const scoreAssessment = async (assessment, answers) => {
  
  // Step 1: Group answers by dimension
  const groupedAnswers = groupByDimension(assessment, answers);
  
  // Step 2: Calculate score for each dimension
  const dimensionScores = [];
  
  for (const dimension of assessment.dimensions) {
    // Get answers for this dimension
    const dimAnswers = groupedAnswers[dimension.dimensionId] || [];
    
    // Calculate score
    const score = calculateDimensionScore(
      dimension,
      dimAnswers,
      assessment.items
    );
    
    dimensionScores.push(score);
  }
  
  // Step 3: Calculate overall score (average of all dimensions)
  const overallScore = calculateOverallScore(dimensionScores);
  
  // Step 4: Return results
  return {
    dimensions: dimensionScores,
    overallScore: overallScore,
    computedAt: new Date()
  };
};


// ===================================================
// FUNCTION 2: CALCULATE SCORE FOR ONE DIMENSION
// ===================================================
export const calculateDimensionScore = (dimension, answers, allItems) => {
  
  // Get items (questions) for this dimension
  const items = allItems.filter(
    item => item.dimensionId === dimension.dimensionId
  );
  
  // If no items, return empty score
  if (items.length === 0) {
    return {
      dimensionId: dimension.dimensionId,
      name: dimension.name,
      rawScore: 0,
      normalizedScore: 0,
      percentile: 0
    };
  }
  
  // Calculate raw score
  let rawScore = 0;
  let answeredCount = 0;
  
  for (const item of items) {
    // Find user's answer for this item
    const answer = answers.find(a => a.itemId === item.itemId);
    
    if (answer && answer.value != null) {
      // Get the value
      let value = answer.value;
      
      // If reversed question, flip the score
      if (item.isReversed) {
        value = reverseScore(value, item.minValue, item.maxValue);
      }
      
      // Add to raw score (value × weight)
      rawScore += value * item.weight;
      answeredCount++;
    }
  }
  
  // If no answers, return zeros
  if (answeredCount === 0) {
    return {
      dimensionId: dimension.dimensionId,
      name: dimension.name,
      rawScore: 0,
      normalizedScore: 0,
      percentile: 0
    };
  }
  
  // Calculate min and max possible scores
  const minPossible = items.reduce(
    (sum, item) => sum + (item.minValue * item.weight), 
    0
  );
  
  const maxPossible = items.reduce(
    (sum, item) => sum + (item.maxValue * item.weight), 
    0
  );
  
  // Normalize to 0-100 scale
  const normalizedScore = normalizeScore(
    rawScore, 
    minPossible, 
    maxPossible
  );
  
  // Calculate percentile
  const percentile = calculatePercentile(normalizedScore);
  
  // Return results (rounded to 2 decimals)
  return {
    dimensionId: dimension.dimensionId,
    name: dimension.name,
    rawScore: Math.round(rawScore * 100) / 100,
    normalizedScore: Math.round(normalizedScore * 100) / 100,
    percentile: Math.round(percentile)
  };
};


// ===================================================
// FUNCTION 3: REVERSE SCORE (for reversed questions)
// Formula: (max + min) - value
// Example: Scale 1-5, answer 2 → (5+1)-2 = 4
// ===================================================
export const reverseScore = (value, minValue, maxValue) => {
  return (maxValue + minValue) - value;
};


// ===================================================
// FUNCTION 4: NORMALIZE SCORE to 0-100 scale
// Formula: ((raw - min) / (max - min)) × 100
// Example: raw=12, min=3, max=15 → 75
// ===================================================
export const normalizeScore = (rawScore, minPossible, maxPossible) => {
  // Prevent division by zero
  if (maxPossible === minPossible) {
    return 50;
  }
  
  // Calculate percentage
  const normalized = ((rawScore - minPossible) / (maxPossible - minPossible)) * 100;
  
  return normalized;
};


// ===================================================
// FUNCTION 5: CALCULATE PERCENTILE using bell curve
// Assumes normal distribution (mean=50, sd=15)
// Returns where you rank: 0-100
// ===================================================
export const calculatePercentile = (normalizedScore) => {
  const mean = 50;           // Average score
  const stdDev = 15;         // Standard deviation
  
  // Calculate z-score (how many standard deviations from mean)
  const z = (normalizedScore - mean) / stdDev;
  
  // Convert z-score to percentile using bell curve
  const percentile = normalCDF(z) * 100;
  
  return percentile;
};


// ===================================================
// FUNCTION 6: NORMAL DISTRIBUTION CDF
// Bell curve math - don't worry about understanding this!
// Just know: Converts z-score to percentile
// ===================================================
export const normalCDF = (z) => {
  // Mathematical approximation formula for bell curve
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return z > 0 ? 1 - prob : prob;
};


// ===================================================
// FUNCTION 7: CALCULATE OVERALL SCORE
// Simple average of all dimension scores
// ===================================================
export const calculateOverallScore = (dimensionScores) => {
  if (dimensionScores.length === 0) {
    return 0;
  }
  
  // Add up all normalized scores
  const sum = dimensionScores.reduce(
    (total, dim) => total + dim.normalizedScore, 
    0
  );
  
  // Calculate average
  const average = sum / dimensionScores.length;
  
  // Round to 2 decimal places
  return Math.round(average * 100) / 100;
};


// ===================================================
// FUNCTION 8: GROUP ANSWERS BY DIMENSION
// Organizes answers into categories for easier processing
// ===================================================
export const groupByDimension = (assessment, answers) => {
  const grouped = {};
  
  for (const answer of answers) {
    // Find which dimension this answer belongs to
    const item = assessment.items.find(i => i.itemId === answer.itemId);
    
    if (item && item.dimensionId) {
      // Create array if doesn't exist
      if (!grouped[item.dimensionId]) {
        grouped[item.dimensionId] = [];
      }
      
      // Add answer to this dimension
      grouped[item.dimensionId].push(answer);
    }
  }
  
  return grouped;
};


// ===================================================
// DEFAULT EXPORT - Main function others will use
// ===================================================
export default {
  scoreAssessment,
  calculateDimensionScore,
  reverseScore,
  normalizeScore,
  calculatePercentile,
  calculateOverallScore
};