// ==============================================================================
// ZOD TYPE AUGMENTATION
// Adds chainable validation and transform methods to all Zod types.
// ------------------------------------------------------------------------------
// Context: Layer 1 bridge between Layer 0 pure check functions and Layer 2 rules.
// Scope:   Imported as a side effect from src/index.ts; patches ZodType.prototype.
// NOTE:    This file MUST be imported before any consumer creates Zod schemas.
// ==============================================================================

import type { RefinementCtx, ZodPipe, ZodTransform } from 'zod'
import { ZodType } from 'zod'
import { hasDigits, hasLowercase, hasSpecial, hasUppercase } from './checks/composition'
import { containsEmail, containsHtml, containsUrl } from './checks/detection'
import { maxConsecutive, maxWords, minWords, noSpaces } from './checks/limits'
import {
  onlyAlpha,
  onlyAlphanumeric,
  onlyAlphanumericSpaceHyphen,
  onlyAlphaSpaceHyphen,
  onlyNumeric,
} from './checks/restriction'
import { collapseWhitespace, stripHtml, toSlug, toTitleCase } from './checks/transforms'
import { ensureCustomError } from './core/customError'

// ----------------------------------------------------------
// REGISTER ERROR HANDLER
// ----------------------------------------------------------

ensureCustomError()

// ----------------------------------------------------------
// OPTION INTERFACES
// ----------------------------------------------------------

/** Options for composition methods (hasUppercase, hasLowercase, hasDigits, hasSpecial). */
interface CompositionMethodOptions {
  readonly min?: number | undefined
  readonly max?: number | undefined
  readonly label?: string | undefined
  readonly namespace?: string | undefined
}

/** Options for simple boolean check methods. */
interface CheckMethodOptions {
  readonly label?: string | undefined
  readonly namespace?: string | undefined
}

/** Options for the maxWords chainable method. */
interface MaxWordsOptions extends CheckMethodOptions {
  readonly max: number
}

/** Options for the minWords chainable method. */
interface MinWordsOptions extends CheckMethodOptions {
  readonly min: number
}

/** Options for the maxConsecutive chainable method. */
interface MaxConsecutiveOptions extends CheckMethodOptions {
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

// ----------------------------------------------------------
// PROTOTYPE PATCHING
// ----------------------------------------------------------
// Prototype patching requires assignment to ZodType.prototype which ESLint
// sees as unsafe `any` access. This is the only way to augment Zod types
// at runtime — the module augmentation above provides type safety for consumers.
/* eslint-disable ts/no-unsafe-member-access, ts/no-unsafe-return, ts/no-unsafe-call */

// ----------------------------------------------------------
// COMPOSITION METHODS
// ----------------------------------------------------------

ZodType.prototype.hasUppercase = function (opts: CompositionMethodOptions = {}): ZodType {
  const min = opts.min ?? 1
  const max = opts.max
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (min > 0 && !hasUppercase(v, min)) {
      ctx.addIssue({ code: 'custom', params: { code: 'minUppercase', namespace: ns, minimum: min, label: lbl } })
    }
    if (max !== undefined && !hasUppercase(v, 0, max)) {
      ctx.addIssue({ code: 'custom', params: { code: 'maxUppercase', namespace: ns, maximum: max, label: lbl } })
    }
  })
}

ZodType.prototype.hasLowercase = function (opts: CompositionMethodOptions = {}): ZodType {
  const min = opts.min ?? 1
  const max = opts.max
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (min > 0 && !hasLowercase(v, min)) {
      ctx.addIssue({ code: 'custom', params: { code: 'minLowercase', namespace: ns, minimum: min, label: lbl } })
    }
    if (max !== undefined && !hasLowercase(v, 0, max)) {
      ctx.addIssue({ code: 'custom', params: { code: 'maxLowercase', namespace: ns, maximum: max, label: lbl } })
    }
  })
}

ZodType.prototype.hasDigits = function (opts: CompositionMethodOptions = {}): ZodType {
  const min = opts.min ?? 1
  const max = opts.max
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (min > 0 && !hasDigits(v, min)) {
      ctx.addIssue({ code: 'custom', params: { code: 'minDigits', namespace: ns, minimum: min, label: lbl } })
    }
    if (max !== undefined && !hasDigits(v, 0, max)) {
      ctx.addIssue({ code: 'custom', params: { code: 'maxDigits', namespace: ns, maximum: max, label: lbl } })
    }
  })
}

