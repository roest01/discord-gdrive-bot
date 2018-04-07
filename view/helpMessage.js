// helpMessage.js
// Help messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');

/**
 * Sending general informations about available commands within channel
 * @param {PREFIX} prefix for each command for bot control
 * @param {author} name of the user who triggers the bot
 * @param {hasRole} flag whether user has special permission
 * @returns message block with all informations about available commands
 * @type RichEmbed
 */
const helpMessage = (PREFIX, author, hasRole) => {
    
    let embed = new Discord.RichEmbed()
        .setAuthor(`${author}`)
        .setDescription(`${i18n.get('FollowingCommands')}`)
        .addField(`${PREFIX}about`, `${i18n.get('AboutBot')}`)
        .addField(`${PREFIX}ep`, `${i18n.get('InfoGuildMemberEPList')}`)
        .addField(`${PREFIX}find NAME`, `${i18n.get('InfoFindPlayer')}`)
        .addField(`${PREFIX}afk [TEXT]`, `${i18n.get('InfoCheckoutPlayer')}`);
    
    if (hasRole) {
        embed.addField(`${PREFIX}add`,`${i18n.get('InfoAddingPlayer')}`);
    }
    return embed;
}

// export
module.exports = {
    getChannelHelp: helpMessage
};