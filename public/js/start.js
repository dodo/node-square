$(function(){ /* init2 */
//// start the action ;)

node2.init_physics();

node2.socket.connect();

$('#change_name').val( $.cookie('name') || 'Anonymous' )
var initial_color = $.cookie('color') || 'black' // TODO: no global var

node2.register(
  $('#change_name').val(),
  initial_color,
  location.pathname.slice(1)
)

node2.print_message("Welcome");

//// close
});
