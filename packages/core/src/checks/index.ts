// ==============================================================================
// CHECKS — BARREL EXPORT
// Re-exports all pure check functions.
// ==============================================================================

export { hasDigits, hasLowercase, hasSpecial, hasUppercase } from './composition'
export { containsEmail, containsHtml, containsUrl } from './detection'
export { maxConsecutive, maxWords, minWords, noSpaces } from './limits'
export { containsPhoneNumber } from './phoneDetection'
export {
  onlyAlpha,
  onlyAlphanumeric,
  onlyAlphanumericSpaceHyphen,
  onlyAlphaSpaceHyphen,
  onlyNumeric,
} from './restriction'
export {
  collapseWhitespace,
  emptyToUndefined,
  stripHtml,
  toSlug,
  toTitleCase,
} from './transforms'
