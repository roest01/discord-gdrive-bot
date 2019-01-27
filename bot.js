// bot.js
// main class to run discord bot
// ================

//import
const { RichEmbed, Client, Attachment } = require("discord.js");
const http = require("http");
const c = require("./general/constLoader");
const i18n = require('./general/langSupport');
const strH = require('./general/stringHelper');
const access = require('./general/accessManager');

// VIEW
const helpMsg = require('./view/helpMessage');
const sheet = require('./view/sheetMessage');

const tagger = require('./general/tagManager');

//logger
var log =require('loglevel');
log.setLevel('info');


// prefix for commands
const PREFIX = c.prefix();

const bot = new Client({
    disableEveryone: true
});


// prepare invite code
bot.on("ready", async() => {
    log.info(`# # # # # # # # # #\n${i18n.get('BotReady')} ${bot.user.username}\n# # # # # # # # # #`);
    try {
        // show link for inviting
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log.info(link);
        
        // prepare access limits
        access.setLimits(c.restriction());

        // heroku hack
        if (typeof process.env.HOST != 'undefined') {
            // Heroku ENV token
        
            setInterval(function() {
                console.log(`Ping URL http://${process.env.HOST}.herokuapp.com`);
                http.get(`http://${process.env.HOST}.herokuapp.com`);
            }, 1000 * 60 * 10); // every 10 minutes (300000)
        }
    } catch (e) {
        log.error(e.stack);
    }
});

// messages
bot.on("messageUpdate", async (oldMessage, newMessage) => {
    executeCommand(newMessage);
});


// messages
bot.on("message", async message => {
    executeCommand(message);
});

