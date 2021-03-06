// sheetMessage.js
// message based on google sheet
// ================

//import
const Discord = require("discord.js");
const _ = require("lodash");
const Taffy = require("taffy");

const c = require("../general/constLoader");
const i18n = require('../general/langSupport');
const formatter = require('../general/contentFormatter');
const pdfTemplater = require('../general/pdfTemplater');
const Spreadsheet = require('edit-google-spreadsheet');

const log =require('loglevel');


// numbers of entries for each message
const BLOCK_SIZE = 20;

const EPList = function() {
    let epList = this;
    epList.options = {};

    epList.__construct = function(){
        let sprId = c.spreadsheetId();

        epList.header = {
            debug: true,
            worksheetName: c.worksheetP1(),
            oauth2: {
                client_id: c.googleClientId(),
                client_secret: c.googleClientSecret(),
                refresh_token: c.googleRefreshToken()
            },
        };

        if (sprId === "") {
            epList.header["spreadsheetName"] = c.spreadSheetName();
        } else {
            epList.header["spreadsheetId"] = sprId;
        }
    };
    epList.__construct();

    epList._loadData = function(){
        return new Promise(function(resolve, reject){
            Spreadsheet.load(epList.header, function sheetReady(err, spreadsheet) {
                spreadsheet.receive({getValues: true}, function(err, rows, info) {
                    if (err){
                        reject(err);
                        return false;
                    }
                    resolve(rows);
                });
            });
        });
    };

    epList.getData = function(){
        return new Promise(function (resolve, reject) {
            epList._loadData().then(function(dataRows) {
                let dates = [];
                let players = [];
                _.each(dataRows, function(currentRow){
                    let isHeader = (currentRow["6"] === 'Ø');

                    if (isHeader) {
                        //isHeader
                        dates = Object.values(currentRow);
                        return;
                    }

                    if (currentRow[5] === "-"){
                        currentRow[4] = "-";
                        currentRow[3] = "-";
                        currentRow[2] = "-";
                    }
                    if (currentRow[4] === "-"){
                        currentRow[3] = "-";
                        currentRow[2] = "-";
                    }
                    if (currentRow[3] === "-"){
                        currentRow[2] = "-";
                    }

                    players.push({
                        name: currentRow["1"],
                        avg: currentRow["6"],
                        week1: currentRow["2"],
                        week2: currentRow["3"],
                        week3: currentRow["4"],
                        week4: currentRow["5"]
                    });
                });

                // sort by last week entry
                players.sort(sortPlayer);

                let fs = require('fs');

                let memberFilePath = 'resources/members.json';

                fs.writeFile(memberFilePath, JSON.stringify(players), 'utf8', function(e){
                    log.debug(memberFilePath + " file written", e);
                });

                epList.players = new Taffy(players);
                epList.dates = dates;
                resolve();
            }).catch(function(e){
                reject(e);
            });
        });
    };

    epList.generatePNG = function(playerName){
        return new Promise(function(resolve, reject){
            epList.getData().then(function(){
                var players = epList.players();

                if (!!playerName){
                   players = epList.filterPlayersByName(players.order("week4 asc"), playerName);
                }

                if (players.count() < 2){ //header == 1
                    reject(i18n.get('PlayerNotFound'));
                    //only header found
                }

                return pdfTemplater.generateDocuments(epList.dates, players, epList.options)
                    .then(function(filePath){
                        resolve(filePath)
                    }).catch(reject);
            });
        });
    };

    epList.filterPlayersByName = function(players, playerName){
        epList.options.markRow = {
            field: "name",
            value: playerName
        };
        let specificPlayer = epList.players({name:playerName});
        let gtPlayers = epList.players({week4: {gt: specificPlayer.first().week4}}).order("week4").limit(1);
        let ltPlayers = epList.players({week4: {lt: specificPlayer.first().week4}}).limit(1);

        let nameBasedSearch = [{
            name: specificPlayer.first().name
        }];
        gtPlayers.each(function(gtP){
            nameBasedSearch.push({name: gtP.name});
        });
        ltPlayers.each(function(ltP){
            nameBasedSearch.push({name: ltP.name});
        });

        return epList.players(nameBasedSearch).order("week4 asc");
    }
};

/**
 * Desc sort
 * @param {player} a 
 * @param {player} b 
 */
function sortPlayer(a,b) {

    if (a.week4 == "-" && b.week4 != "-") return 1;
    if (b.week4 == "-" && a.week4 != "-") return -1;

    if (a.week4 > b.week4) return -1;
    if (b.week4 > a.week4) return 1;
    return 0;
}

