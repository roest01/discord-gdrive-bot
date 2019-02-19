// dbHandlerMySQL.js
// Wrapper/Handle db request to mySQL
// ==================

//import
const mysql = require('mysql');

const DbHandler = (function () {
  var instance;
  
  function initInstance() {

      // connection
      var host = null, user = null, password = null, database = null;
      var multipleStatements = false;

      // db connection
      var connection = null;
      
      return {
          allowMultipleStatements: (allow) => {
            multipleStatements = allow;
            
            // reset connection
            connection = null;
          },
          connectTo: function (hostName, userName, pwd, db) {
            host = hostName;
            user = userName;
            password = pwd;
            database = db;
            return;
          },
          connect: function() {
              if (connection==null) {
                connection = mysql.createConnection({
                  host     : host,
                  user     : user,
                  password : password,
                  database : database,
                  multipleStatements: multipleStatements
                });
              }
              connection.connect();
              return;
          },
          disconnect: function() {
            if (connection!=null) {
              connection.end();
            }
            return;
          },
          executeQuery: function(query, callback) {
            this.connect();
            connection.query(query, function (error, results, fields) {
              //if (error) throw error;
              if (callback==null) return;
              callback(error, results,fields);
              this.disconnect;
              return;
            });
          },
          executeParamQuery: function(query, param, callback) {
            this.connect();

            connection.query(query, param, function (error, results, fields) {
              //if (error) throw error;
              if (callback==null) return;
              callback(error, results,fields);
              this.disconnect;
              return;
            });
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

// update connection data
const setConnection = (host, user, password, database) => {
  DbHandler.getInstance().connectTo(host,user,password,database);
}

// enable multiple statements
const enableMultipleReq = (allow) => {
  DbHandler.getInstance().allowMultipleStatements(allow);
}

// execute query
const executeQuery = (query, callback) => {
  DbHandler.getInstance().executeQuery(query,callback);
}

// execute query
const executeParamQuery = (query, parameter, callback) => {
  DbHandler.getInstance().executeParamQuery(query,parameter,callback);
}

// export
module.exports = {
  connectTo: setConnection,
  enableMultipleReq: enableMultipleReq,
  executeQuery: executeQuery,
  executeParamQuery: executeParamQuery
};