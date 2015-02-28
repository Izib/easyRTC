$('a').click(function(event) {
    event.preventDefault();
});

var camListObj = {};
var listEasyrtcid = {};
var roomid = "";

var connect = function() {
    easyrtc.enableAudio(false);
    easyrtc.enableVideo(false);
    easyrtc.setUsername("monitor");
    easyrtc.setPeerListener(peerListener);
    easyrtc.setRoomOccupantListener(roomOccupantListener);
    easyrtc.connect("easysec", loginSuccess, loginFailure);
};

// Run at connection if there is a connection or authorization failure.
var loginFailure = function(errorCode, message) {
    easyrtc.showError(errorCode, message);
};

// Run at connection after successful authorization with EasyRTC server
var loginSuccess = function(easyrtcid) {
    $("#iam").html("I am " + easyrtc.cleanId(easyrtcid));

    easyrtc.setStreamAcceptor(streamAcceptor);
};

// When a stream arrives, this gets run.
var streamAcceptor = function(peerEasyrtcid, stream) {    
    console.debug("Getting stream from " + peerEasyrtcid);
    var monitorVideo = document.getElementById("video_" + peerEasyrtcid);
    easyrtc.setVideoObjectSrc(monitorVideo, stream);
    $("#snapshot_" + peerEasyrtcid).hide();
    $("#video_" + peerEasyrtcid).show();
};

// This listener gets called whenever a message is received from a peer.
var peerListener = function(senderEasyrtcid, msgType, msgData, target) {
    switch(msgType) {
        case "snapshot":
            console.log("["+senderEasyrtcid+"] Receiving snapshot", msgData);
            $("#snapshot_" + senderEasyrtcid).attr("src", msgData);
            if (camListObj[senderEasyrtcid] && !camListObj[senderEasyrtcid].isLive){
                $("#snapshot_" + senderEasyrtcid).show();
                $("#video_" + senderEasyrtcid).hide();
            }
            break;
        case "motionState":
            $("#monitor_" + senderEasyrtcid).css("border-color", msgData.motion ? "red" : "#5c5c5c");
            
            setTimeout(function() {
                refreshSnapshot(senderEasyrtcid);
            }, 200);

            break;
        default:
            console.warn("[" + senderEasyrtcid + "] Received unhandled msgType: " + msgType);
    }
    console.log("\nPeer Listener:\nARGUMENTS:", arguments);
};

// This listener gets called when ever there is a change to the details of who is in the room
var roomOccupantListener = function(roomName, peerListObj, myDetails) {
    console.debug("Running roomOccupantListener for room [" + roomName + "] with client list object:", peerListObj);
    console.debug("My details:", myDetails);

    if ( roomid != roomName){
    // if the room != the current room, don't refresh the view.
        return;
    }
    // remove cameras?
    $.each(camListObj, function(peerEasyrtcid, clientObj) {
        if (!peerListObj[peerEasyrtcid]) {
            cameraRemove(peerEasyrtcid);
        }
    });

    // add cameras?
    $.each(peerListObj, function(peerEasyrtcid, clientObj) {
        if (clientObj.username == "cam" && !camListObj[peerEasyrtcid]) {
            // Adding camera after a short delay to ensure camera is done login
            setTimeout(function() {
                if ( !listEasyrtcid[peerEasyrtcid] ){
                    cameraAdd(peerEasyrtcid, clientObj);                    
                }
                listEasyrtcid[peerEasyrtcid] = true;                
            }, 500);
        }
    });
    listEasyrtcid = {};
};

// Adds the element to hold a camera view, and initiates the call
cameraAdd = function(peerEasyrtcid, clientObj) {
    console.debug("Adding camera view for " + peerEasyrtcid);

    // Clone clientObj into camListObj
    camListObj[peerEasyrtcid] = JSON.parse(JSON.stringify(clientObj));

    // Create HTML element to hold cam video
    var newDiv = "<div class=\"monitor\" id=\"monitor_" + peerEasyrtcid + "\" state=\"pause\">";
    newDiv += "<video class=\"video hidden\" id=\"video_" + peerEasyrtcid + "\"></video>";
    newDiv += "<p>" + peerEasyrtcid + "</p>";
    newDiv += "<img class=\"snapshot\" id=\"snapshot_" + peerEasyrtcid + "\">";
    newDiv += "<div class=\"icon-full hidden\"></div>";
    newDiv += "<div class=\"icon-play hidden\"></div>";
    newDiv += "<div class=\"icon-pause hidden\"></div>";
    newDiv += "</div>";

    // Append new Monitor to Monitors
    $(newDiv).appendTo("#monitors");

    // Initialize Controls for new Monitor
    initNewMonitorControls(peerEasyrtcid);

    // Increment Feed Count
    feedCountAdd(); // Defined in assets/scripts.js

    refreshSnapshot(peerEasyrtcid);

};

