/*****************************************************************************
 * Can Graphics Library - a object based library for HTML5                   *
 *****************************************************************************
 *
 *
 * []=======================================================================[]
 * || Canvas                                                                ||
 * []=======================================================================[]
 * vas :             canvas element that objects are drawn on
 * init : vas        takes a canvas element and initilizes the library for use
 * screen.setSize :  w, h   adjusts canvas size to given values
 * screen.fitWindow  makes canvas fill browser window
 * draw :            draws the objects onto the canvas
 * clear :           clears the canvas
 * getImageData:     get the current image data from the canvas
 * events :          object for keeping track of all mouse triggered events
 * cans :            for storing objects that will be drawn, 
 * restart :         removes all cans & events off the canvas to restart
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
 * oval : x, y, width, height, (style)
 * framedOval : x, y, width, height, (style, lineWidth)
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
 *
 * getTruePos :     returns the true x and y position of the object {x, y}
 *                  this inclides taking into account alignment and groups
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
 * click, dblclick, mousedown, mouseenter, mouseleave, mousemove, mouseup,
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
    vas : document.createElement("canvas"),

    screen : {
        setSize : function (w, h) {
            can.vas.width = w;
            can.vas.height = h;
            can.width = can.vas.width;
            can.height = can.vas.height;
        },
        fitWindow : function () {
            can.screen.setSize(window.innerWidth, window.innerHeight-3);
            window.onresize = function(event) {
                can.screen.setSize(window.innerWidth, window.innerHeight-3);
                can.draw();
            };
        },
    },

    init : function (vas) {
        if (vas != null)
            this.vas = vas;
        this.vas.parent = this;
        this.ctx = this.vas.getContext("2d");
        this.width = this.vas.width;
        this.height = this.vas.height;

        this.vas.addEventListener("mousedown", function (e) {
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

        this.vas.addEventListener("mousemove", function (e) {
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

        this.vas.addEventListener("mouseup", function (e) {
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
        this.methods.init(this);
        for (var i in this.methods.containers.group)
            this[i] = this.methods.containers.group[i];
        this.draw();
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
        canned : {
            // top right corner of object on canvas
            getTruePos : function () {
                var place = this, x = 0, y = 0;
                while (place.x != null) {
                    x += place.x;
                    y += place.y;
                    if (place.align == "center") {
                        x -= place.width/2;
                        y -= place.height/2;
                    }
                    if (place.align == "right") {
                        x -= place.width;
                        y -= place.height;
                    }
                    if (place.parent != null)
                        place = place.parent;
                    else
                        break;
                }
                return {x : x, y : y};
            },
            getRelativePos : function () {
                var x = this.x, y = this.y;
                if (this.align == "center") {
                    x -= this.width/2;
                    y -= this.height/2;
                }
                if (this.align == "right") {
                    x -= this.width;
                    y -= this.height;
                }
                return {x : x, y : y};
            },

            moveTo : function (x, y) {
                this.x = x;
                this.y = y;
                this.isOffScreen();
                return this;
            },
            moveBy : function (x, y) {
                this.x += x;
                this.y += y;
                this.isOffScreen()
                return this;
            },
            isOffScreen : function () {
                if (this.offscreen != null) {
                    var x = this.x, y = this.y;
                    if (this.align != null && this.align != "left") {
                        if (this.align == "center") {
                            x -= this.width/2;
                            y -= this.height/2;
                        }
                        if (this.align == "right") {
                            x -= this.width;
                            y -= this.height;
                        }

                    }

                    if (x < -this.width || y < -this.height
                    || x>this.parent.width || y>this.parent.height)
                        this.offscreen();
                }
            },
            isOn : function (x, y) {
                var pos = this.getRelativePos();
                if (x - pos.x < this.width && x - pos.x >= 0
                && y - pos.y < this.height && y - pos.y >= 0)
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
            dataImage : function () {
                var ctx = this.parent.vas.getContext("2d");
                var pos = this.getTruePos();
                return ctx.getImageData(pos.x, pos.y, this.width, this.height);
            },

            angle : 0,
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

            isVisible : true,
            hide : function () {this.isVisible = false;return this;},
            show : function () {this.isVisible = true;return this;},
            toggleVisible : function () {this.isVisible = !this.isVisible;return this;},

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
                        this.parent.events[e].push(this);
                        break;
    
                    case 'offscreen':
                        this[e] = func;
                        break;
    
                    default:
                        break;
                }
                return this;
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
                        var index = this.parent.events[e].indexOf(this);
                        if (index != -1)
                            this.parent.events[e].splice(index, 1);
                        break;

                    case 'offscreen':
                        this[e] = null;
                        break;
    
                    default:
                        break;
                }
                return this;
            },
            addTo : function (parent) {
                if (parent != null && parent.cans != null) {
                    this.parent = parent;
                    parent.cans.push(this);
                }
                return this;
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
                return this;
            },
        },

        init : function (parent) {
            this.parent = parent;
        },

        shapes : {
            // x, y, width, height, style
            fillRect : {
                "draw" : function (ctx) {
                    ctx.fillStyle = this.style;
                    ctx.fillRect(0, 0, this.width, this.height);
                },
            },
            // x, y, width, height, style, lineWidth
            strokeRect : {
                "draw" : function (ctx) {
                    ctx.beginPath();
                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.style;
                    ctx.rect(0, 0, this.width, this.height);
                    ctx.stroke();
                },
            },
            // x, y, width, height, style, radius
            roundedFillRect : {
                "draw" : function (ctx) {
                    var w = this.width, h = this.height, r = this.radius;
                    ctx.beginPath();
                    ctx.moveTo(0, r);
                    ctx.arc(r,   r, r, Math.PI, -0.5*Math.PI);
                    ctx.lineTo(w-r, 0);
                    ctx.arc(w-r, r, r, 0.5*Math.PI, 0);
                    ctx.lineTo(w,   h-r);
                    ctx.arc(w-r, h-r, r, 0, 0.5*Math.PI);
                    ctx.lineTo(r,   h);
                    ctx.arc(r,   h-r, r, 1.5*Math.PI, Math.PI);
                    ctx.lineTo(0,   r);
                    ctx.fillStyle = this.style;
                    ctx.fill();
                },
            },
            // x, y, width, height, style, lineWidth, radius
            roundedStrokeRect : {
                "draw" : function (ctx) {
                    var w = this.width, h = this.height, r = this.radius;
                    ctx.beginPath();
                    ctx.moveTo(0, r);
                    ctx.arc(r,   r, r, Math.PI, -0.5*Math.PI);
                    ctx.lineTo(w-r, 0);
                    ctx.arc(w-r, r, r, 0.5*Math.PI, 0);
                    ctx.lineTo(w,   h-r);
                    ctx.arc(w-r, h-r, r, 0, 0.5*Math.PI);
                    ctx.lineTo(r,   h);
                    ctx.arc(r,   h-r, r, 1.5*Math.PI, Math.PI);
                    ctx.lineTo(0,   r);
                    ctx.strokeStyle = this.style;
                    ctx.stroke();
                },
            },
            // x, y, width, height, style
            fillOval : {
                "draw" : function (ctx) {
                    ctx.scale(1, this.height/this.width);
                    ctx.beginPath();
                    ctx.arc(this.width/2, this.width/2, this.width/2, 0, 2*Math.PI);
                    ctx.fillStyle = this.style;
                    ctx.fill();
                    ctx.scale(1, this.width/this.height);
                },
            },
            // x, y, width, height, style, lineWidth
            strokeOval : {
                "draw" : function (ctx) {
                    ctx.scale(1, this.height/this.width);
                    ctx.beginPath();
                    ctx.arc(this.width/2, this.width/2, this.width/2, 0, 2*Math.PI);
                    ctx.strokeStyle = this.style;
                    ctx.lineWidth = this.lineWidth;
                    ctx.stroke();
                    ctx.scale(1, this.width/this.height);
                },
            },
            polygon : {
                "draw" : function (ctx) {
                    ctx.fillStyle = this.style;
                    ctx.beginPath();
                    ctx.moveTo(this.points[0].x, this.points[0].y);
                    for (var i=1;i<this.points.length;i++)
                        ctx.lineTo(this.points[i].x, this.points[i].y);
                    ctx.fill();
                },
            },

        },
        lines : {
            // x1, y1, x2, y2, style, lineWidth
            line : {
                "draw" : function (ctx) {
                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.style;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(this.width, this.height);
                    ctx.stroke();
                },
            },
            // x, y, r, start, end, style
            fillArc : {
                "draw" : function (ctx) {
                    ctx.beginPath();
                    ctx.arc(this.r, this.r, this.r, this.start, this.end);
                    ctx.fillStyle = this.style;
                    ctx.fill();
                },
            },
            // x, y, r, start, end, style, lineWidth
            strokeArc : {
                "draw" : function (ctx) {
                    ctx.beginPath();
                    ctx.arc(this.r, this.r, this.r, this.start, this.end);
                    ctx.strokeStyle = this.style;
                    ctx.lineWidth = this.lineWidth;
                    ctx.stroke();
                },
            }
        },
        text : {
            // str, x, y, width, height, maxWidth, lineHeight,
            // style, textAlign, font
            fillText : {
                "draw" : function (ctx) {
                    ctx.fillStyle = this.style;
                    ctx.textAlign = this.textAlign;
                    ctx.font = this.lineHeight + "px " + this.font;
                    // passing a null maxWidth to fillText in chrome
                    // prevents the text from displaying
                    if (this.maxWidth == null)
                        ctx.fillText(this.str, 0, this.lineHeight);
                    else
                        ctx.fillText(this.str,0,this.lineHeight,this.maxWidth);
                },
                "getString" : function () {return this.str;},
                "setString" : function (str) {
                    if (typeof str == "string")
                        this.str = str;
                    can.ctx.font = this.lineHeight + "px " + this.font;
                    var width = can.ctx.measureText(str).width;
                    if (this.width == null
                    || this.maxWidth == null || this.maxWidth > width)
                        this.width = width;
                },
            },
            // str, x, y, width, height, maxWidth, lineHeight,
            // style, textAlign, font, lineWidth
            strokeText : {
                "draw" : function (ctx) {
                    ctx.strokeStyle = this.style;
                    ctx.textAlign = this.textAlign;
                    ctx.font = this.lineHeight + "px " + this.font;
                    ctx.lineWidth = this.lineWidth;
                    this.width = ctx.measureText(this.str).width;
                    // passing a null maxWidth to fillText in chrome              
                    // prevents the text from displaying
                    if (this.maxWidth == null)
                        ctx.strokeText(this.str, 0, this.lineHeight);
                    else
                        ctx.strokeText(this.str,0,this.lineHeight,this.maxWidth);
                },
                "getString" : function () {return this.str;},
                "setString" : function (str) {
                    if (typeof str == "string")
                        this.str = str;
                    can.ctx.font = this.lineHeight + "px " + this.font;
                    var width = can.ctx.measureText(this.str).width;
                    if (this.width == null
                    || this.maxWidth == null || this.maxWidth > width)
                        this.width = width;
                    return this;
                },
            },
            // str, x, y, width, height, maxWidth, lineHeight,
            // style, textAlign, font
            wrappedFillText : {
                "draw" : function (ctx) {
                    ctx.fillStyle = this.style;
                    ctx.textAlign = this.textAlign;
                    ctx.font = this.lineHeight + "px " + this.font;
                    // passing a null maxWidth to fillText in chrome
                    // prevents the text from displaying
                    if (this.maxWidth == null) {
                        ctx.fillText(this.str, 0, this.lineHeight);//, this.lineHeight);
                    } else {
                        var words = this.str.split(' ');
                        var line = '', y = this.lineHeight;

                        for (var i=0;i<words.length;i++) {
                            var testLine = line+words[i]+' ';
                            var testWidth = ctx.measureText(testLine).width;
                            if (testWidth > this.maxWidth && i > 0) {
                                ctx.fillText(line, 0, y, this.maxWidth);
                                line = words[i] + ' ';
                                y += this.lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        ctx.fillText(line, 0, y, this.maxWidth);
                    }
                },
                // functions for text
                "getString" : function () {return this.str;return this;},
                "setString" : function (str) {
                    if (typeof str == "string")
                        this.str = str;
                    // height may need to be recalculated
                    if (this.maxWidth == null) {
                        can.ctx.font = this.lineHeight + "px " + this.font;
                        var width = can.ctx.measureText(this.str).width;
                        if (this.width == null
                        || this.maxWidth == null || this.maxWidth > width)
                            this.width = width;
                        this.height = this.lineHeight;
                    } else {
                        var line = "";
                        var words = this.str.split(' ');
                        var y = this.lineHeight;
                        for (var i=0;i<words.length;i++) {
                            var testLine = line+words[i]+' ';
                            var testWidth = can.ctx.measureText(testLine).width;
                            if (testWidth > this.maxWidth && i > 0) {
                                line = words[i] + ' ';
                                y += this.lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        this.width = this.maxWidth;
                        this.height = y;
                    }
                },
            },
        },
        containers : {
            // x, y, width, height
            group : {
                "clear" : function (ctx) {
                    var padding = 1;
                    if (ctx == null)
                        ctx = this.vas.getContext("2d");
                   	ctx.clearRect(-padding, -padding, 
                            this.width+(padding*2), this.height+(padding*2));
                },
                "getImageData" : function (ctx) {
                    if (ctx == null)
                        ctx = this.vas.getContext("2d");
                    return ctx.getImageData(0, 0, this.width, this.height);
                },
                "draw" : function (ctx) {
                    if (ctx == null) {
                        ctx = this.vas.getContext("2d");
                        this.clear(ctx);
                    }
                    for (var i=0;i<this.cans.length;i++) {
                        var c = this.cans[i];
                        if (c.isVisible) {
                            this.setup(ctx, c);
                            c.draw(ctx);
                            this.teardown(ctx, c);
                        }
                    }
                },
                "setup" : function (ctx, c) {
                    // rotate and position
                    if (c.angle!=0) {
                        ctx.translate(c.x+(c.width/2), c.y+(c.height/2));
                        ctx.rotate(c.angle);
                        ctx.translate(-c.width/2, -c.height/2);
                    } else { 
                        ctx.translate(c.x, c.y);
                    }

                    // alignment by position
                    if (c.align == "center")
                        ctx.translate(-c.width/2, -c.height/2);
                    if (c.align == "right")
                        ctx.translate(-c.width, -c.height);

                    // transparency / alpha
                    if (c.alpha != null) {
                        var a = ctx.globalAlpha;
                        ctx.globalAlpha = c.alpha;
                        c.alpha = a;
                    }

                    // composite
                    if (c.composite != null) {
                        var comp = ctx.globalCompositeOperation;
                        ctx.globalCompositeOperation = c.composite;
                        c.composite = comp;
                    }
                },
                "teardown" : function (ctx, c) {
                    // rotate and position
                    if (c.angle!=0) {
                        ctx.translate(c.width/2, c.height/2);
                        ctx.rotate(-c.angle);
                        ctx.translate(-c.x-(c.width/2), -c.y-(c.height/2));
                    } else {
                        ctx.translate(-c.x, -c.y);
                    }

                    // alignment by position
                    if (c.align == "center")
                        ctx.translate(c.width/2, c.height/2);
                    if (c.align == "right")
                        ctx.translate(c.width, c.height);

                    // transparency / alpha
                    if (c.alpha != null) {
                        var a = ctx.globalAlpha;
                        ctx.globalAlpha = c.alpha;
                        c.alpha = a;
                    }

                    // composite
                    if (c.composite != null) {
                        var comp = ctx.globalCompositeOperation;
                        ctx.globalCompositeOperation = c.composite;
                        c.composite = comp;
                    }
                },
                // clears all objects off canvas
                "restart" : function () {
                    this.events = {
                        click : [],
                        dblclick : [],
                        mouseenter : [],
                        mouseleave : [],
                        mousedown : [],
                        mousemove : [],
                        mouseup : [],
                        mousedrag : [],
                    },
                    delete this.cans;
                    this.cans = [];
                },
            },
        },
        special : {
            // src, x, y, width, height
            image : {
                "draw" : function (ctx) {
                    if (this.width == null) {
                        ctx.drawImage(this.img, 0, 0);
                        this.width = this.img.width;
                        this.height = this.img.height;
                    } else {
                        ctx.drawImage(this.img, 0, 0, this.width, this.height);
                    }
                },
            },
            imageData : {
                "draw" : function (ctx) {
                    var pos = this.getTruePos();
                    ctx.putImageData(this.data, pos.x, pos.y, 0, 0,
                            this.width,this.height);
                },
            },

            // x, y, width, height, xtext, ytext, strokeStyle, fillStyle,
            // margin, xMax, yMax, xMin, yMin
            graph : {
                "draw" : function (ctx) {
                    var w = this.width, h = this.height, m = this.margin;
                    // Background
                    ctx.fillStyle = this.fillStyle;
                    ctx.fillRect(0, 0, w, h);
                        
                    // Axes
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = this.strokeStyle;
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
                    ctx.fillStyle = this.strokeStyle;
                    ctx.fillText(range.ymin.toPrecision(2), m*2/3, h-m+3, m);
                    ctx.fillText(range.xmin.toPrecision(2), m*4/3, h-(m/3)+3,
                            m*(2/3));

                    // Axes Labels
                    ctx.fillText(this.xtext, (w/2)+(m*2/3), h-(m/3)+3, w-2*m);
                    ctx.translate(m/3, (h-m)/2);
                    ctx.rotate(Math.PI*(-1/2));
                    ctx.fillText(this.ytext, 0, 0, h-(2*m));
                    ctx.rotate(Math.PI*(1/2));
                    ctx.translate(-m/3, -((h-m)/2));

                    // Lines & Numbers
                    ctx.lineWidth = 1;
                    ctx.textAlign = "right";
                    for (var i=1;i<range.ysteps;i++) { // x
                        var y = Math.round(h-m-((h-m)*(i/range.ysteps)))-1.5;
                        ctx.moveTo(this.margin*(7/6), y);
                        ctx.lineTo(this.width-1, y);
                        ctx.stroke();
                        ctx.fillText(
                            (range.ymin+(range.yrange*(i/range.ysteps)))
                                .toPrecision(2), m*(7/6)-1, y+3, m*(5/6)-2);
                    }
                    ctx.textAlign = "center";
                    for (var i=1;i<range.xsteps;i++) { // y
                        var x = Math.round(m+(((w-m)*(i/range.xsteps))))+1.5;
                        ctx.moveTo(x, h-m);
                        ctx.lineTo(x, h-(m*(5/6)));
                        ctx.stroke();
                        ctx.fillText(
                            (range.xmin+(range.xrange*(i/range.xsteps)))
                                .toPrecision(2), x, h-(m*(2/3))+3, m);
                    }

                    // data plot
                    for (var i=0;i<this.data.length;i++) {
                        this.map(ctx, m*(4/3), 0, w-(m*(4/3)), h-(m), range,
                                this.data[i]);
                    }
                },
                "getRanges" : function() {
                    var range = {
                        xmin : 0,
                        xmax : 1,
                        xsteps : Math.floor(
                            (this.width-(this.margin*(4/3))-3)/this.margin),
                        ymin : 0,
                        ymax : 1,
                        ysteps : Math.floor(
                            (this.height-this.margin-3)/this.margin),
                    };
                    if (typeof this.xMax=="number"&&typeof this.yMax=="number"
                    && typeof this.xMin=="number"&&typeof this.yMin=="number") {
                        range.xmax = this.xMax;
                        range.ymax = this.yMax;
                        range.xmin = this.xMin;
                        range.ymin = this.yMin;
                    } else if (this.data.length > 0) {
                        for (var i=0;i<this.data.length;i++) {
                            for (var j=0;j<this.data[i].points.length;j++) {
                                var d = this.data[i].points[j];
                                if (d.x > range.xmax)
                                    range.xmax = d.x + (d.x-range.xmin)*(1/10);
                                else if (d.x < range.xmin)
                                    range.xmin = d.x - (range.xmax-d.x)*(1/10);
                                if (d.y > range.ymax)
                                    range.ymax = d.y + (d.y-range.ymin)*(1/10);
                                else if (d.y < range.ymin)
                                    range.ymin = d.y - (range.ymax-d.y)*(1/10);
                            }
                        }
                    }
                    range.xrange = range.xmax-range.xmin;
                    range.yrange = range.ymax-range.ymin;
                    return range;
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
                            "x" : x+(((data.points[num].x-range.xmin)
                                        /range.xrange)*width),
                            "y" : y+(((range.ymax-data.points[num].y)
                                        /range.yrange)*height),
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
                },
            },
        },
    },

    create : {
        can : function (obj, methods) {
            for (i in can.methods.canned)
                obj[i] = can.methods.canned[i];
            for (i in methods)
                obj[i] = methods[i];
            obj.parent = this.parent;
            this.parent.cans.push(obj);
            return obj;
        },
        text : function (str, x, y, maxWidth, lineHeight, 
                       style, textAlign, font) {
            if (typeof str=="string"&&typeof x=="number"&&typeof y=="number") {
                // the width is a quick guess with no external validation
                var txt = {
                    "str" : str,
                    "x" : x,
                    "y" : y,
                    "width" : maxWidth,
                    "height" : typeof lineHeight!="number"?20:lineHeight,
                    "maxWidth" : maxWidth,
                    "lineHeight" : typeof lineHeight!="number"?20:lineHeight,
                    "style" : style==null?"#000":style,
                    "textAlign" : textAlign==null?"left":textAlign,
                    "font" : font==null?"Verdana":font,
                };
                var ctx = this.parent.vas.getContext("2d");
                ctx.font = txt.lineHeight + "px " + txt.font;
                var width = ctx.measureText(str).width;
                if (txt.width == null || txt.width > width)
                    txt.width = width;
                return this.can(txt, can.methods.text.fillText);
            } else {
                console.log("could not create text object");
            }
        },
        framedText : function (str, x, y, maxWidth, lineHeight,
                             style, textAlign, font, lineWidth) {
            if (typeof str=="string"&&typeof x=="number"&&typeof y=="number") {
                var width = this.parent.vas.getContext("2d")
                    .measureText(str).width;
                var txt = {
                    "str" : str,
                    "x" : x,
                    "y" : y,
                    "width" : maxWidth,
                    "height" : typeof lineHeight!="number"?20:lineHeight,
                    "maxWidth" : maxWidth,
                    "lineHeight" : typeof lineHeight!="number"?20:lineHeight,
                    "style" : style==null?"#000":style,
                    "textAlign" : textAlign==null?"left":textAlign,
                    "font" : font==null?"Verdana":font,
                    "lineWidth" : lineWidth==null?1:lineWidth,
                };
                var ctx = this.parent.vas.getContext("2d");
                ctx.font = txt.lineHeight + "px " + txt.font;
                var width = ctx.measureText(str).width;
                if (txt.width == null || txt.width > width)
                    txt.width = width;
                this.can(txt, can.methods.text.strokeText);
                txt.setString(str);
                return txt;
            } else {
                console.log("could not create text frame object");
            }
        },
        wrappedText : function (str, x, y, maxWidth, lineHeight,
                              style, textAlign, font) {
            if (typeof str=="string"&&typeof x=="number"&&typeof y=="number") {
                var width = this.parent.vas.getContext("2d")
                    .measureText(str).width;
                var txt = {
                    "str" : str,
                    "x" : x,
                    "y" : y,
                    "width" : maxWidth,
                    "height" : typeof lineHeight!="number"?20:lineHeight,
                    "maxWidth" : maxWidth,
                    "lineHeight" : typeof lineHeight!="number"?20:lineHeight,
                    "style" : style==null?"#000":style,
                    "textAlign" : textAlign==null?"left":textAlign,
                    "font" : font==null?"Verdana":font,
                };
                this.can(txt, can.methods.text.wrappedFillText);
                txt.setString(str);
                return txt;
            } else {
                console.log("could not create wrapped text object");
            }
        },
        rect : function (x, y, width, height, style) {
            if (typeof x=="number"&&typeof y=="number"&&typeof width=="number"){
                var rect = {
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height==null?width:height,
                    "style" : style==null?"#000":style,
                };
                return this.can(rect, can.methods.shapes.fillRect);
            } else {
                console.log("could not create Rectangle object");
            }
        },
        framedRect : function (x, y, width, height, style, lineWidth) {
            if (typeof x=="number"&&typeof y=="number"&&typeof width=="number"){
                var rect = {
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height==null?width:height,
                    "style" : style==null?"#000":style,
                    "lineWidth" : lineWidth==null?1:lineWidth,
                };
                return this.can(rect, can.methods.shapes.strokeRect);
            } else {
                console.log("could not create rectangle object");
            }
        },
        roundedRect : function (x, y, width, height, style, radius) {
            if (typeof x=="number"&&typeof y=="number"&&typeof width=="number"){
                var rect = {
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height==null?width:height,
                    "style" : style==null?"#000":style,
                    "radius" : typeof radius!="number"?5:radius,
                };
                return this.can(rect, can.methods.shapes.roundedFillRect);
            } else {
                console.log("could not create rounded Rectangle object");
            }
        },
        polygon : function (points, style) {
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

                var poly = {
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "style" : style==null?"#000":style,
                    "points" : points,
                };
                return this.can(poly, can.methods.shapes.polygon);
            } else {
                console.log("could not create polygon object");
            }
        },
        line : function (x1, y1, x2, y2, style, lineWidth) {
            if (typeof x1 == "number" && typeof y1 == "number"
            && typeof x2 == "number" && typeof y2 == "number") {
                var line = {
                    "x" : x1,
                    "y" : y1,
                    "width" : (x2-x1),
                    "height" : (y2-y1),
                    "style" : style==null?"#000":style,
                    "lineWidth" : lineWidth==null?1:lineWidth,
                };
                return this.can(line, can.methods.lines.line);
            } else {
                console.log("could not create line object");
            }
        },
        image : function (src, x, y, width, height, draw) {
            if (typeof src=="string"&&typeof x=="number"&&typeof y=="number") {
                var i = new Image();
                var img = {
                    "img" : i,
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                };
                i.obj = img;
                i.onload = function() {
                    if(this.obj.width==null)
                        this.obj.width = this.width;
                    if(this.obj.height==null)
                        this.obj.height = this.height;
                    if (draw==null || draw==true)
                        can.draw();
                }
                i.src = src;
                return this.can(img, can.methods.special.image);
            } else {
                console.log("could not create image object");
            }
        },
        imageData : function (img, x, y, width, height) {
            if (typeof img=="object"&&typeof x=="number"&&typeof y=="number") {
                var data = {
                    "data" : img,
                    "x" : x,
                    "y" : y,
                    "width" : width==null?img.width:width,
                    "height" : height==null?img.height:height,
                };
                return this.can(data, can.methods.special.imageData);
            } else {
                console.log("could not create image data object");
            }
        },
        oval : function (x, y, width, height, style) {
            if (typeof x=="number"&&typeof y=="number"&&typeof width=="number"){
                var oval = {
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height==null?width:height,
                    "style" : style==null?"#000":style,
                };
                return this.can(oval, can.methods.shapes.fillOval);
            } else {
                console.log("could not create oval object");
            }
        },
        framedOval : function (x, y, width, height, style, lineWidth) {
            if (typeof x=="number"&&typeof y=="number"&&typeof width=="number"){
                var oval = {
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height==null?width:height,
                    "style" : style==null?"#00":style,
                    "lineWidth" : lineWidth==null?1:lineWidth,
                };
                return this.can(oval, can.methods.shapes.strokeOval);
            } else {
                console.log("could not create framed Oval object");
            }
        },
        arc : function (x, y, r, start, end, style, lineWidth) {
            if (typeof x == "number" && typeof y == "number"
            && typeof r == "number" 
            && typeof start == "number" && typeof end == "number") {
                var oval = {
                    "x" : x,
                    "y" : y,
                    "r" : r,
                    "start" : start,
                    "end" : end,
                    "width" : r*2,
                    "height" : r*2,
                    "style" : style==null?"#000":style,
                    "lineWidth" : lineWidth==null?1:lineWidth,
                };
                return this.can(oval, can.methods.lines.strokeArc);
            } else {
                console.log("could not create framed Arc object");
            }
        },
        filledArc : function (x, y, r, start, end, style) {
            if (typeof x == "number" && typeof y == "number"
            && typeof r == "number" && typeof start == "number"
            && typeof end == "number") {
                var oval = {
                    "x" : x,
                    "y" : y,
                    "r" : r,
                    "start" : start,
                    "end" : end,
                    "width" : r*2,
                    "height" : r*2,
                    "style" : style==null?"#000":style,
                };
                return this.can(oval, can.methods.lines.fillArc);
            } else {
                console.log("could not create filled Arc object");
            }
        },
        graph : function (x, y, width, height, xtext, ytext,
                    strokeStyle, fillStyle, margin, xMax, yMax, xMin, yMin) {
            if (typeof x == "number" && typeof y == "number"
            && typeof width == "number" && typeof height == "number"
            && typeof xtext == "string" && typeof xtext == "string") {
                var data = [];
                for (var i=13;i<arguments.length;i++) {
                    data.push(arguments[i]);
                }
                var graph = {
                    "x" : x,
                    "y" : y,
                    "width" : width,
                    "height" : height,
                    "xtext" : xtext,
                    "ytext" : ytext,
                    "strokeStyle" : strokeStyle==null?"#000":strokeStyle,
                    "fillStyle" : fillStyle==null?"#FFF":fillStyle,
                    "xMax" : xMax,
                    "yMax" : yMax,
                    "xMin" : xMin,
                    "yMin" : yMin,
                    "data" : data,
                    "setData" : function (data) {this.data = data;},
                    "margin" : margin==null?30:margin,
                };
                return this.can(graph, can.methods.special.graph);
            } else {
                console.log("could not create graph object");
            }
        },
        group : function (x, y, width, height) {
            if (typeof x == "number" && typeof y == "number") {
                var cans = [];
                for (var i=6;i<arguments.length;i++) {
                    arguments[i].remove();
                    cans.push(arguments[i]);
                }
                var group = {
                    "x" : x,
                    "y" : y,
                    "width" : width==null?0:width,
                    "height" : height==null?0:height,
                    "vas" : this.parent.vas,
                    "cans" : cans,
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
                return this.can(group, can.methods.containers.group);
            } else {
                console.log("could not create group object");
            }
        },
    },
    cans : [],
};
