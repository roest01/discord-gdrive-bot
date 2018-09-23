// tagManager.js
// Handle tagging users
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const constant = require("../general/constLoader");

const addTag = (playerName, tag, message, completion) => {
    
    let role = message.guild.roles.find("name", tag);

    const callback = function(members) {

        var didAddTag = false;
        //exact check
        for (const m of members) {
            const user = m.user;
            if (m.nickname == playerName || m.displayedName == playerName || user.username == playerName) {
                didAddTag = true;
                m.addRole(role).catch(console.error);
                completion(`${i18n.get('SuccessAddingTag')} [${playerName}]`);
                return;
            }
        }

        if (members.length > 0 && !didAddTag) {
            const m = members[0];
            m.addRole(role).catch(console.error);
            completion(`${i18n.get('SuccessAddingTag')} [${m.displayedName}]`);
        } else {
            completion(`${i18n.get('FailedAddingTag')} [${playerName}]`);
        }
    }

    memberWithoutTag(message, playerName, tag, callback);

}

const removeTag = (playerName, tag, message, completion) => {

    let role = message.guild.roles.find("name", tag);

    const callback = function(members) {

        var didRemoveTag = false;
        //exact check
        for (const m of members) {
            const user = m.user;
            if (m.nickname == playerName || m.displayedName == playerName || user.username == playerName) {
                didRemoveTag = true;
                m.removeRole(role).catch(console.error);
                completion(`${i18n.get('SuccessRemovingTag')} [${playerName}]`);
                return;
            }
        }

        if (members.length > 0 && !didRemoveTag) {
            const m = members[0];
            m.removeRole(role).catch(console.error);
            completion(`${i18n.get('SuccessRemovingTag')} [${m.displayedName}]`);
        } else {
            completion(`${i18n.get('FailedRemovingTag')} [${playerName}]`);
        }
    }

    memberWithTag(message, playerName, tag, callback);
}

// get all members
const members = (message, tag, isBot, completion) => {
    message.guild.fetchMembers()
            .then(async function (guild) {
                const members = guild.members;

                var resultList = [];

                for (const m of members) {

                    const guildMember = m[1];

                    if (guildMember.user.bot) {
                        if (!isBot) {
                            continue;
                        }
                    } 

                    for (const roleMap of guildMember.roles) {
                        const role = roleMap[1];

                        if (role.name == tag) {
                            resultList[resultList.length] = guildMember;
                        }
                    }

                    if (tag == null) {
                        resultList[resultList.length] = guildMember;
                    }
                }
                completion(resultList);
            })
            .catch(console.error);
}


// get all members
const memberWithoutTag = (message, name, tag, completion) => {

    message.guild.fetchMembers()
            .then(async function (guild) {
                const members = guild.members;

                var resultList = [];

                for (const m of members) {

                    const guildMember = m[1];

                    // ignore bots
                    if (guildMember.user.bot) {
                        continue;
                    } 

                    var hasTag = false;

                    for (const roleMap of guildMember.roles) {
                        const role = roleMap[1];

                        if (role.name == tag) {
                            hasTag = true;
                        }
                    }

                    if (!hasTag) {
                        if (guildMember.nickname != null  && guildMember.nickname.includes(name)) {
                            resultList[resultList.length] = guildMember;
                        } else {

                            if (guildMember.displayedName !=null && guildMember.displayedName.includes(name)) {
                                resultList[resultList.length] = guildMember;
                            } else {
                                const user = guildMember.user;
                                if (user.username!=null && user.username.includes(name)) {
                                    resultList[resultList.length] = guildMember;
                                }
                            }
                        }

                    }
                }
                completion(resultList);
            })
            .catch(console.error);
}


// get all members with tag
const memberWithTag = (message, name, tag, completion) => {

    let role = message.guild.roles.find("name", tag);

    var resultList = [];

    for (const r of role.members) {
        const guildMember = r[1];
        
        // ignore bots
        if (guildMember.user.bot) {
            continue;
        } 

        if (guildMember.nickname != null  && guildMember.nickname.includes(name)) {
            resultList[resultList.length] = guildMember;
        } else {
            if (guildMember.displayedName !=null && guildMember.displayedName.includes(name)) {
                resultList[resultList.length] = guildMember;
            } else {
                const user = guildMember.user;
                if (user.username!=null && user.username.includes(name)) {
                    resultList[resultList.length] = guildMember;
                }
            }
        }
    }
    completion(resultList);
}

// export
module.exports = {
    addTag: addTag,
    removeTag: removeTag,
    findMembers: members,
    findWithoutTag: memberWithoutTag,
    findWithTag: memberWithTag
};