// Removing the element to which holds the camera view. Ensures the connection is disconnected.
cameraRemove = function(peerEasyrtcid) {
    console.debug("Removing camera view for " + peerEasyrtcid);

    easyrtc.hangup(peerEasyrtcid);
    $("#monitor_" + peerEasyrtcid).remove();

    // Remove One from Feed Count
    feedCountRemove(); // Defined in assets/scripts.js

    if (camListObj[peerEasyrtcid]) {
        delete camListObj[peerEasyrtcid];
    }
};

var showLive = function(peerEasyrtcid) {
    if (camListObj[peerEasyrtcid] && !camListObj[peerEasyrtcid].isLive) {
        camListObj[peerEasyrtcid].isLive = true;

        easyrtc.call(peerEasyrtcid, function(easyrtcid, mediaType) {
            console.log("Got mediatype " + mediaType + " from " + easyrtc.idToName(easyrtcid));
        }, function(errorCode, errMessage) {
            console.log("call to  " + easyrtc.idToName(peerEasyrtcid) + " failed:" + errMessage);
        }, function(wasAccepted, easyrtcid) {
            if (wasAccepted) {
                console.log("call accepted by " + easyrtc.idToName(easyrtcid));
            } else {
                console.log("call rejected" + easyrtc.idToName(easyrtcid));
            }
        });
    }
};

var refreshSnapshot = function(peerEasyrtcid) {
    easyrtc.sendData(peerEasyrtcid, "getSnapshot", true, function() {});
};

var showSnapshot = function(peerEasyrtcid) {
    // Request new snapshot
    refreshSnapshot(peerEasyrtcid);

    // In case connection is gone
    if (!camListObj[peerEasyrtcid]) {
        return;
    }

    // If camera is live, than disconnect.
    if (camListObj[peerEasyrtcid].isLive) {
        easyrtc.hangup(peerEasyrtcid);
    }

    camListObj[peerEasyrtcid].isLive = false;

    if (camListObj[peerEasyrtcid].snapshot) {
        $("#video_" + peerEasyrtcid).hide();
        $("#snapshot_" + peerEasyrtcid).show();
    }
};

var toggleSize = function(peerEasyrtcid) {
    // In case connection is gone
    if (!camListObj[peerEasyrtcid]) {
        return;
    }

    if (camListObj[peerEasyrtcid].isBig) {
        camListObj[peerEasyrtcid].isBig = false;
        $("#monitor_" + peerEasyrtcid).width(180);

        $("#monitor_" + peerEasyrtcid).height(134);
        $("#monitor_" + peerEasyrtcid + " div").removeClass('large');
    } else {
        // Restore size of any other cameras
        $.each(camListObj, function(innerPeerEasyrtcid, innerPeerListObj) {
            if (innerPeerListObj.isBig) {
                innerPeerListObj.isBig = false;
                $("#monitor_" + innerPeerEasyrtcid).width(180);
                $("#monitor_" + innerPeerEasyrtcid).height(134);
                $("#monitor_" + innerPeerEasyrtcid + " div").removeClass('large');
            }
        });

        camListObj[peerEasyrtcid].isBig = true;

        $("#monitor_" + peerEasyrtcid).width(440);
        $("#monitor_" + peerEasyrtcid).height(330);
        $("#monitor_" + peerEasyrtcid + " div").addClass('large');
    }
};

var joinroom = function(){
    roomid = document.getElementById("roomid").value;
    easyrtc.leaveRoom(roomid, successCB_l, failureCB_l);        
}

var successCB = function(roomName) {
    console.debug("Joining room successfully" + roomName);
}


var failureCB =  function(errorCode, errorText, roomName) {
    console.debug("Joinging room failure" + roomName, errorCode, errorText);
}

var successCB_l = function(roomName) {
    easyrtc.joinRoom(roomid, null, successCB, failureCB);
    console.debug("Leaving room successfully" + roomName);
}


var failureCB_l =  function(errorCode, errorText, roomName) {
    console.debug("Leaving room failure" + roomName, errorCode, errorText);
}

var keydown = function(event){
    var keyCode = event.keyCode?event.keyCode:event.which?event.which:event.charCode;
    if (keyCode ==13){
        joinroom();// 此处处理回车动作
    }
 }