function executeCommand(message) {
    //ignore own messages , instead of every botmessage ...message.author.bot
    if (message.author.id == bot.user.id) {
        return;
    }
    
    //prevent checking direct message
    if (message.channel.type === "dm"){ 
        return;
    }

    //ignore commands without prefix
    if (!message.content.startsWith(PREFIX)) return;
    
    //prevent any actions, if bot cannot write
    if (message.member != null) {
        if (!message.channel.permissionsFor(bot.user).has('SEND_MESSAGES')) {
            return;
        }
    }

    let messageArray = message.content.split(" ");
    let command = messageArray[0];

    // user has admin rights
    const hasRole = access.hasRight(message.member);
    
    //HELP
    if (strH.hasCmd(command,`${PREFIX}help`)) {
        let embed = helpMsg.getChannelHelp(PREFIX,message.author.username, hasRole);
        message.channel.send(embed);
        return;
    }
    
    //send weekly ep list
    if (strH.hasCmd(command,`${PREFIX}ep`)) {
        message.channel.startTyping();
        let epList = new sheet.EPList();
        epList.generatePNG().then(function(filePaths){
            message.delete().catch(function(){
                log.debug("no permission to delete " + message );
            });
            message.channel.send({
                files: [
                    filePaths.pngPath
                ]
            });
            message.channel.stopTyping();
        }).catch(function(e){
            message.channel.send(e.message);
            message.channel.stopTyping();
            log.error(e);
        });
        return;
    }

    // list of guild members
    if (strH.hasCmds(command, [`${PREFIX}list`, `${PREFIX}l`])) {
        const callback = function(response) {
                
            if (response == null) {
                message.channel.send(`${i18n.get('PlayerNotFound')}`);
            } else {
                message.channel.send(response);
            }
            message.channel.stopTyping();
        };

        message.channel.startTyping();
        sheet.members(callback);
        return;
    }

    // list of smurfs
    if (strH.hasCmds(command, [`${PREFIX}smurf`,`${PREFIX}smurfs`])) {
        const callback = function(response) {
            message.channel.send(response);
            message.channel.stopTyping();
        };

        message.channel.startTyping();
        sheet.smurfs(callback);
        return;
    }

    if (strH.hasCmds(command,[`${PREFIX}time`, `${PREFIX}t`])) {
        const callback = function(list) {
            if (list !=null) {
                var msgString = "";
                list.forEach(date => {
                    if (msgString.length == 0) {
                        msgString = `${i18n.get('Time')}: `+date;
                    } else {
                        msgString = msgString + ", " + date;
                    }
                });
                message.channel.send(msgString);
            }
        };
        sheet.recentDates(callback);
        return;
    }

    if (messageArray.length > 1) {
        
        if (hasRole) {
        
            //add player to raw data index
            if (strH.hasCmds(command,[`${PREFIX}add`,`${PREFIX}a`])) {

                const callback = function(playerName, success, finished) {

                    if (success) {
                        message.channel.send(`${i18n.get('SuccessfulAddingPlayer')} [${playerName}]`);
                    } else {
                        message.channel.send(`${i18n.get('FailedAddingPlayer')} [${playerName}]`);
                    }

                    if (finished) {
                        message.channel.stopTyping();
                    }

                    //player added, try to handle tag
                    if (success) {
                        const tag = c.defaultTag();
                        const internalCallback = function(response) {
                            if (response == null) {
                                message.channel.send(`${i18n.get('PlayerNotFound')}`);
                            } else {
                                message.channel.send(response);
                            }
                        };
                        //tagger.addTag(playerName,tag,message,internalCallback);
                    }
                };

                message.channel.startTyping();
                const arg = messageArray.slice(1, messageArray.length);
                sheet.addPlayers(arg, callback);
                return
            }
            
            //store player from raw data
            if (strH.hasCmds(command,[`${PREFIX}backup`, `${PREFIX}b`])) {
                const callback = function(playerName, success) {
                
                    if (!success) {
                        message.channel.send(`${i18n.get('PlayerNotFound')} [${playerName}]`);
                    } else {
                        const tag = c.defaultTag();
                        message.channel.send(`${i18n.get('SuccessfulBackupPlayer')} [${playerName}]`);
                        
                        const callback = function(response) {
                            
                            if (response == null) {
                                message.channel.send(`${i18n.get('PlayerNotFound')} [${playerName}]`);
                            } else {
                                message.channel.send(response);
                            }
                        };
                        //tagger.removeTag(playerName,tag,message,callback);
                    }
                    message.channel.stopTyping();

                };

                message.channel.startTyping();
                sheet.backup(messageArray[1], callback);
                return;
            }
        }
        
        // check out user (afk / holidays)
        if (strH.hasCmds(command,[`${PREFIX}afk`])) {
            const callback = function(response) {
                var d = new RichEmbed().setAuthor(message.author.username);
                d.setTitle(response)
                message.channel.send(d);
                message.channel.stopTyping();
            };
            message.channel.startTyping();
            sheet.checkout(message.author.username, message.content.substring(
                messageArray[0].length + 1, message.content.length),callback);
            return;
        }
        
        // find player
        if (strH.hasCmd(command,`${PREFIX}find`)) {
            message.channel.startTyping();
            let epList = new sheet.EPList();
            epList.generatePNG(messageArray[1]).then(function(filePaths){
                message.channel.send({
                    files: [
                        filePaths.pngPath
                    ]
                });
                message.channel.stopTyping();
            }).catch(function(e){
                message.channel.send(e.message);
                message.channel.stopTyping();
                log.error(e);
            });
            return;
        }

        // restore archieved player
        if (strH.hasCmds(command,[`${PREFIX}restore`, `${PREFIX}r`])) {
            
            const callback = function(playerName, success, full) {

                if (success) {
                    message.channel.send(`${i18n.get('SuccessfulRestorePlayer')} [${playerName}]`);
                    const tag = c.defaultTag();
                    const internalCallback = function(response) {
                        if (response == null) {
                            message.channel.send(`${i18n.get('PlayerNotFound')}`);
                        } else {
                            message.channel.send(response);
                        }
                    };
                    //tagger.addTag(playerName,tag,message,internalCallback);
                } else {
                    if (!full) {
                        message.channel.send(`${i18n.get('PlayerNotFound')} [${playerName}]`);
                    } else {
                        message.channel.send(`${i18n.get('FailedRestoringPlayerGuildFull')} [${playerName}]`);
                    }
                }

                message.channel.stopTyping();
            };

            message.channel.startTyping();
            sheet.restore(messageArray[1], callback);
            return;
        }

        // rename an active guild player
        if (strH.hasCmds(command,[`${PREFIX}rename`])) {
            
            const callback = function(response) {
                message.channel.send(response);
                message.channel.stopTyping();
            };

            message.channel.startTyping();
            sheet.renamePlayer(messageArray[1], messageArray[2], callback);
            return;
        }

        // check uuid
        if (strH.hasCmds(command,[`${PREFIX}check`])) {
            
            const callback = function(response) {
                message.channel.send(response);
                message.channel.stopTyping();
            };

            message.channel.startTyping();
            sheet.checkUuid(messageArray[1], callback);
            return;
        }

        // old find method
        if (strH.hasCmd(command,`${PREFIX}search`)) {
            const callback = function(response) {
                
                if (response == null) {
                    message.channel.send(`${i18n.get('PlayerNotFound')}`);
                } else {
                    message.channel.send(response);
                }
                message.channel.stopTyping();
            };

            message.channel.startTyping();
            sheet.findByName(messageArray[1], callback);
            return;
        }
    }
    if (messageArray.length == 3) {
        
        if (hasRole) {
            if (strH.hasCmd(command,`${PREFIX}tag`)) {
                const callback = function(response) {
                    
                    if (response == null) {
                        message.channel.send(`${i18n.get('PlayerNotFound')}`);
                    } else {
                        message.channel.send(response);
                    }
                    message.channel.stopTyping();
                };
    
                message.channel.startTyping();
                tagger.addTag(messageArray[1],messageArray[2],message,callback);
                return;
            }

            if (strH.hasCmds(command,[`${PREFIX}del`,`${PREFIX}delete`,`${PREFIX}remove`,`${PREFIX}rm`])) {
                const callback = function(response) {
                    
                    if (response == null) {
                        message.channel.send(`${i18n.get('PlayerNotFound')}`);
                    } else {
                        message.channel.send(response);
                    }
                    message.channel.stopTyping();
                };
    
                message.channel.startTyping();
                //tagger.removeTag(messageArray[1],messageArray[2],message,callback);
                return;
            }

        }
    }

    if (hasRole){
        if(strH.hasCmds(command,[`${PREFIX}u`,`${PREFIX}users`])) {

            var tag = null;

            if (messageArray.length > 1) {
                tag = messageArray[1];
            }

            const callback = function(members) {
                
                var detailsTag = "";

                if (tag!=null) {
                    detailsTag = ` [${tag}]`
                }

                let embed = new RichEmbed()
                .setDescription(`${i18n.get('InfoMemberList')}${detailsTag}: ${members.length}`);

                var content = "";
                
                for (const guildMember of members) {
                    const user = guildMember.user;

                    var nickname = " / " + guildMember.nickname;

                    if (guildMember.nickname == null) {
                        nickname = "";
                    }

                    content = content +
                     "- "+//+"[" + user.discriminator + "] " + 
                     user.username + nickname + "\n"; 
                }

                if (content == "") {
                    content = `${detailsTag}: Not found`;
                }
                embed.addField("-", content);
                message.channel.send(embed);
            };

            tagger.findMembers(message, tag, false ,callback);
        }
    }
}

// login bot into discord
if (!(c.botToken() == null || c.botToken().length == 0)) {
    bot.login(c.botToken());
} else {
    log.error('Invalid Discord Token')
}