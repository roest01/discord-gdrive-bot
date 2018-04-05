// bot.js
// main class to run discord bot
// ================

//import
const Discord = require("discord.js");
const c = require("./general/constLoader");
const i18n = require('./general/langSupport');
const fm = require('./general/contentFormatter');
const strH = require('./general/stringHelper');

//View

const sheet = require('./view/sheetMessage');

//logger
var log =require('loglevel');
log.setLevel('info');
  
const bot = new Discord.Client({
    disableEveryone: true
});


// prepare invite code
bot.on("ready", async() => {
    log.info(`# # # # # # # # # #\n${i18n.get('BotReady')} ${bot.user.username}\n# # # # # # # # # #`);
    try {
        // show link for inviting
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log.info(link);
    } catch (e) {
        log.error(e.stack);
    }
});


// messages
bot.on("message", async message => {

    //ignore own messages
    if (message.author.bot) {
        return;
    }
    
    //prevent direct message
    if (message.channel.type === "dm"){ 
        return;
    }
    
    //only channel message
    
    
    //send weekly ep list
    if (message.content == `.ep`) {

        const callback = function(embed) {
            message.channel.send(embed);
        };
        
        sheet.showEPList(callback);
        return;
    }
});


// login bot into discord
if (!(c.botToken() == null || c.botToken().length == 0)) {
    bot.login(c.botToken());
} else {
    log.error('Invalid Discord Token')
}