// accessManager.js
// handle permissions
// ==================

//import
const Discord = require("discord.js");

var AccessManager = (function () {
    var instance;
    
    function initInstance() {
        // list with tags
        var tagList = [];
        
        return {
            addTag: function(tag) {
                
                if (!tagList.includes(tag)) {
                    tagList = [tagList, tag];
                }
                return;
            },
            setTags: function(tags) {
                
                tagList = tags;
                return;
            },
            tags: function() {
                return tagList;
            }
        }
    }
    return {
        getInstance: function() {
            if (!instance) {
                instance = initInstance();
            }
            return instance;
        } 
    };
})();


// user needs one of user tag for accessing
const restriction = function(tag) {
    AccessManager.getInstance().addTag(tag);
}

const restrictions  = function(tags) {
    AccessManager.getInstance().setTags(tags);
}

// check whether user has permission
const hasRight = (member) => {

    for (var reqRole of AccessManager.getInstance().tags()) {
        if (member.roles.find("name", reqRole)) {
            return true;
        }
    }
    return false;
}

// export
module.exports = {
    addLimit: restriction,
    setLimits: restrictions,
    hasRight: hasRight
};