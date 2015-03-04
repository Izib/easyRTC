var selfEasyrtcid = "";
var monitorList = {};
var curRoom = "default";  // the first joining room should be default.

var connect = function() {
    console.debug("Initializing local media");        
    easyrtc.enableAudio(true);
    easyrtc.enableVideo(true);
    easyrtc.setUsername("cam");
    easyrtc.setPeerListener(peerListener);    
    easyrtc.setRoomOccupantListener(roomOccupantListener);
    easyrtc.setVideoDims(document.getElementById("textWidth").value, document.getElementById("textHeight").value);
    
    // Initialize the local media via getUserMedia()
    easyrtc.initMediaSource(
        function (){
            // Setup self video
            var selfVideo = document.getElementById("selfVideo");
            selfVideo.muted = true;
            easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());

            // Connect to EasyRTC Server
            console.debug("Connecting to EasyRTC Server");
            easyrtc.connect("easysec", loginSuccess, loginFailure);
            initiateMotionDetection();
        },
        function (){
            easyrtc.showError("no-media", "Unable to get local media");
        }
    );
};


// Run at connection if there is a connection or authorization failure.
var loginFailure = function(errorCode, message) {
    easyrtc.showError(errorCode, message);
};


// Run at connection after successful authorization with EasyRTC server
var loginSuccess = function(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    console.debug("Successful connection. Easyrctid is " + selfEasyrtcid);
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(selfEasyrtcid) + " at Room: " + curRoom;
};


// This listener gets called whenever there is a change to the details of who is in the room
var roomOccupantListener = function(roomName, clientListObj, myDetails) {
    console.debug("Running roomOccupantListener for room ["+roomName+"] with client list object:", clientListObj);
    console.debug("My details:", myDetails);
    console.log("Monitor List!", monitorList);
    //
    // remove any monitors that have gone away
    //
    for( var monitor in monitorList) {
        if( !clientListObj[monitor]) {
           delete monitorList[monitor];
        }
    }
};


// This listener is called whenever a message is received from another peer
var peerListener = function(senderEasyrtcid, msgType, msg, target) {
    switch(msgType){
        case "getSnapshot":
            console.log("Sending snapshot");
            sendSnapshot(senderEasyrtcid);
            // add the monitor if not already added
            monitorList[senderEasyrtcid] = senderEasyrtcid;
        break;

        default:
            console.warn("["+senderEasyrtcid+"] Received unhandled msgType: " + msgType);
    }
    console.log("\nPeer Listener:\nARGUMENTS:", arguments);
};


// Takes a snapshot of the current video screen
var takeSnapshot = function() {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    var videoElement = document.getElementById("selfVideo");
    canvas.width = easyrtc.nativeVideoWidth;
    canvas.height = easyrtc.nativeVideoHeight;
    ctx.drawImage(videoElement, 0, 0, easyrtc.nativeVideoWidth, easyrtc.nativeVideoHeight, 0, 0, easyrtc.nativeVideoWidth, easyrtc.nativeVideoHeight);

    var imageDataURL = canvas.toDataURL('image/jpeg');
    return imageDataURL;
};


// Send snapshot to a specific easyrtcid
var sendSnapshot = function(targetEasyrtcid) {
    easyrtc.sendData(targetEasyrtcid, "snapshot", takeSnapshot(), function(){});
};


// Simple code to detect motion via the canvas method
var lastFrame = null;
var currentFrame = null;
var smallFrame;
var ampThreshold = 30;
var hitThreshold = 14000;

var motionSeenReportDelay = 5000;
var isLastReportMotionSeen = false;
var lastReportMotionSeenDate = 0;
var sendReportDelayDuringMotion = 2000;
var sendReportDelayDuringNoMotion = 10000;
var lastReportSentDate = 0;
var isMotionLastSeen = false;

// initialize thresholdField with code value.
$("#thresholdField").val(hitThreshold);
$("#thresholdField").change(function() {
    // update the threshold value after the person has had time to finish typing.
    setTimeout( function() {
       try {
        var val = parseInt($("#thresholdField").val());
        if( val > 1000 && val < 40000 ) {
            hitThreshold = val;
            console.log("hit threshold updated to " + val);
        }
        else {
            console.log("out of range hit threshold " + val);
        }
      } catch( oops) {
           console.log("bad hitThreshold value");
      };
    }, 5000);
});

