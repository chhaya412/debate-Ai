export interface EloResult {
  newRatingA: number;
  newRatingB: number;
  deltaA: number;
  deltaB: number;
}

export function calculateEloChange(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  scoreB: number
): EloResult {
  // Expected score calculation
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  // Determine actual match outcome
  let actualA = 0.5;
  let actualB = 0.5;
  if (scoreA > scoreB) {
    actualA = 1;
    actualB = 0;
  } else if (scoreB > scoreA) {
    actualA = 0;
    actualB = 1;
  }

  // K-factor scale based on rating
  const getK = (rating: number) => {
    if (rating >= 1900) return 16;
    if (rating >= 1500) return 24;
    return 32;
  };

  const deltaA = Math.round(getK(ratingA) * (actualA - expectedA));
  const deltaB = Math.round(getK(ratingB) * (actualB - expectedB));

  return {
    newRatingA: Math.max(100, ratingA + deltaA),
    newRatingB: Math.max(100, ratingB + deltaB),
    deltaA,
    deltaB,
  };
}
