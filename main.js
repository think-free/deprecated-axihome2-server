
var log = require('../lib/lib-log');
var soc = require("unified.socket/unified.socket.js");
var db = require('./lib/lib-database.js');
var tools = require('./lib/lib-tools.js');
var uuid = require('node-uuid');

// ## Init and socket connection callback
/* ***************************************************************************** */

// ### init
// Params : none
// Init the application

exports.init = function(config){
    
    log.write("on-domo", "Starting application");

    // Loading module list defined for application

    var call_list = require('../lib/lib-config').load('/config/instances.json');
    var instances = [];
    var schedule;

    // Loading application backends

    require("fs").readdirSync("./application/backends/").forEach(function(file) {

        instances[file] = require("./backends/" + file + "/main.js");
        log.write(config.server, "Loading application data backend : " + file);
    });

    // Starting backend configured

    for (var idx in call_list){

        var p = call_list[idx];

        if (p.active){
            log.write(config.server, "Running module : " + p.backend);
            instances[p.backend].run(p.name, p.poolInterval, p.params);
        }
    }

    // Db changed trigger

    db.setSaveCallback(function(key, value){

        tools.checkChangeTrigger(key, value);

        soc.broadcast({type : "setVariable", body : {variable : key, option:  "", value : value}});
    });

    // Scheduler

    schedule = require('../lib/lib-config').load('/config/schedule.json');

    for (var idx in schedule){

        tools.createSceneJob(schedule[idx]);
    }  
}

// ### clientConnected
// Params : socket
// Client connected to socket callback

exports.clientConnected = function(socket){

    console.log("Client connected : " + socket.host() + ":" + socket.port());
}

// ### clientDisconnected
// Params : socket
// Client disconnected callback

exports.clientDisconnected = function(socket){
 
    console.log("Client disconnected : " + socket.host() + ":" + socket.port());   
}

// ## Login/Logout managment
/* ***************************************************************************** */

// ### login
// Params : user, password
// Login a user
// Return :
// {type : "ssid", body : sessionId} 
// {type : "login-error", body : "User/Password invalid"}

exports.login = function(user,password,device,callback){

    var date =new Date();
    var dt = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var ssid = uuid.v4() + "-" + uuid.v4() + "-" + uuid.v4() + "-" + uuid.v4();

    var session = {id: user, session : ssid, Expiration : dt};

    callback(session, {type : "ssid", body : session.session});
}

// ### logout
// Params : session
// Logout a user by his session

exports.logout = function(session){
    
}

// ### name
// Params : params
// Description
// Return :
// {valid : false, message : "Reason
// {valid : true, message : sessions[session].Expiration, session : sessions[session]}"}

exports.isSessionValid = function(session){
    
    return {valid : true, message : "Session valid", session : session}
}
