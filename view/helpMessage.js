// helpMessage.js
// Help messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const constant = require("../general/constLoader");

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
        .addField(`${PREFIX}ep`, `${i18n.get('InfoGuildMemberEPList')}`)
        .addField(`${PREFIX}find NAME`, `${i18n.get('InfoFindPlayer')}`)
        .addField(`${PREFIX}time`, `${i18n.get('Time')}`);
        //.addField(`${PREFIX}afk [TEXT]`, `${i18n.get('InfoCheckoutPlayer')}`)
    
    if (hasRole) {
        embed.addField(`${PREFIX}add NAME / NAMES`,`${i18n.get('InfoAddingPlayer')}`);
        embed.addField(`${PREFIX}backup NAME`,`${i18n.get('InfoBackupPlayer')}`);
        embed.addField(`${PREFIX}restore NAME`,`${i18n.get('InfoRestorePlayer')}`);
        embed.addField(`${PREFIX}list`,`${i18n.get('InfoMemberList')} [GAME]`);
        embed.addField(`${PREFIX}users`,`${i18n.get('InfoMemberList')} [DISCORD]`);
        embed.addField(`${PREFIX}rename OLDNAME NEWNAME`,`${i18n.get('InfoRenamingPlayer')} `);
        embed.addField(`${PREFIX}addTime`,`${i18n.get('InfoAddingTime')} `);
        //embed.addField(`${PREFIX}tag NAME TAG`,`-`);
        //embed.addField(`${PREFIX}remove NAME TAG`,`-`);
    }

    embed.setFooter(`${i18n.get('Version')}: ${constant.version()} - ${constant.author()}`);
    return embed;
}

// export
module.exports = {
    getChannelHelp: helpMessage
};