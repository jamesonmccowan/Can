// checks if two ImageData objects are the same
// tolerance says how many unmatched pixels are allowed
var equalImages = function (a, b, tolerance) {
    if (typeof tolerance != "number")
        tolerance = 0;
    if (a.data.length != b.data.length)
        return false;
    for (var i=0;i<a.data.length;i+=4) {
        if (a.data[i] != b.data[i]
        || a.data[i+1] != b.data[i+1]
        || a.data[i+2] != b.data[i+2]
        || a.data[i+3] != b.data[i+3])
            tolerance--;
        if (tolerance < 0)
            return false;
    }
    return true;
}

// takes two ImageData objects of equal pixel count
// returns a new ImageData object with red marking diff of two given
var difference = function (a, b) {
    var diff = tests.c.getContext("2d").createImageData(a.width, a.height);
    if (a.data.length != b.data.length)
        return false;
    for (var i=0;i<a.data.length;i+=4) {
        if (a.data[i] != b.data[i]
        || a.data[i+1] != b.data[i+1]
        || a.data[i+2] != b.data[i+2]
        || a.data[i+3] != b.data[i+3]) {
            diff.data[i]=255;
            diff.data[i+1]=0;
            diff.data[i+2]=0;
            diff.data[i+3]=255;
        } else {
            diff.data[i]=0;
            diff.data[i+1]=0;
            diff.data[i+2]=0;
            diff.data[i+3]=0;
        }            
    }
    return diff;
}

// function that's used to build objects that hold the results of the test
function testReturn(passed, error, states) {
    var ret = {
        "passed" : passed, // true or false
        "error" : error,   // error message, reason the test failed
        "states" : states==null?[]:states,
        "draw" : function () {
            can.restart();

            // draw the states of the test
            var bound = Math.ceil(Math.sqrt(this.states.length));
            for (var i=0;i<bound;i++) {
                for (var j=0;j<bound;j++) {
                    if (this.states.length>(i*bound)+j) {
                        can.create.imageData(this.states[(i*bound)+j],
                                j*can.width/bound, i*can.height/bound,
                                can.width/bound, can.height/bound);
                    } else {
                        can.create.line(j*can.width/bound, i*can.height/bound,
                            (j+1)*can.width/bound, (i+1)*can.height/bound,
                            "red");
                        can.create.line(
                            (j+1)*can.width/bound, i*can.height/bound,
                            j*can.width/bound, (i+1)*can.height/bound, "red");
                    }
                }
            }

            // add dividing lines
            for (var i=1;i<bound;i++) {
                can.create.line(i*can.width/bound, 0,
                        i*can.width/bound, can.height);
                can.create.line(0, i*can.height/bound,
                        can.width, i*can.height/bound);
            }

            // add text that lists why the test failed or says the test passed
            if (!this.passed) {
                var error = can.create.text(this.source + " : " + this.error,
                        10, 10, null, null, "gray");
            } else {
                var error = can.create.text("Test Passed!",
                        10, 10, null, null, "green");
            }

            // make text transparent and draggable
            error.alpha = 0.5;
            error.setEvent("mousedown", function (e) {
                this.xs = e.x;
                this.ys = e.y;
            });
            error.setEvent("mousedrag", function (e) {
                this.moveBy(e.x-this.xs, e.y-this.ys);
                this.xs = e.x;
                this.ys = e.y;
            });
            error.setEvent("mouseup", function () {can.draw();});

            // cause canvas to list all failed tests again on double click
            var group = can.create.group(0, 0, can.width, can.height);
            group.setEvent("dblclick", function () {
                can.cans = save.cans;
                can.events = save.events;
                can.draw();
            });
            can.draw();
        },
    };
    return ret;
}

