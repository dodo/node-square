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

var mongo = require('./lib/mongodb'),
    db = require('./db');

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ?
    process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ?
    process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;

var client = new mongo.Db('node2', new mongo.Server(host, port, {}));
client.open(function() {
    client.collection('bubbles', function(err, coll) {
        var map = db.create_node('Welcome');

        var root = db.create_node('Welcome');
        map.subs.push(root);

        var mind = db.create_node('Mind Maps');
        mind.subs.push(db.create_node('Develope ideas'));
        mind.subs.push(db.create_node('Be creative'));
        mind.subs.push(db.create_node('Organize your chaos'));
        root.subs.push(mind);

        var pers = db.create_node('Persistency');
        pers.subs.push(db.create_node('Continue on another PC'));
        pers.subs.push(db.create_node('Create todo lists'));
        pers.subs.push(db.create_node('Make notes'));
        root.subs.push(pers);

        var co = db.create_node('Collaboration');
        co.subs.push(db.create_node('Invite friends'));
        co.subs.push(db.create_node('Read only access included'));
        co.subs.push(db.create_node('Share your ideas'));
        root.subs.push(co);

        var use = db.create_node('Usage');
        use.subs.push(db.create_node('Spread the links above to colaborate'));
        root.subs.push(use);

        var nodes = db.create_node('Nodes');
        nodes.subs.push(db.create_node('Drag&'));
        use.subs.push(nodes);
        
        var start_tree = {
            content:    'Welcome',
            hashes:     ['', db.random_hash() + db.random_hash()],
            users:      {},
            subs:       [map],
        };

        console.log(start_tree);

        coll.update({'hashes': ''}, start_tree, {upsert: 1}, function(err, res) {
            if(err) {
                console.log(err);
            } else {
                console.log("Done.");
            }

            client.close();
        });
    });
});

