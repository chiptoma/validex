// ==============================================================================
// DOMAIN MATCH
// Checks whether a hostname matches any domain in a list (exact or subdomain).
// ==============================================================================

/**
 * Matches Domain List
 * Returns true if the hostname exactly matches or is a subdomain of any domain.
 *
 * @param hostname - The hostname to check (e.g. 'sub.example.com').
 * @param domains  - The list of domains to match against.
 * @returns True if the hostname matches any domain in the list.
 */
export function matchesDomainList(hostname: string, domains: readonly string[]): boolean {
  return domains.some((d: string) =>
    hostname === d || hostname.endsWith(`.${d}`),
  )
}
