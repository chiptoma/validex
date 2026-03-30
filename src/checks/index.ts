// ==============================================================================
// CHECKS — BARREL EXPORT
// Re-exports all pure check functions.
// ==============================================================================

export { checkAsciiBoundary, checkUnicodeBoundary } from './boundary'
export { hasDigits, hasLowercase, hasSpecial, hasUppercase } from './composition'
export { containsEmail, containsHtml, containsPhoneNumber, containsUrl } from './detection'
export { maxConsecutive, maxWords, noSpaces } from './limits'
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
