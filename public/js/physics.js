$(function(){
//// ready

node2.initNode = function (_node) {
    var node = $(_node);
    var holder = node.find(".holder");
    var buttons = holder.find(".buttons");
    var body = node.find(".body");
    var canvas = $("#canvas");
    var left, top;

    // nice initial position
    var par = $('#'+node[0].id.slice(0, -2));
    if(par && par.length) {
        childs = $('.'+node[0].id.slice(0, -2)).length;
        a = childs % 4;
        left = par.offset().left + (childs%2) + 1/(a+1) - 1.5;
        top = par.offset().top + (childs/2)%2 - 0.5;
    } else {
        left = canvas.offset().left + canvas.width() / 2;
        top = canvas.offset().top + canvas.height() / 2;
    }
    var holder_out = false;
    var h = Math.min(body.outerHeight(), buttons.outerHeight())+1;
    // node setup
    node.css({
        left: left,
        top: top,
        height: h,
            position:"absolute",
        width:buttons.outerWidth()*2+body.outerWidth(),
    }).hover(
        function () /*handleIn*/  {$(this).addClass("fixed");},
        function () { // handleOut
            $(this).removeClass("fixed");
            if(!holder_out) return;
            holder_out = false;
            var me = $(this).find(".holder");
            if(me.parent().hasClass("moving")) return;
            var mybuttons = me.find(".buttons");
            var h = Math.min(mybuttons.outerHeight(),
                             me.parent().find(".body").outerHeight())+1;
            me.css("overflow", "hidden");
            me.animate({
                    width: node2._const.holder_width * 0.2,
                    height: h,
                }, node2._const.fold_time, function () {
                    mybuttons.css("visibility","hidden");
            }).parent().animate({
                left:  '+=' + node2._const.holder_width,
                width: '-=' + node2._const.holder_width,
                height: h,
            }, node2._const.fold_time);
        }
    );
    // buttons setup
    buttons.css("visibility","hidden");
    // holder setup
    holder.css({
        height: h,
        overflow: "hidden",
        width: node2._const.holder_width * 0.2,
    }).hover(
        function () { // handleIn
            if(holder_out) return;
            holder_out = true;
            var me = $(this);
            if(me.parent().hasClass("moving")) return;
            var mybuttons = me.find(".buttons");
            var h = Math.max(mybuttons.outerHeight(),
                             me.parent().find(".body").outerHeight())+7;
            mybuttons.css("visibility","visible");
            me.animate({
                    width: node2._const.holder_width,
                    height: h,
                }, node2._const.fold_time, function () {
                    me.css("overflow", "visible");
            }).parent().animate({
                left:  '-=' + node2._const.holder_width,
                width: '+=' + node2._const.holder_width,
                height: h,
            }, node2._const.fold_time);
        }
    );
};

/// init
node2.init_physics = function () {
// TODO remove global vars or capitalize or  move to sub hash const
    node2._const.fold_time = 50;
    node2._const.holder_width = $("#protonode .holder").outerWidth();
    node2.springs_physics = springsPhysics.generate();
    node2.springs_physics.static();

    node2.ani_man = node2.springs_physics.ani_manager(42, 50);
    //ani_man.start();

    $(".node").each(function (_, _node) {node2.initNode(_node);});
    //setTimeout("springsPhysics.generate().pre_render(10,23)",3000);
    //setInterval("springsPhysics.generate().pre_render(100,23)",100);
    //setInterval("springs_physics.static()",42);
}

//// close
});
