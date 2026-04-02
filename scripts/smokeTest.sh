#!/usr/bin/env bash
# NOTE: Uses npm (not pnpm) intentionally — simulates a real
# consumer installing from a registry. Consumers use npm/yarn/pnpm.
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       VALIDEX CONSUMER SMOKE TEST               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Store monorepo root
MONO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 1. Pack all 3 packages (core FIRST — adapters depend on it)
echo "📦 Packing @validex/core..."
cd "$MONO_ROOT/packages/core"
CORE_PACK=$(npm pack --pack-destination /tmp 2>/dev/null | tail -1)
echo "   → /tmp/$CORE_PACK"

echo "📦 Packing @validex/nuxt..."
cd "$MONO_ROOT/packages/nuxt"
NUXT_PACK=$(npm pack --pack-destination /tmp 2>/dev/null | tail -1)
echo "   → /tmp/$NUXT_PACK"

echo "📦 Packing @validex/fastify..."
cd "$MONO_ROOT/packages/fastify"
FASTIFY_PACK=$(npm pack --pack-destination /tmp 2>/dev/null | tail -1)
echo "   → /tmp/$FASTIFY_PACK"

# 2. Create temp consumer project
SMOKE_DIR=$(mktemp -d)
echo ""
echo "📁 Test dir: $SMOKE_DIR"
echo ""

cd "$SMOKE_DIR"
npm init -y --silent > /dev/null 2>&1

# 3. Set up as ESM project
node -e "
const pkg = require('./package.json');
pkg.type = 'module';
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

cat > tsconfig.json << 'TSEOF'
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "esModuleInterop": true,
    "skipLibCheck": false
  }
}
TSEOF

# 4. Install packed packages + peer deps + runner
npm install "/tmp/$CORE_PACK" "/tmp/$NUXT_PACK" "/tmp/$FASTIFY_PACK" zod tsx --silent 2>/dev/null

# 5. Copy smoke test from repo
cp "$MONO_ROOT/packages/core/tests/smoke/smoke.ts" ./smoke.ts

# 6. Run it
npx tsx smoke.ts
EXIT_CODE=$?

# 7. Cleanup
cd "$MONO_ROOT"
rm -rf "$SMOKE_DIR"
rm -f "/tmp/$CORE_PACK" "/tmp/$NUXT_PACK" "/tmp/$FASTIFY_PACK"

exit $EXIT_CODE
