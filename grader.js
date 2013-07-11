#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var getLocalFile = function(htmlFile) {
    return fs.readFileSync(htmlFile);
};

var loadChecks = function(checksFile) {
    return JSON.parse(fs.readFileSync(checksFile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    //$ = cheerioHtmlFile(htmlfile);
    $ = cheerio.load(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);
    }
    return instr;
};

var getHtmlFile = function(fileUrl, checksFile) {
    rest.get(fileUrl).on('complete', function(result) {
        if (result instanceof Error) {
            console.log("Error getting %s, retrying...", fileUrl);
            console.log(result.message);
            this.retry(1000);
        } else {
            var checkJson = checkHtmlFile(result.toString(), checksFile);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        }
    });
    return fileUrl.toString();
};

var getHtmlUrl = function(urlName) {
    return urlName.toString();
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // https://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json',
        clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html',
        clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <heroku URL>', 'Heroku URL',
        clone(getHtmlUrl))
        .parse(process.argv);
    //var checkJson;
    if (program.url) {
        console.log("Program has a url: %s", program.url);
        getHtmlFile(program.url, program.checks);
    } else {
        console.log("Program has a file: %s", program.file);
        var checkJson = checkHtmlFile(getLocalFile(program.file), 
            program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
