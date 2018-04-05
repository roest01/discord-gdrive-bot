// stringHelper.js
// helper function for handling strings
// ==================

/**
 * Count spaces within string
 * @param {String} input string for counting spaces
 * @returns number of spaces
 * @type Number
 */
const countSpaces = (string) => {
    return (string.match(new RegExp(" ", "g")) || []).length;
}

/**
 * Check whether string is a command
 * @param {String} inputString with component for checking command
 * @param {String} command command for checking
 * @returns true if the command is matching
 * @type Boolean
 */
const containsCommand = (inputString, command) => {
    return inputString.toLowerCase() === command;
}


/**
 * Check whether string is matching to one of given command
 * @param {String} inputString with component for checking command
 * @param {String} commands command for checking
 * @returns true if a command is matching
 * @type Boolean
 */
const containsCommands = (inputString, commands) => {
    
    if (commands.length == 1) {
        return containsCommand(inputString, commands[0]);
    }
    
    for (var c of commands) {
        if (inputString.toLowerCase() === c) {
            return true;
        }
    }
    
    return false;
}

// export
module.exports = {
    numberOfSpaces: countSpaces,
    hasCmd: containsCommand,
    hasCmds: containsCommands
};