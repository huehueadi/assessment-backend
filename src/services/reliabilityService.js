
export const checkReliability = async (assessment, answers, metadata = {}) => {
  
  const checks = [];
  
  // Run all 5 checks
  checks.push(checkStraightlining(answers));
  checks.push(checkVariability(answers, assessment.items));
  checks.push(checkExtremeResponding(answers, assessment.items));
  checks.push(checkCompletionRate(answers, assessment.items));
  
  // Only check time if we have time data
  if (metadata.timeSpent && metadata.timeSpent > 0) {
    checks.push(checkResponseTime(metadata.timeSpent, assessment.items.length));
  }
  
  // Calculate overall rating
  const overallRating = calculateOverallRating(checks);
  const isUsable = overallRating !== 'poor';
  const flags = generateFlags(checks);
  
  return {
    isUsable,
    overallRating,
    checks,
    flags,
    checkedAt: new Date()
  };
};


// CHECK 1: STRAIGHTLINING DETECTION
// Catches people who answer same value repeatedly
// Example: [3,3,3,3,3,3,3,3] = BAD!
export const checkStraightlining = (answers) => {
  
  if (answers.length === 0) {
    return createCheck('straightlining', false, 0, 'No answers provided');
  }
  
  const valueCounts = {};
  
  for (const answer of answers) {
    if (answer.value != null) {
      const val = answer.value;
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    }
  }
  
  const counts = Object.values(valueCounts);
  const maxCount = Math.max(...counts);
  const totalAnswers = answers.length;
  
  const straightlinePercent = (maxCount / totalAnswers) * 100;
  
  const passed = straightlinePercent <= 80;
  const score = passed ? 100 : Math.max(0, 100 - straightlinePercent);
  
  const message = passed 
    ? 'Good response variation'
    : `${Math.round(straightlinePercent)}% answers are identical - possible straightlining`;
  
  return createCheck('straightlining', passed, score, message);
};


// CHECK 2: RESPONSE VARIABILITY
// Checks if answers vary enough (not all similar)
// Uses Standard Deviation (measures spread)
export const checkVariability = (answers, items) => {
  
  const values = answers
    .filter(a => a.value != null)
    .map(a => a.value);
  
  if (values.length < 3) {
    return createCheck('variability', false, 0, 'Not enough answers');
  }
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  const variance = values.reduce(
    (sum, v) => sum + Math.pow(v - mean, 2), 
    0
  ) / values.length;
  
  const stdDev = Math.sqrt(variance);
  
  const sampleItem = items[0] || { minValue: 1, maxValue: 5 };
  const scaleRange = sampleItem.maxValue - sampleItem.minValue;
  
  const normalizedSD = stdDev / scaleRange;
  
  const passed = normalizedSD >= 0.15;
  const score = Math.min(100, normalizedSD * 400);
  
  const message = passed
    ? 'Adequate response variability'
    : 'Low response variability - answers too similar';
  
  return createCheck('variability', passed, score, message);
};


// CHECK 3: EXTREME RESPONDING
// Catches overuse of min (1) or max (5) values
// Example: [1,5,1,5,5,1,5] = TOO EXTREME!
export const checkExtremeResponding = (answers, items) => {
  
  if (answers.length === 0) {
    return createCheck('extreme_responding', false, 0, 'No answers');
  }
  
  const itemMap = {};
  for (const item of items) {
    itemMap[item.itemId] = {
      min: item.minValue,
      max: item.maxValue
    };
  }
  
  let extremeCount = 0;
  let totalCount = 0;
  
  for (const answer of answers) {
    if (answer.value != null) {
      const item = itemMap[answer.itemId];
      
      if (item) {
        totalCount++;
        
        // Check if answer is min or max
        if (answer.value === item.min || answer.value === item.max) {
          extremeCount++;
        }
      }
    }
  }
  
  const extremePercent = totalCount > 0 ? (extremeCount / totalCount) * 100 : 0;
  
  const passed = extremePercent <= 70;
  const score = passed ? 100 : Math.max(0, 100 - extremePercent);
  
  const message = passed
    ? 'Appropriate use of scale'
    : `${Math.round(extremePercent)}% extreme values - possible bias`;
  
  return createCheck('extreme_responding', passed, score, message);
};


// CHECK 4: COMPLETION RATE
// Checks if user answered enough questions
// Example: Only 5 out of 10 questions = BAD!
export const checkCompletionRate = (answers, items) => {
  
  const totalItems = items.length;
  
  // Count answered items (not null)
  const answeredItems = answers.filter(
    a => a.value != null
  ).length;
  
  // Calculate percentage
  const completionPercent = (answeredItems / totalItems) * 100;
  
  // THRESHOLD: Less than 80% completion = FAIL
  const passed = completionPercent >= 80;
  const score = completionPercent;
  
  const message = passed
    ? `${Math.round(completionPercent)}% completion rate`
    : `Only ${Math.round(completionPercent)}% completed - too many skipped`;
  
  return createCheck('completion_rate', passed, score, message);
};


// CHECK 5: RESPONSE TIME
// Checks if user finished too quickly (rushing)
// Example: 20 questions in 30 seconds = TOO FAST!
export const checkResponseTime = (timeSpent, itemCount) => {
  
  const avgTimePerItem = timeSpent / itemCount;
  
  const minTimePerItem = 2;
  const passed = avgTimePerItem >= minTimePerItem;
  const score = Math.min(100, (avgTimePerItem / minTimePerItem) * 100);
  
  const message = passed
    ? `Average ${Math.round(avgTimePerItem)}s per item - adequate time`
    : `Only ${Math.round(avgTimePerItem)}s per item - possible rushing`;
  
  return createCheck('response_time', passed, score, message);
};


// CALCULATE OVERALL RATING
// Based on how many checks passed
export const calculateOverallRating = (checks) => {
  
  const passedCount = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const passRate = passedCount / totalChecks;
  
  if (passRate >= 0.9) return 'excellent';   // 90%+ passed
  if (passRate >= 0.7) return 'good';        // 70%+ passed
  if (passRate >= 0.5) return 'questionable'; // 50%+ passed
  return 'poor';                              // Less than 50% passed
};


// GENERATE FLAGS (list of failed checks)
export const generateFlags = (checks) => {
  return checks
    .filter(check => !check.passed)
    .map(check => check.checkName);
};


// HELPER: Create standardized check result
export const createCheck = (checkName, passed, score, message) => {
  return {
    checkName,
    passed,
    score: Math.round(score * 100) / 100,  
    message
  };
};



export default {
  checkReliability,
  checkStraightlining,
  checkVariability,
  checkExtremeResponding,
  checkCompletionRate,
  checkResponseTime
};