$.fn.extend({
    disableSelection: function() {
        this.each(function() {
            if (typeof this.onselectstart != 'undefined') {
                this.onselectstart = function() { return false; };
            } else if (typeof this.style.MozUserSelect != 'undefined') {
                this.style.MozUserSelect = 'none';
            } else {
                this.onmousedown = function() { return false; };
            }
        });
    }
});

$(document).ready(function() {
    $('.header').disableSelection();
    $('#canvas').disableSelection();
});

var sketchpad = {
    init : function (stage) {
        this.stage = stage;
        this.stage.parent = this.stage;
        stage.on("mousedrag", function (e) {
            sketchpad.paint.chainMove(e.x, e.y); 
        });
        stage.on("mousedown", function (e) {
            sketchpad.paint.chainStart(e.x, e.y); 
        });
        this.coloring.init();
    },
    coloring : {
        init : function () {
            var self = this;
            this.display = $("#c1");
            this.ri = $("#ri");
            this.ro = $("#ro");
            this.ro.innerHTML = ri.value;

            this.gi = $("#gi");
            this.go = $("#go");
            this.go.innerHTML = gi.value;

            this.bi = $("#bi");
            this.bo = $("#bo");
            this.bo.innerHTML = bi.value;

            this.text = $("#text");
            this.select = $("#colorselect");

            function setColorRGB() {
                self.ro.html(self.ri.val());
                self.go.html(self.gi.val());
                self.bo.html(self.bi.val());
                var color = "rgb(" + self.ri.val() + ", " + self.gi.val() + ", " + self.bi.val() + ")"
                self.display.css("background-color", color);
                self.color(color);
            }
            this.setColorRGB = setColorRGB;
            ri.addEventListener("change", setColorRGB, false);
            gi.addEventListener("change", setColorRGB, false);
            bi.addEventListener("change", setColorRGB, false);
            setColorRGB();

            function setColorHex() {
                self.display.css("background-color", self.text.val());
                self.color(self.text.val());
            }
            this.setColorHex = setColorHex;
            $("#sethex").on("click", setColorHex);

            function setColorSelect() {
                self.display.css("background-color", self.select.val());
                self.color(self.select.val());
            }
            this.setColorSelect = setColorSelect;
            this.select.on("change", setColorSelect);
            this.select.on("mouseup", setColorSelect);
        },
        colors : ["#000"],
        max : 7,
        color : function (c) {
            if (arguments.length) {
                [].unshift.call(this.colors, c);
                var off = this.colors.length - this.max;
                if (off > 0)
                    this.colors.splice(this.max, off);
            } else {
                return this.colors[0];
            }
        },
        menu : function () {},
    },
    paint : {
        chainStart : function (x, y) {
            this.chain = can.chain({
                points : [{x : x, y : y}],
                lineWidth : this.width,
                lineJoin : "round",
                lineCap : "round",
                style : sketchpad.coloring.colors[0]
            });
            sketchpad.stage.add(this.chain);
            sketchpad.stage.draw();
        },
        chainMove : function (x, y) {
            this.chain.points.push({x:x,y:y});
            sketchpad.stage.draw();
        },
        brush : function (x, y) {
            var r = this.width/2;
            sketchpad.stage.add(can.circle({
                x:x-r,
                y:y-r,
                radius:r,
                fill:sketchpad.coloring.colors[0]
            }));
            sketchpad.stage.draw();
        },
        pencil : function (x, y) {
            sketchpad.stage.add(can.rect({
                x:x,
                y:y,
                width:1,
                height:1,
                fill:sketchpad.coloring.colors[0]
            }));
            sketchpad.stage.draw();
        },

        width : 10,
    }
};

window.addEventListener("load", function() {
    var body = document.getElementsByTagName("body")[0];
    body.style.width  = window.innerWidth  + "px";
    body.style.height = window.innerHeight + "px";
    var t = [];
    t.push(document.getElementById("colors").getElementsByTagName("div")[0]);
    t.push(document.getElementById("tools").getElementsByTagName("div")[0]);
    t.push(document.getElementById("canvas").getElementsByTagName("div")[0]);

    function dragStart(event) {
        body.dragging = true;
        var p = this.parentNode;
        body.drag = p;
        var rect = p.getBoundingClientRect();
        body.point = {x:event.clientX, y:event.clientY};
        p.style.top  = (rect.top  - 10) + "px";
        p.style.left = (rect.left - 10) + "px";
        event.stopPropagation();
        event.preventDefault();
        return false;
    }

    body.addEventListener("mousemove", function (e) {
        if (this.dragging) {
            var rect = this.drag.getBoundingClientRect();
            var diffx = e.clientX - this.point.x;
            var diffy = e.clientY - this.point.y;
            this.point = {x:e.clientX, y:e.clientY};
            this.drag.style.top  = (rect.top  - 10 + diffy) + "px";
            this.drag.style.left = (rect.left - 10 + diffx) + "px";
        }
        if (this.resizing) {
            var c = document.getElementById("canvas");
            var s = document.getElementById("stage");
            var rect = c.getBoundingClientRect();
            c.style.width = (e.clientX-rect.left-2)+"px";
            c.style.height = (e.clientY-rect.top-2)+"px";
            sketchpad.stage.width(e.clientX-rect.left-7);
            sketchpad.stage.height(e.clientY-rect.top-30);
            sketchpad.stage.draw();
        }
    }, false);
    body.addEventListener("mouseup", function (e) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.resizing) {
            this.resizing = false;
        }
    }, false);

    for (var i=0;i<t.length;i++) {
        t[i].addEventListener("mousedown", dragStart, false);
        var p = t[i].parentNode;
        var rect = p.getBoundingClientRect();
        p.style.width = (p.clientWidth + 1) + "px";
        p.style.position="absolute";
        p.style.top  = (rect.top  - 10) + "px";
        p.style.left = (rect.left - 10) + "px";
    }

    document.getElementById("canvas").addEventListener("mousedown", function (e) {
        body.resizing = true;
    }, false);
    document.getElementById("stage").addEventListener("mousedown", function (event) {
        event.stopPropagation();
        event.preventDefault();
        return false;
    }, false);
    
    sketchpad.init(can.stage(document.getElementsByTagName("canvas")[0]));
}, false);
