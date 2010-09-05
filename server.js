/*
 * node-square - collaborative persistent mindmapping
 *
 * Copyright (C) 2010 dodo, rbjl, Thammi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Module dependencies.
 */

require.paths.unshift(__dirname + '/lib');

var express = require('express'),
    connect = require('connect'),
    io = require('socket.io'),
    session = require('./session'),
    db = require('./db');

var error_catcher = function(error) {
    console.log("EXCEPTION");
    console.log(error);
    console.log(error.stack)
}

db.connect(function(dbc) {
    var app = module.exports = express.createServer();

    // Configuration

    app.configure(function(){
        app.set('views', __dirname + '/views');
        app.use(connect.bodyDecoder());
        app.use(connect.methodOverride());
        app.use(connect.compiler({ src: __dirname + '/public', enable: ['less'] }));
        app.use(app.router);
        app.use(connect.staticProvider(__dirname + '/public'));
    });

    app.configure('development', function(){
        app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function(){
       app.use(connect.errorHandler());
    });

    // Routes

    app.get('/', function(req, res){
        res.render('index.haml', {
            locals: {
                title: 'Node²',
                hash: '',
            }
        });
    });

    app.get('/:hash', function(req, res){
        hash = req.params.hash;
        res.render('index.haml', {
            locals: {
                title: 'Node²',
                hash: hash,
            }
        });
    });




    // Only listen on $ node app.js

    if (!module.parent) {
        app.listen(parseInt(process.env.PORT) || 3000);
        console.log("server listening on port %d ...", app.address().port);

        ios = io.listen(app);

        var session_manager = session.session_manager();

        ios.on('connection', function(client) {
            var bubble, session, user, rights = 0;

            var error = function(msg) {
                client.send(JSON.stringify({err: {msg: msg}}));
            }

            var server_info = function(msg_hash) {
                client.send(JSON.stringify({info: msg_hash}));
            }

            client.send(JSON.stringify({
                debug: {msg: 'hello world'}
            }) );

            client.on('disconnect', function() {
                console.log('bye client')
                if(session) {
                    session.remove_client(client);
                    session.broadcast(JSON.stringify({left: {id: user.id, name: user.name}}));
                }
            });

            client.on('error', error_catcher)

            client.on('message', function(msg) {
                if(session && !session.alive) {
                    console.log('clearing client from destroyed session');
                    console.log(session.alive)
                    session = null;
                }

                try {
                    console.log("incoming: " + msg);
                    stanza = JSON.parse(msg);

                    // enter a chat
                    if(stanza.register) {
                        if(session) {
                            error("Already attached to a session");
                            return;
                        }

                        // TODO: move bubble into session?
                        d = stanza.register

                        // db-abstraction
                        bubble = dbc.get_bubble(d.hash);

                        // sending the tree
                        bubble.get_tree(function(tree) {
                            console.log("tree:");
                            console.log(tree);

                            if(tree) {
                                for(var n = 0; n < tree.hashes.length; n++) {
                                    if(tree.hashes[n] == d.hash) {
                                        console.log("rights: " + n);
                                        rights = n;
                                    }
                                }

                                // send the info
                                tree.hashes = tree.hashes.slice(0, rights + 1);
                                client.send(JSON.stringify({node_data: {bubble: tree}}));

                                if(rights > 0) {
                                    bubble.create_user(d.name, d.color, function(res) {
                                        user = res;

                                        console.log('adding session to client');

                                        // user/session management
                                        session = session_manager.get(d.hash);
                                        session.broadcast(JSON.stringify({registered: {id: user.id, name: d.name, color: d.color}}));
                                        session.add_client(client);

                                        console.log("session:",session)
                                    });
                                }
                            } else if(d.hash === ''){
                                server_info({
                                  silent: 'true'
                                })
                            } else {
                                // TODO: close connection?
                                error("Unknown Hash");
                            }
                        });
                    // create a bubble
                    } else if(stanza.create_bubble) {
                        d = stanza.create_bubble

                        if(d.user_name.trim() === '' || d.bubble_name === '') {
                            error("Invalid name");
                            return;
                        }

                        dbc.create_bubble(d.bubble_name, d.user_name, d.user_color, function(bubble) {
                            client.send(JSON.stringify({
                                bubble_created: {hash: bubble.hash},
                            }));
                        });
                    // change your color
                    } else if(stanza.change_color) {
                        if(session) {
                            color = stanza.change_color.color;
                            user.set_color(color);
                            session.broadcast(JSON.stringify({color_changed:{
                              id:    user.id,
                              color: color
                            }}));
                        } else {
                            error("No write permissions");
                        }
                    // change your name
                    } else if(stanza.change_name) {
                        if(session) {
                            name = stanza.change_name.name;

                            if(name.trim() === '') {
                                error("Invalid name");
                                return;
                            }

                            var old_name = user.name;
                            user.rename(name);
                            session.broadcast(JSON.stringify({name_changed: {
                              id:   user.id,
                              name: name,
                            },announcement:{
                              content: old_name + " is now " + name + ".",
                            }}));
                        } else {
                            error("No write permissions");
                        }
                    // add a node
                    } else if(stanza.add_node) {
                        if(session) {
                            d = stanza.add_node;
                            bubble.add_node(d.to, d.content, user.id, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_added:{
                                    content: d.content,
                                    to: d.to,
                                    user: user.id,
                                  }
                                }) );
                            });
                        } else {
                            error("No write permissions");
                        }
                    // send a message
                    } else if(stanza.chat_message) {
                        if(session) {
                            d = stanza.chat_message;
                            bubble.message_chated(d.content, user.id, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  message_chated:{
                                    user: user.id,
                                    content: d.content,
                                  }
                                }) );
                            });
                        } else {
                            error("No chatting allowed");
                        }
                    // move a node
                    } else if(stanza.move_node) {
                        if(session) {
                            d = stanza.move_node;
                            bubble.add_moved(d.id, d.to, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_added:{
                                    id: d.id,
                                    to: d.to,
                                  }
                                }) );
                            });
                        } else {
                            error("No write permissions");
                        }
                    // delete a node
                    } else if(stanza.delete_node) {
                        if(session) {
                            bubble.del_node(stanza.delete_node.id, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  node_deleted:{
                                    id: stanza.delete_node.id,
                                  }
                                }) );
                            });
                        } else {
                            error("No write permissions");
                        }
                    // edit a node
                    } else if(stanza.edit_content) {
                        if(session) {
                            d = stanza.edit_content;
                            bubble.edit_node(d.id, d.content, function() {
                                // tell your friends
                                session.broadcast(JSON.stringify({
                                  content_edited:{
                                    id: d.id,
                                    content: d.content,
                                  }
                                }) );
                            });
                        } else {
                            error("No write permissions");
                        }
                    // close the bubble
                    } else if(stanza.destroy) {
                        if(session && rights > 1) {
                            session.destroy();
                            bubble.destroy();
                        } else {
                            error("Not enough permissions");
                        }
                    } else {
                        error("Unknown method");
                    }
                }
                catch(e)
                {
                    error_catcher(e);
                }
            });
        });
    }
});