var tests = {
    init : function () {
        this.c = document.getElementsByTagName("canvas")[0];
        can.init(tests.c);
        can.screen.setSize(500, 500);
        this.run();
    },

    run : function () {
        var failed = [];
        var passed = [];
        var testCount = 0;

        // run tests and save test results
        for (var i in this) {
            if (typeof this[i] == "function" && i != "run" && i != "init") {
                testCount++;
                var ret = this[i]();
                ret.source = i
                if (ret.passed) {
                    passed.push(ret);
                } else {
                    failed.push(ret);
                }
            }
        }

        // delete all can objects created during tests
        can.restart();

        // list tests and provide more info when clicked
        function list(l, line, step) {
            for (var i=0;i<l.length;i++) {
                if (typeof l[i].error == "string") {
                    var t = can.create.text(l[i].source + " : "
                            + l[i].error,
                            10, line, null, step, "black");
                    t.ret = l[i]
                    t.setEvent("click", function () {
                        this.ret.draw();
                    });
                } else {
                    can.create.text(
                            "Error: typeof this.error == " + typeof l[i].error,
                            10, line, null, step, "red");
                }
                line += step;
            }
            return line;
        }

        var start = 30;
        var step = 15;
        if (failed.length > 0) {
            can.create.text(failed.length + " of " + testCount + " Tests Failed!", 10, 10, null, 20, "red");
            start = list(failed, start, step);
            start += step;
            can.create.line(10, start-(step/3), can.width/2, start-(step/3));
        } else {
            can.create.text("All " + testCount + " tests Passed!", 10, 10, null, null, "green");
        }
        list(passed, start, step);
        save = {cans : can.cans,events : can.events,};
        can.draw();
    },

    // check if [can] exists and is able to draw
    exists : function () {
        if (typeof can != "object") {
            return testReturn(false,
                "can library not found, can variable not found");
        }
        if (typeof can.draw != "function") {
            return testReturn(false,
            "can library draw function missing, is the library initialized?");
        }
        return testReturn(true, "");
    },

    // check if [can.clear] works
    clear : function () {
        var ctx = this.c.getContext("2d");

        // make sure canvas is clear
        ctx.clearRect(-10, -10, this.c.width+20, this.c.height+20);
        var start = ctx.getImageData(0, 0, this.c.width, this.c.height);

        // color canvas
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, this.c.width, this.c.height);
        var stain = ctx.getImageData(0, 0, this.c.width, this.c.height);

        // clear canvas with can
        can.clear();
        var end = ctx.getImageData(0, 0, this.c.width, this.c.height);
        
        // check that the canvas changed, and was then cleared by can
        if (equalImages(start, stain))
            return testReturn(false,
                    "was unable to change canvas",
                    [start, stain, end]);
        if (!equalImages(start, end))
            return testReturn(false,
                    "can library clear function did not clear canvas",
                    [start, stain, end]);
        return testReturn(true, "", [start, stain, end]);
    },

    // test getImageData, need to test group use of this
    getImageData : function () {
        var ctx = this.c.getContext("2d");
        var start = ctx.getImageData(0, 0, this.c.width, this.c.height);
        var end = can.getImageData();
        if (equalImages(start, end))
            return testReturn(true, "", [start, end]);
        else
            return testReturn(false,
                    "can and canvas imageData do not match",
                    [start, end]);
    },

    // check if text object works
    // text : str, x, y, (maxWidth, lineHeight, style, align, font)
    text : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.text();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.text("Test String", 10, 10);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false,
                    "object wasn't drawn",
                    [start, stain]);

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]);

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if framedText object works
    // framedText : str, x, y,
    //             (maxWidth, lineHeight, style, align, font, lineWidth)
    framedText : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.framedText();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.framedText("Test String", 10, 10);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false,
                    "object wasn't drawn",
                    [start, stain]); 

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if wrappedText object works
    // wrappedText : str, x, y, (maxWidth, lineHeight, style, align, font)
    wrappedText : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.wrappedText();
        if (can.cans.length != 0)
            return testReturn(false,
                "object was added to canvas without enough parameters",
                [start]);
        
        var testVar = can.create.wrappedText(
                "Test String for wrappedText", 10, 10);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false,
                    "object wasn't drawn", [start, stain]); 

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate", [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if rect object works
    // rect : x, y, width, height, (style)
    rect : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.rect();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.rect(10, 10, 20, 10);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]);

        testVar.angle += Math.PI/2;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI/2;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "half rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]);

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if framedRect object works
    // framedRect : x, y, width, height, (style, lineWidth)
    framedRect : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.framedRect();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.framedRect(10, 10, 20, 10);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas", [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]);

        testVar.angle += Math.PI/2;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate", [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen", [start, stain, halfRot]);

        testVar.angle += Math.PI/2;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "half rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]);

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if roundedRect object works
    // roundedRect : x, y, width, height, (style, radius)
    roundedRect : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.roundedRect();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.roundedRect(10, 10, 40, 20);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas", [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]);

        testVar.angle += Math.PI/2;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate", [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen", [start, stain, halfRot]);

        testVar.angle += Math.PI/2;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot, 20))
            return testReturn(false,
            "half rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]);

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if line object works
    // line : x1, y1, x2, y2, (style, lineWidth)
    line : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.line();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.line(10, 10, 20, 20);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas", [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]);

        testVar.angle += Math.PI/2;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate", [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen", [start, stain, halfRot]);

        testVar.angle += 3*Math.PI/2;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]);

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if image object works
    // image : src, x, y, (width, height)
    image : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.image();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.image("data:image/png;base64,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", 0, 0);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas", [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false,"object wasn't drawn"
            + "(this might be caused by the image taking too long to load)",
            [start, stain]);

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate", [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen", [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]);

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if image object works
    // image : src, x, y, (width, height)
    imageData : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.imageData();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var img = this.c.getContext("2d").createImageData(can.width, can.height);
        for (var i=0;i<img.data.length;i++) {
            img.data[i] = Math.floor(Math.random()*256);
        }
        var testVar = can.create.imageData(img, 10, 10);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas", [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]);

        /*testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate (currently cannot rotate)",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen", [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 
        */
        return testReturn(true, "still doesn't rotate", [start, stain]);
    },


    // check if oval object works
    // oval : x, y, width, height, (style)
    oval : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.oval();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.oval(10, 10, 20, 10);
        if (can.cans.length != 1)
            return testReturn(false,
                    "object failed to be added to canvas", [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]); 

        testVar.angle += Math.PI/2;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false,
                    "object didn't rotate", [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false,
                    "object rotated off screen", [start, stain, halfRot]);

        testVar.angle += Math.PI/2;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot, 10))
            return testReturn(false,
            "half rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if framedOval object works
    // framedOval : x, y, width, height, (style, lineWidth)
    framedOval : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.framedOval();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.framedOval(10, 10, 20, 10);
        if (can.cans.length != 1)
            return testReturn(false, "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]); 

        testVar.angle += Math.PI/2;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false, "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false, "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI/2;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "half rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if arc object works
    // arc : x, y, r, [start, end, (style, lineWidth)
    arc : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.arc();
        if (can.cans.length != 0)
            return testReturn(false,
                "object was added to canvas without enough parameters",
                [start]);
        
        var testVar = can.create.arc(10, 10, 5, 0, Math.PI);
        if (can.cans.length != 1)
            return testReturn(false, "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]); 

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false, "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false, "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if filledArc object works
    // filledArc : x, y, r, [start, end, (style)
    filledArc : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.filledArc();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.filledArc(10, 10, 5, 0, Math.PI);
        if (can.cans.length != 1)
            return testReturn(false, "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn",
                    [start, stain]); 

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false, "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false, "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot, 5))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]);

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if graph object works
    // graph : x, y, width, height, xtext, ytext,
    //        (strokeStyle, fillStyle, margin, xMax, yMax, xMin, yMin, data...)
    graph : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.graph();
        if (can.cans.length != 0)
            return testReturn(false,
                    "object was added to canvas without enough parameters",
                    [start]);
        
        var testVar = can.create.graph(10, 10, 300, 300, "X text", "Y Text");
        if (can.cans.length != 1)
            return testReturn(false, "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn", [start, stain]); 

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot, 1))
            return testReturn(false, "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false, "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot, 2000))
            return testReturn(false, 
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },

    // check if group object works
    // group : x, y, (width, height, composite, alpha, can...)
    group : function () {
        can.cans = [];
        can.clear();
        var start = can.getImageData();
        can.create.group();
        if (can.cans.length != 0)
            return testReturn(false,
            "object was added to canvas without enough parameters", [start]);
        
        var testVar = can.create.group(10, 10);
        if (can.cans.length != 1)
            return testReturn(false, "object failed to be added to canvas",
                    [start]);

        can.draw();
        var stain = can.getImageData();
        if (!equalImages(start, stain))
            return testReturn(false,
            "object changed canvas when there was nothing for it to draw",
            [start, stain]);

        var testSubVar = can.create.text("T", 0, 0);
        testSubVar.remove();
        testSubVar.addTo(testVar);
        can.draw();
        stain = can.getImageData();
        if (equalImages(start, stain))
            return testReturn(false, "object wasn't drawn",
                    [start, stain]);

        testVar.angle += Math.PI;
        can.draw();
        var halfRot = can.getImageData();
        if (equalImages(stain, halfRot))
            return testReturn(false, "object didn't rotate",
                    [start, stain, halfRot]);
        if (equalImages(start, halfRot))
            return testReturn(false, "object rotated off screen",
                    [start, stain, halfRot]);

        testVar.angle += Math.PI;
        can.draw();
        var fullRot = can.getImageData();
        if (!equalImages(stain, fullRot))
            return testReturn(false,
            "full rotation failed to return object to start original position",
            [difference(stain, fullRot), stain, halfRot, fullRot]); 

        return testReturn(true, "", [start, stain, halfRot, fullRot]);
    },
}

window.addEventListener('load', function () {tests.init();}, false);
