$(function(){ /* init2 */
//// start the action ;)

node2.init_physics();

node2.socket.connect();

// TODO remove
var initial_color = $.cookie('color')
if( !initial_color ){ initial_color = 'black' }

node2.register(
  $('#change_name').val(),
  initial_color,
  location.pathname.slice(1)
)

node2.print_message("Welcome");

//// close
});
