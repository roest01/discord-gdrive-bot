// migrateMySQL.js
// Handle the migration between Google Doc and mySQL
// ==================

//import
const c = require("./general/constLoader");
const gsheet = require("./general/gsheetControl");
const dbConnector = require("./general/dbHandlerMySQL");

const DEFAULT_IMPORT_GUILD_NAME = 'EuroElite';
const DEFAULT_IMPORT_GUILD_TAG = 'EuE';

const host = c.storageHost(), login = c.storageLogin(), password = c.storagePwd() ,database = c.storageDb();

//init db connection
dbConnector.connectTo(host, login, password, database);

// SELECT * FROM PLAYER
const selectAllPlayerCallback = (list, completion) => {
    const dbRequestSelectPlayer = (error, result , fields) => {
        var playerList = Array.from(list);
        for (const playerDB of result) {
            const name = playerDB.name;
            if (playerList.indexOf(name) >=0) {
                playerList.splice(playerList.indexOf(name),1);
                //console.log(`${name} already exist.`)
            }
        }
        completion(playerList);
    }
    dbConnector.executeQuery('SELECT * FROM PLAYER', dbRequestSelectPlayer);
}

// fetch active/inactive players
function fetchMembers(active, completion) {
    const activeMembersCallBack = (list) => {
        const completeGetAllPlayers = (players) => {
            if (players.length > 0) {
                // insert every user into database
                var queries = "";
                for (const m of players) {
                    queries = queries + `INSERT INTO PLAYER(main,name) VALUES(true,?);`;
                }
                const dbRequestCallback = (error, result , fields) => {
                    // finish db request for active list
                    dbConnector.enableMultipleReq(false);
                    if (completion!=null) {completion();}
                }

                dbConnector.enableMultipleReq(true);
                dbConnector.executeParamQuery(queries,players, dbRequestCallback);
            } else {
                console.log(`No new members ${active?'[active]':'[inactive]'}`);
                dbConnector.enableMultipleReq(false);
                if (completion!=null) {completion();}
            }
        }
        selectAllPlayerCallback(list, completeGetAllPlayers);
    }
    gsheet.members(active, activeMembersCallBack);
}

// create guild
function generateDefaultGuild(completion) {
    const dbSelectRequestGuild = (err1, res1 , fields1) => {
        if (res1.length == 0) {

            const dbInsertGuild = (error, result , fields) => {
                if (completion!=null) completion();
            }
            dbConnector.enableMultipleReq(false);
            dbConnector.executeParamQuery(`INSERT INTO GUILD(name,tag) VALUES(?,?)`,[DEFAULT_IMPORT_GUILD_NAME,DEFAULT_IMPORT_GUILD_TAG], dbInsertGuild);
        } else {
            console.log(`Guild ${DEFAULT_IMPORT_GUILD_NAME} already exist.`);
            if (completion!=null) completion();
        }
    }
    dbConnector.enableMultipleReq(false);
    dbConnector.executeParamQuery(`SELECT * FROM GUILD WHERE tag=?`,[DEFAULT_IMPORT_GUILD_TAG], dbSelectRequestGuild);
}

function findPlayerIdByName(items, name) {
    for (const player of items) {
        if (player.name == name) {
            return player.id;
        }
    }
    return null;
}


// helper method to convert time
function convertGerTimeToDate(input) {
    var parts = input.match(/(\d+)/g);
    const date = new Date(Date.UTC(parts[2], parts[1]-1, parts[0], 0, 0, 0));
    return date;
}

// fetch active/inactive players
function fetchAllPlayer(active, completion) {
    const memberDataCallback = (list) => {

        // fetch guild and player ids
        const playerGuildRequest = (err1,res1,field1) => {

            const playerListFromDb = res1[0]; 
            const guildListFromDb = res1[1];

            var guild = null;
            if (guildListFromDb.length > 0) {
                guild = guildListFromDb[0];
            } else {
                completion();
                console.log('Guild missing');
                return;
            }

            var fullQuery = "";
            var arguments = [];
            for (const item  of list) {
                const currentName = Object.keys(item)[0];
                const playerId = findPlayerIdByName(playerListFromDb, currentName);

                if (playerId != null) {
                    const timeMap = item[currentName];
                    for (const time of Object.keys(timeMap)) {
                        fullQuery = fullQuery + `INSERT INTO RAWDATA(date,guild_id,player_id,value) VALUES(?,?,?,?);`;
                        arguments.push(convertGerTimeToDate(time));
                        arguments.push(guild.id);
                        arguments.push(playerId);
                        arguments.push(timeMap[time]);
                    }
                } else {
                    console.log(currentName + " not found");
                }
            }

            const rawDataReqCallback = () => {
                completion();
            }

            dbConnector.enableMultipleReq(true);
            dbConnector.executeParamQuery(fullQuery, arguments,rawDataReqCallback);
        }
        dbConnector.enableMultipleReq(true);
        dbConnector.executeParamQuery(`SELECT id,name FROM PLAYER;SELECT * FROM GUILD WHERE tag=? AND name=?`,[DEFAULT_IMPORT_GUILD_TAG,DEFAULT_IMPORT_GUILD_NAME], playerGuildRequest);
    }
    gsheet.allMemberData(active, memberDataCallback);
}

// EXECUTION

const completionActiveHandler = () => {
    // fetch inactive members
    const completionInactiveHandler = () => {

        // fetch guild
        const completeInsertGuild = () => {
            console.log('Completed');

            const completeFetchRawData = () => {
                console.log('Migration completed');
            }
            fetchAllPlayer(true, completeFetchRawData);
        }
        generateDefaultGuild(completeInsertGuild);
    }
    fetchMembers(false, completionInactiveHandler);
}
fetchMembers(true, completionActiveHandler);