ZodType.prototype.hasSpecial = function (opts: CompositionMethodOptions = {}): ZodType {
  const min = opts.min ?? 1
  const max = opts.max
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (min > 0 && !hasSpecial(v, min)) {
      ctx.addIssue({ code: 'custom', params: { code: 'minSpecial', namespace: ns, minimum: min, label: lbl } })
    }
    if (max !== undefined && !hasSpecial(v, 0, max)) {
      ctx.addIssue({ code: 'custom', params: { code: 'maxSpecial', namespace: ns, maximum: max, label: lbl } })
    }
  })
}

// ----------------------------------------------------------
// BLOCKING METHODS
// ----------------------------------------------------------

ZodType.prototype.noEmails = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (containsEmail(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'noEmails', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.noUrls = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (containsUrl(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'noUrls', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.noHtml = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (containsHtml(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'noHtml', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.noPhoneNumbers = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine(async (v: unknown, ctx: RefinementCtx): Promise<void> => {
    if (typeof v !== 'string')
      return
    const { containsPhoneNumber } = await import('./checks/phoneDetection')
    if (await containsPhoneNumber(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'noPhoneNumbers', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.noSpaces = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!noSpaces(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'noSpaces', namespace: ns, label: lbl } })
    }
  })
}

// ----------------------------------------------------------
// RESTRICTION METHODS
// ----------------------------------------------------------

ZodType.prototype.onlyAlpha = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!onlyAlpha(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'onlyAlpha', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.onlyNumeric = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!onlyNumeric(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'onlyNumeric', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.onlyAlphanumeric = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!onlyAlphanumeric(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'onlyAlphanumeric', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.onlyAlphaSpaceHyphen = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!onlyAlphaSpaceHyphen(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'onlyAlphaSpaceHyphen', namespace: ns, label: lbl } })
    }
  })
}

ZodType.prototype.onlyAlphanumericSpaceHyphen = function (opts: CheckMethodOptions = {}): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!onlyAlphanumericSpaceHyphen(v)) {
      ctx.addIssue({ code: 'custom', params: { code: 'onlyAlphanumericSpaceHyphen', namespace: ns, label: lbl } })
    }
  })
}

// ----------------------------------------------------------
// LIMIT METHODS
// ----------------------------------------------------------

ZodType.prototype.maxWords = function (opts: MaxWordsOptions): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  const max = opts.max
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!maxWords(v, max)) {
      ctx.addIssue({ code: 'custom', params: { code: 'maxWords', namespace: ns, maximum: max, label: lbl } })
    }
  })
}

ZodType.prototype.minWords = function (opts: MinWordsOptions): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  const min = opts.min
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!minWords(v, min)) {
      ctx.addIssue({ code: 'custom', params: { code: 'minWords', namespace: ns, minimum: min, label: lbl } })
    }
  })
}

ZodType.prototype.maxConsecutive = function (opts: MaxConsecutiveOptions): ZodType {
  const ns = opts.namespace ?? 'string'
  const lbl = opts.label
  const max = opts.max
  return this.superRefine((v: unknown, ctx: RefinementCtx): void => {
    if (typeof v !== 'string')
      return
    if (!maxConsecutive(v, max)) {
      ctx.addIssue({ code: 'custom', params: { code: 'maxConsecutive', namespace: ns, maximum: max, label: lbl } })
    }
  })
}

// ----------------------------------------------------------
// TRANSFORM METHODS
// ----------------------------------------------------------

ZodType.prototype.toTitleCase = function (): unknown {
  return this.transform((v: unknown): string =>
    typeof v === 'string' ? toTitleCase(v) : String(v),
  )
}

ZodType.prototype.toSlug = function (): unknown {
  return this.transform((v: unknown): string =>
    typeof v === 'string' ? toSlug(v) : String(v),
  )
}

ZodType.prototype.stripHtml = function (): unknown {
  return this.transform((v: unknown): string =>
    typeof v === 'string' ? stripHtml(v) : String(v),
  )
}

ZodType.prototype.collapseWhitespace = function (): unknown {
  return this.transform((v: unknown): string =>
    typeof v === 'string' ? collapseWhitespace(v) : String(v),
  )
}

ZodType.prototype.emptyToUndefined = function (): unknown {
  return this.transform((v: unknown): unknown =>
    v === '' || v === null ? undefined : v,
  )
}

/* eslint-enable ts/no-unsafe-member-access, ts/no-unsafe-return, ts/no-unsafe-call */
