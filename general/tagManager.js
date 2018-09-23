// tagManager.js
// Handle tagging users
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const constant = require("../general/constLoader");

const addTag = (playerName, tag, message, completion) => {
    
    let role = message.guild.roles.find("name", tag);

    // Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
    let member = message.mentions.members.first();

    // Add the role!
    member.addRole(role).catch(console.error);
    completion('ok');
}

const removeTag = (playerName, tag, message, completion) => {
    //if (hasRight(bot)) {
        // // get role by ID
        // let myRole = message.guild.roles.get("264410914592129025");

        // // get role by name
        // let myRole = message.guild.roles.find("name", "Moderators");

        // // assuming role.id is an actual ID of a valid role:
        // if(message.member.roles.has(role.id)) {
        //     console.log(`Yay, the author of the message has the role!`);
        // } else {
        //     console.log(`Nope, noppers, nadda.`);
        // }
        let role = message.guild.roles.find("name", tag);

        // Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
        let member = message.mentions.members.first();
        
        // or the person who made the command: let member = message.member;
        
        // Remove a role!
        member.removeRole(role).catch(console.error);
        completion('go go go');
    //} else {
        //completion("no no no");
    //}
}

function hasRight(bot) {
    return true;
}
// export
module.exports = {
    hasRight:hasRight,
    addTag: addTag,
    removeTag: removeTag
};