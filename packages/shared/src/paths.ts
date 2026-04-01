export const normalizeSlashes = (value: string): string => value.replace(/\\/g, "/");

export const isWithinBasePath = (basePath: string, candidatePath: string): boolean => {
  const normalizedBase = normalizeSlashes(basePath).replace(/\/$/, "");
  const normalizedCandidate = normalizeSlashes(candidatePath);
  return (
    normalizedCandidate === normalizedBase || normalizedCandidate.startsWith(`${normalizedBase}/`)
  );
};
