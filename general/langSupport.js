// langSupport.js
// file for handling language settings
// ===============

const c = require("./constLoader");

//singleton language service
var LangService = (function() {
    var instance;
  
    function initInstance() {
  
        // default language is english
        var lang = c.language();
        
        //load language file
        const language = require(`../data/locales/${lang}.json`);
    
        return {
            get: function(string) {
                if (language.hasOwnProperty(string)) {
                    return language[string];
                } else {
                    return string;
                }
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

// get localized string from json file
const getLocalizedString = function(string) {
  
    var instance = LangService.getInstance();
    return instance.get(string);
}

// export
module.exports = {
    get: getLocalizedString
};