/**
 * EasySecurity - by Priologic Software Inc.
 * Created by Chris Rail and Rod Apeldoorn
 */


var videoFeedsObj;		// HTML wrapper for all video feeds
var numVideoFeedsObj;	// Video feed counter

/**
 * Initialize the application.
 * This function can also be used to update all VideoFeed MouseOver/MouseOut/Click events.
 * Can be called when a new Video Feed is added.
 */
function initApplication()
{
	// Get Page Elements
	videoFeedsObj = $('#monitors');
	numVideoFeedsObj = $('#numVideoFeeds');
	
	// Unbind any existing Events
	$('div.monitor').unbind('mouseover');
	$('div.monitor').unbind('mouseout');
	$('div.icon-full').unbind('click');
	$('div.icon-play').unbind('click');
	$('div.icon-pause').unbind('click');
	
	// Hook Mouseover options
	$('div.monitor').mouseover(function()
	{	
		// Find ID of element
		var objID = '#'+ $(this).attr('id');
		
		// Find Video State (play or pause)
		var videoState = $(objID).attr('state');
		
		var showIcon = 'div.icon-play';
		
		// Determine appropriate icon to display (play vs pause)
		if(videoState == 'play')
		{
			showIcon = 'div.icon-pause';
		}
		// Display Video options
		$(objID +' div.icon-full').removeClass('hidden');
		$(objID +' '+ showIcon).removeClass('hidden');
		
	});
	
	// Hook Video Mouseout options
	$('div.monitor').mouseout(function()
	{
		// Find ID of element
		var objID = '#'+ $(this).attr('id');
		
		// Hide all video options
		$(objID +' div.icon-full').addClass('hidden');
		$(objID +' div.icon-play').addClass('hidden');
		$(objID +' div.icon-pause').addClass('hidden');
	});
	
	// Hook Fullscreen button Click event
	$('div.icon-full').click(function()
	{
		
		var videoID = '#'+ $(this).parent().attr('id') + ' video';
		
		// Enter Full Screen
		enterFullScreen(videoID);
	});
	
	// Hook Play button Click event
	$('div.icon-play').click(function()
	{
		// Find parent ID
		var parentID = '#'+ $(this).parent().attr('id');
		
		// Update Video State to Play
		$(parentID).attr('state','play');
		
		// Hide Play button and show Pause button
		$(this).addClass('hidden');
		$(parentID +' div.icon-pause').removeClass('hidden');
		
		// Play the specified video
		playVideo(parentID +' video');
	});
	
	// Hook Pause button Click event
	$('div.icon-pause').click(function()
	{
		// Find parent ID
		var parentID = '#'+ $(this).parent().attr('id');
		
		// Update Video State to Play
		$(parentID).attr('state','pause');
		
		// Hide Play button and show Pause button
		$(this).addClass('hidden');
		$(parentID +' div.icon-play').removeClass('hidden');
		
		// Pause the specified video
		pauseVideo(parentID +' video');
	});
	
}


// Increment the Feed Count by one
function feedCountAdd()
{
	numVideoFeedsObj.empty();
	numVideoFeedsObj.html($('.monitor').length);
}


// Decrement the Feed Count by one
function feedCountRemove()
{
	numVideoFeedsObj.empty();
	numVideoFeedsObj.html($('.monitor').length);
}


// Update the Feed Count to what you like
function feedCountUpdate(updateValue)
{
	numVideoFeedsObj.empty();
	numVideoFeedsObj.html(updateValue);
}


// Enter Full Screen for selected Video
function enterFullScreen(peerEasyrtcid)
{
	// Toggle Video Size >> Defined in monitor.js
	toggleSize(peerEasyrtcid);
}


// Play a specified video Feed
function playVideo(peerEasyrtcid)
{
	// Show Live Video >> Defined in monitor.js
	showLive(peerEasyrtcid);
}


// Pause a specified video Feed
function pauseVideo(peerEasyrtcid)
{
	// Pause Video and Show Snapshot >> Defined in monitor.js
	showSnapshot(peerEasyrtcid);
}


