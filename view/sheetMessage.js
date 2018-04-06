// sheetMessage.js
// message based on google sheet
// ================

//import
const Discord = require("discord.js");

const c = require("../general/constLoader");
const i18n = require('../general/langSupport');
const Spreadsheet = require('edit-google-spreadsheet');

// numbers of entries for each message
const BLOCK_SIZE = 20;

const showItem = (callback) => {
    
    var header = {
        debug: true,
        worksheetName: c.worksheetP1(),
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
                
                players.push(entry);
            }
            
            // array with all message objects
            var msgList = [];
            var content = "";
            
            var count = 0;
            
            //TODO: sort rows by score
            for (let row of players) {
                content = `${content}${row["name"]}: ${row["1"]} | ${row["2"]} | ${row["3"]} | ${row["4"]}\n`
                
                count = count + 1;
                if (count % BLOCK_SIZE == 0) {

                    let embed = new Discord.RichEmbed();
                    embed.addField(`Name | ${dates[0]} | ${dates[1]} | ${dates[2]} | ${dates[3]}`,content);
                    
                    msgList.push(embed);
                    content = "";
                }
            
            }
            
            if (count % BLOCK_SIZE != 0) {
                let embed = new Discord.RichEmbed();
                embed.addField(`Name | ${dates[0]} | ${dates[1]} | ${dates[2]} | ${dates[3]}`,content);
                msgList.push(embed);
            }
            callback(msgList);
          });
      });
}

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
    
    showEPList: showItem,
    addPlayer: player
};