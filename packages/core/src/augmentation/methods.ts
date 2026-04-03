// ==============================================================================
// ZOD TYPE AUGMENTATION — PROTOTYPE METHODS
// Runtime prototype patches for chainable validation and transform methods.
// ------------------------------------------------------------------------------
// Context: Layer 1 bridge between Layer 0 pure check functions and Layer 2 rules.
// NOTE:    initAugmentation() MUST be called before any consumer creates Zod schemas.
// ==============================================================================

import type { RefinementCtx } from 'zod'

import type {
  CheckMethodOptions,
  CompositionMethodOptions,
  MaxConsecutiveOptions,
  MaxWordsOptions,
  MinWordsOptions,
} from './types'

import { ZodType } from 'zod'

import { hasDigits, hasLowercase, hasSpecial, hasUppercase } from '@checks/composition'
import { containsEmail, containsHtml, containsUrl } from '@checks/detection'
import { maxConsecutive, maxWords, minWords, noSpaces } from '@checks/limits'
import {
  onlyAlpha,
  onlyAlphanumeric,
  onlyAlphanumericSpaceHyphen,
  onlyAlphaSpaceHyphen,
  onlyNumeric,
} from '@checks/restriction'
import { collapseWhitespace, stripHtml, toSlug, toTitleCase } from '@checks/transforms'
import { ensureCustomError } from '@core/customError'

// ----------------------------------------------------------
// PROTOTYPE PATCHING
// ----------------------------------------------------------
// Wrapped in a function so it survives tree-shaking via the
// dependency graph (named import + call) instead of relying
// on bare side-effect imports that bundlers drop with
// sideEffects: false.
//
// Prototype patching requires assignment to ZodType.prototype
// which ESLint sees as unsafe `any` access. Module augmentation
// in types.ts provides the compile-time type safety.

let _initialized = false

/* eslint-disable ts/no-unsafe-member-access, ts/no-unsafe-return, ts/no-unsafe-call -- prototype patching requires unsafe any access; type safety provided by module augmentation in types.ts */

/**
 * Registers the custom error handler and patches ZodType.prototype
 * with chainable validation and transform methods. Idempotent.
 */
// eslint-disable-next-line max-lines-per-function -- initAugmentation patches 22 methods on ZodType.prototype; cannot split without breaking idempotency guard
export function initAugmentation(): void {
  if (_initialized)
    return
  _initialized = true

  ensureCustomError()

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

  /**
   * NOTE: Uses dynamic import — forces async validation.
   *       Use safeParseAsync() when this method is in the chain.
   *
   * @param opts - Check method options (namespace, label).
   * @returns The schema with phone number detection refine applied.
   */
  ZodType.prototype.noPhoneNumbers = function (opts: CheckMethodOptions = {}): ZodType {
    const ns = opts.namespace ?? 'string'
    const lbl = opts.label
    return this.superRefine(async (v: unknown, ctx: RefinementCtx): Promise<void> => {
      if (typeof v !== 'string')
        return
      const { containsPhoneNumber } = await import('../checks/phoneDetection')
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
}

/* eslint-enable ts/no-unsafe-member-access, ts/no-unsafe-return, ts/no-unsafe-call */
