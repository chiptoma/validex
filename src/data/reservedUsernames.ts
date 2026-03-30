// ==============================================================================
// RESERVED USERNAMES
// Curated list of usernames that platforms should not allow for registration.
// ------------------------------------------------------------------------------
// NOTE: Sourced from GitHub, Twitter/X, Instagram, and common conventions.
// ==============================================================================

// ----------------------------------------------------------
// DATA
// ----------------------------------------------------------

const RESERVED: readonly string[] = [
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'help',
  'webmaster',
  'postmaster',
  'hostmaster',
  'info',
  'mail',
  'email',
  'abuse',
  'security',
  'noreply',
  'no-reply',
  'www',
  'ftp',
  'ssh',
  'api',
  'app',
  'dev',
  'test',
  'staging',
  'production',
  'demo',
  'blog',
  'shop',
  'store',
  'status',
  'docs',
  'documentation',
  'billing',
  'account',
  'accounts',
  'login',
  'signin',
  'signup',
  'register',
  'dashboard',
  'settings',
  'config',
  'configuration',
  'about',
  'contact',
  'privacy',
  'terms',
  'legal',
  'tos',
  'copyright',
  'feedback',
  'search',
  'sitemap',
  'robots',
  'favicon',
  'undefined',
  'null',
  'true',
  'false',
  'error',
  '404',
  '500',
  'static',
  'assets',
  'images',
  'img',
  'css',
  'js',
  'fonts',
  'media',
  'uploads',
  'download',
  'downloads',
  'public',
  'private',
  'internal',
  'external',
  'home',
  'index',
  'default',
  'main',
  'master',
  'moderator',
  'mod',
  'sysadmin',
  'operator',
  'staff',
  'team',
  'official',
  'verified',
  'bot',
  'robot',
  'service',
  'services',
  'newsletter',
  'subscribe',
  'unsubscribe',
  'marketing',
  'sales',
  'hr',
  'finance',
  'engineering',
  'ceo',
  'cto',
  'cfo',
  'coo',
  'founder',
  'cofounder',
  'owner',
  'manager',
  'director',
  'president',
  'vp',
  'exec',
  'executive',
  'board',
  'member',
  'user',
  'users',
  'customer',
  'customers',
  'client',
  'clients',
  'partner',
  'partners',
  'vendor',
  'vendors',
  'anonymous',
  'guest',
  'visitor',
  'archive',
  'archives',
  'backup',
  'cache',
  'cdn',
  'cloud',
  'data',
  'database',
  'db',
  'debug',
  'deploy',
  'dns',
  'domain',
  'domains',
  'gateway',
  'health',
  'healthcheck',
  'hook',
  'hooks',
  'instance',
  'load',
  'log',
  'logs',
  'metrics',
  'monitor',
  'monitoring',
  'network',
  'node',
  'oauth',
  'ping',
  'proxy',
  'queue',
  'redirect',
  'server',
  'socket',
  'ssl',
  'tcp',
  'udp',
  'webhook',
  'webhooks',
  'worker',
  'workers',
  'auth',
  'channel',
  'checkout',
  'comment',
  'console',
  'developer',
  'enterprise',
  'event',
  'explore',
  'export',
  'feed',
  'file',
  'follow',
  'followers',
  'following',
  'forum',
  'group',
  'import',
  'inbox',
  'integration',
  'invite',
  'issue',
  'job',
  'marketplace',
  'me',
  'message',
  'mobile',
  'new',
  'news',
  'notification',
  'org',
  'organization',
  'page',
  'payment',
  'plan',
  'platform',
  'plugin',
  'policy',
  'popular',
  'post',
  'premium',
  'pricing',
  'profile',
  'project',
  'report',
  'repo',
  'repository',
  'review',
  'role',
  'rss',
  'schedule',
  'sdk',
  'session',
  'site',
  'super',
  'superuser',
  'superadmin',
  'tag',
  'token',
  'topic',
  'trending',
  'update',
  'upload',
  'url',
  'username',
  'verify',
  'wiki',
  'workspace',
] as const

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlySet<string> | undefined

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Load Reserved Usernames
 * Initializes the reserved usernames set and caches it for subsequent access.
 *
 * @returns A promise resolving to the immutable set of reserved usernames.
 */
export async function loadReservedUsernames(): Promise<ReadonlySet<string>> {
  if (!cache) {
    cache = new Set<string>(RESERVED)
  }
  return cache
}

/**
 * Get Reserved Usernames
 * Returns the cached reserved usernames set synchronously.
 * Throws if the data has not been loaded via `loadReservedUsernames` first.
 *
 * @returns The immutable set of reserved usernames.
 * @throws  {Error} When called before `loadReservedUsernames`.
 */
export function getReservedUsernames(): ReadonlySet<string> {
  if (!cache) {
    throw new Error(
      'Reserved usernames not loaded. Call loadReservedUsernames() first.',
    )
  }
  return cache
}

/**
 * Reset Reserved Usernames Cache
 * Clears the cached set so subsequent calls to `loadReservedUsernames`
 * rebuild it from scratch. Intended for test isolation only.
 */
export function resetReservedUsernamesCache(): void {
  cache = undefined
}
