// =====================================================
// SHARE SERVICE
// Creates safe, shareable profiles
// =====================================================

// =====================================================
// WHAT'S SAFE TO SHARE:
// ✅ Dimension names ("Extraversion")
// ✅ Scores (0-100 scale)
// ✅ Percentiles (rank vs others)
// ✅ Labels ("high", "moderate", "low")
//
// WHAT'S HIDDEN:
// ❌ Raw answers to questions
// ❌ Individual item responses
// ❌ Reliability check details
// ❌ User's real ID
// =====================================================


// ===================================================
// FUNCTION 1: Generate Share Profile (Single User)
// ===================================================
export const generateSharePayload = (assessmentResponse, includePercentiles = true) => {
  
  // Check if response quality is good enough
  if (!assessmentResponse.reliability.isUsable) {
    return {
      error: 'Response quality too low to share',
      rating: assessmentResponse.reliability.overallRating
    };
  }
  
  // Create dimension summaries (safe data only)
  const dimensions = assessmentResponse.scores.dimensions.map(dim => ({
    name: dim.name,
    score: dim.normalizedScore,
    percentile: includePercentiles ? dim.percentile : undefined,
    level: getScoreLevel(dim.normalizedScore),
    description: getScoreDescription(dim.name, dim.normalizedScore)
  }));
  
  // Return safe profile
  return {
    profileId: generateProfileId(assessmentResponse.responseId),
    userId: assessmentResponse.userId,
    assessmentVersion: assessmentResponse.assessmentId,
    overallScore: assessmentResponse.scores.overallScore,
    dimensions: dimensions,
    profileStrength: getProfileStrength(assessmentResponse.scores.dimensions),
    generatedAt: new Date(),
    disclaimer: 'For informational purposes only. Not for clinical diagnosis.'
  };
};


// ===================================================
// FUNCTION 2: Generate Compare Profile (Two Users)
// ===================================================
export const generateComparePayload = (response1, response2) => {
  
  // Check both responses are usable
  if (!response1.reliability.isUsable || !response2.reliability.isUsable) {
    return {
      error: 'One or both profiles have insufficient quality'
    };
  }
  
  // Compare each dimension
  const dimensionComparisons = compareDimensions(
    response1.scores.dimensions,
    response2.scores.dimensions
  );
  
  // Calculate overall similarity
  const overallSimilarity = calculateOverallSimilarity(dimensionComparisons);
  
  // Find similar and different areas
  const similarities = dimensionComparisons.filter(d => d.similarity >= 75);
  const differences = dimensionComparisons.filter(d => d.similarity < 75);
  
  // Return comparison
  return {
    comparisonId: generateComparisonId(response1.responseId, response2.responseId),
    profile1: {
      profileId: generateProfileId(response1.responseId),
      userId: response1.userId
    },
    profile2: {
      profileId: generateProfileId(response2.responseId),
      userId: response2.userId
    },
    overallSimilarity: Math.round(overallSimilarity),
    compatibilityLevel: getCompatibilityLevel(overallSimilarity),
    dimensions: dimensionComparisons,
    summary: {
      similarAreas: similarities.map(d => d.dimensionName),
      differentAreas: differences.map(d => d.dimensionName),
      strongestSimilarity: findStrongest(dimensionComparisons, 'similarity'),
      largestDifference: findStrongest(dimensionComparisons, 'difference')
    },
    generatedAt: new Date(),
    disclaimer: 'For informational purposes only.'
  };
};


// ===================================================
// FUNCTION 3: Compare Dimensions Between Two Users
// ===================================================
export const compareDimensions = (dimensions1, dimensions2) => {
  const comparisons = [];
  
  for (const dim1 of dimensions1) {
    // Find matching dimension in second user
    const dim2 = dimensions2.find(d => d.dimensionId === dim1.dimensionId);
    
    if (dim2) {
      // Calculate difference
      const diff = Math.abs(dim1.normalizedScore - dim2.normalizedScore);
      
      // Similarity = 100 - difference
      // Example: Scores 80 and 75 → diff=5 → similarity=95
      const similarity = 100 - diff;
      
      comparisons.push({
        dimensionId: dim1.dimensionId,
        dimensionName: dim1.name,
        profile1Score: dim1.normalizedScore,
        profile2Score: dim2.normalizedScore,
        difference: Math.round(diff),
        similarity: Math.round(similarity),
        category: getSimilarityCategory(similarity),
        interpretation: getComparisonInterpretation(dim1.name, dim1.normalizedScore, dim2.normalizedScore)
      });
    }
  }
  
  return comparisons;
};


