// sheetMessage.js
// message based on google sheet
// ================

//import
const Discord = require("discord.js");

const c = require("../general/constLoader");
const i18n = require('../general/langSupport');
const formatter = require('../general/contentFormatter');
const pdfTemplater = require('../general/pdfTemplater');
const Spreadsheet = require('edit-google-spreadsheet');

// numbers of entries for each message
const BLOCK_SIZE = 20;

const generateEPList = (playerName) => {
    
    let header = {
        debug: true,
        worksheetName: c.worksheetP1(),
        oauth2: {
          client_id: c.googleClientId(),
          client_secret: c.googleClientSecret(),
          refresh_token: c.googleRefreshToken()
        },
    };
    
    let sprId = c.spreadsheetId();
    
    if (sprId === "") {
        header["spreadsheetName"] = c.spreadSheetName();
    } else {
        header["spreadsheetId"] = sprId;
    }

    return new Promise(function(resolve, reject){
        Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
            spreadsheet.receive({getValues: true},function(err, rows, info) {
                if (err){
                    reject(err);
                    return;
                }

                let players = [];
                let dates = [];
                
                //prepare content for indexing
                const map = mapContent(rows);

                for (let row of Object.keys(rows)) {
                    let currentRow = rows[row];
                    let isHeader = (currentRow["6"] === 'Ø');

                    if (isHeader) {
                        //isHeader
                        dates = Object.values(currentRow);
                        continue;
                    }

                    if (isHeader || !playerName || playerName === currentRow["1"]) {
                        //@todo getPlayerByName structure
                        //getPlayerByName(map, playerName);
                        //getPlayerByIndex(map, 2);

                        let entry = {};
                        entry["name"] = currentRow["1"];

                        let hasNewlyJoined = currentRow["5"] === "-";
                        entry["4"] = currentRow["5"];

                        if (hasNewlyJoined) {
                            entry["3"] = "-";
                        } else {
                            hasNewlyJoined = currentRow["4"] === "-";
                            entry["3"] = currentRow["4"];
                        }


                        if (hasNewlyJoined) {
                            entry["2"] = "-";
                        } else {
                            hasNewlyJoined = currentRow["3"] === "-";
                            entry["2"] = currentRow["3"];
                        }

                        if (hasNewlyJoined) {
                            entry["1"] = "-";
                        } else {
                            hasNewlyJoined = currentRow["2"] === "-";
                            entry["1"] = currentRow["2"];
                        }

                        entry["avg"] = currentRow["6"];

                        players.push(entry);

                    }
                }

                return pdfTemplater.generateDocuments(dates, players).then(function(filePaths){
                    resolve(filePaths)
                });
            });
        });
    })
};


const findPlayer = (playerName) => {
    return generateEPList(playerName);
};

const player = (playerName, completion) => {
    
    var header = {
        debug: true,
        worksheetName: c.worksheetP2(),
        oauth2: {
          client_id: c.googleClientId(),
          client_secret: c.googleClientSecret(),
          refresh_token: c.googleRefreshToken()
        },
    }
    
    let sprId = c.spreadsheetId();
    
    if (sprId === "") {
        header["spreadsheetName"] = c.spreadSheetName();
    } else {
        header["spreadsheetId"] = sprId;
    }
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        // check number of available rows
        
        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            
            spreadsheet.receive({getValues: true},function(err, rows, info) {
              if(err) throw err;
              
              let firstRow = rows['1'];
              
              if (containsName(firstRow, playerName)) {
                  completion(`${i18n.get('FailedAddingPlayer')}`);
                  return;
              }
              
              const callback = function(column) {

                  var rowEntry = {};
                  
                  rowEntry[`${column}`] = playerName;
                  
                  spreadsheet.add({1:rowEntry});
                  spreadsheet.send(function(err) {
                    if(err) throw err;
                    
                    completion(`${i18n.get('SuccessfulAddingPlayer')}`);
                    
                  });
              };
              
              const rowItems = Object.keys(firstRow);
              
              var last = rowItems[rowItems.length - 1];
              if (parseInt(last) < metadata.colCount) {
                  // enough columns for inserting
                  callback(parseInt(last) + 1);
              } else {
                  spreadsheet.metadata({
                      colCount: metadata.colCount+1
                      }, function(err, metadata){
                        if(err) throw err;
                        callback(parseInt(last) + 1);

                      });
              }
            });
        });
    });
}

