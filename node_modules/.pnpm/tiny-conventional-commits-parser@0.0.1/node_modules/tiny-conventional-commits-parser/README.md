# tiny-conventional-commits-parser

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Install size][size]][size-url]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

A tiny conventional commits parser.

This package does not aim to provide features and APIs compatible with [conventional-commits-parser](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-commits-parser), but only basic, simple parsing of conventional-commits.

## Usage

```ts
import { getRecentCommits } from 'tiny-conventional-commits-parser'
getRecentCommits('v9.10.0', 'HEAD')

const rawCommit = {
  author: {
    email: 'author1@example.com',
    name: 'author1',
  },
  body: '',
  data: 'Thu Jan 23 17:42:15 2025 +0800',
  message: 'feat(scope)!: commit message',
  shortHash: '9cfa09f',
}
parseCommit(rawCommit)
```

```json
{
  "authors": [
    {
      "email": "author1@example.com",
      "name": "author1"
    }
  ],
  "body": "",
  "data": "Thu Jan 23 17:42:15 2025 +0800",
  "description": "commit message",
  "isBreaking": true,
  "isConventional": true,
  "message": "feat(scope)!: commit message",
  "references": [],
  "scope": "scope",
  "shortHash": "9cfa09f",
  "type": "feat"
}
```

## License

[MIT](./LICENSE) License

## Acknowledgements

- [unjs/changelogen](https://github.com/unjs/changelogen/): most of the code in this package comes from this package.
- [conventional-commits-parser](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-commits-parser)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/tiny-conventional-commits-parser?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/tiny-conventional-commits-parser
[npm-downloads-src]: https://img.shields.io/npm/dm/tiny-conventional-commits-parser?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/tiny-conventional-commits-parser
[size]: https://packagephobia.com/badge?p=tiny-conventional-commits-parser
[size-url]: https://packagephobia.com/result?p=tiny-conventional-commits-parser
[bundle-src]: https://img.shields.io/bundlephobia/minzip/tiny-conventional-commits-parser?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=tiny-conventional-commits-parser
[license-src]: https://img.shields.io/github/license/northword/tiny-conventional-commits-parser.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/northword/tiny-conventional-commits-parser/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/tiny-conventional-commits-parser