// ===================================================
// FUNCTION 4: Calculate Overall Similarity
// Simple average of all dimension similarities
// ===================================================
export const calculateOverallSimilarity = (comparisons) => {
  if (comparisons.length === 0) return 0;
  
  const sum = comparisons.reduce(
    (total, comp) => total + comp.similarity, 
    0
  );
  
  return sum / comparisons.length;
};


// ===================================================
// FUNCTION 5: Get Score Level Label
// Converts number to word
// ===================================================
export const getScoreLevel = (normalizedScore) => {
  if (normalizedScore >= 80) return 'very_high';
  if (normalizedScore >= 60) return 'high';
  if (normalizedScore >= 40) return 'moderate';
  if (normalizedScore >= 20) return 'low';
  return 'very_low';
};


// ===================================================
// FUNCTION 6: Get Human-Readable Description
// ===================================================
export const getScoreDescription = (dimensionName, score) => {
  const level = getScoreLevel(score);
  
  const descriptions = {
    very_high: `Very strong in ${dimensionName}`,
    high: `Above average in ${dimensionName}`,
    moderate: `Moderate ${dimensionName}`,
    low: `Below average in ${dimensionName}`,
    very_low: `Low ${dimensionName}`
  };
  
  return descriptions[level] || 'Score available';
};


// ===================================================
// FUNCTION 7: Get Similarity Category
// ===================================================
export const getSimilarityCategory = (similarity) => {
  if (similarity >= 90) return 'very_similar';
  if (similarity >= 75) return 'similar';
  if (similarity >= 50) return 'somewhat_different';
  return 'very_different';
};


// ===================================================
// FUNCTION 8: Get Compatibility Level
// ===================================================
export const getCompatibilityLevel = (overallSimilarity) => {
  if (overallSimilarity >= 85) return 'very_high';
  if (overallSimilarity >= 70) return 'high';
  if (overallSimilarity >= 50) return 'moderate';
  if (overallSimilarity >= 30) return 'low';
  return 'very_low';
};


// ===================================================
// FUNCTION 9: Get Comparison Interpretation
// ===================================================
export const getComparisonInterpretation = (dimensionName, score1, score2) => {
  const diff = Math.abs(score1 - score2);
  
  if (diff < 10) {
    return `Very similar ${dimensionName}`;
  } else if (diff < 25) {
    return `Slight difference in ${dimensionName}`;
  } else if (diff < 40) {
    return `Moderate difference in ${dimensionName}`;
  } else {
    return `Significant difference in ${dimensionName}`;
  }
};


// ===================================================
// FUNCTION 10: Calculate Profile Strength
// How "defined" the profile is (extreme vs moderate)
// ===================================================
export const getProfileStrength = (dimensions) => {
  // Calculate average distance from middle (50)
  const avgDeviation = dimensions.reduce((sum, dim) => {
    return sum + Math.abs(dim.normalizedScore - 50);
  }, 0) / dimensions.length;
  
  if (avgDeviation >= 25) return 'very_defined';
  if (avgDeviation >= 15) return 'defined';
  if (avgDeviation >= 10) return 'moderate';
  return 'balanced';
};


// ===================================================
// FUNCTION 11: Find Strongest Similarity or Difference
// ===================================================
export const findStrongest = (comparisons, type) => {
  if (comparisons.length === 0) return null;
  
  if (type === 'similarity') {
    // Find highest similarity
    const strongest = comparisons.reduce((max, comp) => 
      comp.similarity > max.similarity ? comp : max
    );
    return {
      dimension: strongest.dimensionName,
      score: strongest.similarity
    };
  } else {
    // Find largest difference
    const largest = comparisons.reduce((max, comp) => 
      comp.difference > max.difference ? comp : max
    );
    return {
      dimension: largest.dimensionName,
      score: largest.difference
    };
  }
};


// ===================================================
// FUNCTION 12: Generate Anonymous Profile ID
// Hashes the real ID for privacy
// ===================================================
export const generateProfileId = (responseId) => {
  // Convert to base64 and take first 12 characters
  const hash = Buffer.from(responseId).toString('base64').substring(0, 12);
  return `profile_${hash}`;
};


// ===================================================
// FUNCTION 13: Generate Comparison ID
// ===================================================
export const generateComparisonId = (responseId1, responseId2) => {
  // Sort IDs to ensure same comparison always gets same ID
  const combined = [responseId1, responseId2].sort().join('_');
  const hash = Buffer.from(combined).toString('base64').substring(0, 16);
  return `compare_${hash}`;
};


// ===================================================
// DEFAULT EXPORT
// ===================================================
export default {
  generateSharePayload,
  generateComparePayload,
  compareDimensions,
  getScoreLevel,
  getCompatibilityLevel
};