var express = require('express')
    , http = require('http')
    , path = require('path')
    , app = express()
    , fs = require('fs');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
// redis
var redis = require('redis');
var redisPool = redis.createClient();

// log module
var log4js = require('log4js');
var logger = log4js.getLogger();
var logLevel = cfg.log.level || 'ERROR';
logger.setLevel(logLevel);

// config file
var ini = require('node-ini');
ini.encoding = 'utf-8';
var cfg = ini.parseSync('./cluster-config.ini');
var serverPort = cfg.server.port || 3000;
var serverHost = cfg.server.host || '0.0.0.0';

app.set('ip', serverHost);
app.set('port', serverPort);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser())
app.use(express.session({secret: 'its a secret', cookie: { maxAge: 60000 }}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname + "/static/"));

// Load required modules
var io      = require("socket.io");         // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module

if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

passport.use('local', new LocalStrategy(
    function (username, password, done) {
        var user = {
            id: '1',
            username: 'admin',
            password: 'pass'
        }; // 可以配置通过数据库方式读取登陆账号

        if (username !== user.username) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (password !== user.password) {
            return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
    }
));

passport.serializeUser(function (user, done) {//保存user对象
    done(null, user);//可以通过数据库方式操作
});

passport.deserializeUser(function (user, done) {//删除user对象
    done(null, user);//可以通过数据库方式操作
});

app.get('/', function(req,res){    
    res.render("index",{"title":"test"}); 
});          

app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/index.html',
        failureRedirect: '/'
    }));

app.post('/setRoom', function(req,res){
    room = req.body.Room;
    pwd = req.body.password;
    if ( checkIllegalInput(room) && checkIllegalInput(pwd) ){
        redisPool.get(room, function(err, reply) { 
            if(reply == null){        
            redisPool.set( room, pwd, function(err, reply) {
                res.write( "Setting room is: " + reply + ". Please go back to last page and go head your next operation.");
                res.end();
            });
            }else{
                res.write( "the room you want to set already exists, please go back to last page and use another room name." );
                res.end();
            }
        } );
    }else{
        res.write( "Illegal input, only allow 1-10 letters combined with number and lowercase.");
        res.end();
    }
    
});

app.all('*', isLoggedIn);
app.all('/demos/*', isLoggedIn);
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

var webServer = http.createServer(app).listen(app.get('port'), app.get('ip'), function () {
    logger.info('Express server listening on port ' + app.get('port'));
});

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {"log level":1});

// Set ICE servers 
var myIceServers = [
 {"url":"stun:stun.linphone.org:3478"},
 {
   "url":"turn:192.155.86.24:3478",
   "username":"easyRTC",
   "credential":"easyRTC@pass"
 },
];

easyrtc.setOption("appIceServers", myIceServers);

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, {logLevel:"debug", logDateEnable:true});

easyrtc.on( "roomJoin",  function(connectionObj, roomName, roomParameter, callback){
    logger.info( "info:","checking if it's permit to join room");
    logger.info(roomParameter)
    if(checkIllegalInput(roomName)){
        redisPool.get(roomName, function(err, reply) {
            if( ( roomName == "default") ||( roomParameter != null && roomParameter["password"] == reply )){
                logger.info("info:","grant the user joining room")
                eventListener.onRoomJoin(connectionObj, roomName, roomParameter, callback);
            }else{
                logger.info( "info:","Room name or password error");               
            }
        } );
    }else{
        logger.info( "info:","Illegal input, only allow 1-10 letters combined with number and lowercase.");
    }

});

function checkIllegalInput(str){
    // We don't use sql database, but check the input is not a bad habit    
    return /^[a-z0-9]{1,10}$/.test(str);
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}