// gsheetControl.js
// handle api requests to google docs
// ================

//import 
const Spreadsheet = require('edit-google-spreadsheet');
const c = require("./constLoader");

// singleton instance for caching page tokens
var SheetCache = (function () {
    var instance;
    
    function initInstance() {
        // cached tags
        var sheetTokenMap = {};
        var pageTokenMap = {};
        
        return {
            addSheetToken: function(page, token) {
                
                if (page != null) {
                    sheetTokenMap[page] = token;
                }
                return;
            },
            getSheetToken: function(page) {
                
                if (sheetTokenMap.hasOwnProperty(page)) {
                    return sheetTokenMap[page];
                } else {
                    return null;
                }
            },
            addPageToken: function(page, token) {
                
                if (page != null) {
                    pageTokenMap[page] = token;
                }
                return;
            },
            getPageToken: function(page) {
                
                if (pageTokenMap.hasOwnProperty(page)) {
                    return pageTokenMap[page];
                } else {
                    return null;
                }
            }
        }
    }
    return {
        getInstance: function() {
            if (!instance) {
                instance = initInstance();
            }
            return instance;
        } 
    };
})();

/**
 * Prepare header for server request
 * @private
 * @param {sheetName} name of the target loading sheet page
 * @returns request header for google sheet
 * @type Object
 */
function getRequestHeaderForSheet(sheetName) {

    var header = {
        debug: true,
        worksheetName: sheetName,
        oauth2: {
          client_id: c.googleClientId(),
          client_secret: c.googleClientSecret(),
          refresh_token: c.googleRefreshToken()
        },
    }
    
    let sprId = c.spreadsheetId();
    
    //override by config
    if (sprId === "") {
        header["spreadsheetName"] = c.spreadSheetName();
    } else {
        header["spreadsheetId"] = sprId;
    }

    // used existing cache token for faster access
    if (SheetCache.getInstance().getSheetToken(c.spreadSheetName())!=null) {
        header["worksheetId"] = SheetCache.getInstance().getSheetToken(c.spreadSheetName());
    }

    if (SheetCache.getInstance().getPageToken(sheetName)!=null) {
        header["spreadsheetId"] = SheetCache.getInstance().getPageToken(sheetName);
    }
    return header;
}

function getGuildmembers(page, completion) {

    //get first page
    const header = getRequestHeaderForSheet(page);
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {

        //cache ID for later use
        SheetCache.getInstance().addSheetToken(c.spreadSheetName(),spreadsheet.worksheetId);
        SheetCache.getInstance().addPageToken(page,spreadsheet.spreadsheetId);

        spreadsheet.receive({getValues: true},function(err, rows, info) {
            if(err) throw err;

            var playerList = [];
            // prepare player list
            if (Object.keys(rows).length > 0) {

                const firstRow = Object.keys(rows)[0];
                for (let value of Object.values(rows[firstRow])) {
                    playerList.push(value);
                }
    
                if (playerList.length == 0) {
                    if (completion == null) {return;}
                    completion(null);
                    return;
                } else {
                    playerList.sort(function (a, b) {
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    });
                }
                if (completion == null) {return;}
                completion(playerList);
            } else {
                // no entries
                if (completion == null) {return;}
                completion(playerList);
            }
        });
    });
}

function getGuildmemberByName(name, page, completion) {

    //get first page
    const header = getRequestHeaderForSheet(page);
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {

        //cache ID for later use
        SheetCache.getInstance().addSheetToken(c.spreadSheetName(),spreadsheet.worksheetId);
        SheetCache.getInstance().addPageToken(page,spreadsheet.spreadsheetId);

        spreadsheet.receive({getValues: true},function(err, rows, info) {
            if(err) throw err;

            var playerData = {};
            // prepare player list
            if (Object.keys(rows).length > 1) {

                // find column
                const nameRow = Object.values(rows[Object.keys(rows)[0]]);
                var index = -1;
                for (let k of Object.keys(rows[Object.keys(rows)[0]])) {
                    const mappedName = rows[Object.keys(rows)[0]][k];
                    if (mappedName == name) {
                        index = k;
                        break;
                    }
                }

                if (index < 0) {
                    if (completion == null) {return;}
                    completion(null);
                    return;
                }

                for (let value of Object.values(rows)) {
                    if (value[index] == name) continue;

                    if (value.hasOwnProperty(index)) {
                        playerData[value[1]] = value[index];
                    } 
                }
                if (completion == null) {return;}
                completion(playerData);
            } else {
                // no data
                if (completion == null) {return;}
                completion(playerData);
            }
        });
    });
}

const getMembers = (active, completion) => {
    if (active) {
        // active
        getGuildmembers(c.worksheetP2(), completion);
    } else {
        // inactive
        getGuildmembers(c.worksheetP3(), completion);
    }
}

// fetch player column data
const getMember = (name, active, completion) => {
    if (active) {
        getGuildmemberByName(name, c.worksheetP2(), completion);
    } else {
        getGuildmemberByName(name, c.worksheetP3(), completion);
    }
}

// export
module.exports = {
    members: getMembers,
    member: getMember
};