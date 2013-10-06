var apigeeClientCreds = {
	orgName: 'wedify',
	appName: 'wedify'
};

var apigeeClient = new Apigee.Client(apigeeClientCreds);
var apigeeUser;


var tracks = new Usergrid.Collection({
	type: 'tracks',
	client: apigeeClient
});

apigeeClient.login('Raibaz', 'ambasciata', function(err) {
	if(err) {
		alert("Error logging in: " + err);
	} else {
		apigeeClient.getLoggedInUser(function(err, data, user) {
        	if(err) {
            	alert("Error getting logged user: " + err);
           	} else {
            	if (apigeeClient.isLoggedIn()){
            		apigeeUser = user;               
            	}            	
         	}
        });
	}
});


$(document).ready(function() {
	$('#submit-playlist').click(doSubmitPlaylist);	
	$('#playlist').click(function() {
		$('#playlist').val('');
	})
	$(document).on('click', '.votelink', doUpvote);
	setInterval(updateNowPlaying, 3500);
	setInterval(updateTracklist, 5000);
});

function updateNowPlaying() {
	apigeeClient.getEntity({		
		type: 'nowplaying',
		name: 'nowplaying'		
	}, function(err, resp) {
		if(err) {
			alert('error fetching now playing');
		} else {
			$('#np-artist').html(resp._data.artist);
			$('#np-title').html(resp._data.title);
		}
	});
}

function updateTracklist() {
	tracks.qs = {limit: '999', ql:'playcount eq 0 order by votes desc'};	
	tracks.fetch(
	function() {
		console.log(tracks);
		$('#tracks').empty();
		$.each(tracks._list, function(index, val) {			
			var trackVotes = val._data.votes;
			if(trackVotes === undefined) {
				trackVotes = 0;
			}
			$('#tracks').append('<li data-votes="' + trackVotes + '" id="' + 
								val._data.uuid + '">' + val._data.artist + " - " + val._data.title + " (" + trackVotes + ')' + 
								' <a class="votelink"><img src="like_icon.png" alt="Upvote"/></a></li>');
		});
	}, function() {
		console.log("Error fetching tracks :(");
	});
}

function doUpvote(event) {
	event.preventDefault();
	var target = $(this);	
	var parent = target.parent();
	console.log(target.parent());
	var track = new Usergrid.Entity({
		client: apigeeClient,
		data: {
			type: 'track',
			uuid: parent.attr('id'),
			votes: parent.data('votes') + 1
		}
	});
	track.save(function(err, result) {
		if(err) {
			console.log("Error updating votes");
		} else {
			console.log("Votes updated successfully");
			updateTracklist();
		}
	});
}

function doSubmitPlaylist() {
	if($('#playlist').val() === '') {
		return;
	}
	console.log($('#playlist').val());
	var playlist = {
		type: 'playlist',
		name: $('#playlist').val(),
		spotify_id: $('#playlist').val()		
	};

	apigeeClient.createEntity(playlist, function(err, result) {
		if(err) {
			alert('error creating entity: ' + err);			
		} else {
			alert('Playlist created successfully');
			console.log(result);
		}
	});
};