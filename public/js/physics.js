$(function(){
//// ready

node2.initNode = function (_node) {
    var node = $(_node);
    var holder = node.find(".holder");
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

    /*
    left = canvas.offset().left + canvas.width() / 2;
    top = canvas.offset().top + canvas.height() / 2;
    */

    node.css({left: left, top: top});
    //node.css({left:canvas.width() / 2, top:canvas.height() / 2});
    node.hover(
        function () {$(this).addClass("fixed");},
        function () {$(this).removeClass("fixed");}
    );
    node2.holder_min_height = Math.max(node2.holder_min_height, parseInt(holder.height()));
    var h = 13+parseInt(holder.parent().find(".body").height());
    holder.width('20px');
    holder.animate({width:'-=15px', height:h}, 100, function () {
        $(this).find(".button").css("visibility","hidden");
    }).parent().animate({height:h},100);
    holder.hover(
        function () {
            if($(this).parent().hasClass("moving")) return;
            var h = holder_min_height;
            if($(this).parent().hasClass("root")) {
                h -= $(this).find(".button").height()+7;
            }
            h = Math.max(h,13+parseInt($(this).parent().find(".body").height()));
            $(this).find(".button").css("visibility","visible");
            $(this).animate({width:'+=15px', height:h}, 50, function () {
                $(this).css("overflow","visible");
            }).parent().animate({left:'-=15px',width:'+=16px',height:h},50);},//handleIn
        function () {
            if($(this).parent().hasClass("moving")) return;
            var h = 13+parseInt($(this).parent().find(".body").height());
            $(this).css("overflow","hidden");
            $(this).animate({width:'-=15px', height:h}, 50, function () {
                $(this).find(".button").css("visibility","hidden");
            }).parent().animate({left:'+=15px',width:'-=16px',height:h},50);} //handleOut
    );
    node.css({height:Math.max(body.height(), node2.holder_min_height)+1,
               width:holder.width()+body.width()+23,
               position:"absolute",
             });
};

/// init
node2.init_physics = function(){
// TODO remove global vars or capitalize
    node2.holder_min_height = 0; 
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