const player = (playerName, completion) => {
    playerData(playerName, null, completion);
}

const players = (list, completion) => {

    const callback = function(playerName, success, finished) {
        completion(playerName, success, false);
        const slicedList = list.slice(1,list.length);
        players(slicedList, completion);
    }

    if (list.length > 1) {
        playerData(list[0], null, callback); 
    } else {
        if (list.length == 0) {
            playerData(null, null, completion);
        } else {
            playerData(list[0], null, completion);
        }
    }
}

const time = (completion) => {

    let header = getRequestHeaderForSheet(c.worksheetP2());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        // check number of available rows
        
        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            
            spreadsheet.receive({getValues: true},function(err, rows, info) {
                if(err) throw err;
              
                //let firstRow = rows['1'];

                let lastRowIndex = Object.keys(rows).length;
                let lastRow = rows[`${lastRowIndex}`];
                let lastRowDate = lastRow[1];
                
                let meta = metadata;

                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1; //January is 0!
                var yyyy = today.getFullYear();

                if (dd < 10) {
                    dd = '0' + dd;
                }

                if (mm < 10) {
                    mm = '0' + mm;
                }

                if (lastRowDate != null) {
                    let elements = lastRowDate.split('.');
                    if (elements.length == 3) {
                        if (parseInt(elements[0])==parseInt(dd) &&
                            parseInt(elements[1])==parseInt(mm) &&
                            parseInt(elements[2])==parseInt(yyyy)) {
                            completion(`${i18n.get('FailedAlreadyExistDate')}`);
                            return;
                        }
                    }
                }

                if (lastRowIndex < meta.rowCount) {
                    // enough empty rows for inserting new row content

                    var timeMap = {};
                    timeMap[lastRowIndex+1] = {1:mm + '.' + dd + '.' + yyyy};

                    spreadsheet.add(timeMap);
 
                    spreadsheet.send(function(err) {
                    if(err) throw err;
                        completion(`${i18n.get('SuccessfulAddTime')}`);
                    });
                } else {
                    // adjust sheet size
                    let callback = function () {

                        var timeMap = {};
                        timeMap[lastRowIndex+1] = {1:mm + '.' + dd + '.' + yyyy};

                        spreadsheet.add(timeMap);
    
                        spreadsheet.send(function(err) {
                        if(err) throw err;
                            completion(`${i18n.get('SuccessfulAddTime')}`);
                        });
                    };

                    spreadsheet.metadata({
                        rowCount: metadata.rowCount+1
                        }, function(err, metadata){
                            if(err) throw err;
                            callback();
    
                    });
                    
                }

            });
        });
    });
}

const rename = (playerName, updateName, completion) => {

    //TODO: in dev
    if (playerName==null || updateName==null ) {
        completion(`${i18n.get('PlayerNotFound')}`);
        return;
    }

    let header = getRequestHeaderForSheet(c.worksheetP2());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        // check number of available rows
        
        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            
            spreadsheet.receive({getValues: true},function(err, rows, info) {
                if(err) throw err;
              
                let firstRow = rows['1'];
              
                if (!containsName(firstRow, playerName)) {
                    completion(`${i18n.get('PlayerNotFound')}`);
                    return;
                }
                let array = Object.keys(firstRow);
                let firstNameIndex = array[0];
                let lastNameIndex = array[array.length - 1];
                var emptySlot = -1;
              
                for (var index = 0; index < array.length; index++) {

                    let mapIndex = array[index];
                    let value = firstRow[mapIndex];

                    let mapKey = parseInt(mapIndex);

                    if (value == playerName) {
                        var updateMap = {};
                        updateMap[mapKey] = updateName;

                        spreadsheet.add({ 1: updateMap});
 
                        spreadsheet.send(function(err) {
                        if(err) throw err;
                            completion(`${i18n.get('SuccessRenameingPlayer')}`);
                        });
                    }
                }
            });
        });
    });
}

const checkUuid = (uuid, completion) => {

    if (uuid == null || uuid.length == 0) {
        completion(`${i18n.get('PlayerNotFound')}`);
        return;
    }

    let header = getRequestHeaderForSheet(c.worksheetP7());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {

        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            
            spreadsheet.receive({getValues: true},function(err, rows, info) {
                if(err) throw err;
                
                let firstRow = rows['1'];

                for (var rowIndex=2;rowIndex < metadata.rowCount;rowIndex++) {

                    let row = rows[`${rowIndex}`];

                    if (row!=null && row.hasOwnProperty('1')) {
                        if (uuid == row['1']) {
                            let embed = new Discord.RichEmbed();
                            embed.setTitle(uuid);
                            embed.addField(`${firstRow['2']}`,`${row['2']}`);

                            if (row.hasOwnProperty('3')) {
                                embed.addField(`${firstRow['3']}`,`${row['3']}`);
                            }

                            completion(embed);
                            return;
                        }
                    }

                }

                completion(`${i18n.get('PlayerNotFound')}`);
            });
        });
    });
}

