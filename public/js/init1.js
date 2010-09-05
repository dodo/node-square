
$(function(){ /* init1 */
//// main client init initialisation

// node2 global
node2 = {}

// globals vars
node2.READONLY = false
node2.SILENT   = false

/// cookies TODO remove initial_
var initial_name  = $.cookie('name')
if( !initial_name ){ initial_name = 'unknown' } // TODO overlay
$.cookie('name',initial_name);

$('#change_name').val( initial_name )

/// create socket
node2.socket = new io.Socket(location.hostname, {
  transports: ['websocket', 'xhr-polling', 'xhr-multipart', 'server-events', 'htmlfile', 'flashsocket']
});

//// close
});
