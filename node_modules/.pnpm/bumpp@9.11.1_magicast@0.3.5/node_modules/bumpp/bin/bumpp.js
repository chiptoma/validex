#!/usr/bin/env node
'use strict'
import('../dist/cli.js')
  .then(r => r.main())
