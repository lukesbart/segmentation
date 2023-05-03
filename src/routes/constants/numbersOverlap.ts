// Designed so that the order of the numbers and the growth direction of the segment doesn't matter

export const numbersOverlap = (base1: number, bounds1: number, base2: number, bounds2: number): boolean => {
  if (base1 > base2 && bounds1 < bounds2) {
    return true;
  }

  if (base1 < base2 && bounds1 > bounds2) {
    return true;
  }

  return false;
}
