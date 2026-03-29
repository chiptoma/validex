[![Build Status](https://travis-ci.org/Cimpress-MCP/postal-codes-js.svg?branch=master)](https://travis-ci.org/Cimpress-MCP/postal-codes-js)
[![Coverage Status](https://coveralls.io/repos/github/Cimpress-MCP/postal-codes-js/badge.svg?branch=master)](https://coveralls.io/github/Cimpress-MCP/postal-codes-js?branch=master)
[![npm version](https://badge.fury.io/js/postal-codes-js.svg)](https://badge.fury.io/js/postal-codes-js)

# postal-codes.js
Provides javascript postal code validation for [all  countries](https://en.wikipedia.org/wiki/List_of_postal_codes). Supports both Node.js and web browser usage.


### Validation rules
1. Characters " " (space) and "-" (dash) are removed from the input string.
2. Input is case insensitive.
3. Supports both [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) and [ISO 3166-1 alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) country codes.
4. Validates optional n-digit extention seperated by a space or hyphen.

### Usage
```
const postalCodes = require('postal-codes-js');
const countryCode = 'CH'; // ISO 3166-1 alpha-2 or alpha-3 country code as string.
const postalCode = '8008'; // Postal code as string or number.
postalCodes.validate(countryCode, postalCode); // Returns 'true' if valid, error message as string otherwise.

// All the calls below returns true
postalCodes.validate('bg', '1003');
postalCodes.validate('gb', 'EC1A 1BB');
postalCodes.validate('GB', 'EC1A 1BB');
postalCodes.validate('GBR', 'EC1A 1BB');
postalCodes.validate('gb', 'EC1A1BB');
postalCodes.validate('gb', 'EC1A-1BB');
postalCodes.validate('tr', '33150');
postalCodes.validate('TR', '33150');
postalCodes.validate('TUR', '33150');
postalCodes.validate('us', '22313');
postalCodes.validate('USA', '91746-2302');

// All the calls below return a string
postalCodes.validate('UK', 'EC1A 1BB');
 > Unknown alpha2/alpha3 country code: UK

postalCodes.validate('PL', '9999');
 > Postal code 9999 is not valid for country PL

postalCodes.validate('CH');
 > Missing postal code.
```

### Testing with mocha
    $ npm test
    $ npm run coverage

## Contribution
Contributions are more than welcome, just fork the repo and create a pull-request ;)

## Contact
PostalCodesJS@cimpress.com
