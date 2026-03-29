'use strict';

const path = require('path');

module.exports = function getFormat(postalCodeFormat) {
    //use eval(require) to workaround webpack which can't require dynamic path
    return eval('require')(path.join(__dirname, 'formats', postalCodeFormat));
};