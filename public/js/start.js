$(function(){ /* init2 */
//// start the action ;)

node2.init_physics();

node2.socket.connect();

$('input#change_name').val( $.cookie('name') || 'anonymous' )
var initial_color = $.cookie('color') || 'black' // TODO: no global var
$('#colorpicker').css("backgroundColor",initial_color);

node2.register(
  $('input#change_name').val(),
  initial_color,
  location.pathname.slice(1)
)

node2.print_message("Welcome");

//// close
});
