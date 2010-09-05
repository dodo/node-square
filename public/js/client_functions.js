$(function(){ /* client_functions / outbox */
//// ready

//// helpers
// send
send = function(what, hash){
  if(!node2.SILENT){
    to_send = {};
    to_send[what] = hash;
    node2.socket.send(json_plz( to_send ));
  }
}

// json
var json_plz = function(obj){
  return JSON.stringify(obj)
}

// id transformation
var id_for_html = function(arr){
  return 'n_' + arr.join('_')
}
node2.id_for_html = id_for_html

var id_for_json = function(obj){
  a = [] 
  $.each(obj.slice(2).split('_'), function(cur,ele){
    a[cur] = parseInt(ele);
  })
  return a
}
node2.id_for_json = id_for_json

// find the node html_id from within a node
var get_node_id = function(ele){
  return $(ele).parents('.node')[0].id
}
node2.get_node_id = get_node_id


//// send functions

// user management
node2.register = function(name, color, hash){
  node2.socket.send(json_plz({
    register: {
      'name': name,
      'color': color,
      'hash': hash,
    }
  }) )
}

node2.change_name = function(name){
  $.cookie('name', name)
  send('change_name', {
      'name': name,
  });
}

node2.change_color = function(color){
  $.cookie('color', color)
  send('change_color', {
      'color': color,
  });
}


//...
node2.send_message = function(content){
  send('chat_message', {
    content: content,
  })  
}

node2.add_node =  function(content, to){
  if(!node2.READONLY){
    send('add_node', {
      'content': content,
      'to': to,
    });
  }
}

node2.move_node = function(id, to){
  if(!node2.READONLY){
    send('move_node', {
      'id': id,
      'to': to,
    })
  }
}

node2.delete_node = function(id){
  if(!node2.READONLY){
    send('delete_node', {
     'id': id,
    });
  }
}

// changing properties
node2.edit_content = function(id, content){
  send('edit_content', {
    'id': id_for_json(id),
    'content': content,
  });
}
/*
node2.change_position = function(id, $DODO){
  socket.send(json_plz({
    edit_content: {'id': id, '$DODO': $DODO,}
  }) )
}
*/

// bubble management
node2.create_bubble = function(bubble_name, name, color){
  node2.socket.send(json_plz({ //TODO: create 'ignore silent' send
    create_bubble: {
      'bubble_name': bubble_name,
      'user_name': name,
      'user_color': color,
    }
  }) )
}


/// manipulation of nodes

node2.draw_node = function(node, par_id){
  if(node) {
    var html_id = id_for_html(par_id) + '_' + ($('.'+ id_for_html(par_id)).length )
    obj = $('#protonode').clone().
                  attr('id', html_id ).
                  addClass(id_for_html(par_id)).
                  addClass('user_' + node.user).
                  //attr('relation', id_for_html(par_id)).
                  draggable( node2.draggable_options ).
                  droppable( node2.droppable_options ).
                  appendTo('#nodes').fadeIn(100);
    obj.find('p').text( node.content || ' ' );
    console.log("affe", $('#user_' + node.user).length )
    $('.user_' + node.user).find('.holder').css('backgroundColor', $('#user_' + node.user).css('color'));
    var par = $('#'+id_for_html(par_id));
    par.attr('relation',par.attr('relation')+','+html_id);
    node2.initNode(obj, par);
    node2.springs_physics.add(html_id, id_for_html(par_id));
    if(node.subs) {
      $.each(node.subs, function(_,cur){
        node2.draw_node(cur, id_for_json(html_id) )
      });  
    }    
  }
}

node2.draw_all_nodes = function(node) {
    node2.draw_node(node.subs[0].subs[0], [0]);
    $('#n_0_0').addClass("root");
    node2.ani_man.animate(1000, 2);
};

// changing tree structure
node2.delete_with_children = function(current){
console.log('DEL')
console.log($(current))

    var children = ''
    if( $(current).attr('relation') && $(current).attr('relation').length ){
      children = $(current).attr("relation")
    }
    clog(4444444)
    console.log(children)
    $.each(children.split(","),function (_,relation) {
    console.log(relation)
        if(relation != "") {
            var target = $("#"+relation);
            clog('t')
            clog(target)
            if(target.length) {
            console.log('BBBBBBBBBBBBBBB')
               node2.delete_with_children(target)
            }
        }
    });
    clog('REM')
    $(current).remove()
//    fade_and_remove( $(current)[0].id )
}

/// interface

node2.print_message = function (msg) {
    var date = new Date();
    var p = function (n) {return n < 10 ? "0" + n : n;}; 
    var strdate = p(date.getHours())+":"+p(date.getMinutes())+":"+p(date.getSeconds());
    $('#messages').append("<p> <span class='time'>["+strdate+"]</span>"+msg+"</p>");
    $('#messages').animate({marginTop:$('#chat_window').height()-$('#messages').height()},200);
};



//// close
});
