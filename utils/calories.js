async function calculateCaloriesBurned(exerciseType, duration, bodyWeight) {
  const METs = exerciseType === 'cardio' ? 7 : 4;
  const weight = Number(bodyWeight) || 70;
  const minutes = Number(duration) || 0;
  const caloriesPerMinute = (METs * weight) / 200;
  const caloriesBurned = caloriesPerMinute * minutes;
  return Math.round(caloriesBurned * 100) / 100;
}

module.exports = {
  calculateCaloriesBurned,
};
