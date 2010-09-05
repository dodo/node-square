$(function(){ /* inbox */
//// socket messages send by server

/// receive
node2.socket.on('connect', function() {
  console.log('socket connected');
});

node2.socket.on('message', function(msg) {
  console.log('message incoming: ', msg);
  msg = JSON.parse( msg )

  for ( prop in  msg){
    if (typeof msg[prop] !== 'function'){ // enum only props
      val = msg[prop]

      switch(prop){
        case 'debug':
          console.log('_debug: ' + val.msg)
        break;case 'err':
          node2.error_msg(val.msg)
        break;case 'info':
          node2.SILENT = true;
        break;case 'registered':
          append_user(val.id, val);
          node2.print_message("<span class='announcement'>"+val.name+" connected.</span>");
        break;case 'left':
          fade_and_remove( 'user_' + val.id )
          print_message("<span class='announcement'>"+val.name+" disconnected.</span>");
        break;case 'node_data':
          $('#bubble').text( val.bubble.content )
          // build hash string
          console.log(val.bubble)
                    console.log(val.bubble.hashes.length)

          if( val.bubble.hasOwnProperty('hashes') ){
              hash_string = ''
//              if( val.bubble.hashes.length == 3 ){
  //              hash_string = hash_string.concat( '<a href="' + location.host + '/' + val.bubble.hashes[0] + '">admin version</a>' )
    //          }

              if( val.bubble.hashes.length >= 2 ){
                hash_string = hash_string.concat( '<a href="http://' + location.host + '/' + (val.bubble.hashes[val.bubble.hashes.length - 2]) + '">main version,</a> ')
              }
              hash_string = hash_string.concat( '<a href="http://' + location.host + '/' + val.bubble.hashes[val.bubble.hashes.length - 1] + '">read-only version</a>')

              if( val.bubble.hashes.length == 0 ){
                READONLY = true
              }
          }
          console.log('hs' + hash_string)
          $('#hashes').html( hash_string )
          // draw
          var name = $.cookie('name');
          for (cur in val.bubble.users){
            append_user(cur, val.bubble.users[cur]);
            if(val.bubble.users[cur].name == name)
                $('#colorpicker').css('backgroundColor',val.bubble.users[cur].color);
          }
          for(var i = 0; i < val.bubble.messages.length ; i++) {
              var msg = val.bubble.messages[i];
              node2.print_message("<em><span style='color:"+$('#user_' + msg.user).css('color')+"'>"+$('#user_' + msg.user).text()+"</span>: "+msg.content+"</em>");
          }
          node2.draw_all_nodes(val.bubble);
        break;case 'announcement':
          node2.print_message("<span class='announcement'>"+val.content+"</span>");
        break;case 'message_chated':
          node2.print_message("<span style='color:"+$('#user_' + val.user).css('color')+"'>"+$('#user_' + val.user).text()+"</span>: "+val.content);
        break;case 'name_changed':
          $('#user_' + val.id).text( val.name )
        break;case 'color_changed':
          $('#user_' + val.id).css('color', val.color)
          $('.user_' + val.id).find('.holder').css('background', val.color);//.css('border', '1px solid ' + val.color)
        break;case 'node_added':
          node2.draw_node(val, val.to);
          var html_id = id_for_html(val.to) + '_' + ($('.'+ id_for_html(val.to)).length-1 );
          var name = $.cookie('name');
          var user = $('#user_' + val.user);

          //Width fix
          var obj = $("#"+html_id);
          obj.addClass("fixed");
          obj.width(obj.find(".body").width()+33+obj.find(".holder").width());
          obj.height(obj.find(".body").height()+13);
          if(name == user.text())
            edit_node_action(obj.find("p"));
          ani_man.animate(1500, 3);

        break;case 'node_moved':
          // ..
        break;case 'node_deleted':
            jq_delete = $('#'+id_for_html(val.id))
            springs_physics.remove( jq_delete[0].id );
            delete_with_children( jq_delete );
        break;case 'position_changed':
          // ..
        break;case 'content_edited':
          $('#' + node2.id_for_html(val.id) + ' p').text(val.content);
          // ..
        break;case 'bubble_created':
          location.href = '/' + val.hash
        break;default:
          // ..
        break;
      }
    }
  }
});

/// helpers functions

var append_user = function(id, cur){
  $('ul#user_list').append('<li id="user_' + id + '" style="color:' + cur.color + '">' + cur.name + '</li>')
}



//// close
});
