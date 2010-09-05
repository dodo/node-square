$(function(){ /* visual */
//// ready

node2.fade_and_remove = function(html_id) {
  var current  = $('#' + html_id);
  current.fadeOut(90, function () {
    current.remove();
    //updateCanvas();
  })
}

// overlay
node2.error_msg = function(text){
  if(!text){
    text = '!!!'
  }
  node2.print_message("<em><strong>Error: " + text + "</strong></em>");
  $('#error').text( "Error: " + text ).
      animate({backgroundColor:"red"},100);
  setTimeout(function () {
      $('#error').animate({backgroundColor:$('body').css("backgroundColor")}, 1000)
  }, 5000);
}



//// close
});