const playerData = (playerName, data, completion) => {
    
    if (playerName == null || playerName.length == 0) {
        completion(playerName,false ,true);
        return;
    }

    let header = getRequestHeaderForSheet(c.worksheetP2());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        // check number of available rows
        
        spreadsheet.metadata(function(err, metadata){
            if(err) throw err;
            
            spreadsheet.receive({getValues: true},function(err, rows, info) {
              if(err) throw err;
              
              let firstRow = rows['1'];
              
              if (containsName(firstRow, playerName)) {
                completion(playerName,false ,true);
                  return;
              }
              let array = Object.keys(firstRow);
              let firstNameIndex = array[0];
              let lastNameIndex = array[array.length - 1];
              var emptySlot = -1;

              for (var colIndex = firstNameIndex; colIndex < lastNameIndex;colIndex++) {
                if (!firstRow.hasOwnProperty(`${colIndex}`)) {
                    emptySlot = colIndex;
                    break;
                }
              }

              const callback = function(column) {

                if (data == null) {
                    var rowEntry = {};
                  
                    rowEntry[`${column}`] = playerName;
                    spreadsheet.add({1:rowEntry});
                } else {
                    var editedData = {};

                    for (let row of Object.keys(data)) {
                        let value = data[row];
                        for (let u of Object.values(data[row])) {
                            var rowEntry = {};
                            rowEntry[`${column}`] = u;
                            editedData[`${row}`] = rowEntry;
                        }

                    }

                    spreadsheet.add(editedData);
                }
                spreadsheet.send(function(err) {
                    if(err) throw err;
                    if (data == null) {
                        completion(playerName,true ,true);
                    }
                    
                });
            };
            
            // free slot available
            if (emptySlot > 0) {
                callback(emptySlot);
                return;
            }

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
// backup target player
const backup = (user, completion) => {

    let header = getRequestHeaderForSheet(c.worksheetP2());
    
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
                completion(user, false);
                return;
            } else {
                
                var n = {};
                n[index] = user;
                var updateMap = {"1":n};
                
                for (let k of Object.keys(rows)) {
                    
                    //ignore header row
                    if (k != "1") {
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

// copy deleted player into archieve
const storePlayer = (playerData,index, completion) => {

    let header = getRequestHeaderForSheet(c.worksheetP3());
    
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
                  
                  const playerName = Object.values(Object.values(pData)[0])[0];

                  spreadsheet.add(pData);
                  spreadsheet.send(function(err) {
                    if(err) throw err;

                      completion(playerName, true);

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

// restore an existing player from backup sheet
const restore = (user, completion) => {

    //check whether enough space is available (restriction 50 members)
    const callback = function(players) {
        if (players.length < 50) {
            let header = getRequestHeaderForSheet(c.worksheetP3());
            
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
                        completion(user, false,false);
                        return;
                    } else {

                        var n = {};
                        n[index] = user;
                        var updateMap = {"1":n};
                        
                        for (let k of Object.keys(rows)) {
                            
                            //ignore header row
                            if (k != "1") {
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
                            
                            //restore player in overview
                            playerData(user, updateMap, completion);
                        });

                        completion(user, true, false);

                    }
                });
            });
        } else {
            // guild is already full
            completion(user, false, true);
        }
    };
    getGuildMembers(callback);
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
        if (`${header[k]}` === `${name}` ) {
            return true;
        }
    }
    return false;
}

const findPlayer = (playerName, completion) => {
    
    let header = getRequestHeaderForSheet(c.worksheetP1());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
          spreadsheet.receive({getValues: true},function(err, rows, info) {
            if(err) throw err;
            
            var players = [];
            var dates = [];
            
            for (let row of Object.keys(rows)) {
                
                let r = rows[row];
                
                if (r["6"] === 'Ø') {
                    dates.push(r["2"]);
                    dates.push(r["3"]);
                    dates.push(r["4"]);
                    dates.push(r["5"]);
                    continue;
                }
                
                if (playerName === r["1"]) {
                    var entry = {};
                    entry["name"] = r["1"];
                
                    var hasNewlyJoined = r["5"] == "-";
                    entry["4"] = r["5"];
                
                    if (hasNewlyJoined) {
                        entry["3"] = "-";
                    } else {
                        hasNewlyJoined = r["4"] == "-";
                        entry["3"] = r["4"];
                    }
                
                
                    if (hasNewlyJoined) {
                        entry["2"] = "-";
                    } else {
                        hasNewlyJoined = r["3"] == "-";
                        entry["2"] = r["3"];
                    }
                
                    if (hasNewlyJoined) {
                        entry["1"] = "-";
                    } else {
                        hasNewlyJoined = r["2"] == "-";
                        entry["1"] = r["2"];
                    }
                
                
                    entry["avg"] = r["6"];
                
                    let content = `${entry["name"]}: ${entry["1"]} | ${entry["2"]} | ${entry["3"]} | ${entry["4"]}\n`
                    let embed = new Discord.RichEmbed();
                    embed.addField(`Name | ${dates[0]} | ${dates[1]} | ${dates[2]} | ${dates[3]}`,content);
                    completion(embed);
                    return;
                }
            }
            
            completion(null);
          });
      });
}

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
    
    if (sprId === "") {
        header["spreadsheetName"] = c.spreadSheetName();
    } else {
        header["spreadsheetId"] = sprId;
    }
    return header;
}

function getGuildMembers(completion) {
    
    //get first page
    const header = getRequestHeaderForSheet(c.worksheetP5());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        spreadsheet.receive({getValues: true},function(err, rows, info) {
            if(err) throw err;

            var playerList = [];
            // prepare players
            for (let row of Object.keys(rows)) {
                let r = rows[row];
                if (r['1'] != undefined && row != 1) {
                    // check for archieved players
                    if (r['2'] === '#N/A') {
                        continue;
                    }
                    playerList.push(r['1']);
                }
            }

            if (playerList.length == 0) {
                completion(null);
                return;
            } else {
                playerList.sort(function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
            }
            completion(playerList);
        });
    });
}

// method for showing list of all active members
const members = (completion) => {
    const callback = function(players) {
        
        if (players.length == 0) {
            completion(null);
        } else {

            // player names
            var playerNames = "";
            var index = 1;
            for (let name of players) {
                playerNames = playerNames + index+". " + name + "\n";
                index = index + 1;
            }

            let embed = new Discord.RichEmbed();
            embed.setTitle(`${i18n.get('DisplayActiveMembers')} [${players.length}]`);
            embed.addField(`Name`,playerNames);

            completion(embed);
        }
    };
    getGuildMembers(callback);
}

// method to get last 4 dates
const recentDates = (completion) => {
   
    //get first page
    const header = getRequestHeaderForSheet(c.worksheetP1());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        spreadsheet.receive({getValues: true},function(err, rows, info) {
            if(err) throw err;

            var timeList = [];
            for (let row of Object.keys(rows)) {
                let columns = rows[row];

                for (let c of Object.keys(columns)) {
                    if (c > 1 && c < 6) {
                        let date = columns[c];
                        timeList.push(date);
                    }
                }
                break;
            }
            completion(timeList);
        });
    });
}

