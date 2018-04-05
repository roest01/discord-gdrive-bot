// bot.js
// main class to run discord bot
// ================

//import
const Discord = require("discord.js");
const c = require("./general/constLoader");
const i18n = require('./general/langSupport');
const fm = require('./general/contentFormatter');
const strH = require('./general/stringHelper');

// VIEW
const helpMsg = require('./View/helpMessage');
const sheet = require('./view/sheetMessage');

//logger
var log =require('loglevel');
log.setLevel('info');


// prefix for commands
const PREFIX = c.prefix();

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

    //ignore commands without prefix
    if (!message.content.startsWith(PREFIX)) return;
    
    //only channel message
    
    //prevent any actions, if bot cannot write
    if (message.member != null) {
        if (!message.channel.permissionsFor(bot.user).has('SEND_MESSAGES')) {
            return;
        }
    }

    let messageArray = message.content.split(" ");
    let command = messageArray[0];

    // user has role
    var hasRole = false;

    for (var reqRole of c.restriction()) {
        if (message.member.roles.find("name", reqRole)) {
            hasRole = true;
            break;
        }
    }
    
    //HELP
    if (strH.hasCmd(command,`${PREFIX}help`)) {
        let embed = helpMsg.getChannelHelp(PREFIX,message.author.username, hasRole);
        message.channel.send(embed);
        return;
    }

    
    // about
    if (strH.hasCmds(command,[`${PREFIX}about`])) {

        var d = new Discord.RichEmbed().setAuthor(message.author.username);
        const version = c.version();
        message.channel.send(d.addField(`${i18n.get('AboutBot')} [${version}]`, `Creator: ${c.author()}`));
        return;
    }
    
    //send weekly ep list
    if (strH.hasCmd(command,`${PREFIX}ep`)) {
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