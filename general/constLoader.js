// constLoader.js
// handle environment variable
// ==================

//load settings => auto fallback to example for heroku
var botSettings = {};
try {
    botSettings = require("../config/settings.json");
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
    console.log('settings.json not found. Loading default example_settings.json...');
    botSettings = require("../config/example_settings.json");
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

// worksheet name
var workSheetName = botSettings.googleSheet.workSheetName;
if (workSheetName == "") {
    // Heroku ENV token
    workSheetName = process.env.WORKSHEET_NAME;
}

// spreadsheet id
var spreadsheetId = botSettings.googleSheet.spreadsheetId;
if (spreadsheetId == "") {
    if (typeof process.env.SPREADSHEET_ID != 'undefined') {
        // Heroku ENV token
        spreadsheetId = process.env.SPREADSHEET_ID;
    }
}

// worksheet id
var worksheetId = botSettings.googleSheet.worksheetId;
if (worksheetId == "") {
    if (typeof process.env.WORKSHEET_ID != 'undefined') {
        // Heroku ENV token
        worksheetId = process.env.WORKSHEET_ID;
    }
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

// author information
var creator = botSettings.author;
if (creator == "") {
    // Heroku ENV token
    creator = process.env.AUTHOR;
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

const getWorkSheetName = () => {
    return workSheetName;
}

const getSpreadSheetId = () => {
    return spreadsheetId;
}

const getWorkSheetId = () => {
    return worksheetId;
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

const author = () => {
    return creator
}

const getVersion = () => {
    return botSettings.version;
} 

// export
module.exports = {
    botToken: getBotToken,
    prefix: getPrefix,
    restriction: getRestrictedRoles,
    language: lang,
    spreadSheetName: getSpreadSheetName,
    workSheetName: getWorkSheetName,
    spreadsheetId: getSpreadSheetId,
    worksheetId: getWorkSheetId,
    googleClientId: getGoogleClientId,
    googleClientSecret: getGoogleClientSecret,
    googleRefreshToken: getGoogleRefreshToken,
    author: author,
    version: getVersion
};