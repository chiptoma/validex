const postalCodes = require('./postal-codes');

const pc1 = 'CW3 9SS';
let result = postalCodes.validate('GB', pc1);
if ( result === true ) {
    console.log("Postal code is valid.");
} else {
    console.log(result);
}

const pc2 = 'CW39SS';
console.log('Postal code "' + pc2 + '" is valid? ' + postalCodes.validate('GB', pc2));

const pc3 = 'xxxcw39SS';
console.log('Postal code "' + pc3 + '" is valid? ' + postalCodes.validate('GB', pc3));

const pc4 = '1234-123';
console.log('Postal code "' + pc4 + '" is valid? ' + postalCodes.validate('PT', pc4));