$(function(){ /* triggers */
//// ready

/// nodes

// draggables
node2.draggable_options = {
    start: function () {
        $(this).addClass("moving");
    },
    stop: function () {
        $(this).removeClass("moving");
        node2.springs_physics.update($(this));
        //springs_physics.live_render(10, 42, 500);
        node2.ani_man.animate(500);
    },
    drag: function () {
        node2.springs_physics.update($(this));
        node2.springs_physics.static();
    },
}
node2.droppable_options = {
    drop: function(_, ui){
      node2.move_node(this.id, ui.draggable[0].id)
  }
}

var __offset;
node2.mover_options = {
    start: function () {__offset = {top:0, left:0};},
    drag: function (_,ui) {
        node2.springs_physics.modify_nodes(0,{
            'position.x': "+=" + (ui.position.left - __offset.left),
            'position.y': "+=" + (ui.position.top  - __offset.top)
        });
        __offset.left = ui.position.left;
        __offset.top  = ui.position.top;
        ui.position.left = 0;
        ui.position.top  = 0;
    }    
}

$(".draggable").draggable( node2.draggable_options );
$(".draggable").droppable( node2.droppable_options );
$("#mover").draggable( node2.mover_options );

/// manipulating
$('.add_node').live('click', function(){
  var to_id   = id_for_json( get_node_id(this) )
  var content = $(this).parent().find('p').text()
  node2.add_node(content, to_id)
  return false
})

$('.delete_node').live('click', function(){
  var node_id = id_for_json( get_node_id(this) )
  node2.delete_node(node_id);
  return false;
})

$('.edit_content').live('click', function(){
  var node_id = get_node_id(this)
  var content = '5'//...
  node2.edit_content(node_id, content)
})

$("input.in-place-edit").live('keypress', function (e) {
  if( e.which == 13 ){
    $(this).replaceWith('<p>' + $(this).val() + '</p>')
  }
  else if( e.which == 27 ){
    inplace_restore_p(this)
  }
})

$("input.in-place-edit").live('blur', function () {
  inplace_submit_and_restore_p(this)
})

/// interface

$('#change_name_form').submit(function(){
  var name = $(this).find('input[type=text]').val()
  //var color = $(this).find('#colorpicker div').css('backgroundColor')
  node2.change_name(name);
  return false;
})

$('#chat_form').submit(function () {
    var text = $('#chat_msg').val();
    node2.send_message(text);
    $('#chat_msg').val('');
    $('#chat_msg').focus();
    return false;
});

$('#create_bubble_form').submit(function(){
  var name = $(this).find('input[type=text]').val();
  node2.create_bubble(name,  $.cookie('name'),  $.cookie('color'));
  return false;
})


$('.delete_bubble').click(function(){
  node2.delete_bubble()
  alert("ALERT BOX")
  return false;
})


$(window).resize(function () {
   node2.springs_physics.static();
});

//set_color(initial_color) // be lazy, don't solve bugs ;)
/*
var submit_color = function(colpkr){
  $(colpkr).fadeOut(500);
  $('#colorpicker div').css('backgroundColor', '#' + hex);
  return false
}*/

$('#colorpicker').ColorPicker({
  color: '#000000',
  onShow: function (colpkr) {
    $(colpkr).fadeIn(500);
    return false;
  },
//  onChange: function (hsb, hex, rgb) {
//    $('#colorpicker div').css('backgroundColor', '#' + hex);
//  },
  onHide: function(colpkr){
      $(colpkr).fadeOut(500);
      return false;
    },
  onSubmit: function(colpkr, hex){
      $('#colorpicker').css('backgroundColor', '#' + hex);
      node2.change_color('#' + hex)
      $(colpkr).fadeOut(500);
      return false;
    }
})


$('.realtime').click(function(){
    node2.ani_man.toggle();
    if(node2.ani_man.running()) {
        $('.realtime').animate({backgroundColor:"red"},100);
        node2.springs_physics.modify_joints(0,{
            length: 100,
            strength: 500,
        });
        node2.springs_physics.modify_nodes(0,{
            friction: 0.9,
            charge: 850,
        });
        console.log("realtime on.");
    } else {
        $('.realtime').animate({backgroundColor:$('#nonerealtime').css("backgroundColor")},100);
        node2.springs_physics.modify_joints(0,{
            length: 80,
            strength: 300,
        });
        node2.springs_physics.modify_nodes(0,{
            friction: 0.5,
            charge: 800,
        });
        console.log("realtime off.");
    }
});


$('.node p').live('dblclick', function(){
    edit_node_action($(this));
});

$('.edit.button').live('click',function(){
    edit_node_action($(this).parents(".node").find("p"));
});

/// helper functions

var edit_node_action = function (obj) {
    if(!node2.READONLY){ 
        var parent = obj.parent();
        obj.replaceWith('<input type="text" class="in-place-edit" value="' + obj.text() + '" />').focus();
        parent.find('input.in-place-edit').focus();
    }
};

var inplace_submit_and_restore_p = function(ele){
  node2.edit_content( node2.get_node_id(ele), $(ele).val() )
  $(ele).replaceWith('<p>' + $(ele).val() + '</p>')
}


//// done
});