// Add a Video Feed
// You need to supply a unique ID for the Video Feed.
function addVideoFeed(newVideoFeedID, feedTitle)
{
	
	// TODO: MUST SUPPLY UNIQUE ID
	
	/*
	<!-- Video Feed HTML -->
	<div class="video-feed" id="feed_1" state="pause">
		<video width="180" height="150" autoplay muted>Your browser does not support the video tag.</video>
		<p>Camera 1</p>
		<div class="icon-full hidden"></div>
		<div class="icon-play hidden"></div>
		<div class="icon-pause hidden"></div>
	</div>
	*/
	
	// Compose Unique ID
	var videoIDAttr = '';
	
	// Add appropriate Video SRC ?
	
	// Compose Video Feed HTML (same as above, expect as one line so that JS doesn't explode).
	var newFeedHTML = '<div class="video-feed" id="'+ newVideoFeedID +'" state="pause"><video width="180" height="150" autoplay muted>Your browser does not support the video tag.</video><p>'+ feedTitle +'</p><div class="icon-full hidden"></div><div class="icon-play hidden"></div><div class="icon-pause hidden"></div></div>';
	
	// Append Video Feed
	videoFeedsObj.append(newFeedHTML);
	
	// Re-init Application to bind events
	initApplication();
	
	// Update Feed Count
	feedCountAdd();
}


// Remove Video Feed by ID
function removeVideoFeed(videoFeedID)
{
	// Remove Video Feed
	$(videoFeedID).remove();
	
	// Update Feed Count
	feedCountRemove();
}


// Initialize the new Monitor Control event callbacks
function initNewMonitorControls(peerEasyrtcid)
{
	var monitorID = '#monitor_'+ peerEasyrtcid;
	var monitorObj = $(monitorID);
	
	// Hook Mouseover options
	monitorObj.mouseover(function()
	{	
		// Find ID of element
		var objID = '#'+ $(this).attr('id');
		
		// Find Video State (play or pause)
		var videoState = $(objID).attr('state');
		
		var showIcon = 'div.icon-play';
		
		// Determine appropriate icon to display (play vs pause)
		if(videoState == 'play')
		{
			showIcon = 'div.icon-pause';
		}
		// Display Video options
		$(objID +' div.icon-full').removeClass('hidden');
		$(objID +' '+ showIcon).removeClass('hidden');
		
	});
	
	// Hook Video Mouseout options
	monitorObj.mouseout(function()
	{
		// Find ID of element
		var objID = '#'+ $(this).attr('id');
		
		// Hide all video options
		$(objID +' div.icon-full').addClass('hidden');
		$(objID +' div.icon-play').addClass('hidden');
		$(objID +' div.icon-pause').addClass('hidden');
	});
	
	// Hook Fullscreen button Click event
	$(monitorID +' div.icon-full').click(function()
	{
		
		var videoID = '#'+ $(this).parent().attr('id') + ' video';
		
		// Enter Full Screen
		enterFullScreen(peerEasyrtcid);
	});
	
	// Hook Play button Click event
	$(monitorID +' div.icon-play').click(function()
	{
		// Find parent ID
		var parentID = '#'+ $(this).parent().attr('id');
		
		// Update Video State to Play
		$(parentID).attr('state','play');
		
		// Hide Play button and show Pause button
		$(this).addClass('hidden');
		
		// Play the specified video
		playVideo(peerEasyrtcid);
		
		$(parentID +' div').addClass('play');
		$(parentID +' div.icon-pause').removeClass('hidden');
	});
	
	// Hook Pause button Click event
	$(monitorID +' div.icon-pause').click(function()
	{
		// Find parent ID
		var parentID = '#'+ $(this).parent().attr('id');
		
		// Update Video State to Play
		$(parentID).attr('state','pause');
		
		// Hide Play button and show Pause button
		$(this).addClass('hidden');
		
		// Pause the specified video
		pauseVideo(peerEasyrtcid);
		
		$(parentID +' div').removeClass('play');
		$(parentID +' div.icon-play').removeClass('hidden');
	});
}


// Document is Ready!
$(document).ready(function()
{
	// Initialize the application
	initApplication();
	
	// Connect easyRTC
	connect();
});

