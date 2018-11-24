// databaseManager.js
// handle access to database
// ==================

// import

var DbManager = (function () {
    var instance;
    
    function initInstance() {
        
        return {
            dosomething: function(tag) {
                return;
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

// check whether user has permission
const dos = (member) => {
}

// export
module.exports = {
    dos: dos
};