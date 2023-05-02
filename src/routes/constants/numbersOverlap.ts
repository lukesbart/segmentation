export const numbersOverlap = (n1: number, n2: number, m1: number, m2: number) => {
  if (n1 > m1 && n2 < m2) {
    return true;
  }

  if (n1 < m1 && n2 > m2) {
    return true;
  }

  return false;
}
