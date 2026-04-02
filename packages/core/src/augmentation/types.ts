// ==============================================================================
// ZOD TYPE AUGMENTATION — TYPE DECLARATIONS
// Option interfaces and module augmentation for chainable validation methods.
// ==============================================================================

import type { ZodPipe, ZodTransform } from 'zod'

// ----------------------------------------------------------
// OPTION INTERFACES
// ----------------------------------------------------------

/** Options for composition methods (hasUppercase, hasLowercase, hasDigits, hasSpecial). */
export interface CompositionMethodOptions {
  readonly min?: number | undefined
  readonly max?: number | undefined
  readonly label?: string | undefined
  readonly namespace?: string | undefined
}

/** Options for simple boolean check methods. */
export interface CheckMethodOptions {
  readonly label?: string | undefined
  readonly namespace?: string | undefined
}

/** Options for the maxWords chainable method. */
export interface MaxWordsOptions extends CheckMethodOptions {
  readonly max: number
}

/** Options for the minWords chainable method. */
export interface MinWordsOptions extends CheckMethodOptions {
  readonly min: number
}

/** Options for the maxConsecutive chainable method. */
export interface MaxConsecutiveOptions extends CheckMethodOptions {
  readonly max: number
}

// ----------------------------------------------------------
// TYPE AUGMENTATION
// ----------------------------------------------------------

declare module 'zod' {
  /** Chainable validation and transform methods added by validex. */
  interface ZodType {
    // Composition
    hasUppercase: (opts?: CompositionMethodOptions) => this
    hasLowercase: (opts?: CompositionMethodOptions) => this
    hasDigits: (opts?: CompositionMethodOptions) => this
    hasSpecial: (opts?: CompositionMethodOptions) => this

    // Blocking
    noEmails: (opts?: CheckMethodOptions) => this
    noUrls: (opts?: CheckMethodOptions) => this
    noHtml: (opts?: CheckMethodOptions) => this
    noPhoneNumbers: (opts?: CheckMethodOptions) => this
    noSpaces: (opts?: CheckMethodOptions) => this

    // Restriction
    onlyAlpha: (opts?: CheckMethodOptions) => this
    onlyNumeric: (opts?: CheckMethodOptions) => this
    onlyAlphanumeric: (opts?: CheckMethodOptions) => this
    onlyAlphaSpaceHyphen: (opts?: CheckMethodOptions) => this
    onlyAlphanumericSpaceHyphen: (opts?: CheckMethodOptions) => this

    // Limits
    maxWords: (opts: MaxWordsOptions) => this
    minWords: (opts: MinWordsOptions) => this
    maxConsecutive: (opts: MaxConsecutiveOptions) => this

    // Transforms
    toTitleCase: () => ZodPipe<this, ZodTransform<string, string>>
    toSlug: () => ZodPipe<this, ZodTransform<string, string>>
    stripHtml: () => ZodPipe<this, ZodTransform<string, string>>
    collapseWhitespace: () => ZodPipe<this, ZodTransform<string, string>>
    emptyToUndefined: () => ZodPipe<this, ZodTransform<string | undefined, unknown>>
  }
}
