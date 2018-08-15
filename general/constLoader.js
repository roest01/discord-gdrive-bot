// constLoader.js
// handle environment variable
// ==================

//load settings => auto fallback to example for heroku
var botSettings = {};
const exampleSettings = require("../config/example_settings.json");

try {
    botSettings = require("../config/settings.json");
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
    console.log('settings.json not found. Loading default example_settings.json...');
    botSettings = exampleSettings;
}

//Bot Token
var botToken = botSettings.token;
if (botToken == "") {
    // Heroku ENV token
    botToken = process.env.BOT_TOKEN;
}

// default language
var language = botSettings.lang;
if (language == "") {
    if (process.env.LANG != null && process.env.LANG != "") {
        // Heroku ENV token
        language = process.env.LANG;
    } else {
        //default language EN
        language = 'en';
    }
}

// spreadsheet name
var spreadSheetName = botSettings.googleSheet.spreadSheetName;
if (spreadSheetName == "") {
    // Heroku ENV token
    spreadSheetName = process.env.SPREADSHEET_NAME;
}

// spreadsheet id
var spreadsheetId = botSettings.googleSheet.spreadsheetId;
if (spreadsheetId == "") {
    if (typeof process.env.SPREADSHEET_ID != 'undefined') {
        // Heroku ENV token
        spreadsheetId = process.env.SPREADSHEET_ID;
    }
}

// worksheet Page 1
var worksheetP1 = botSettings.googleSheet.worksheetP1;
if (worksheetP1 == "") {
    // Heroku ENV token
    worksheetP1 = process.env.WORKSHEET_P1;
}

// worksheet Page 2
var worksheetP2 = botSettings.googleSheet.worksheetP2;
if (worksheetP2 == "") {
    // Heroku ENV token
    worksheetP2 = process.env.WORKSHEET_P2;
}

// worksheet Page 3
var worksheetP3 = botSettings.googleSheet.worksheetP3;
if (worksheetP3 == "") {
    // Heroku ENV token
    worksheetP3 = process.env.WORKSHEET_P3;
}

// worksheet Page 4
var worksheetP4 = botSettings.googleSheet.worksheetP4;
if (worksheetP4 == "") {
    // Heroku ENV token
    worksheetP4 = process.env.WORKSHEET_P4;
}

// worksheet Page 5
var worksheetP5 = botSettings.googleSheet.worksheetP5;
if (worksheetP5 == "") {
    // Heroku ENV token
    worksheetP5 = process.env.WORKSHEET_P5;
}

// worksheet Page 6
var worksheetP6 = botSettings.googleSheet.worksheetP6;
if (worksheetP6 == "") {
    // Heroku ENV token
    worksheetP6 = process.env.WORKSHEET_P6;
}


var googleClientId = botSettings.googleSheet.client_id;
if (googleClientId == "") {
    // Heroku ENV token
    googleClientId = process.env.CLIENT_ID;
}

var googleClientSecret = botSettings.googleSheet.client_secret;
if (googleClientSecret == "") {
    // Heroku ENV token
    googleClientSecret = process.env.CLIENT_SECRET;
}

var googleRefreshToken = botSettings.googleSheet.refresh_token;
if (googleRefreshToken == "") {
    // Heroku ENV token
    googleRefreshToken = process.env.REFRESH_TOKEN;
}

const getBotToken = () => {
    return botToken;
}

//load prefix
const getPrefix = () => {
    return botSettings.prefix;
}

// roles for accessing special features
const getRestrictedRoles = () => {
    return botSettings.restricted;
}

const lang = () => {
    return language;
}

const getSpreadSheetName = () => {
    return spreadSheetName;
}

const getSpreadSheetId = () => {
    return spreadsheetId;
}

const getworksheetP1 = () => {
    return worksheetP1;
}

const getworksheetP2 = () => {
    return worksheetP2;
}

const getworksheetP3 = () => {
    return worksheetP3;
}

const getworksheetP4 = () => {
    return worksheetP4;
}

const getworksheetP5 = () => {
    return worksheetP5;
}

const getworksheetP6 = () => {
    return worksheetP6;
}

const getGoogleClientId = () => {
    return googleClientId;
}

const getGoogleClientSecret = () => {
    return googleClientSecret;
}

const getGoogleRefreshToken = () => {
    return googleRefreshToken;
}

// author information
const author = () => {
    return exampleSettings.author;
}

const getVersion = () => {
    return exampleSettings.version;
}

// export
module.exports = {
    botToken: getBotToken,
    prefix: getPrefix,
    restriction: getRestrictedRoles,
    language: lang,
    spreadSheetName: getSpreadSheetName,
    spreadsheetId: getSpreadSheetId,
    worksheetP1: getworksheetP1,
    worksheetP2: getworksheetP2,
    worksheetP3: getworksheetP3,
    worksheetP4: getworksheetP4,
    worksheetP5: getworksheetP5,
    worksheetP6: getworksheetP6,
    googleClientId: getGoogleClientId,
    googleClientSecret: getGoogleClientSecret,
    googleRefreshToken: getGoogleRefreshToken,
    author: author,
    version: getVersion
};