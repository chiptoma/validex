'use strict';

const fs = require('fs');
const path = require('path');
const formatsWeb = require('../formats-web');
const expect = require('chai').expect;

describe('formats-web.js', function () {

    const formatsDirectory = path.join(__dirname, '..', 'formats');
    fs.readdir(formatsDirectory, function (err, files) {
        if (err) {
            throw new Error('Unable to list files in formats directory');
        }
        
        files.forEach(function(filename) {
            it(`should require ${filename}`, function() {
                expect(formatsWeb(filename)).to.be.ok;
            });
        });
    });

});
