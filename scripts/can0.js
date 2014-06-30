/*****************************************************************************
 * Can Graphics Library - a object based library for HTML5                   *
 *****************************************************************************
 *
 *
 * []=======================================================================[]
 * || Canvas                                                                ||
 * []=======================================================================[]
 * canvas :         canvas element that objects are drawn on
 * init : canvas    takes a canvas element and initilizes the library for use
 * screen.setSize : w, h   adjusts canvas size to given values
 * screen.fitWindow        makes canvas fill browser window
 * draw :      draws the objects onto the canvas
 * clear :     clears the canvas
 * events :    object for keeping track of all mouse triggered events
 * cans :      for storing objects that will be drawn, 
 *
 *
 * []=======================================================================[]
 * || Objects                                                               ||
 * []=======================================================================[]
 * text : str, x, y, (maxWidth, lineHeight, style, align, font)
 * framedText : str, x, y,
 *              (maxWidth, lineHeight, style, align, font, lineWidth)
 * wrappedText : str, x, y, (maxWidth, lineHeight, style, align, font)
 * rect : x, y, width, height, (style)
 * framedRect : x, y, width, height, (style, lineWidth)
 * roundedRect : x, y, width, height, (style, radius)
 * line : x1, y1, x2, y2, (style, lineWidth)
 * image : src, x, y, (width, height)
 * oval : x, y, r, (style)
 * framedOval : x, y, r, (style, lineWidth)
 * arc : x, y, r, start, end, (style, lineWidth)
 * filledArc : x, y, r, start, end, (style)
 * graph : x, y, width, height, xtext, ytext,
 *         (strokeStyle, fillStyle, margin, xMax, yMax, xMin, yMin, data...)
 * group : x, y, (width, height, composite, alpha, can...)
 * 
 *
 * []=======================================================================[]
 * || Object Methods                                                        ||
 * []=======================================================================[]
 * moveTo : x, y    moves the object to a specified position
 * moveBy : x, y    moves the object by the amounts given
 * isOn : x, y      returns true if the current object is on the given point
 * distance : x, y  returns the distance from object to a given point
 * setRadius : r    sets the radius of the current object, only used by ovals,
 *                  arcs, and roundedRect's
 *
 * - the following manage the rotation of an object
 * angle :    how much the object is rotated (in radians)
 * rotateTo : sets the amount of rotation
 * rotateBy : adds or subtracts from the current rotation
 * 
 * - the following change which objects are rendered on top of eachother in the
 * - event of overlap:
 * sendForward :  move the object forwards by one
 * sendBackward : move the object backwards by one
 * sendToFront :  place the object in front of all other objects
 * sendToBack :   place the object behind all other objects
 * 
 * - the following effect the visibility of the object:
 * isVisible :      boolean that determines if an object is drawn or not
 * hide :           preents an object from being drawn on canvas
 * show :           makes an object visible
 * toggleVisible :  toggles the visibility of an object
 * 
 * - the following are storage space for functions to run if the event of the
 * - same name is triggered for this object (see Object Events for more info):
 * clickdblclick, mousedown, mouseenter, mouseleave, mousemove, mouseup,
 * mousedrag, offscreen
 *
 * setEvent : e, func   sets a function to be run by specific event
 * removeEvent : e      removes a specific event from the object
 * 
 * addTo : parent   adds the object to the specified can or group object
 * remove :         removes the object from its containing object
 *
 *
 * []=======================================================================[]
 * || Object Events                                                         ||
 * []=======================================================================[]
 * click      : {x, y}   mousedown, then mouseup within same object in 1s
 * dblclick   : {x, y}   two clicks within a second of eachother
 * mousedown  : {x, y}   mouse button is pressed on an object
 * mouseenter : {x, y}   mouse moves over an object it wasn't over just before
 * mouseleave : {x, y}   mouse is no longer over an object it was just over
 * mousemove  : {x, y}   mouse is moving while over an object
 * mouseup    : {x, y}   mouse button is released while over this object
 * mousedrag  : {x, y}   mousedown on object, then mouse move without mouseup
 * offscreen  :          object moves and is found to be outside drawing area
 * 
 *
 *****************************************************************************/