// method for showing list of all recorded smurfs
const smurfs = (completion) => {
    
    //get first page
    const header = getRequestHeaderForSheet(c.worksheetP6());
    
    Spreadsheet.load(header, function sheetReady(err, spreadsheet) {
        spreadsheet.receive({getValues: true},function(err, rows, info) {
            if(err) throw err;

            let embed = new Discord.RichEmbed();
            embed.setTitle(`${i18n.get('InfoSmurfsList')}`);

            var playerList = [];
            // prepare players
            for (let row of Object.keys(rows)) {

                let r = rows[row];

                //skip first row
                if (r['1'] != undefined && row != 1) {

                    var smurfList = "";

                    for (var c of Object.values(r)) {
                        if (c != r['1']) {
                            if (smurfList == "") {
                                smurfList = c;
                            } else {
                                smurfList = smurfList + ", " + c;
                            }
                        }
                    }

                    embed.addField(r['1'],smurfList);
                }
            }
            completion(embed);
        });
    });
};

// export
module.exports = {
    EPList: EPList,
    addPlayer: player,
    addPlayers: players,
    addTime: time,
    checkout: checkout,
    checkUuid: checkUuid,
    findByName: findPlayer,
    backup: backup,
    restore: restore,
    members: members,
    smurfs: smurfs,
    renamePlayer:rename,
    recentDates:recentDates
};