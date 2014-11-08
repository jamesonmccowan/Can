var can = (function () {
    function isvalid (x) {
        //null/undefined
        if (x == null) {
            return false;
        }
        //NaN
        return x == x;
    }
    
    //Creates a type with the given bases and attributes.
    function proto (bases, attrs) {
        var f = attrs.constructor;
        if (!f) {
            f = function () {}
        }
        if (!Array.isArray(bases)) {
            bases = [bases];
        }
        
        var metaproto = {};
        var i = bases.length;
        while (i--) {
            var p = bases[i].prototype;
            for (var x in p) {
                metaproto[x] = p[x];
            }
        }
        f.prototype = Object.create(metaproto);
        f.prototype.constructor = f;
        f.prototype.__bases__ = bases;
        
        for (var a in attrs){
            var attr = attrs[a];
            if (typeof attr == "function") {
                f.prototype[a] = attr;
            } else {
                f[a] = attr;
            }
        }
        
        return f;
    }
    
    var anim_funcs = {
        "move" : function () {
            this.subject.move(this.dx, this.dy);
        }
    };
    
    var ease_funcs = {
        "linear" : function (x, t, d, start, cur, end) {
            return x;
        },
        "swing" : function (x, t, d, start, cur, end) {
            return 0.5-Math.cos(x*Math.PI)/2;
        }
    };
    
    var Animation = proto([], {
        constructor : function Animation(how, config) {
            if (typeof how == "string") {
                this.action = anim_funcs[how];
            } else if(typeof how == "object") {
                this.start = {};
                this.end = how;
                this.action = function (x) {
                    var t = new Date().getTime();
                    var target = this.target, end = this.end, dt = t-this.t;
                    this.t = t;
                    
                    for (var v in end) {
                        target[v] = this.start[v]*this.ease(
                            x, dt, this.dur,
                            this.start[v], target[v], end[v]
                        );
                    }
                    this.t = t;
                }
            } else if (typeof how == "function") {
                this.action = how;
            }
            
            var ease = config.ease;
            if (typeof ease == "string") {
                this.ease = ease_funcs[ease];
            } else if (typeof ease == "function") {
                this.ease = ease;
            } else {
                this.ease = ease_funcs.swing;
            }
            
            this.dur = parseFloat(config.duration)||0.4;
            this.redraw = (!!config.redraw)||true;
            this.start = config.start||function(){};
            this.step = config.step||function(){};
            this.done = config.done||function(){};
            this.fps = parseFloat(config.fps)||60;
            this.paused = false;
        },
        apply : function (target) {
            if (this.start) {
                var start = this.start, end = this.end;
                for (var v in end) {
                    start[v] = target[v];
                }
            }
            
            var self = this, x = 0, dt = 1/(this.dur*this.fps);
            
            this.target = target;
            this.timer = setInterval(function () {
                if (!self.paused) {
                    self.step(x);
                    self.action(x);
                    x+=dt;
                    if (x>1) {
                        clearInterval(self.timer);
                        self.done();
                    }
                    if (self.redraw && self.target.stage) {
                        self.target.stage.draw();
                    }
                }
            }, 1000/this.fps);
            this.start();
        },
        pause : function () {
            this.paused = true;
        },
        resume : function () {
            this.paused = false;
        },
        cancel : function () {
            clearInterval(this.timer);
            this.done();
        },
        repeat : function () {
            var self = this, x = 0, dt = 1/(this.dur*this.fps);
            
            this.timer = setInterval(function () {
                self.step(x);
                self.action(x);
                x+=dt;
                if (x>1) {
                    clearInterval(self.timer);
                    self.done();
                }                
                if (this.redraw) {
                    this.target.stage.draw();
                }
            }, 1000/this.fps);
            this.start();
        }
    });
    
    var Can = proto([], {
        constructor : function Can (config) {
            config = config||{};
            
            this.parent = config.parent||null;
            if (config.parent) {
                this.parent = config.parent;
                this.stage = this.parent.stage||null;
            } else {
                this.parent = null;
                this.stage = null;
            }
            
            this.align = config.align;
            this.angle = parseFloat(config.angle)||0;
            this.alpha = parseFloat(config.alpha)||null;
            if (config.composite)
                this.composite = config.composite;
            
            // events
            this.click = config.click||null;
            this.dblclick = config.dblclick||null;
            this.mousedown = config.mousedown||null;
            this.mouseenter = config.mouseenter||null;
            this.mouseleave = config.mouseleave||null;
            this.mousemove = config.mousemove||null;
            this.mouseup = config.mouseup||null;
            this.mousedrag = config.mousedrag||null;
            this.offscreen = config.offscreen||null;

            this.vis = (!!config.visible)||true;
            this.x = parseFloat(config.x)||0;
            this.y = parseFloat(config.y)||0;
            
            if(config.id) {
                this.id = config.id.toString();
            }
            
            var extra = config._extra||{};
            for (var x in extra) {
                this[x] = extra[x];
            }
        },
        find : function (id) {
            if (this.id === id.toString()){
                return this;
            }
            return null;
        },
        beginDraw : function (ctx) {
            // rotate and position
            if (this.angle) {
                ctx.translate(this.x+(this.width()/2),
                    this.y+(this.height()/2));
                ctx.rotate(this.angle);
                ctx.translate(-this.width()/2, -this.height()/2);
            } else { 
                ctx.translate(Math.round(this.x), Math.round(this.y));
            }

            // alignment by position
            if (this.align == "center")
                ctx.translate(-this.width()/2, -this.height()/2);
            else if (this.align == "right")
                ctx.translate(-this.width(), -this.height());
            
            // transparency / alpha
            if (this.alpha != null) {
                var a = ctx.globalAlpha;
                ctx.globalAlpha = this.alpha;
                this.alpha = a;
            }
            
            // composite
            if (this.composite != null) {
                var comp = ctx.globalCompositeOperation;
                ctx.globalCompositeOperation = this.composite;
                this.composite = comp;
            }
            
            return this;
        },
        endDraw : function (ctx) {
            // rotate and position
            if (this.angle!=0) {
                ctx.translate(this.width()/2, this.height()/2);
                ctx.rotate(-this.angle);
                ctx.translate(-this.x-(this.width()/2),
                    -this.y-(this.height()/2));
            } else {
                ctx.translate(-Math.round(this.x), -Math.round(this.y));
            }

            // alignment by position
            if (this.align == "center")
                ctx.translate(this.width()/2, this.height()/2);
            if (this.align == "right")
                ctx.translate(this.width(), this.height());

            // transparency / alpha
            if (this.alpha != null) {
                var a = ctx.globalAlpha;
                ctx.globalAlpha = this.alpha;
                this.alpha = a;
            }

            // composite
            if (this.composite != null) {
                var comp = ctx.globalCompositeOperation;
                ctx.globalCompositeOperation = this.composite;
                this.composite = comp;
            }
            
            return this;
        },
        position : function (x, y) {
            if (arguments.length) {
                var off = this.offset();
                return this.offset(x-off.x, y-off.y);
            } else {
                var place = this, x = 0, y = 0;
                while (place.x != null) {
                    x += place.x;
                    y += place.y;
                    if (place.align == "center") {
                        x -= place.width()/2;
                        y -= place.height()/2;
                    }
                    if (place.align == "right") {
                        x -= place.width();
                        y -= place.height();
                    }
                    if (place.parent != null)
                        place = place.parent;
                    else
                        break;
                }
                return {x : x, y : y};
            }
        },
        offset : function (x, y) {
            if (arguments.length) {
                this.x = parseFloat(x)||0;
                this.y = parseFloat(y)||0;
                this.isOffScreen();
                
                return this;
            } else {
                var x = this.x, y = this.y;
                if (this.align == "center") {
                    x -= this.width()/2;
                    y -= this.height()/2;
                }
                if (this.align == "right") {
                    x -= this.width();
                    y -= this.height();
                }
                return {x : x, y : y};
            }
        },
        move : function (x, y) {
            this.x += x;
            this.y += y;
            this.isOffScreen();
            
            return this;
        },
        width : function (w) {
            if (arguments.length) {
                if (w = parseFloat(w)) {
                    this.w = w;
                    
                    return this;
                }
            }
            
            return this.w;
        },
        height : function (h) {
            if (arguments.length) {
                if (h = parseFloat(h)) {
                    this.h = h;
                    
                    return this;
                }
            }
            
            return this.h;
        },
        isOffScreen : function () {
            if (this.offscreen != null) {
                var x = this.x, y = this.y;
                if (this.align != null && this.align != "left") {
                    if (this.align == "center") {
                        x -= this.width()/2;
                        y -= this.height()/2;
                    }
                    if (this.align == "right") {
                        x -= this.width();
                        y -= this.height();
                    }

                }

                if (x < -this.width() || y < -this.height()
                || x>this.parent.width() || y>this.parent.height())
                    this.offscreen();
            }
        },
        isOn : function (x, y) {
            var pos = this.offset();
            if (x - pos.x < this.width() && x - pos.x >= 0
            && y - pos.y < this.height() && y - pos.y >= 0)
                return true;
            else
                return false;
        },
        distance : function (x, y) {
            if (typeof x == "number" && typeof y == "number")
                return Math.sqrt(Math.pow(this.x-x, 2)
                        +Math.pow(this.y-y, 2));
            if (typeof x == "object")
                return Math.sqrt(Math.pow(this.x-x.x,2)
                        +Math.pow(this.y-x.y,2));
        },
        rotateTo : function (num) {
            this.angle = num;
            
            return this;
        },
        rotateBy : function (num) {
            this.angle += num;
            
            return this;
        },
        sendForward : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place < this.parent.cans.length-1
                && this.parent.cans.length > 1) {
                    this.parent.cans[place] = this.parent.cans[place+1];
                    this.parent.cans[place+1] = this;
                }
            }
            return this;
        },
        sendBackward : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place > 0 && this.parent.cans.length > 1) {
                    this.parent.cans[place] = this.parent.cans[place-1];
                    this.parent.cans[place-1] = this;
                }
            }
            return this;
        },
        sendToFront : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place < this.parent.cans.length-1) {
                    this.parent.cans.splice(place,1);
                    this.parent.cans.push(this);
                }
            }
            return this;
        },
        sendToBack : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place != 0) {
                    this.parent.cans.splice(place,1);
                    this.parent.cans.unshift(this);
                }
            }
            return this;
        },
        visible : function(vis) {
            if (arguments.length) {
                this.vis = vis;
                return this;
            } else {
                return this.vis;
            }
        },
        toggleVisible : function () {
            this.vis = !this.vis;
            return this;
        },
        on : function (e, func) {
            switch (e) {
                case 'click':
                case 'dblclick':
                case 'mousedown':
                case 'mouseenter':
                case 'mouseleave':
                case 'mousemove':
                case 'mouseup':
                case 'mousedrag':
                    this[e] = func;
                    this.parent.events[e].push(this);

                case 'offscreen':
                    this[e] = func;
            }
            
            return this;
        },
        off : function (e) {
            switch (e) {
                case 'click':
                case 'dblclick':
                case 'mousedown':
                case 'mouseenter':
                case 'mouseleave':
                case 'mousemove':
                case 'mouseup':
                case 'mousedrag':
                    this[e] = null;
                    var index = this.parent.events[e].indexOf(this);
                    if (index != -1)
                        this.parent.events[e].splice(index, 1);

                case 'offscreen':
                    this[e] = null;
            }
            
            return this;
        },
        addTo : function (parent) {
            if (parent && parent.cans) {
                this.parent = parent;
                if (parent.stage)
                    this.stage = parent.stage;
                parent.cans.push(this);
            }
            
            return this;
        },
        remove : function () {
            if (this.parent) {
                this.parent.remove(this);
            }
            for (e in this.events) {
                if (this.events[e] != null) {
                    this.off(e);
                }
            }
            this.parent = null;
        },
        setStage : function (stage) {
            this.stage = stage;
            return this;
        },
        animate : function(how, config) {
            (new Animation(how, config)).apply(this);
            return this;
        }
    });
    
    //All the Text objects
    var Text = proto([Can], {
        constructor : function Text(config){
            config = config||{};
            
            Can.call(this, config);
            
            this.maxWidth = parseFloat(config.maxWidth)||0;
            this.size = parseFloat(config.size)||13;
            
            this.fill = config.fill||"#000";
            this.stroke = config.stroke||"transparent";
            this.base = config.base||"bottop";
            this.textAlign = config.textAlign||"left";
            this.font = config.font||"Verdana";
            this.wrap = (!!config.wrap)||false;
            this.bold = (!!config.bold)||false;
            this.italic = (!!config.italic)||false;
            this.underline = (!!config.underline)||false;
            this.text(config.str||"");
        },
        setStage : function (stage) {
            Can.prototype.setStage.call(this, stage);
            
            //Calculate width and height within the new context
            this.text(this.str);
            return this;
        },
        draw : function (ctx) {
            ctx.fillStyle = this.fill;
            ctx.strokeStyle = this.stroke;
            ctx.textAlign = this.textAlign;
            ctx.textBaseline = this.base;

            // some fonts don't display differenty for bold or italic
            ctx.font = (this.italic?"italic ":"")
                + (this.bold?"bold ":"")
                + this.size + "px " + this.font;
            
            // passing a null maxWidth to fillText in chrome
            // prevents the text from displaying
            var self = this, y = this.size, w = this.maxWidth;

            if (!w) {
                ctx.strokeText(this.str, 0, y);
                ctx.fillText(this.str, 0, y);
                if (this.underline) {
                    underline(y, ctx.measureText(this.str).width);
                }
            } else if (w > 0 && this.wrap) {
                var words = this.str.split(' '), line = '';

                for (var i=0;i<words.length;i++) {
                    var testLine = line+words[i]+' ';
                    var testWidth = ctx.measureText(testLine).width;
                    if (testWidth > w && i > 0) {
                        ctx.strokeText(line, 0, y, w);
                        ctx.fillText(line, 0, y, w);
                        if (this.underline) {
                            underline(y, Math.min(w, ctx.measureText(line).width));
                        }
                        line = words[i] + ' ';
                        y += this.size;
                    } else {
                        line = testLine;
                    }
                }
                ctx.strokeText(line, 0, y, w);
                ctx.fillText(line, 0, y, w);
                if (this.underline) {
                    underline(y, Math.min(w, ctx.measureText(line).width));
                }
            } else {
                ctx.strokeText(this.str, 0, y, w);
                ctx.fillText(this.str, 0, y, w);
                if (this.underline) {
                    underline(y, Math.min(w, ctx.measureText(this.str).width));
                }
            }
            function underline(y, w) {
                var x = 0;
                if (self.textAlign == "center")
                    x = -w/2;
                else if (self.textAlign == "right")
                    x = -w;
                
                if (self.base == "top" || self.base == "hanging")
                    y += self.size;
                else if (self.base == "middle")
                    y += self.size/2;
                
                ctx.save();
                
                ctx.beginPath();
                //The underline should have the same style as
                //the text's fill
                ctx.strokeStyle = self.fill;
                ctx.lineWidth = self.bold?2:1;
                //Lines are drawn mid-pixel, so offset by half
                ctx.moveTo(x, y);
                ctx.lineTo(x+w, y);
                ctx.stroke();
                
                ctx.restore();
            }
        },
        width : function () {
            if (!this.stage || (this.maxWidth != 0 && !this.wrap)) {
                this.w = this.maxWidth;
                return this.maxWidth;
            }

            var ctx = this.stage.canvas.getContext("2d");
            ctx.font = (this.italic?"italic ":"")
                + (this.bold?"bold ":"")
                + this.size + "px " + this.font;
            var w = 0;

            if (this.maxWidth == 0)
                w = ctx.measureText(this.str).width;
            else if (this.wrap) {
                var words = this.str.split(' ');
                var line = '';
                var mw = this.maxWidth;

                for (var i=0;i<words.length;i++) {
                    var testLine = line+words[i]+' ';
                    var testWidth = ctx.measureText(testLine).width;
                    if (testWidth > mw && i > 0) {
                        var lw = ctx.measureText(line).width;
                        if (lw>mw) w = (mw>w?mw:w);
                        else w = (lw>w?lw:w);
                        line = words[i] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                var lw = ctx.measureText(line).width;
                if (lw>mw) w = (mw>w?mw:w);
                else w = (lw>w?lw:w);
            }
            this.w = w;
            return w;
        },
        height : function () {
            if (!this.stage || !this.wrap || this.maxWidth == 0) {
                this.h = this.size;
                return this.h;
            }

            var ctx = this.stage.canvas.getContext("2d");
            ctx.font = (this.italic?"italic ":"")
                + (this.bold?"bold ":"")
                + this.size + "px " + this.font;
            var h = this.size;
            var words = this.str.split(' ');
            var line = '', y = h;

            for (var i=0;i<words.length;i++) {
                var testLine = line+words[i]+' ';
                var testWidth = ctx.measureText(testLine).width;
                if (testWidth > this.maxWidth && i > 0) {
                    line = words[i] + ' ';
                    y += h;
                } else {
                    line = testLine;
                }
            }
            this.h = y;
            
            return this.h;
        },
        text : function (str) {
            if (arguments.length) {
                this.str = str;
                this.h = this.height();
                this.w = this.width();
                return this;
            } else {
                return this.str;
            }
        }
    });
    
    //Shape class mostly used to abstract away the Canvas "feature" that
    //makes shapes render mid-pixel.
    var Shape = proto([Can], {
        constructor : function Shape(config) {
            Can.call(this, config);
        },
        /*beginDraw : function (ctx) {
            Can.prototype.beginDraw.call(this, ctx);
            //ctx.translate(0.5, 0.5);
        },
        endDraw : function (ctx) {
            Can.prototype.endDraw.call(this, ctx);
            //ctx.translate(-0.5, -0.5);
        }*/
    });
    
    var Rect = proto([Shape], {
        constructor : function Rect (config) {
            config = config||{};
            
            var w=parseFloat(config.width), h=parseFloat(config.height);
            if(!w || !h){
                throw new Error("Both width and height are required to build a rect object.");
            }
            
            Shape.call(this, config);
            
            this.w = w;
            this.h = h;
            this.radius = config.radius||0;
            this.fill = config.fill||"transparent";
            this.stroke = config.stroke||"transparent";
            
            this.lineWidth = parseFloat(config.lineWidth)||(this.stroke?1:0);
        },
        //arcTo is not supported in Opera, so this is browser-specific
        draw : (function(){
            if (!CanvasRenderingContext2D.prototype.arcTo) {
                return function (ctx) {
                    var w = this.w, h = this.h, r = this.radius;
                    ctx.beginPath();
                    
                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.stroke;
                    ctx.fillStyle = this.fill;
                    
                    if (r) {
                        // First call to lineTo should normalize the position
                        // (Eliminate half-pixel rendering)
                        ctx.moveTo(0, r);
                        
                        ctx.arc(r, r, r, Math.PI, -Math.PI/2);
                        ctx.lineTo(r, 0);
                        ctx.lineTo(w-r, 0);
                        
                        ctx.arc(w-r, r, r, -Math.PI/2, 0);
                        ctx.lineTo(w, r);
                        ctx.lineTo(w, h-r);
                        
                        ctx.arc(w-r, h-r, r, 0, Math.PI/2);
                        ctx.lineTo(w-r, h);
                        ctx.lineTo(r, h);
                        
                        ctx.arc(r, h-r, r, Math.PI/2, Math.PI);
                        ctx.lineTo(0, h-r);
                        ctx.lineTo(0, r);
                    } else {
                        ctx.fillRect(0, 0, this.w, this.h);
                        ctx.rect(0, 0, this.w, this.h);
                    }
                    
                    ctx.endPath();
                    
                    ctx.fill();
                    ctx.stroke();
                }
            }
            return function (ctx) {
                var w = this.w, h = this.h, r = this.radius;
                
                ctx.beginPath();
                ctx.lineWidth = this.lineWidth;
                ctx.strokeStyle = this.stroke;
                ctx.fillStyle = this.fill;
                
                if (r) {
                    
                    ctx.moveTo(r, 0);
                    
                    ctx.arcTo(w, 0, w, r, r);
                    ctx.arcTo(w, h, w-r, h, r);
                    ctx.arcTo(0, h, 0, h-r, r);
                    ctx.arcTo(0, 0, r, 0, r);
                    
                    ctx.closePath();
                } else {
                    ctx.rect(0, 0, w, h);
                    ctx.fillRect(0, 0, w, h);
                }
                ctx.stroke();
                ctx.fill();
                ctx.stroke();
            }
        })()
    });
    
    var Line = proto([Shape], {
        constructor : function Line (config) {
            config = config||{};
            
            var x2=parseFloat(config.x2), y2=parseFloat(config.y2);
            var w = parseFloat(config.width), h = parseFloat(config.height);
            if(!(isvalid(x2) && isvalid(y2)) && !(isvalid(w) && isvalid(h))){
                throw new Error("Either x2/y2 or width/height required to build a line object.");
            }
            
            Shape.call(this, config);
            
            this.x = parseFloat(config.x1)||this.x;
            this.y = parseFloat(config.y1)||this.y;
            
            this.w = x2?x2-this.x:(w||0);
            this.h = y2?y2-this.y:(h||0);
            this.style = config.style||"#000";
            this.lineWidth = parseFloat(config.lineWidth)||1;
        },
        draw : function (ctx) {
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = this.style;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.w, this.h);
            ctx.stroke();
        }
    });
    
    var CannedImage = proto([Can], {
        constructor : function CannedImage(config) {
            config = config||{};
            
            if (typeof config == "string"
            || config instanceof Image
            || config instanceof HTMLCanvasElement
            || config instanceof ImageData) {
                config = {image : config};
            }
            Can.call(this, config);
            
            this.load = config.load;
            this.error = config.error;
            this.w = parseFloat(config.width)||null;
            this.h = parseFloat(config.height)||null;
            
            if (typeof config.image == "string"){
                var i = new Image();
                this.img = i;
                
                i.can = this;
                i.onload = function () {
                    if (this.can.w === null) {
                        this.can.w = this.width;
                    }
                    if (this.can.h === null) {
                        this.can.h = this.height;
                    }
                    
                    if(typeof this.can.load == "function") {
                        this.can.load(this);
                    }
                }
                i.onerror = function (e) {
                    if (this.can.w === null) {
                        this.can.w = 0;
                    }
                    if (this.can.h === null) {
                        this.can.h = 0;
                    }
                    
                    if (typeof this.can.error == "function") {
                        this.can.error(e);
                    }
                }
                i.src = config.image;
            }
            else if(config.image instanceof Image
                 || config.image instanceof HTMLCanvasElement) {
                this.img = config.image;
                if (this.w === null) {
                    this.w = this.img.width;
                }
                if (this.h === null) {
                    this.h = this.img.height;
                }
            } else if (config.image instanceof ImageData) {
                // make a canvas object and draw the ImageData object on it
                this.img = document.createElement("canvas");
                this.img.width = config.image.width;
                this.img.height = config.image.height;
                this.img.getContext("2d").putImageData(config.image, 0, 0);
                if (this.w === null) {
                    this.w = this.img.width;
                }
                if (this.h === null) {
                    this.h = this.img.height;
                }
            } else if (config.image) {
                throw new Error("Couldn't figure out how to handle image");
            }
        },
        draw : function (ctx) {
            ctx.drawImage(this.img, 0, 0, this.w, this.h);
        }
    });
    
    var Tile = proto([CannedImage], {
        constructor : function Tile (config) {
            config = config||{};
            
            if (config.image instanceof CannedImage) {
                config.image = config.image.img;
            }
            
            CannedImage.call(this, config);
            
            this.offx = parseFloat(config.offx)||0;
            this.offy = parseFloat(config.offy)||0;
        },
        draw : function (ctx) {
            ctx.drawImage(this.img, this.offx, this.offy, this.w, this.h,
                0, 0, this.w, this.h);
        }
    });
    
    var Oval = proto([Shape], {
        constructor : function Oval (config) {
            config = config||{};
            
            var w=parseFloat(config.width), h=parseFloat(config.height);
            if (!w && !h){
                throw new Error("Either width or height are required to build an oval.");
            }
            
            Shape.call(this, config);
            
            this.w = w||h;
            this.h = h||w;
            this.fill = config.fill||"transparent";
            this.stroke = config.stroke||"transparent";
            this.lineWidth = config.lineWidth||1;
        },
        draw : function (ctx) {
            if (this.h != this.w)
                ctx.scale(1, this.h/this.w);
            
            ctx.beginPath();
            
            ctx.fillStyle = this.fill;
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = this.lineWidth;
            
            ctx.arc(this.w/2, this.w/2, this.w/2, 0, 2*Math.PI);
            
            ctx.fill();
            ctx.stroke();
            
            if (this.h != this.w)
                ctx.scale(1, this.w/this.h);
        }
    });
    
    var Arc = proto([Shape], {
        constructor : function Arc (config) {
            config = config||{};
            
            var r = parseFloat(config.r);
            if (!r) {
                throw new Error("Radius required to build an arc.");
            }
            
            Shape.call(this, config);
            
            this.r = r;
            this.start = parseFloat(config.start)||0;
            this.end = parseFloat(config.end)||Math.PI;
            this.w = r*2;
            this.h = r*2;
            this.fill = config.fill||"transparent";
            this.stroke = config.stroke||"transparent";
            this.lineWidth = parseFloat(config.lineWidth)||1;
        },
        draw : function (ctx) {
            ctx.beginPath();
            ctx.arc(this.r, this.r, this.r, this.start, this.end);
            ctx.fillStyle = this.fill;
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = this.lineWidth;
            ctx.fill();
            ctx.stroke();
        }
    });
    
    var Polygon = proto([Shape], {
        constructor : function Polygon (config) {
            config = config||{};

            var points = config.points;
            if (!points) {
                throw new Error("Points required to build a polygone.");
            }
            if (points.length > 1
            && typeof points[0].x=="number" && typeof points[0].y=="number"){
                var x = points[0].x;
                var y = points[0].y;
                for (var i=1;i<points.length;i++) {
                    if (points[i].x < x)
                        x = points[i].x;
                    if (points[i].y < y)
                        y = points[i].y;
                }
                var width = points[0].x - x;
                var height = points[0].y - y;
                for (var i=0;i<points.length;i++) {
                    points[i].x -= x;
                    points[i].y -= y;
                    if (points[i].x > width)
                        width = points[i].x;
                    if (points[i].y > height)
                        height = points[i].y;
                }
            } else
                throw new Error("Points error: not structured correctly");
    
            Shape.call(this, config);
            
            this.points = points;
            this.x = x;
            this.y = y;
            this.w = width;
            this.h = height;
            this.fill = config.fill||"transparent";
            this.stroke = config.stroke||"transparent";
            this.lineWidth = parseFloat(config.lineWidth)||2;
        },
        draw : function (ctx) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (var i=1;i<this.points.length;i++)
                ctx.lineTo(this.points[i].x, this.points[i].y);
            ctx.closePath();
            ctx.fillStyle = this.fill;
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = this.lineWidth;
            ctx.fill();
            ctx.stroke();
        }
    });

    var Chain = proto([Shape], {
        constructor : function Chain (config) {
            config = config||{};

            var points = config.points;
            if (!points) {
                throw new Error("Points required to build a Chain.");
            }
            if (points.length >= 1
            && typeof points[0].x=="number" && typeof points[0].y=="number"){
                var x = 0;//points[0].x;
                var y = 0;//points[0].y;
                for (var i=1;i<points.length;i++) {
                    if (points[i].x < x)
                        x = points[i].x;
                    if (points[i].y < y)
                        y = points[i].y;
                }
                var width = points[0].x - x;
                var height = points[0].y - y;
                /*for (var i=0;i<points.length;i++) {
                    points[i].x -= x;
                    points[i].y -= y;
                    if (points[i].x > width)
                        width = points[i].x;
                    if (points[i].y > height)
                        height = points[i].y;
                }*/
            } else
                throw new Error("Points error: not structured correctly");
    
            Shape.call(this, config);
            
            this.points = points;
            this.x = x;
            this.y = y;
            this.lineJoin = config.lineJoin||"miter"; // bevel|round|miter
            this.lineCap = config.lineCap||"square"; // butt|round|square
            this.miterLimit = config.miterLimit||10;
            this.w = width;
            this.h = height;
            this.style = config.style||"#000";
            this.lineWidth = parseFloat(config.lineWidth)||2;
        },
        draw : function (ctx) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (var i=1;i<this.points.length;i++)
                ctx.lineTo(this.points[i].x, this.points[i].y);
            ctx.strokeStyle = this.style;
            ctx.lineJoin = this.lineJoin;
            ctx.lineCap = this.lineCap;
            ctx.miterLimit = this.miterLimit;
            ctx.lineWidth = this.lineWidth;
            ctx.stroke();
        }
    });

    var Graph = proto([Can], {
        constructor : function Graph (config) {
            config = config||{};
            
            var w=parseFloat(config.width), h=parseFloat(config.height);
            if(!w || !h){
                throw new Error("Both width and height are required to build a graph.");
            }
            
            Can.call(this, config);
            
            this.w = w;
            this.h = h;
            this.textx = config.textx;
            this.texty = config.texty;
            this.stroke = config.stroke||"#000";
            this.fill = config.fill||"#fff";
            this.maxx = parseFloat(config.maxx);
            this.maxy = parseFloat(config.maxy);
            this.minx = parseFloat(config.minx);
            this.miny = parseFloat(config.miny);
            this.data = config.data;
            this.margin = parseFloat(config.margin)||30;
        },
        draw : function (ctx) {
            var w = this.w, h = this.h, m = this.margin;
            // Background
            ctx.fillStyle = this.fill;
            ctx.fillRect(0, 0, w, h);
                
            // Axes
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.stroke;
            ctx.beginPath();
            ctx.moveTo(m*(4/3), 1);
            ctx.lineTo(m*(4/3), h-(m*(2/3)));
            ctx.moveTo(m, h-m);
            ctx.lineTo(w-1, h-m);
            ctx.stroke();
                
            // Mins
            var range = this.getRanges();
            ctx.font = "10px Verdana";
            ctx.textAlign = "center";
            ctx.fillStyle = this.stroke;
            ctx.fillText(range.miny.toPrecision(2), m*2/3, h-m+3, m);
            ctx.fillText(range.minx.toPrecision(2), m*4/3, h-(m/3)+3,
                    m*(2/3));

            // Axes Labels
            ctx.fillText(this.textx, (w/2)+(m*2/3), h-(m/3)+3, w-2*m);
            ctx.translate(m/3, (h-m)/2);
            ctx.rotate(Math.PI*(-1/2));
            ctx.fillText(this.texty, 0, 0, h-(2*m));
            ctx.rotate(Math.PI*(1/2));
            ctx.translate(-m/3, -((h-m)/2));

            // Lines & Mumbers
            ctx.lineWidth = 1;
            ctx.textAlign = "right";
            for (var i=1;i<range.ysteps;i++) { // x
                var y = Math.round(h-m-((h-m)*(i/range.ysteps)))-1.5;
                ctx.moveTo(this.margin*(7/6), y);
                ctx.lineTo(w-1, y);
                ctx.stroke();
                ctx.fillText(
                    (range.minx+(range.yrange*(i/range.ysteps)))
                        .toPrecision(2), m*(7/6)-1, y+3, m*(5/6)-2);
            }
            ctx.textAlign = "center";
            for (var i=1;i<range.xsteps;i++) { // y
                var x = Math.round(m+(((w-m)*(i/range.xsteps))))+1.5;
                ctx.moveTo(x, h-m);
                ctx.lineTo(x, h-(m*(5/6)));
                ctx.stroke();
                ctx.fillText(
                    (range.miny+(range.xrange*(i/range.xsteps)))
                        .toPrecision(2), x, h-(m*(2/3))+3, m);
            }

            // data plot
            for (var i=0;i<this.data.length;i++) {
                this.map(ctx, m*(4/3), 0, w-(m*(4/3)), h-(m), range,
                        this.data[i]);
            }
        },
        getRanges : function() {
            var range = {
                minx : 0,
                maxx : 1,
                xsteps : Math.floor(
                    (this.w-(this.margin*(4/3))-3)/this.margin),
                miny : 0,
                maxy : 1,
                ysteps : Math.floor((this.h-this.margin-3)/this.margin)
            };
            if (typeof this.maxx=="number"&&typeof this.maxy=="number"
            && typeof this.minx=="number"&&typeof this.miny=="number") {
                range.maxx = this.maxx;
                range.maxy = this.maxy;
                range.minx = this.minx;
                range.miny = this.miny;
            } else if (this.data.length > 0) {
                for (var i=0;i<this.data.length;i++) {
                    for (var j=0;j<this.data[i].points.length;j++) {
                        var d = this.data[i].points[j];
                        if (d.x > range.maxx)
                            range.maxx = d.x + (d.x-range.minx)*(1/10);
                        else if (d.x < range.minx)
                            range.minx = d.x - (range.maxx-d.x)*(1/10);
                        if (d.y > range.maxy)
                            range.maxy = d.y + (d.y-range.miny)*(1/10);
                        else if (d.y < range.ymin)
                            range.miny = d.y - (range.maxy-d.y)*(1/10);
                    }
                }
            }
            range.xrange = range.maxx-range.minx;
            range.yrange = range.maxy-range.miny;
            return range;
        },
        map : function (ctx, x, y, width, height, range, data) {
            var r = 4;
            ctx.beginPath();
            ctx.lineWidth = 2;
            if (typeof data.color == "string") {
                ctx.strokeStyle = data.color;
                ctx.fillStyle = data.color;
            } else {
                ctx.strokeStyle = "#888";
                ctx.fillStyle = "#888";
            }
            function getXY (num) {
                return {
                    "x" : x+(((data.points[num].x-range.minx)
                                /range.xrange)*width),
                    "y" : y+(((range.maxy-data.points[num].y)
                                /range.yrange)*height)
                };
            }
            var xy = getXY(0);
            ctx.arc(xy.x, xy.y, r, 0, 2*Math.PI);
            ctx.fill();
            var last = xy;
            for (var i=1;i<data.points.length;i++) {
                xy = getXY(i);
                ctx.beginPath();
                ctx.moveTo(last.x, last.y);
                ctx.lineTo(xy.x, xy.y);
                ctx.stroke();
                last = xy;
                ctx.beginPath();
                ctx.arc(xy.x, xy.y, r, 0, 2*Math.PI);
                ctx.fill();
            }
        }
    });
    
    var Group = proto([Can], {
        constructor : function Group (config) {
            config = config||{};
            
            Can.call(this, config);
            
            this.w = parseFloat(config.width)||0;
            this.h = parseFloat(config.height)||0;
            this.events = {
                click : [],
                dblclick : [],
                mouseenter : [],
                mouseleave : [],
                mousedown : [],
                mousemove : [],
                mouseup : [],
                mousedrag : []
            };
            
            this.cans = [];
            var cancans = config.cans||[];
            for (var i=0; i<cancans.length; ++i) {
                this.add(cancans[i]);
            }
        },
        find : function (id) {
            id = id.toString();
            if (this.id === id) {
                return this;
            }
            
            for (var i=0; i<this.cans.length; ++i) {
                var c = this.cans[i].find(id);
                if (c) {
                    return c;
                }
            }
            return null;
        },
        add : function (child) {
            if (!Array.isArray(child))
                child = [child];
            
            for (var i=0; i<child.length; ++i) {
                if (child[i]) {
                    //Allows the child to do things when added.
                    child[i].addTo(this);
                    if (this.stage)
                        child[i].setStage(this.stage);
                }
            }
            return this;
        },
        remove : function (x) {
            if (arguments.length) {
                var index = this.cans.indexOf(x);
                if (index != -1)
                    this.cans.splice(index, 1);
            }
            else {
                Can.prototype.remove.call(this);
            }
            
            return this;
        },
        width : function () {
            var neg = 0, pos = 0, cans = this.cans;
            for (var i=0; i<cans.length; ++i) {
                var can = cans[i], x = can.x;
                if (x<0) {
                    neg = Math.max(neg, -x);
                }
                pos = Math.max(pos, x+can.width());
            }
            return neg+pos;
        },
        height : function () {
            var neg = 0, pos = 0, cans = this.cans;
            for (var i=0; i<cans.length; ++i) {
                var can = cans[i], y = can.y;
                if (y<0) {
                    neg = Math.max(neg, -y);
                }
                pos = Math.max(pos, y+can.height());
            }
            return neg+pos;
        },
        setStage : function (stage) {
            var i = this.cans.length
            while (i--) {
                this.cans[i].setStage(stage);
            }
            return Can.prototype.setStage(stage);
        },
        getImageData : function (ctx) {
            return ctx.getImageData(0, 0, this.w, this.h);
        },
        draw : function (ctx) {
            var i = 0, l = this.cans.length;
            while (l-i) {
                var c = this.cans[i++];
                if (c.vis) {
                    c.beginDraw(ctx);
                    c.draw(ctx);
                    c.endDraw(ctx);
                }
            }
        },
        // clears all objects off canvas
        clear : function () {
            this.events = {
                click : [],
                dblclick : [],
                mouseenter : [],
                mouseleave : [],
                mousedown : [],
                mousemove : [],
                mouseup : [],
                mousedrag : []
            },
            delete this.cans;
            this.cans = [];
            
            return this;
        }
    });
    
    var Sprite = proto([Can], {
        constructor : function Sprite (config) {
            Can.call(this, config);
            
            config = config||{};
            
            this.frames = config.frames||[];
            this.index = this.frames.length-1;
            this.fps = 1000/(parseFloat(config.fps)||60);
            this.timer = new Date().getTime();
        },
        setStage : function (stage) {
            var i = this.frames.length;
            while (i--) {
                this.frames[i].setStage(stage);
            }
            return Can.prototype.setStage.call(this, stage);
        },
        draw : function (ctx) {
            var t = new Date().getTime();
            if (t - this.timer >= this.speed) {
                this.index = (this.index+1)%this.frames.length;
                
                this.timer = t - t%this.speed;
            }
            
            var f=this.frames[this.index];
            f.beginDraw(ctx);
            f.draw(ctx);
            f.endDraw(ctx);
        },
        width : function () {
            var w = 0;
            for (var i=0; i<this.frames.length; ++i) {
                w = Math.max(w, this.frames[i].width());
            }
            return w;
        },
        height : function () {
            var h = 0;
            for (var i=0; i<this.frames.length; ++i) {
                h = Math.max(h, this.frames[i].height());
            }
            return h;
        }
    });
    
    var Category = proto([Can], {
        constructor : function Category (config) {
            Can.call(this, config);
            
            config = config||{};
            
            this.items = config.items||[];
            if (this.items.length) {
                var x = this.get();
                this.item = x||this.items[0][1];
                this.mode = x?[]:this.items[0][0];
            }
        },
        find : function (id) {
            id = id.toString();
            if (this.id === id) {
                return this;
            }
            
            for (var i=0; i<this.items.length; ++i) {
                var c = this.items[i][1].find(id);
                if (c) {
                    return c;
                }
            }
            return null;
        },
        setStage : function (stage) {
            var i = this.items.length;
            while (i--) {
                this.items[i].setStage(stage);
            }
            return Can.prototype.setStage.call(this, stage);
        },
        get : function () {
            var it = this.items;
            for (var i = 0; i<it.length; ++i) {
                var keys = it[i][0];
                if (keys.length == arguments.length) {
                    for (var j = 0; j<keys.length; ++j) {
                        if (keys.indexOf(arguments[j])<0) {
                            break;
                        }
                    }
                    if (j == keys.length) {
                        return it[i][1];
                    }
                }
            }
        },
        draw : function (ctx) {
            if (this.item) {
                this.item.beginDraw(ctx);
                this.item.draw(ctx);
                this.item.endDraw(ctx);
            }
        },
        select : function () {
            var item = this.get.apply(this, arguments);
            if (item) {
                this.item = item;
                this.mode = arguments;
            }
            return this;
        },
        add : function (tags, x) {
            this.items.push([tags, x]);
            if (!this.item) {
                this.item = this.get()||x;
            }
        },
        width : function () {
            if (this.item) {
                return this.item.width();
            }
            return 0;
        },
        height : function () {
            if (this.item) {
                return this.item.height();
            }
            return 0;
        }
    });
    
    var Stage = proto([Group], {
        constructor : function Stage(config) {
            if (typeof config == "undefined") {
                config = {canvas : document.createElement("canvas")};
            } else if (config instanceof HTMLCanvasElement) {
                config = {canvas : config};
            } else if (typeof config.canvas == "undefined") {
                config.canvas = document.createElement("canvas");
            }

            this.canvas = config.canvas;
            this.context = this.canvas.getContext("2d");

            if (!config.width) {
                config.width = this.canvas.width;
            }
            if (!config.height) {
                config.height = this.canvas.height;
            }
            
            Group.call(this, config);
            
            this.stage = this;
            var i = this.cans.length;
            while (i--) {
                this.cans[i].stage = this;
            }
            
            if (this.w && this.h) {
                this.canvas.setAttribute("width", this.w);
                this.canvas.setAttribute("height", this.h);
            }
            
            this.bg = config.bg||"#fff";
            
            var self = this;
            
            this.canvas.addEventListener("mousedown", function (e) {
                var rect = this.getBoundingClientRect();
                var point = {x:e.clientX-rect.left, y:e.clientY-rect.top};
                
                // Mouse Down Event
                // mouse pointer is over the element, and the mouse button
                // is pressed
                var m = self.events.mousedown;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        if (m[i].mousedown(point) == false) {
                            break;
                        }
                    }
                }

                // Click Event (mouse down part)
                // The mouse button is depressed while the pointer is inside 
                // the element.
                // The mouse button is released while the pointer is inside 
                // the element.
                var m = self.events.click;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        m[i].pressed = (new Date).getTime();
                    } else {
                        m[i].pressed = 0;
                    }
                }

                // Double Click Event (first and second mouse down part)
                // Two consecutive click events on the same object within a 
                // second
                var m = self.events.dblclick;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        if (m[i].dblone > 0) {
                            m[i].dbltwo = (new Date).getTime();
                            if (m[i].dbltwo - m[i].dblone > 2000) {
                                m[i].dblone = m[i].dbltwo;
                                m[i].dbltwo = 0;
                            }
                        } else {
                            m[i].dblone = (new Date).getTime();
                        }
                    } else {
                        m[i].dblone = 0;
                        m[i].dbltwo = 0;
                    }
                }

                // Mouse Drag Event (mouse down part)
                // mouse pointer is over the element, and the mouse button 
                // is pressed, then the mouse pointer is moved
                var m = self.events.mousedrag;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        m[i].dragging = true;
                    } else {
                        m[i].dragging = false;
                    }
                }
            }, false);

            this.canvas.addEventListener("mousemove", function (e) {
                var rect = this.getBoundingClientRect();
                var point = {x:e.clientX-rect.left, y:e.clientY-rect.top}

                // Mouse Move Event
                // mouse pointer is over the element, and the mouse button 
                // is released
                var m = self.events.mousemove;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        if (m[i].mousemove(point) == false) {
                            break;
                        }
                    }
                }

                // Mouse Enter Event
                // mouse pointer enters the element
                var m = self.events.mouseenter;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        if (m[i].entered != true) {
                            m[i].entered = true;
                            if (m[i].mouseenter(point) == false) {
                                break;
                            }
                        }
                    } else {
                        m[i].entered = false;
                    }
                }

                // Mouse Leave Event
                // mouse pointer leaves the element
                var m = self.events.mouseleave;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        m[i].entered = true;
                    } else if (m[i].entered == true) {
                        m[i].entered = false;
                        if (m[i].mouseleave(point) == false)
                            break;
                    }
                }

                // Mouse Drag Event (mouse pointer moving part)
                // mouse pointer is over the element, and the mouse button is pressed, then the mouse pointer is moved
                var m = self.events.mousedrag;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].dragging) {
                        if (m[i].mousedrag(point) == false) {
                            break;
                        }
                    }
                }
            }, false);

            this.canvas.addEventListener("mouseup", function (e) {
                var rect = this.getBoundingClientRect();
                var point = {x:e.clientX-rect.left, y:e.clientY-rect.top}

                // Mouse Up Event
                // mouse pointer is over the element, and the mouse button is released
                var m = self.events.mouseup;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        if (m[i].mouseup(point) == false) {
                            break;
                        }
                    }
                }

                // Click Event (release part)
                // The mouse button is depressed while the pointer is inside the element.
                // The mouse button is released while the pointer is inside the element.
                var m = self.events.click;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        var ret;
                        if (m[i].pressed && ((new Date).getTime()) - m[i].pressed < 1000) {
                            m[i].pressed = 0;
                            ret = m[i].click(point);
                        } else {
                            m[i].pressed = 0;
                        }
                        if (ret == false) {
                            break;
                        }
                    } else {
                        m[i].pressed = 0;
                    }
                }

                // Double Click Event (first and second release part)
                // Two consecutive click events on the same object within a 
                // second
                var m = self.events.dblclick;
                for (var i=m.length-1;i>=0;i--) {
                    if (m[i].isOn(point.x, point.y)) {
                        var now = (new Date).getTime();
                        if (m[i].dblone > 0) {
                            if (m[i].dbltwo > 0) {
                                if (now - m[i].dbltwo <= 1000) {
                                    m[i].dblone = 0;
                                    m[i].dbltwo = 0;
                                    if (m[i].dblclick(point)
                                    == false) {
                                        break;
                                    }
                                } else {
                                    m[i].dblone = 0;
                                    m[i].dbltwo = 0;
                                }
                            } else if (now - m[i].dblone > 1000) {
                                m[i].dblone = 0;
                            }
                        }
                    } else {
                        m[i].dblone = 0;
                        m[i].dbltwo = 0;
                    }
                }

                // Mouse Drag Event (release part)
                // mouse pointer is over the element, and the mouse button 
                // is pressed, then the mouse pointer is moved
                var m = self.events.mousedrag;
                for (var i=m.length-1;i>=0;i--) {
                    m[i].dragging = false;
                }
            }, false);
            
            this.draw();
        },
        width : function (w) {
            if (arguments.length) {
                if (w = parseFloat(w)) {
                    this.canvas.width = w;
                    this.w = w;
                    
                    return this;
                }
            }
            
            return this.w;
        },
        height : function (h) {
            if (arguments.length) {
                if (h = parseFloat(h)) {
                    this.canvas.height = h;
                    this.h = h;
                    
                    return this;
                }
            }
            
            return this.h;
        },
        draw : function () {
            var c = this.context;
            this.clear().beginDraw(c);
            Group.prototype.draw.call(this, c)
            this.endDraw(c);
        },
        clear : function () {
            this.context.clearRect(-0.5, -0.5, this.w+1, this.h+1);
            return this;
        },
        fitWindow : function () {
            var can = this.can;
            
            var that = this
            function resize(){
                that.width(window.innerWidth).height(window.innerHeight-3);
                that.draw();
            }
            
            window.addEventListener("resize", resize);
            resize();
            
            return this;
        },
        getImageData : function () {
            return this.context.getImageData(0, 0, this.width(), this.height());
        }
    });
    
    var Buffer = proto([Group], {
        constructor : function (config) {
            Group.call(this, config);
            
            this.canvas = document.createElement("canvas");
            this.context = this.canvas.getContext("2d");
        },
        draw : function (ctx) {
            if (ctx) {
                ctx.drawImage(this.canvas, 0, 0);
            } else {
                Group.prototype.draw.call(this, this.context);
            }
            return this;
        },
        clear : function (c) {
            if (c) {
                this.context.clearRect(0, 0, this.width(), this.height());
            }
            return Group.prototype.clear.call(this);
        }
    });
    
    return {
        //Include proto for extensions.
        proto : proto,
        types : {
            Animation : Animation,
            Can : Can,
            Text : Text,
            Shape : Shape,
            Rect : Rect,
            Line : Line,
            Oval : Oval,
            Arc : Arc,
            Polygon : Polygon,
            Graph : Graph,
            Group : Group,
            Tile : Tile,
            Sprite : Sprite,
            Category : Category,
            Stage : Stage,
            Buffer : Buffer
        },
        fx : {
            animations : anim_funcs,
            easing : ease_funcs
        },
        animation : function (how, config) {
            return new Animation(how, config);
        },
        can : function (config) {
            return new Can(config);
        },
        //Easy access to the types of text.
        text : function (config) {
            return new Text(config);
        },
        shape : function (config) {
            return new Shape(config);
        },
        rect : function (config) {
            return new Rect(config);
        },
        line : function (config) {
            return new Line(config);
        },
        image : function (config) {
            return new CannedImage(config);
        },
        oval : function (config) {
            return new Oval(config);
        },
        circle : function (config) {
            if (config.radius) {
                config.width = config.radius*2;
                config.height = config.width;
            }
            return new Oval(config);
        },
        arc : function (config) {
            return new Arc(config);
        },
        polygon : function (config) {
            return new Polygon(config);
        },
        chain : function (config) {
            return new Chain(config);
        },
        graph : function (config) {
            return new Graph(config);
        },
        group : function (config) {
            return new Group(config);
        },
        tile : function (config) {
            return new Tile(config);
        },
        animation : function (config) {
            return new Animation(config);
        },
        sprite : function (config) {
            return new Sprite(config);
        },
        category : function (config) {
            return new Category(config);
        },
        stage : function (config) {
            return new Stage(config);
        },
        buffer : function (config) {
            return new Buffer(config);
        }
    };
})();
