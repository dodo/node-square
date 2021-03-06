$(function(){ /* init1 */
//// main client init initialisation

// node2 global
node2 = {_const:{}};

// globals vars
node2._const.READONLY = false;
node2._const.SILENT   = false;

/// create socket
node2.socket = new io.Socket(location.hostname, {
  transports: ['websocket', 'xhr-polling', 'xhr-multipart', 'server-events', 'htmlfile', 'flashsocket']
});

/// helpers

// firefox workaround
if(typeof(console) == 'undefined') console ={log: function () {},
    error: function () {}, warn: function () {}, info: function () {}};

// less debug typing
var clog = function(str){ console.log(str) }


//// close
});