const checkout = (user, message, completion) => {
    
    var header = {
        debug: true,
        worksheetName: c.worksheetP4(),
        oauth2: {
          client_id: c.googleClientId(),
          client_secret: c.googleClientSecret(),
          refresh_token: c.googleRefreshToken()
        },
    }
    
    let sprId = c.spreadsheetId();
    
    if (sprId === "") {
        header["spreadsheetName"] = c.spreadSheetName();
    } else {
        header["spreadsheetId"] = sprId;
    }
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        // check number of available rows
        
        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            
            spreadsheet.receive({getValues: true},function(err, rows, info) {
              if(err) throw err;
              
              
              const callback = function(row) {

                  var rowEntry = {};
                  
                  rowEntry["1"] = user;
                  rowEntry["2"] = `${formatter.dateToString(new Date())}`;
                  rowEntry["5"] = message;
                  
                  
                  var rowData = {};
                  rowData[`${row}`] = rowEntry;
                  
                  spreadsheet.add(rowData);
                  spreadsheet.send(function(err) {
                    if(err) throw err;
                    completion(`${i18n.get('SuccessfulCheckoutMessage')}`);
                  });
              };
              
              const rowItems = Object.keys(rows);
              var last = rowItems[rowItems.length - 1];
              if (parseInt(last) < metadata.rowCount) {
                  // enough rows for inserting
                  callback(parseInt(last) + 1);
              } else {
                  spreadsheet.metadata({
                      rowCount: metadata.rowCount+1
                    }, function(err, metadata){
                        if(err) throw err;
                        callback(parseInt(last) + 1);
                    });
              }
            });
        });
    });
}

const backup = (user, completion) => {
    
    
    var header = {
        debug: true,
        worksheetName: c.worksheetP2(),
        oauth2: {
          client_id: c.googleClientId(),
          client_secret: c.googleClientSecret(),
          refresh_token: c.googleRefreshToken()
        },
    }
    
    let sprId = c.spreadsheetId();
    
    if (sprId === "") {
        header["spreadsheetName"] = c.spreadSheetName();
    } else {
        header["spreadsheetId"] = sprId;
    }
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
          spreadsheet.receive({getValues: true},function(err, rows, info) {
            if(err) throw err;
            
            var index = null;
            
            let nameList = rows["1"];
            
            
            for (let k of Object.keys(nameList)) {
                if (nameList[k] === user) {
                    index = k;
                    break;
                }
            }
            
            if (index == null) {
                completion(null);
                return;
            } else {
                
                var n = {};
                n[index] = user;
                var updateMap = {"1":n};
                
                for (let k of Object.keys(rows)) {
                    
                    //ignore header row
                    if (k != "1") {
                        
                        //row position
                        let rowPos = k;
                        
                        let singleRow = rows[k];
                        
                        if (singleRow.hasOwnProperty(index)) {
                            var rowValue = {};
                            rowValue[index] = singleRow[index];
                            updateMap[k] = rowValue;
                        } else {
                            continue;
                        }
                    }
                }
                
                var delMap = {};
                
                for (let k of Object.keys(updateMap)) {
                
                    var rowEntry = {};
                    rowEntry[index] = "";
                
                    delMap[k] = rowEntry;
                }
            
                //remove entry
                spreadsheet.add(delMap);
                spreadsheet.send(function(err) {
                  if(err) throw err;
                  
                  //back up player in archieve
                  storePlayer(updateMap,index, completion);
                });
                
            }
          });
      });
}

