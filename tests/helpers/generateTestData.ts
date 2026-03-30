// ==============================================================================
// GENERATE TEST DATA
// Faker-based bulk data generators for fuzz testing validation rules.
// ==============================================================================

import type { Faker } from '@faker-js/faker'
import { allFakers, faker } from '@faker-js/faker'

// ----------------------------------------------------------
// LOCALE HELPERS
// ----------------------------------------------------------

const LOCALE_FAKERS: ReadonlyArray<{ locale: string, instance: Faker }> = [
  { locale: 'en', instance: allFakers.en },
  { locale: 'de', instance: allFakers.de },
  { locale: 'fr', instance: allFakers.fr },
  { locale: 'es', instance: allFakers.es },
  { locale: 'ja', instance: allFakers.ja },
]

/**
 * Generate With Locales
 * Runs a generator function across multiple locales.
 *
 * @param perLocale - Number of values to generate per locale.
 * @param generate  - Generator function that receives a Faker instance.
 * @returns Array of objects with value and locale.
 */
function generateWithLocales(
  perLocale: number,
  generate: (f: Faker) => string,
): Array<{ value: string, locale: string }> {
  const results: Array<{ value: string, locale: string }> = []

  for (const { locale, instance } of LOCALE_FAKERS) {
    for (let i = 0; i < perLocale; i++) {
      results.push({ value: generate(instance), locale })
    }
  }

  return results
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Generate Emails
 * Produces an array of fake email addresses.
 *
 * @param count - Number of emails to generate.
 * @returns Array of email strings.
 */
export function generateEmails(count: number = 100): string[] {
  return Array.from({ length: count }, () => faker.internet.email())
}

/**
 * Generate Names
 * Produces name strings across multiple locales.
 *
 * @param perLocale - Number of names to generate per locale.
 * @returns Array of objects with value and locale.
 */
export function generateNames(
  perLocale: number = 50,
): Array<{ value: string, locale: string }> {
  return generateWithLocales(perLocale, f => f.person.fullName())
}

/**
 * Generate Phones
 * Produces phone number strings across multiple locales.
 *
 * @param perLocale - Number of phone numbers to generate per locale.
 * @returns Array of objects with value and locale.
 */
export function generatePhones(
  perLocale: number = 50,
): Array<{ value: string, locale: string }> {
  return generateWithLocales(perLocale, f => f.phone.number())
}

/**
 * Generate Company Names
 * Produces company name strings across multiple locales.
 *
 * @param perLocale - Number of company names to generate per locale.
 * @returns Array of objects with value and locale.
 */
export function generateCompanyNames(
  perLocale: number = 50,
): Array<{ value: string, locale: string }> {
  return generateWithLocales(perLocale, f => f.company.name())
}

/**
 * Generate Uuids
 * Produces an array of UUID v4 strings.
 *
 * @param count - Number of UUIDs to generate.
 * @returns Array of UUID strings.
 */
export function generateUuids(count: number = 100): string[] {
  return Array.from({ length: count }, () => faker.string.uuid())
}

/**
 * Generate Urls
 * Produces an array of URL strings.
 *
 * @param count - Number of URLs to generate.
 * @returns Array of URL strings.
 */
export function generateUrls(count: number = 100): string[] {
  return Array.from({ length: count }, () => faker.internet.url())
}

/**
 * Generate Usernames
 * Produces an array of username strings.
 *
 * @param count - Number of usernames to generate.
 * @returns Array of username strings.
 */
export function generateUsernames(count: number = 100): string[] {
  return Array.from({ length: count }, () => faker.internet.username())
}

/**
 * Generate Colors
 * Produces an array of hex color strings.
 *
 * @param count - Number of colors to generate.
 * @returns Array of hex color strings.
 */
export function generateColors(count: number = 100): string[] {
  return Array.from({ length: count }, () => faker.color.rgb())
}