var can = {
    canvas : document.createElement("canvas"),

    screen : {
        setSize : function (w, h) {
            can.canvas.width = w;
            can.canvas.height = h;
            can.width = can.canvas.width;
            can.height = can.canvas.height;
        },
        fitWindow : function () {
            can.screen.setSize(window.innerWidth, window.innerHeight-3);
            window.onresize = function(event) {
                can.screen.setSize(window.innerWidth, window.innerHeight-3);
                can.draw();
            };
        },
    },

    init : function (canvas) {
        if (canvas != null)
            this.canvas = canvas;
        this.canvas.parent = this;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.draw();
        this.canvas.addEventListener("mousedown", function (e) {
            var rect = this.getBoundingClientRect();
            var point = {x:e.clientX-rect.left, y:e.clientY-rect.top}

            // Mouse Down Event
            // mouse pointer is over the element, and the mouse button is pressed
            var m = this.parent.events.mousedown;
            for (var i=m.length-1;i>=0;i--) {
                if (m[i].isOn(point.x, point.y)) {
                    if (m[i].mousedown(point) == false) {
                        break;
                    }
                }
            }

            // Click Event (mouse down part)
            // The mouse button is depressed while the pointer is inside the element.
            // The mouse button is released while the pointer is inside the element.
            var m = this.parent.events.click;
            for (var i=m.length-1;i>=0;i--) {
                if (m[i].isOn(point.x, point.y)) {
                    m[i].pressed = (new Date).getTime();
                } else {
                    m[i].pressed = 0;
                }
            }

            // Double Click Event (first and second mouse down part)
            // Two consecutive click events on the same object within a second
            var m = this.parent.events.dblclick;
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
            // mouse pointer is over the element, and the mouse button is pressed, then the mouse pointer is moved
            var m = this.parent.events.mousedrag;
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
            // mouse pointer is over the element, and the mouse button is released
            var m = this.parent.events.mousemove;
            for (var i=m.length-1;i>=0;i--) {
                if (m[i].isOn(point.x, point.y)) {
                    if (m[i].mousemove(point) == false) {
                        break;
                    }
                }
            }

            // Mouse Enter Event
            // mouse pointer enters the element
            var m = this.parent.events.mouseenter;
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
            var m = this.parent.events.mouseleave;
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
            var m = this.parent.events.mousedrag;
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
            var m = this.parent.events.mouseup;
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
            var m = this.parent.events.click;
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
            // Two consecutive click events on the same object within a second
            var m = this.parent.events.dblclick;
            for (var i=m.length-1;i>=0;i--) {
                if (m[i].isOn(point.x, point.y)) {
                    var now = (new Date).getTime();
                    if (m[i].dblone > 0) {
                        if (m[i].dbltwo > 0) {
                            if (now - m[i].dbltwo <= 1000) {
                                m[i].dblone = 0;
                                m[i].dbltwo = 0;
                                if (m[i].dblclick(point) == false) {
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
            // mouse pointer is over the element, and the mouse button is pressed, then the mouse pointer is moved
            var m = this.parent.events.mousedrag;
            for (var i=m.length-1;i>=0;i--) {
                m[i].dragging = false;
            }
        }, false);
        this.create.parent = this;
    },

    draw : function (ctx) {
        if (ctx == null) {
            ctx = this.canvas.getContext("2d");
            this.clear(ctx);
        }
        for (var i=0;i<this.cans.length;i++) {
            var c = this.cans[i];
            if (c.isVisible) {
                if (c.angle!=0) {
                    ctx.translate(c.x+(c.width/2), c.y+(c.height/2));
                    ctx.rotate(c.angle);
                    ctx.translate(-c.width/2, -c.height/2);
                    c.draw(ctx);
                    ctx.translate(c.width/2, c.height/2);
                    ctx.rotate(-c.angle);
                    ctx.translate(-c.x-(c.width/2), -c.y-(c.height/2));

                } else {
                    ctx.translate(c.x, c.y);
                    c.draw(ctx);
                    ctx.translate(-c.x, -c.y);
                }
            }
        }
    },

    clear : function (ctx) {
        var padding = 1;
        if (ctx == null)
            ctx = this.canvas.getContext("2d");
       	ctx.clearRect(-padding, -padding, this.width+(padding*2), this.height+(padding*2));
    },

    events : {
        click : [],
        dblclick : [],
        mouseenter : [],
        mouseleave : [],
        mousedown : [],
        mousemove : [],
        mouseup : [],
        mousedrag : [],
    },

    methods : {
        moveTo : function (x, y) {
            this.x = x;
            this.y = y;
            this.isOffScreen()
        },
        moveBy : function (x, y) {
            this.x += x;
            this.y += y;
            this.isOffScreen()
        },
        isOffScreen : function () {
            if (this.offscreen != null)
                if (this.x < -this.width || this.y < -this.height
                || this.x > this.parent.width || this.y > this.parent.height)
                    this.offscreen();
        },
        isOn : function (x, y) {
            if (x - this.x < this.width && x - this.x >= 0
            && y - this.y < this.height && y - this.y >= 0)
                return true;
            else
                return false;
        },
        distance : function (x, y) {
            if (typeof x == "number" && typeof y == "number")
                return Math.sqrt(Math.pow(this.x-x, 2)+Math.pow(this.y-y, 2));
            if (typeof x == "object")
                return Math.sqrt(Math.pow(this.x-x.x,2)+Math.pow(this.y-x.y,2));
        },
        setRadius : function (r) {
            if (typeof this.r != "undefined") {
                this.r = r;
                this.width = r*2;
                this.height = r*2;
            }
            if (typeof this.radius != "undefined")
                this.radius = r;
        },

        angle : 0,
        rotateTo : function (num) {
            this.angle = num;
        },
        rotateBy : function (num) {
            this.angle += num;
        },

        sendForward : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place < this.parent.cans.length-1 && this.parent.cans.length > 1) {
                    this.parent.cans[place] = this.parent.cans[place+1];
                    this.parent.cans[place+1] = this;
                }
                return true;
            }
            return false;
        },
        sendBackward : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place > 0 && this.parent.cans.length > 1) {
                    this.parent.cans[place] = this.parent.cans[place-1];
                    this.parent.cans[place-1] = this;
                }
                return true;
            }
            return false;
        },
        sendToFront : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place < this.parent.cans.length-1) {
                    this.parent.cans.splice(place,1);
                    this.parent.cans.push(this);
                }
                return true;
            }
            return false;
        },
        sendToBack : function () {
            var place = this.parent.cans.indexOf(this);
            if (place >= 0) {
                if (place != 0) {
                    this.parent.cans.splice(place,1);
                    this.parent.cans.unshift(this);
                }
                return true;
            }
            return false;
        },

        isVisible : true,
        hide : function () {this.isVisible = false;},
        show : function () {this.isVisible = true;},
        toggleVisible : function () {this.isVisible = !this.isVisible;},

        // events
        click : null,
        dblclick : null,
        mousedown : null,
        mouseenter : null,
        mouseleave : null,
        mousemove : null,
        mouseup : null,
        mousedrag : null,
        offscreen : null,
        setEvent : function (e, func) {
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
                    can.events[e].push(this);
                    return true;

                case 'offscreen':
                    this[e] = func;
                    return true;

                default:
                    return false;
            }
        },
        removeEvent : function (e) {
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
                    var index = can.events[e].indexOf(this);
                    if (index != -1)
                        can.events[e].splice(index, 1);
                    return true;

                case 'offscreen':
                    this[e] = null;
                    return true;

                default:
                    return false;
            }
        },
        addTo : function (parent) {
            if (parent != null && parent.cans != null) {
                this.parent = parent;
                parent.cans.push(this);
            }
        },
        remove : function () {
            var index = this.parent.cans.indexOf(this);
            if (index != -1)
                this.parent.cans.splice(index, 1);
            for (e in can.events) {
                if (this[e] != null) {
                    this.removeEvent(e);
                }
            }
            this.parent = null;
        },
    },

    create : {
        can : function (obj) {
            for (i in this.parent.methods)
                obj[i] = this.parent.methods[i];
            obj.parent = this.parent;
        },
        text : function (str, x, y, maxWidth, lineHeight, style, align, font) {
            if (typeof str == "string" && typeof x == "number" && typeof y == "number") {
                if (typeof lineHeight != "number")
                    lineHeight = 20;
                if (style == null)
                    style = "#000";
                if (align == null)
                    align = "left";
                if (font == null)
                    font = "Verdana";
                var width;
                if (maxWidth != null)
                    width = maxWidth;
                else // this width is a quick guess with no external validation
                    width = lineHeight*str.length/0.8;
                var txt = {
                    "type" : "text",
                    "str" : str,
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : lineHeight,
                    "maxWidth" : maxWidth,
                    "lineHeight" : lineHeight,
                    "style" : style,
                    "align" : align,
                    "font" : font,
                    "draw" : function (ctx) {
                        ctx.fillStyle = this.style;
                        ctx.textAlign = this.align;
                        ctx.font = this.lineHeight + "px " + this.font;
                        this.width = ctx.measureText(this.str).width;
                        // passing a null maxWidth to fillText in chrome
                        // prevents the text from displaying
                        if (this.maxWidth == null)
                            ctx.fillText(this.str, 0, this.lineHeight);
                        else
                            ctx.fillText(this.str, 0, this.lineHeight, this.maxWidth);
                    },
                };
                this.can(txt);
                this.parent.cans.push(txt);
                return txt;
            } else {
                console.log("could not create text object");
            }
        },
        framedText : function (str, x, y, maxWidth, lineHeight, style, align, font, lineWidth) {
            if (typeof str == "string" && typeof x == "number" && typeof y == "number") {
                if (typeof lineHeight != "number")
                    lineHeight = 20;
                if (style == null)
                    style = "#000";
                if (align == null)
                    align = "left";
                if (font == null)
                    font = "Verdana";
                if (lineWidth == null)
                    lineWidth = 1;
                var width;
                if (maxWidth != null)
                    width = maxWidth;
                else // this width is a quick guess with no external validation
                    width = lineHeight*str.length/0.8;
                var txt = {
                    "type" : "framedText",
                    "str" : str,
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : lineHeight,
                    "maxWidth" : maxWidth,
                    "lineHeight" : lineHeight,
                    "style" : style,
                    "align" : align,
                    "font" : font,
                    "lineWidth" : lineWidth,
                    "draw" : function (ctx) {
                        ctx.strokeStyle = this.style;
                        ctx.textAlign = this.align;
                        ctx.font = this.lineHeight + "px " + this.font;
                        ctx.lineWidth = this.lineWidth;
                        this.width = ctx.measureText(this.str).width;
                        // passing a null maxWidth to fillText in chrome
                        // prevents the text from displaying
                        if (this.maxWidth == null)
                            ctx.strokeText(this.str, 0, this.lineHeight);
                        else
                            ctx.strokeText(this.str, 0, this.lineHeight, 
                                    this.maxWidth);
                    },
                };
                this.can(txt);
                this.parent.cans.push(txt);
                return txt;
            } else {
                console.log("could not create text frame object");
            }
        },
        wrappedText : function (str, x, y, maxWidth, lineHeight, style, align, font) {
            if (typeof str == "string" && typeof x == "number" && typeof y == "number") {
                if (typeof lineHeight != "number")
                    lineHeight = 20;
                if (style == null)
                    style = "#000";
                if (align == null)
                    align = "left";
                if (font == null)
                    font = "Verdana";
                var width;
                if (maxWidth != null)
                    width = maxWidth;
                else // this width is a quick guess with no external validation
                    width = lineHeight*str.length/0.8;
                var txt = {
                    "type" : "wrappedText",
                    "str" : str,
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : lineHeight,
                    "maxWidth" : maxWidth,
                    "lineHeight" : lineHeight,
                    "style" : style,
                    "align" : align,
                    "font" : font,
                    "draw" : function (ctx) {
                        ctx.fillStyle = this.style;
                        ctx.textAlign = this.align;
                        ctx.font = this.lineHeight + "px " + this.font;
                        // passing a null maxWidth to fillText in chrome
                        // prevents the text from displaying
                        if (this.maxWidth == null)
                            ctx.fillText(this.str, 0, this.lineHeight);
                        else {
                            var words = this.str.split(' ');
                            var line = '', x = 0, y = this.lineHeight;

                            for (var i=0;i<words.length;i++) {
                                var testLine = line+words[i]+' ';
                                var testWidth = ctx.measureText(testLine).width;
                                if (testWidth > this.maxWidth && i > 0) {
                                    ctx.fillText(line, x, y, this.maxWidth);
                                    line = words[i] + ' ';
                                    y += this.lineHeight;
                                } else {
                                    line = testLine;
                                }
                            }
                            this.height = y;
                            ctx.fillText(line, x, y, this.maxWidth);
                        }
                    },
                };
                this.can(txt);
                this.parent.cans.push(txt);
                return txt;
            } else {
                console.log("could not create wrapped text object");
            }
        },
        rect : function (x, y, width, height, style) {
            if (typeof x == "number" && typeof y == "number" && typeof width == "number" && typeof height == "number") {
                if (style == null)
                    style = "#000";
                var rect = {
                    "type" : "rect",
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "style" : style,
                    "draw" : function (ctx) {
                        ctx.fillStyle = this.style;
                        ctx.fillRect(0, 0, this.width, this.height);
                    },
                };
                this.can(rect);
                this.parent.cans.push(rect);
                return rect;
            } else {
                console.log("could not create text frame object");
            }
        },
        framedRect : function (x, y, width, height, style, lineWidth) {
            if (typeof x == "number" && typeof y == "number" && typeof width == "number" && typeof height == "number") {
                if (style == null)
                    style = "#000";
                if (lineWidth == null)
                    lineWidth = 1;
                var rect = {
                    "type" : "framedRect",
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "style" : style,
                    "lineWidth" : lineWidth,
                    "draw" : function (ctx) {
                        ctx.beginPath();
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.style;
                        ctx.rect(0, 0, this.width, this.height);
                        ctx.stroke();
                    },
                };
                this.can(rect);
                this.parent.cans.push(rect);
                return rect;
            } else {
                console.log("could not create rectangle object");
            }
        },
        roundedRect : function (x, y, width, height, style, radius) {
            if (typeof x == "number" && typeof y == "number" && typeof width == "number" && typeof height == "number") {
                if (style == null)
                    style = "#000";
                if (typeof radius != "number")
                    radius = 5;
                var rect = {
                    "type" : "roundedRect",
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "style" : style,
                    "radius" : radius,
                    "draw" : function (ctx) {
                        var w = this.width, h = this.height, r = this.radius;
                        ctx.beginPath();
                        ctx.moveTo(0, r);
                        ctx.arc(   r,   r, r, Math.PI, -0.5*Math.PI);
                        ctx.lineTo(w-r, 0);
                        ctx.arc(   w-r, r, r, 0.5*Math.PI, 0);
                        ctx.lineTo(w,   h-r);
                        ctx.arc(   w-r, h-r, r, 0, 0.5*Math.PI);
                        ctx.lineTo(r,   h);
                        ctx.arc(   r,   h-r, r, 1.5*Math.PI, Math.PI);
                        ctx.lineTo(0,   r);
                        ctx.fillStyle = this.style;
                        ctx.fill();
                    },
                };
                this.can(rect);
                this.parent.cans.push(rect);
                return rect;
            } else {
                console.log("could not create rounded Rectangle object");
            }
        },
        line : function (x1, y1, x2, y2, style, lineWidth) {
            if (typeof x1 == "number" && typeof y1 == "number" && typeof x2 == "number" && typeof y2 == "number") {
                if (style == null)
                    style = "#000";
                if (typeof lineWidth != "number")
                    lineWidth = 1;
                var line = {
                    "type" : "line",
                    "x" : x1,
                    "y" : y1,
                    "width" : (x2-x1),
                    "height" : (y2-y1),
                    "style" : style,
                    "lineWidth" : lineWidth,
                    "draw" : function (ctx) {
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.style;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(this.width, this.height);
                        ctx.stroke();
                    },
                };
                this.can(line);
                line.isAt = function (x, y) {
                    if (x - this.x < this.width && y - this.y < this.height) {
                        var m = this.height/this.width;
                        if (Math.abs((this.y-m*this.x)-(y-m*x)) < this.lineWidth) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                this.parent.cans.push(line);
                return line;
            } else {
                console.log("could not create line object");
            }
        },
        image : function (src, x, y, width, height) {
            if (typeof src == "string" && typeof x == "number" && typeof y == "number") {
                var img = new Image();
                img.onload = function() {can.draw();};
                img.src = src;
                var img = {
                    "type" : "image",
                    "img" : img,
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "draw" : function (ctx) {
                        if (this.width == null) {
                            ctx.drawImage(this.img, 0, 0);
                            this.width = this.img.width;
                            this.height = this.img.height;
                        } else {
                            ctx.drawImage(this.img, 0, 0, this.width, this.height);
                        }
                    },
                };
                this.can(img);
                this.parent.cans.push(img);
                return img;
            } else {
                console.log("could not create image object");
            }
        },
        oval : function (x, y, r, style) {
            if (typeof x == "number" && typeof y == "number" && typeof r == "number") {
                if (style == null)
                    style = "#000";
                var oval = {
                    "type" : "oval",
                    "x" : x,
                    "y" : y,
                    "r" : r,
                    "width" : r*2,
                    "height" : r*2,
                    "style" : style,
                    "draw" : function (ctx) {
                        ctx.beginPath();
                        ctx.arc(this.r, this.r, this.r, 0, 2*Math.PI);
                        ctx.fillStyle = this.style;
                        ctx.fill();
                    },
                };
                this.can(oval);
                this.parent.cans.push(oval);
                return oval;
            } else {
                console.log("could not create oval object");
            }
        },
        framedOval : function (x, y, r, style, lineWidth) {
            if (typeof x == "number" && typeof y == "number" && typeof r == "number") {
                if (style == null)
                    style = "#000";
                if (lineWidth = null)
                    lineWidth = 1;
                var oval = {
                    "type" : "framedOval",
                    "x" : x,
                    "y" : y,
                    "r" : r,
                    "width" : r*2,
                    "height" : r*2,
                    "style" : style,
                    "lineWidth" : lineWidth,
                    "draw" : function (ctx) {
                        ctx.beginPath();
                        ctx.arc(this.r, this.r, this.r, 0, 2*Math.PI);
                        ctx.strokeStyle = this.style;
                        ctx.lineWidth = this.lineWidth;
                        ctx.stroke();
                    },
                };
                this.can(oval);
                this.parent.cans.push(oval);
                return oval;
            } else {
                console.log("could not create framed Oval object");
            }
        },
        arc : function (x, y, r, start, end, style, lineWidth) {
            if (typeof x == "number" && typeof y == "number" && typeof r == "number" && typeof start == "number" && typeof end == "number") {
                if (style == null)
                    style = "#000";
                if (lineWidth = null)
                    lineWidth = 1;
                var oval = {
                    "type" : "framedArc",
                    "x" : x,
                    "y" : y,
                    "r" : r,
                    "start" : start,
                    "end" : end,
                    "width" : r*2,
                    "height" : r*2,
                    "style" : style,
                    "lineWidth" : lineWidth,
                    "draw" : function (ctx) {
                        ctx.beginPath();
                        ctx.arc(this.r, this.r, this.r, this.start, this.end);
                        ctx.strokeStyle = this.style;
                        ctx.lineWidth = this.lineWidth;
                        ctx.stroke();
                    },
                };
                this.can(oval);
                this.parent.cans.push(oval);
                return oval;
            } else {
                console.log("could not create framed Arc object");
            }
        },
        filledArc : function (x, y, r, start, end, style) {
            if (typeof x == "number" && typeof y == "number" && typeof r == "number" && typeof start == "number" && typeof end == "number") {
                if (style == null)
                    style = "#000";
                var oval = {
                    "type" : "filledArc",
                    "x" : x,
                    "y" : y,
                    "r" : r,
                    "start" : start,
                    "end" : end,
                    "width" : r*2,
                    "height" : r*2,
                    "style" : style,
                    "draw" : function (ctx) {
                        ctx.beginPath();
                        ctx.arc(this.r, this.r, this.r, this.start, this.end);
                        ctx.fillStyle = this.style;
                        ctx.fill();
                    },
                };
                this.can(oval);
                this.parent.cans.push(oval);
                return oval;
            } else {
                console.log("could not create filled Arc object");
            }
        },
        graph : function (x, y, width, height, xtext, ytext, strokeStyle, fillStyle, margin, xMax, yMax, xMin, yMin) {
            if (typeof x == "number" && typeof y == "number" && typeof width == "number"
            && typeof height == "number" && typeof xtext == "string" && typeof xtext == "string") {
                if (strokeStyle == null)
                    strokeStyle = "#000";
                if (fillStyle == null)
                    fillStyle = "#fff";
                if (margin == null)
                    margin = 30;
                var data = [];
                for (var i=13;i<arguments.length;i++) {
                    data.push(arguments[i]);
                }
                var graph = {
                    "type" : "graph",
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "xtext" : xtext,
                    "ytext" : ytext,
                    "strokeStyle" : strokeStyle,
                    "fillStyle" : fillStyle,
                    "xMax" : xMax,
                    "yMax" : yMax,
                    "xMin" : xMin,
                    "yMin" : yMin,
                    "data" : data,
                    "setData" : function (data) {this.data = data;},
                    "margin" : margin,
                    "getRanges" : function() {
                        var range = {
                            x : {
                                min : 0,
                                max : 1,
                                steps : Math.floor((this.width-(this.margin*(4/3))-3)/this.margin),
                            },
                            y : {
                                min : 0,
                                max : 1,
                                steps : Math.floor((this.height-this.margin-3)/this.margin),
                            }
                        };

                        if (typeof this.xMax == "number" && typeof this.yMax == "number" && typeof this.xMin == "number" && typeof this.yMin == "number") {
                            range.x.max = this.xMax;
                            range.y.max = this.yMax;
                            range.x.min = this.xMin;
                            range.y.min = this.yMin;
                        } else if (this.data.length > 0) {
                            for (var i=0;i<this.data.length;i++) {
                                for (var j=0;j<this.data[i].points.length;j++) {
                                    var d = this.data[i].points[j];
                                    if (d.x > range.x.max) {
                                        range.x.max = d.x + (d.x-range.x.min)*(1/10);
                                    } else if (d.x < range.x.min) {
                                        range.x.min = d.x - (range.x.max-d.x)*(1/10);
                                    }
                                    if (d.y > range.y.max) {
                                        range.y.max = d.y + (d.y-range.y.min)*(1/10);
                                    } else if (d.y < range.y.min) {
                                        range.y.min = d.y - (range.y.max-d.y)*(1/10);
                                    }
                                }
                            }
                        }
                        range.x.range = range.x.max-range.x.min;
                        range.y.range = range.y.max-range.y.min;
                        return range;
                    },
                    "draw" : function (ctx) {
                        // background
                        ctx.fillStyle = this.fillStyle;
                        ctx.fillRect(0, 0, this.width, this.height);
                        
                        // axes
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = this.strokeStyle;
                        ctx.beginPath();
                        ctx.moveTo(this.margin*(4/3), 1);
                        ctx.lineTo(this.margin*(4/3), this.height-(this.margin*(2/3)));
                        ctx.moveTo(this.margin, this.height-this.margin);
                        ctx.lineTo(this.width-1, this.height-this.margin);
                        ctx.stroke();
                        
                        // mins
                        var range = this.getRanges();
                        ctx.font = "10px Verdana";
                        ctx.textAlign = "center";
                        ctx.fillStyle = this.strokeStyle;
                        ctx.fillText(range.y.min.toPrecision(2), this.margin*(2/3), this.height-this.margin+3, this.margin);
                        ctx.fillText(range.x.min.toPrecision(2), this.margin*(4/3), this.height-(this.margin/3)+3, this.margin*(2/3));

                        // text
                        ctx.fillText(this.xtext, (this.width/2)+(this.margin*(2/3)), this.height-(this.margin/3)+3, this.width-(2*this.margin));
                        ctx.translate(this.margin/3, (this.height-this.margin)/2);
                        ctx.rotate(Math.PI*(-1/2));
                        ctx.fillText(this.ytext, 0, 0, this.height-(2*this.margin));
                        ctx.rotate(Math.PI*(1/2));
                        ctx.translate(-(this.margin/3), -((this.height-this.margin)/2));

                        // lines & numbers
                        ctx.lineWidth = 1;
                        ctx.textAlign = "right";
                        for (var i=1;i<range.y.steps;i++) { // x
                            var y = Math.round(this.height-this.margin-((this.height-this.margin)*(i/range.y.steps)))-1.5;
                            ctx.moveTo(this.margin*(7/6), y);
                            ctx.lineTo(this.width-1, y);
                            ctx.stroke();
                            ctx.fillText((range.y.min+(range.y.range*(i/range.y.steps))).toPrecision(2), this.margin*(7/6)-1, y+3, this.margin*(5/6)-2);
                        }
                        ctx.textAlign = "center";
                        for (var i=1;i<range.x.steps;i++) { // y
                            var x = Math.round(this.margin+(((this.width-this.margin)*(i/range.x.steps))))+1.5;
                            ctx.moveTo(x, this.height-this.margin);
                            ctx.lineTo(x, this.height-(this.margin*(5/6)));
                            ctx.stroke();
                            ctx.fillText((range.x.min+(range.x.range*(i/range.x.steps))).toPrecision(2), x, this.height-(this.margin*(2/3))+3, this.margin);
                        }

                        // data plot
                        for (var i=0;i<this.data.length;i++) {
                            this.map(ctx, this.margin*(4/3), 0, this.width-(this.margin*(4/3)), this.height-(this.margin), range, this.data[i]);
                        }
                    },
                    "map" : function (ctx, x, y, width, height, range, data) {
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
                                "x" : x+(((data.points[num].x-range.x.min)/range.x.range)*width),
                                "y" : y+(((range.y.max-data.points[num].y)/range.y.range)*height),
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
                };
                this.can(graph);
                this.parent.cans.push(graph);
                return graph;
            } else {
                console.log("could not create graph object");
            }
        },
        group : function (x, y, width, height) {
            if (typeof x == "number" && typeof y == "number") {
                if (width == null)
                    width = 0;
                if (height == null)
                    height = 0;
                var cans = [];
                for (var i=6;i<arguments.length;i++) {
                    arguments[i].remove();
                    cans.push(arguments[i]);
                }
                var group = {
                    "type" : "group",
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "canvas" : this.parent.canvas,
                    "cans" : cans,
                    "draw" :  can.draw,
                    "clear" : can.clear,
                    "events" : {
                        click : [],
                        dblclick : [],
                        mouseenter : [],
                        mouseleave : [],
                        mousedown : [],
                        mousemove : [],
                        mouseup : [],
                        mousedrag : []
                    },
                };
                this.can(group);
                this.parent.cans.push(group);
                return group;
            } else {
                console.log("could not create group object");
            }
        },
        advancedGroup : function (x, y, width, height, composite, alpha) {
            if (typeof x == "number" && typeof y == "number") {
                if (width == null)
                    width = 0;
                if (height == null)
                    height = 0;
                if (composite == null)
                    composite = "source-over";
                if (alpha == null)
                    alpha = 1;
                var cans = [];
                for (var i=6;i<arguments.length;i++) {
                    arguments[i].remove();
                    cans.push(arguments[i]);
                }
                    var group = {
                    "type" : "group",
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "composite" : composite,
                    "alpha" : alpha,
                    "canvas" : this.parent.canvas,
                    "cans" : cans,
                    "draw" : function (ctx) {
                        if (this.composite != null) {
                            var c = ctx.globalCompositeOperation;
                            ctx.globalCompositeOperation = this.composite;
                            if (this.alpha != null) {
                                var a = ctx.globalAlpha;
                                ctx.globalAlpha = this.alpha;
                                can.draw.apply(this, [ctx]);
                                ctx.globalAlpha = a;
                            } else {
                                can.draw.apply(this, [ctx]);
                            }
                            ctx.globalCompositeOperation = c;
                        } else {
                            if (this.alpha != null) {
                                var a = ctx.globalAlpha;
                                ctx.globalAlpha = this.alpha;
                                can.draw.apply(this, [ctx]);
                                ctx.globalAlpha = a;
                            } else {
                                can.draw.apply(this, [ctx]);
                            }
                        }
                    },
                    "clear" : can.clear,
                    "events" : {
                        click : [],
                        dblclick : [],
                        mouseenter : [],
                        mouseleave : [],
                        mousedown : [],
                        mousemove : [],
                        mouseup : [],
                        mousedrag : []
                    },
                };
                this.can(group);
                this.parent.cans.push(group);
                return group;
            } else {
                console.log("could not create advanced group object");
            }
        },
    },
    cans : [],
};