const storePlayer = (playerData,index, completion) => {
    var header = {
        debug: true,
        worksheetName: c.worksheetP3(),
        oauth2: {
          client_id: c.googleClientId(),
          client_secret: c.googleClientSecret(),
          refresh_token: c.googleRefreshToken()
        },
    }
    
    let sprId = c.spreadsheetId();
    
    if (sprId === "") {
        header["spreadsheetName"] = c.spreadSheetName();
    } else {
        header["spreadsheetId"] = sprId;
    }
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        // check number of available rows
        
        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            
            spreadsheet.receive({getValues: true},function(err, rows, info) {
              if(err) throw err;
              
              let firstRow = rows['1'];
              
              const callback = function(column) {

                  var pData = playerData;
                  
                  //update column
                  for (let k of Object.keys(pData)) {
                      
                      let r = pData[k];
                      
                      var rowData = {};
                      rowData[column] = r[index];
                      pData[k] = rowData;
                  }
                  
                  spreadsheet.add(pData);
                  spreadsheet.send(function(err) {
                    if(err) throw err;

                      completion(`${i18n.get('SuccessfulBackupPlayer')}`);

                  });
              };
              
              const rowItems = Object.keys(firstRow);
              
              var last = rowItems[rowItems.length - 1];
              if (parseInt(last) < metadata.colCount) {
                  // enough columns for inserting
                  callback(parseInt(last) + 1);
              } else {
                  spreadsheet.metadata({
                      colCount: metadata.colCount+1
                      }, function(err, metadata){
                        if(err) throw err;
                        callback(parseInt(last) + 1);

                      });
              }
            });
        });
    });
}


/**
 * Prepare content for indexing
 * @private
 * @param {Object} content input from server request
 * @returns map with two keys: header: contains header as array, body: array with player values (array) 
 * @type Object
 */
function mapContent(content) {
    // {'header','body'}
    
    var map = {'header':[],'body':[]};
    
    var players = [];
    
    
    for (let row of Object.keys(content)) {
        
        let r = content[row];
        
        if (r["6"] === 'Ø') {
            // collect header cell content
            //TODO: r instead of every cell?
            map['header'] = [r["2"],r["3"],r["4"],r["5"]]
            continue;
        } else {
            var body = [];
            
            //check whether newly joined
            var isNewMember = r['5'] == '-';
            
            // push latest
            body.push(r['5']);
            
            for (var i=4;i>=2;i--) {
                if (isNewMember) {
                    body.push('-');
                } else {
                    isNewMember = r[`${i}`] == "-";
                    body.push(r[`${i}`]);
                }
            }
            
            //name
            body.push(r['1']);
            
            map['body'].push(body.reverse());
        }
    }
    return map;
}

/**
 * Find data row by given index
 * @private
 * @param {Object} data map with sheet content
 * @param {number} position row index
 * @returns array for matching position, or null if invalid data or position is invalid 
 * @type Object
 */
function getPlayerByIndex(data,position) {
    //invalid data
    if (data == undefined || data == null) {
        return null;
    } else {
        // array bounds exception
        if (position < 0 || position >= data.body.length) {
            return null;
        } else {
            return data.body[position];
        }
    }
}


/**
 * Find data row by given name
 * @private
 * @param {Object} data map with sheet content
 * @param {string} searching name
 * @returns array for matching position, or null if invalid data or name 
 * @type Object
 */
function getPlayerByName(data, name) {
    //invalid data / name
    if (data == undefined || data == null || name == null || name.length == 0) {
        return null;
    } else {
        return data.body.find(function(element) {
            return element[0] == name;
        });
    }
}

function containsName(header, name) {
    
    for (let k of Object.keys(header)) {
        if (header[k] === name) {
            return true;
        }
    }
    return false;
}

// export
module.exports = {
    generateEPList: generateEPList,
    addPlayer: player,
    checkout: checkout,
    findByName: findPlayer,
    backup: backup
};