function compareFrames() {
    if( !smallFrame) {
        smallFrame = document.createElement("canvas");
        smallFrame.width = 320;
        smallFrame.height = 240;        
    }
    var ctx = smallFrame.getContext("2d");
    var videoElement = document.getElementById("selfVideo");
    ctx.drawImage(videoElement, 0, 0, easyrtc.nativeVideoWidth, easyrtc.nativeVideoHeight, 0, 0, 320, 240);
    currentFrame = ctx.getImageData(0, 0, 320, 240).data;
    var hits = 0;
    if( lastFrame) {
        var n = currentFrame.length;
        for( var i = 0; i < n; i++) {
            if( Math.abs(currentFrame[i]-lastFrame[i]) > ampThreshold) {
                hits++;
            }
        }
    }
    lastFrame = currentFrame;
    var isMotionNowSeen = (hits > hitThreshold);


    if(isMotionNowSeen){
        if (!isLastReportMotionSeen){
            reportMotion(isMotionNowSeen);
            console.log("Reporting NEW motion ["+hits+"]>["+hitThreshold+"]");
        }
        else if((Date.now() - sendReportDelayDuringMotion) > lastReportSentDate){
            reportMotion(isMotionNowSeen);
            console.log("Updating motion screenshot ["+hits+"]>["+hitThreshold+"]");
        }
        else {
            console.log("Marking CONTINUED motion ["+hits+"]>["+hitThreshold+"]");
            lastReportMotionSeenDate = Date.now();
        }
    }
    else if (isLastReportMotionSeen) {
        // Report if motion no longer detected after a suitable time period
        if ((Date.now() - lastReportMotionSeenDate) > motionSeenReportDelay){
            console.log("Reporting NO MORE motion after time period ["+hits+"]>["+hitThreshold+"]");
            reportMotion(isMotionNowSeen);
        }
    }
    else if ((Date.now() - lastReportSentDate) > sendReportDelayDuringNoMotion){
        console.log("Reporting CONTINUE NO motion after time period ["+hits+"]>["+hitThreshold+"]");
        reportMotion(isMotionNowSeen);
    }

    else {
        console.log("End of line", isMotionNowSeen);
    }

    return isMotionNowSeen;
}

// Send motion status to all monitors
function reportMotion(isMotionSeen) {
    if (isMotionSeen) {
        console.debug("Motion detected.");
        lastReportMotionSeenDate = Date.now();
    }
    else {
        console.debug("Motion not detected.");
    }

    for( var monitor in monitorList) {
         easyrtc.sendData(monitor, "motionState", {"motion":isMotionSeen}, function(){});
    }
    lastReportSentDate = Date.now();
    isLastReportMotionSeen = isMotionSeen;
}

// Initiate motion detect to scan video four times a second
function initiateMotionDetection() {
    var sawMotion = compareFrames();
    setTimeout( initiateMotionDetection, (sawMotion?1000:250));
}

var joinroom = function(){
    roomid = document.getElementById("roomid").value;
    pwd = document.getElementById("password").value;
    easyrtc.leaveRoom(curRoom, successCB_l, failureCB_l);    
    curRoom = roomid;
    // a delay to ensure leaving the room
    setTimeout( function() {easyrtc.joinRoom(roomid, { "password": pwd}, successCB, failureCB)},500);    
}

var successCB = function(roomName) {
    console.debug("Joining room successfully" + roomName);
    alert("Joining room Or Creating room: " + roomName);
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(selfEasyrtcid) + " at Room: " + curRoom;
}


var failureCB =  function(errorCode, errorText, roomName) {
    console.debug("Joinging room failure" + roomName, errorCode, errorText);
}

var successCB_l = function(roomName) {    
    console.debug("Leaving room successfully" + roomName);
}


var failureCB_l =  function(errorCode, errorText, roomName) {
    console.debug("Leaving room failure" + roomName, errorCode, errorText);
}

var keydown = function(event){
    var keyCode = event.keyCode?event.keyCode:event.which?event.which:event.charCode;
    if (keyCode ==13){ // 13: Enter keydown
        if(event.currentTarget.id == "roomid" || event.currentTarget.id == "password" ) {
            joinroom();
        }else if (event.currentTarget.id == "textHeight" || event.currentTarget.id == "textWidth" || event.currentTarget.id == "thresholdField"){
            connect();
        }
    }
 }
 
 