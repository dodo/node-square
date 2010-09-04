
var springsPhysics = function () {
    var system = {};
    // defaults

    var _default = system.defaults = {
            length:   80,   // 100
            strength: 300,  // 500
            mass:     342,  // 342
            charge:   800,  // 800
            friction: 0.5,  // 0.9
        };

    // helper

    var _position_helper = function (offset,obj) {
        var off = {x: obj.offset().left, y: obj.offset().top};
        var mid = {x: obj.width() / 2,   y: obj.height() / 2};
        var pos = {x:off.x - offset.left  + mid.x,
                   y:off.y - offset.top   + mid.y};
        var size = (obj.width()+obj.height()) / 2;
        return {offset:off, middle:mid, position:pos, size:size};
    };

    var min = function (s1,s2) {if(s2>s1) return s1; else return s2};
    var max = function (s1,s2) {if(s1>s2) return s1; else return s2};

    var vmag = function (vec) {return Math.sqrt(vec.x*vec.x+vec.y*vec.y);};
    var vmul = function (vec,a) {return {x: vec.x*a, y: vec.y*a}};
    var vadd = function (a,b) {return {x:a.x+b.x, y:a.y+b.y};};
    var vsub = function (a,b) {return {x:a.x-b.x, y:a.y-b.y};};
    var vnorm = function (vec) {if(vec.x == 0 && vec.y == 0)
        return vec; else return vmul(vec, 1 / vmag(vec));};

    var interpret_uservalue = function (old,input) {
        var parts = /^([+\-]=)?([\d+.\-]+)(.*)$/.exec(input);
        var val = parseFloat(parts[2]);
        if(isNaN(val))    return old;
        else if(parts[1]) return old + ((parts[1] === "-=" ? -1 : 1) * val);
        else              return val;
    };

    var interpret_userinput = function (obj, param, input) {
        var ps = param.split(".");
        var p = ps.shift();
        if(p in obj) {
            if(ps.length == 0)
                 obj[p] = interpret_uservalue(obj[p],input);
            else obj[p] = interpret_userinput(obj[p],ps.join("."),input);
        } else console.error("key",p,"not in",obj);
        return obj;
    };

    // library

    // header ---
    var constructor = system.generate = function (params) {
        if(typeof(params) == "undefined") params = _default;
        // TODO more params check
        var engine = build(params);
        var realtime = function (/*time in millisec*/ ms) {
            var dt = ms / 1000;
            simulate(engine, dt);
            animate(engine, dt);
            return draw(engine);
        };
        var step = function (/*time in millisec*/ ms, /*number of steps*/ nr) {
            var dt = ms / nr / 1000;
            for(var i = 0 ; i < nr ; i++) simulate(engine, dt);
            return engine;
        };
        var pre_render = function (/*time in millisec*/ ms, /*number of steps*/ nr, /*animation time*/ anims) {
            if(typeof(anims) == "undefined") var ani = ms; else  var ani = anims;
            step(ms, nr);
            animate(engine, ani);
            return draw(engine);
        };
        var live_render = function (/*time in millisec*/ ms, /*number of steps*/ nr, /*animation time*/ anims) {
            if(typeof(anims) == "undefined") var ani = ms; else  var ani = anims;
            step(ms, nr*ani/1000);
            console.log(ms, nr*ani/1000)
            var id = setInterval(function () {dom_draw(engine);},ani/nr);
            setTimeout(function() {clearInterval(id);},ani);
            //setTimeout("clearInterval("+id+")",ani);
            animate(engine, ani);
            return draw(engine);
        };
        var ani_manager = function (/*number of steps per sec*/ nr, scale) {
            var manager = {};

            var oneStep = function() {
                realtime(1000/nr);
            };

            var start = manager.start =  function() {
                if(!running()) {
                    interval = setInterval(oneStep, 1000/nr);
                }
            }

            var stop = manager.stop =  function() {
                if(running()) {
                    clearInterval(interval);
                    delete interval;
                }
            }

            manager.animate = function (/*animation time*/ anims, special_scale) {
                if(typeof(special_scale) == "undefined") {
                    special_scale = 1;
                }

                if(!running()) {
                    live_render(anims*scale*special_scale, nr, anims);
                    console.log('starting animation', anims/(scale*special_scale), nr, anims);
                }
            };

            manager.toggle = function() {
                if(!running()) {
                    start();
                } else {
                    stop();
                }
            };

            var running = manager.running = function () {
                return typeof(interval) != "undefined";
            };

            return manager;
        };
        var modify_nodes = function (dt,params) {
            return draw(animate(update_nodes(engine,params),dt));
        };
        var modify_joints = function (params) {
            return draw(update_joints(engine,params));
        };
        var add = function (nodeid,parid) {return add_node(engine,nodeid,parid);};
        var update = function (nodeid,params) {return update_node(engine,nodeid,params);};
        var remove = function (nodeid) {return remove_node(engine,nodeid);};
        var static = function () {return draw(engine);};
        return {realtime:realtime, step:step, pre_render:pre_render,
                static:static, add:add, update:update, remove:remove,
                live_render:live_render, ani_manager: ani_manager,
                modify_nodes:modify_nodes, modify_joints:modify_joints};
    };

    // body ---
    var build = system.build = function (params) {
        if(typeof(params) == "undefined") params = _default;
        var nodes = {}, joints = [];
        var window = $("#nodes");
        //get nodes
        $(".node").each(function () {
            var current = $(this);
            var composition = _position_helper(window.offset(), current);
            nodes[current[0].id] = cur_node = {
                    id: current[0].id,
                    object: current,
                    position: composition.position,
                    middle: composition.middle,
                    offset: composition.offset,
                    size: composition.size,
                    acceleration: {x:0, y:0},
                    speed: {x:0, y:0},
                    charge: params.charge,
                    mass: params.mass,
                    friction: params.friction,
                    joints: {},
                    parent:0,
                };
            //get joints
            $.each(current.attr("relation").split(","),function (_,relation) {
                if(relation != "") {
                    var target = $("#"+relation);
                    if(target.length) {
                        joints.push(
                            nodes[cur_node.id].joints[target[0].id] = {
                                source: cur_node,
                                target: target[0].id,
                                length: params.length,
                                strength: params.strength,
                            });
                    }
                }
            });
        });
        //fill relations with nodes
        $.each(joints,function (_,joint) {
            joint.target = nodes[joint.target];
            joint.target.parent = joint.source;
        });
        return {nodes:nodes, joints:joints, params:params};
    };

    var simulate = system.run = function (engine, dt) {
        //calc joint acceleration
        $.each(engine.joints, function (_, joint) {
            var diff = vsub(joint.target.position, joint.source.position);
            var dir = vnorm(diff);
            var difflen = joint.length - vmag(diff);
            var accel = vmul(dir, difflen * joint.strength);//<- calc stuff
            joint.target.acceleration = vadd(joint.target.acceleration,accel);
        });
        //calc electric force acceleration (bl!tz)
        $.each(engine.nodes, function (_, node) {
            var accel = {x:0, y:0};
            $.each(engine.nodes, function (_, other) {
                if(other.id != node.id) {
                    var diff = vsub(node.position,other.position);
                    var dir = vnorm(diff);
                    var threshold = engine.params.length + node.size;
                    var difflen = diff.x*diff.x +
                                  diff.y*diff.y; //vmag(diff)^2 //<- calc stuff
                    var difflen = vmag(diff); //<- calc stuff
                    if(difflen < threshold)
                        difflen = (1 - difflen/threshold) * threshold;
                    if(difflen > 1e2)
                        accel = vadd(accel,vmul(dir,
                            (node.charge*other.charge)/difflen));
                    else accel = vadd(accel,vmul(dir,threshold));
                }
            });
            node.acceleration = vadd(node.acceleration,accel);
        });
        //apply results
        $.each(engine.nodes, function (_, node) {
            // omitt all currently hovered nodes and root too
            if(!(node.object.hasClass("fixed")) && !(node.object.hasClass("root"))) {
                //calc speed
                node.speed = vadd(node.speed, vmul(node.acceleration,dt/node.mass));
                node.speed = vmul(node.speed, node.friction);// ^^^ calc stuff
                //apply speed
                node.position = vadd(node.position, node.speed);
            }
            //clean acceleration
            node.acceleration = {x:0, y:0};
        });
        return engine;
    };

    var draw = system.draw = function (engine) {
        var obj = $("#canvas");
        var canvas = obj[0];
        canvas.height = obj.height();
        canvas.width  = obj.width();
        var g = canvas.getContext("2d");
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.beginPath();
        $.each(engine.joints, function (_, joint) {
            var src = joint.source.position;
            var trg = joint.target.position;
            //var src = vsub(joint.source.position,{x:0,y:joint.source.middle.y/2});//??
            //var trg = vsub(joint.target.position,{x:0,y:joint.target.middle.y/2});//??
             // drawing ...
            g.moveTo(src.x, src.y);
            g.lineTo(trg.x, trg.y);
        });
        g.stroke();
        g.closePath();
        return engine;
    };

    var dom_draw = system.dom_draw = function (engine) {
        var window = $("#nodes");
        var obj = $("#canvas");
        var canvas = obj[0];
        canvas.height = obj.height();
        canvas.width  = obj.width();
        var g = canvas.getContext("2d");
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.beginPath();
        $.each(engine.joints, function (_, joint) {
            var src = _position_helper(window.offset(), joint.source.object);
            var trg = _position_helper(window.offset(), joint.target.object);
             // drawing ...
            g.moveTo(src.position.x, src.position.y);
            g.lineTo(trg.position.x, trg.position.y);
        });
        g.stroke();
        g.closePath();
        return engine;
    };

    var animate = system.animate = function (engine, dt) {
        $.each(engine.nodes, function (_, node) {
            if(!(node.object.hasClass("moving"))) {
                var pos = vsub(node.position, node.middle);
                node.object.animate({left:pos.x, top:pos.y}, dt);
            }
        });
        return engine;
    };

    var update_node = system.update_node = function (engine, jqnode, params) {
        if(jqnode[0].id in engine.nodes) {
            var node = engine.nodes[jqnode[0].id];
            if(typeof(params) == "undefined") {
                var window = $("#nodes");
                var composition = _position_helper(window.offset(), jqnode);
                node.position = composition.position;
                node.middle = composition.middle;
                node.offset = composition.offset;
                node.size = composition.size;
            } else {
                for(var param in params) {
                    node = interpret_userinput(node, param, params[param]);
                }
            }
        } else console.error("unknown node id",jqnode[0].id);
        return engine;
    };

    var add_node = system.add_node = function (engine, nodeid, parid) {
        var window = $("#nodes");
        var current = $("#"+nodeid);
        var composition = _position_helper(window.offset(), current);
        engine.nodes[nodeid] = cur_node = {
                id: nodeid,
                object: current,
                position: composition.position,
                middle: composition.middle,
                offset: composition.offset,
                size: composition.size,
                acceleration: {x:0, y:0},
                speed: {x:0, y:0},
                charge: engine.params.charge,
                mass: engine.params.mass,
                friction: engine.params.friction,
                joints: {},
            };
        $.each(current.attr("relation").split(","),function (_,relation) {
            if(relation != "") {
                var target = $("#"+relation);
                if(target.length) {
                    engine.joints.push(
                        engine.nodes[nodeid].joints[target[0].id] = {
                            source: cur_node,
                            target: engine.nodes[target[0].id], // error source
                            length: engine.params.length,
                            strength: engine.params.strength,
                        });
                }
            }
        });
        if(parid == "n_0") return engine; // all root objects
        return add_joint_to_node(engine, nodeid, parid);
    };

    var remove_node = system.remove_node = function (engine, nodeid,recursive) {
        if(nodeid in engine.nodes) {
            var kill = [];
            var node = engine.nodes[nodeid];
            console.log("remove",node);
            $.each(node.joints, function (_, joint) {
                console.log("j",joint,_);
                remove_node(engine,joint.target.id,1);
                kill.push(engine.joints.indexOf(joint));
            });
            kill.sort(function (a,b) {return a - b;});
            while(kill.length) engine.joints.splice(kill.pop(),1);
            if(!recursive) {
                for(var i = 0; i < engine.joints.length; i++) {
                    var joint = engine.joints[i];
                    if(joint.target.id == nodeid) {
                        engine.joints.splice(i,1);
                        delete joint.source.joints[nodeid];
                        break;
                    }
                }
                draw(engine);
            }
            delete engine.nodes[nodeid];
        } else console.error("unknown node id",nodeid);
        return engine;
    };

    var add_joint_to_node = system.add_joint_to_node = function (engine, nodeid, parid) {
        if((parid in engine.nodes) && (nodeid in engine.nodes)) {
            var par = engine.nodes[parid];
            var node = engine.nodes[nodeid];
            engine.joints.push( par.joints[node.id] = {
                    source: par,
                    target: node,
                    length: engine.params.length,
                    strength: engine.params.strength,
                });
        } else {
            if(!(parid in engine.nodes)) console.error("unknown parent node id",parid);
            if(!(nodeid in engine.nodes)) console.error("unknown node id",nodeid);
        }
        return engine;
    };

    var update_nodes = system.update_nodes = function (engine, params) {
        for(var nodeid in engine.nodes) {
            var node = engine.nodes[nodeid];
            for(var param in params) {
                node = interpret_userinput(node, param, params[param]);
            }
        }
        return engine;
    };

    var update_joints = system.update_joints = function (engine, params) {
        for(var i = 0; i < engine.joints.length; i++) {
            var joint = engine.joints[i];
            for(var param in params) {
                joint = interpret_userinput(joint, param, params[param]);
            }
        }
        return engine;
    };

    return system;
}();

