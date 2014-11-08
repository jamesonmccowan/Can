// null test of test system
new Test();

new Test({
    title : "Non-Null Test",
    description : "testing to see if all the entries for this test are added",
    success : "Test seems to be working",
    failure : "Test wasn't supposed to fail",
    setup : function () {},
    run : function () {
        return true;
    },
    teardown: function () {}
});

new Test({
    title : "Can Exists Test",
    description : "Test to see if the can library is even in scope",
    success : "Can Exists",
    failure : "Can does not Exist",
    run : function () {
        if (typeof can != "undefined")
            return true;
        else
            return false;
    }
});


new Test({
    title : "Can init",
    description : "Test can object's basic structure for expected features",
    success : "Can has the expected objects and functions",
    failure : "tests are out of date or problems with can",
    run : function () {
        var ret = true;
        var crash = ["proto", "animation", "rect", "line", "oval", "circle", "arc", "polygon", "chain", "graph"];
        var obj = ["types", "fx"];
        var pass = ["can", "text", "shape", "image", "group", "tile", "sprite", "category", "buffer", "stage"];
        var info = this.info;

        // pass fail crash
        function pfc (str, check) {
            var actual;
            try {
                var o = can[str]();
                if (o == null) {
                    info.push("returned null when \""+str+"\" called with no arguments ("+ (check=="fail"?"expected":"unexpected") +")");
                    actual = "fail";
                } else if (typeof o == "object") {
                    info.push("returned object when \""+str+"\"called with no arguments ("+ (check=="pass"?"expected":"unexpected") +")");
                    actual = "pass";
                } else {
                    info.push("returned " + typeof o + " when \""+str+"\"called with no arguments (unexpected)");
                    actual = "unknown";
                }
            } catch (e) {
                info.push("caused an error when \""+str+"\"called with no arguments ("+ (check=="crash"?"expected":"unexpected") +")");
                actual = "crash";
            }
            if (check != actual)
                ret = false;
        }

        for (var i in can) {
            if (typeof can[i] == "function") {
                var index = pass.indexOf(i);
                if (index != -1) {
                    pass.splice(index, 1);
                    pfc(i, "pass");
                } else {
                    index = crash.indexOf(i);
                    if (index != -1) {
                        crash.splice(index, 1);
                        pfc(i, "crash");
                    } else {
                        info.push("Unexpected new function \"" + i + "\", this test may need revision!");
                        ret = false;
                    }
                }
            } else {
                var index = obj.indexOf(i);
                if (index != -1) { // if in list
                    obj.splice(index, 1); // remove from list
                } else {
                    info.push("Unexpected new element \"" + i + "\", this test may need revision!)");
                    ret = false;
                }
            }
        }
        return ret;
    }
});

// the first 4 tests are now treated as init tests:
// that means if the results returned by them aren't as expected, further testing is stopped
framework.inits = framework.tests;
framework.tests = [];

new Test({
    title : "text test 1",
    description : "Test text object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.text({
            x : 10,
            y : 10,
            fill : "rgb("+(color.r)+","+color.g+","+color.b+")",
            str : "Test Text"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created text, but wrong color";
            return false;
        }

        return true;
    }
});

// cans: parent, align, angle, alpha, composite, visible, x, y, id
// config.extra = {"anythingYouWant" : "anyValue"}; // can overwrite some values though.

// maxWidth, size, fill, stroke, textAlign, font, wrap, 
// bold, italic, underline, str
// base?

new Test({
    title : "text test 2",
    description : "Test text object features and functions",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of text failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var text = can.text({
            x : 10,
            y : 10,
            fill : "rgb("+(c1.r)+","+c1.g+","+c1.b+")",
            str : "Test Text"});
        this.stage.add(text);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        text.text("more test text");
        onChange("Changing text works", "changing text doesn't work");

        text.maxWidth = text.width()/2;
        onChange("setting maxWidth works", "setting maxWidth doesn't work");

        text.size = text.size + 1;
        onChange("changing size works", "changing size doesn't work");

        text.wrap = true;
        onChange("setting wrap works", "setting wrap doesn't work");

        text.fill = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing fill works", "changing fill doesn't work");

        text.stroke = "rgb("+(c1.r)+","+c1.g+","+c1.b+")";
        onChange("setting stroke works", "setting stroke doesn't work");

        return ret;
    }
});

// textAlign, font, bold, italic, underline
new Test({
    title : "text test 3",
    description : "Test textAlign, font, bold, italic, underline",
    success : "Canvas was changed by draw events, presumably as expected",
    failure: "One or more features of text failed to change the canvas",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var text = can.text({
            x : 10,
            y : 10,
            fill : "rgb("+(c1.r)+","+c1.g+","+c1.b+")",
            str : "Test Text"});
        this.stage.add(text);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        text.textAlign = "center";
        onChange("Changing textAlign to center works",
                 "changing textAlign to center doesn't work");

        text.textAlign = "right";
        onChange("Changing textAlign to right works",
                "changing textAlign to right doesn't work");

        text.textAlign = "left";
        onChange("Changing textAlign to left works",
                "changing textAlign to left doesn't work");

        text.italic = true;
        onChange("Setting italic works", "Setting italic doesn't work");

        text.underline = true;
        onChange("Setting underline works", "Setting underline doesn't work");

        text.bold = true;
        onChange("Setting bold works", "Setting bold doesn't work");

        text.font = "Calibri";
        onChange("Changing font works", "Changing font doesn't work");

        // this is here just to see how underline handles it
        text.stroke = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        text.maxWidth = text.width()/2;
        text.wrap = true;
        onChange("Setting stroke works", "Setting stroke doesn't work");

        return ret;
    }
});

new Test({
    title : "rect test 1",
    description : "Test rect object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.rect({
            x : 10,
            y : 10,
            width : 10,
            height : 10,
            fill : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created rect, but wrong color";
            return false;
        }

        return true;
    }
});

new Test({
    title : "rect test 2",
    description : "Test rect object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of rect failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var rect = can.rect({
            x : 10,
            y : 10,
            width : 40,
            height : 40,
            fill : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"});
        this.stage.add(rect);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        rect.width(rect.width()*2);
        onChange("setting width works", "setting width doesn't work");

        rect.height(rect.height()*2);
        onChange("setting height works", "setting height doesn't work");

        rect.radius = 10;
        onChange("setting radius works", "setting radius doesn't work");

        rect.fill = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing fill works", "changing fill doesn't work");

        rect.stroke = "rgb("+(c1.r)+","+c1.g+","+c1.b+")";
        onChange("setting stroke works", "setting stroke doesn't work");

        return ret;
    }
});

new Test({
    title : "line test 1",
    description : "Test line object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.line({
            x : 10,
            y : 10,
            x2 : 90,
            y2 : 90,
            lineWidth : 3,
            style : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created line, but wrong color";
            return false;
        }

        return true;
    }
});

new Test({
    title : "line test 2",
    description : "Test line object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of line failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var line = can.line({
            x : 10,
            y : 10,
            x2 : 50,
            y2 : 50,
            style : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"});
        this.stage.add(line);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        line.width(line.width()*2);
        onChange("setting width works", "setting width doesn't work");

        line.height(line.height()*2);
        onChange("setting height works", "setting height doesn't work");

        line.lineWidth = line.lineWidth*2;
        onChange("changing lineWidth works", "changing lineWidth doesn't work");

        line.style = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing style works", "changing style doesn't work");

        return ret;
    }
});

new Test({
    title : "image test 1",
    description : "Test image object creation",
    success : "Canvas was changed by draw event.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var self = this;
        var load = function () {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            if (equalImages(self.snapshots[0], self.snapshots[1])) {
                self.status = "failure";
                if (framework.timeout) {
                    framework.loading.pop();
                    framework.finish();
                }
                return ;
            }

            self.snapshots.push(
                    difference(self.snapshots[0], self.snapshots[1]));
            self.status = "success";
            if (framework.timeout) {
                framework.loading.pop();
                framework.finish();
            }
            return ;
        }
        framework.loading.push(1);
        this.stage.add(can.image({
            x : 10,
            y : 10,
            image : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIKSURBVHjaYvz//z/DYAIAAcTEMMgAQACxYAoxMjLC2cSEH3XVAwQQC6bSF6Kih16/RhbBZQ0t1AMEEBOyaqAwEImbmNiJikIEV4ERsp9orR4ggECugwAGsOr/np4gjqcn0B9ABNEA8QQaoJF6gABihCiFOB8KPD1fnjkDYcLDNgw1YGmnHiCAsDkIyIWFJxzgs4Cq6gECiAlNEYQBlNu9e3cYkmosaYI26gECiAk5MTHCtO3ZsweuFIiAmjEtoJF6gABihAcsKFSR2AxI6lxdXTFzMo3UAwQQ9pIani+IBFRUDxBAjGhJjwE1AIFuJ1jQUVc9QAAxYg3bAaw6AAKIcbDV9gABNOhqe4AAGnQOAgigQecggACiQnuIVIDffIAAoqg9RJ5T8JsPEEDkt4fIcA0x5gMEEEYa8vRk2LYNogeujZqAkPkAAURme4i84CHGfIAAIrM9RJGD8JoPEEDkt4dIdhNx5gMEEPntIVIBkeYDBBD57SFyYo0I8wECiDrtITJCC5f5AAFEUXuIvIIRv/kAAUSF9hB1qw6AABp07SGAABp0tT1AAA06BwEE0KBzEEAADbrxIYAAGnTjQwABNOjGhwACaNCNDwEE0KAbHwIIoEE3PgQQQINufAgggAbd+BBAAA268SGAABp040MAATToxocAAmjQjQ8BBNCgaw8BBNCgq+0BAgwAnVoBjAo1LQ4AAAAASUVORK5CYII=",
            load : load}));
    }
});

new Test({
    title : "image test 2",
    description : "Test image object features",
    success : "Canvas was changed by draw event.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var self = this;
        var load = function (image) {
            self.info.push("different source loaded");
            this.width(this.img.width);
            this.height(this.img.height);
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            self.status = "success";
            if (equalImages(self.snapshots[0], self.snapshots[1])) {
                self.status = "failure";
                self.info.push("image didn't draw");
            } else {
                self.info.push("image was drawn successfully");
            }

            this.remove();
            var i = can.image({
                x : 10,
                y : 10,
                image : image});
            self.stage.add(i);
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            if (!equalImages(self.snapshots[1], self.snapshots[2])) {
                self.status = "failure";
                self.info.push("Could not dulpicate image by passing in Image");
            } else {
                self.info.push("Successfully created duplicate image by passing in Image");
            }

            i.remove();
            i = can.image({
                x : 0,
                y : 0,
                image : self.snapshots[1]});
            self.stage.add(i);
            self.stage.draw();
            self.snapshots.push(self.snapshots[2]);
            if (!equalImages(self.snapshots[1], self.snapshots[3])) {
                self.status = "failure";
                self.info.push("Could not dulpicate image using imageData");
            } else {
                self.info.push("Successfully created duplicate image using imageData");
            }


            if (framework.timeout) {
                framework.loading.pop();
                framework.finish();
            }
            return ;
        }
        var error = function () {
            self.status = "failure";
            //self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            self.info.push("error triggered, attempting to load different source");
            this.img.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIKSURBVHjaYvz//z/DYAIAAcTEMMgAQACxYAoxMjLC2cSEH3XVAwQQC6bSF6Kih16/RhbBZQ0t1AMEEBOyaqAwEImbmNiJikIEV4ERsp9orR4ggECugwAGsOr/np4gjqcn0B9ABNEA8QQaoJF6gABihCiFOB8KPD1fnjkDYcLDNgw1YGmnHiCAsDkIyIWFJxzgs4Cq6gECiAlNEYQBlNu9e3cYkmosaYI26gECiAk5MTHCtO3ZsweuFIiAmjEtoJF6gABihAcsKFSR2AxI6lxdXTFzMo3UAwQQ9pIani+IBFRUDxBAjGhJjwE1AIFuJ1jQUVc9QAAxYg3bAaw6AAKIcbDV9gABNOhqe4AAGnQOAgigQecggACiQnuIVIDffIAAoqg9RJ5T8JsPEEDkt4fIcA0x5gMEEEYa8vRk2LYNogeujZqAkPkAAURme4i84CHGfIAAIrM9RJGD8JoPEEDkt4dIdhNx5gMEEPntIVIBkeYDBBD57SFyYo0I8wECiDrtITJCC5f5AAFEUXuIvIIRv/kAAUSF9hB1qw6AABp07SGAABp0tT1AAA06BwEE0KBzEEAADbrxIYAAGnTjQwABNOjGhwACaNCNDwEE0KAbHwIIoEE3PgQQQINufAgggAbd+BBAAA268SGAABp040MAATToxocAAmjQjQ8BBNCgaw8BBNCgq+0BAgwAnVoBjAo1LQ4AAAAASUVORK5CYII=";
        }
        
        framework.loading.push(1);
        this.stage.add(can.image({
            x : 10,
            y : 10,
            image : "junk",
            error : error,
            load : load}));
    }
});

new Test({
    title : "line test 1",
    description : "Test line object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.line({
            x : 10,
            y : 10,
            x2 : 90,
            y2 : 90,
            lineWidth : 3,
            style : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created line, but wrong color";
            return false;
        }

        return true;
    }
});

new Test({
    title : "line test 2",
    description : "Test line object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of line failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var line = can.line({
            x : 10,
            y : 10,
            x2 : 50,
            y2 : 50,
            style : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"});
        this.stage.add(line);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        line.width(line.width()*2);
        onChange("setting width works", "setting width doesn't work");

        line.height(line.height()*2);
        onChange("setting height works", "setting height doesn't work");

        line.lineWidth = line.lineWidth*2;
        onChange("changing lineWidth works", "changing lineWidth doesn't work");

        line.style = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing style works", "changing style doesn't work");

        return ret;
    }
});

new Test({
    title : "oval test 1",
    description : "Test oval object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.oval({
            x : 10,
            y : 10,
            width : 80,
            fill : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created oval, but wrong color";
            return false;
        }

        return true;
    }
});

new Test({
    title : "oval test 2",
    description : "Test oval object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of oval failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var oval = can.oval({
            x : 10,
            y : 10,
            height : 40,
            fill : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"});
        this.stage.add(oval);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        oval.width(oval.width()*2);
        onChange("setting width works", "setting width doesn't work");

        oval.height(oval.height()*2);
        onChange("setting height works", "setting height doesn't work");

        oval.fill = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing fill works", "changing fill doesn't work");

        oval.stroke = "rgb("+(c1.r)+","+c1.g+","+c1.b+")";
        onChange("changing stroke works", "changing stroke doesn't work");

        oval.lineWidth = oval.lineWidth*2;
        onChange("changing lineWidth works", "changing lineWidth doesn't work");

        return ret;
    }
});

new Test({
    title : "circle test 1",
    description : "Test circle object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.circle({
            x : 10,
            y : 10,
            radius : 40,
            fill : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created circle, but wrong color";
            return false;
        }

        return true;
    }
});

new Test({
    title : "arc test 1",
    description : "Test arc object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.arc({
            x : 10,
            y : 10,
            r : 40,
            fill : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created arc, but wrong color";
            return false;
        }

        return true;
    }
});

new Test({
    title : "arc test 2",
    description : "Test arc object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of arc failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var arc = can.arc({
            x : 10,
            y : 10,
            r : 20,
            fill : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"});
        this.stage.add(arc);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        arc.r *= 2;
        onChange("changing r works", "changing r doesn't work");

        arc.start = Math.PI/2;
        onChange("changing start works", "changing start doesn't work");

        arc.end = 3*Math.PI/2;
        onChange("changing end works", "changing end doesn't work");

        arc.fill = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing fill works", "changing fill doesn't work");

        arc.stroke = "rgb("+(c1.r)+","+c1.g+","+c1.b+")";
        onChange("changing stroke works", "changing stroke doesn't work");

        arc.lineWidth = arc.lineWidth*2;
        onChange("changing lineWidth works", "changing lineWidth doesn't work");

        return ret;
    }
});

new Test({
    title : "polygon test 1",
    description : "Test polygon object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.polygon({
            points: [
                {x : 10, y : 10},
                {x : 90, y : 10},
                {x : 90, y : 90},
                {x : 10, y : 90},
            ],
            stroke : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created polygon, but wrong color";
            this.info.push("this could be because the canvas insists on stroking between pixels for some reason, which can cause bluring of color");
            return false;
        }

        return true;
    }
});

new Test({
    title : "polygon test 2",
    description : "Test polygon object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of polygon failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var polygon = can.polygon({
            points: [
                {x : 10, y : 10},
                {x : 90, y : 10},
                {x : 90, y : 90},
                {x : 10, y : 90},
            ],
            stroke : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"});
        this.stage.add(polygon);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        polygon.points.push({x:40, y:40});
        onChange("adding a point works", "adding a point doesn't work");

        polygon.points.pop();
        onChange("removing a point works", "removing a point doesn't work");

        var swap = polygon.points[2];
        polygon.points[2] = polygon.points[3];
        polygon.points[3] = swap;
        onChange("swapping points works", "swapping points doesn't work");

        polygon.lineWidth = polygon.lineWidth*2;
        onChange("changing lineWidth works", "changing lineWidth doesn't work");

        polygon.stroke = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing stroke works", "changing stroke doesn't work");

        polygon.fill = "rgb("+(c1.r)+","+c1.g+","+c1.b+")";
        onChange("changing fill works", "changing fill doesn't work");

        return ret;
    }
});

/*    can.chain({points: [
            {x:10, y:10},
            {x:10, y:50},
            {x:50, y:50},
            {x:50, y:10},
            {x:20, y:10},], style:"rgb(150, 203, 217)"}).addTo(stage);

    can.chain({points: [
            {x:110, y:110},
            {x:110, y:150},
            {x:150, y:150},
            {x:150, y:110},
            {x:120, y:110},], style:"rgb(150, 203, 217)"}).addTo(stage);
*/
new Test({
    title : "chain test 1",
    description : "Test chain object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var color = randomColor();
        this.stage.add(can.chain({
            points: [
                {x : 10, y : 10},
                {x : 90, y : 10},
                {x : 90, y : 90},
                {x : 10, y : 90},
            ],
            style : "rgb("+(color.r)+","+color.g+","+color.b+")"}));
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], color)) {
            this.f = "Created chain, but wrong color";
            this.info.push("this could be because the canvas insists on stroking between pixels for some reason, which can cause bluring of color");
            return false;
        }

        return true;
    }
});

new Test({
    title : "chain test 2",
    description : "Test chain object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of polygon failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 100, height: 100});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var ret = true;
        var self = this;
        var chain = can.chain({
            points: [
                {x : 10, y : 10},
                {x : 90, y : 10},
                {x : 90, y : 90},
                {x : 10, y : 90},
            ],
            style : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"});
        this.stage.add(chain);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        chain.points.push({x:40, y:40});
        onChange("adding a point works", "adding a point doesn't work");

        chain.points.pop();
        onChange("removing a point works", "removing a point doesn't work");

        var swap = chain.points[2];
        chain.points[2] = chain.points[3];
        chain.points[3] = swap;
        onChange("swapping points works", "swapping points doesn't work");

        chain.lineWidth = chain.lineWidth*10;
        onChange("changing lineWidth works", "changing lineWidth doesn't work");

        chain.style = "rgb("+(c2.r)+","+c2.g+","+c2.b+")";
        onChange("changing style works", "changing style doesn't work");

        chain.miterLimit = 2;
        onChange("changing miterLimit works", "changing miterLimit doesn't work");

        chain.lineCap = "round";
        onChange("changing lineCap works", "changing lineCap doesn't work");

        chain.lineJoin = "round";
        onChange("changing lineJoin works", "changing lineJoin doesn't work");

        return ret;
    }
});


new Test({
    title : "graph test 1",
    description : "Test graph object creation",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "Canvas was not changed by draw.",
    setup : function () {
        this.stage = can.stage({width: 240, height: 240});
        this.snapshots.push(this.stage.getImageData());
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var c3 = randomColor();
        var c4 = randomColor();
        var c5 = randomColor();
        this.stage.add(can.graph({x:10, y:10, width:220, height:220,
            textx:"Time (s)", texty:"Acceleration (m/s/s)", stroke:"black", fill:"white", margin:40, maxx:4, maxy:4, minx:0, miny:0,
            data : [{points:[{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3}], color : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"},
                {points:[{x:1,y:3},{x:2,y:1},{x:3,y:2},{x:1,y:3}], color : "rgb("+(c2.r)+","+c2.g+","+c2.b+")"},
                {points:[{x:1,y:2},{x:2,y:3},{x:3,y:1}], color : "rgb("+(c3.r)+","+c3.g+","+c3.b+")"}],
            fill : "rgb("+(c4.r)+","+c4.g+","+c4.b+")",
            stroke : "rgb("+(c5.r)+","+c5.g+","+c5.b+")"}));

        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        if (equalImages(this.snapshots[0], this.snapshots[1])) {
            return false;
        }

        this.snapshots.push(
                difference(this.snapshots[0], this.snapshots[1]));

        if (!detectColor(this.snapshots[1], c1)) {
            this.f = "Created graph, but wrong color";
            return false;
        } else {
            this.info.push("color 1 found");
        }

        if (!detectColor(this.snapshots[1], c2)) {
            this.f = "Created graph, but wrong color";
            return false;
        } else {
            this.info.push("color 2 found");
        }

        if (!detectColor(this.snapshots[1], c3)) {
            this.f = "Created graph, but wrong color";
            return false;
        } else {
            this.info.push("color 3 found");
        }

        if (!detectColor(this.snapshots[1], c4)) {
            this.f = "Created graph, but wrong color";
            return false;
        } else {
            this.info.push("color 4 found");
        }

        if (!detectColor(this.snapshots[1], c5)) {
            this.f = "Created graph, but wrong color";
            return false;
        } else {
            this.info.push("color 5 found");
        }

        return true;
    }
});

new Test({
    title : "graph test 2",
    description : "Test graph object features",
    success : "Canvas was changed by draw event and colored correctly.",
    failure: "One or more features of graph failed to change as expected",
    setup : function () {
        this.stage = can.stage({width: 240, height: 240});
    },
    run : function () {
        var c1 = randomColor();
        var c2 = randomColor();
        var c3 = randomColor();
        var c4 = randomColor();
        var c5 = randomColor();
        var c6 = randomColor();
        var c7 = randomColor();
        var ret = true;
        var self = this;
        var graph = can.graph({x:10, y:10, width:110, height:110,
            textx:"Time (s)", texty:"Acceleration (m/s/s)", stroke:"black", fill:"white", margin:40, maxx:4, maxy:4, minx:0, miny:0,
            data : [{points:[{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3}], color : "rgb("+(c1.r)+","+c1.g+","+c1.b+")"},
                {points:[{x:1,y:3},{x:2,y:1},{x:3,y:2},{x:1,y:3}], color : "rgb("+(c2.r)+","+c2.g+","+c2.b+")"},
                {points:[{x:1,y:2},{x:2,y:3},{x:3,y:1}], color : "rgb("+(c3.r)+","+c3.g+","+c3.b+")"}],
            fill : "rgb("+(c4.r)+","+c4.g+","+c4.b+")",
            stroke : "rgb("+(c5.r)+","+c5.g+","+c5.b+")"});
        this.stage.add(graph);
        this.stage.draw();
        this.snapshots.push(this.stage.getImageData());

        function onChange(s, f) {
            self.stage.draw();
            self.snapshots.push(self.stage.getImageData());
            var l = self.snapshots.length;
            if (equalImages(self.snapshots[l-2], self.snapshots[l-1])) {
                self.info.push(f);
                ret = false;
            } else {
                self.info.push(s);
            }
        }
        
        graph.width(graph.width()*2);
        onChange("setting width works", "setting width doesn't work");

        graph.height(graph.height()*2);
        onChange("setting height works", "setting height doesn't work");

        graph.textx = "textx";
        onChange("changing textx works", "changing textx doesn't work");

        graph.texty = "texty";
        onChange("changing texty works", "changing texty doesn't work");

        graph.margin = graph.margin+10;
        onChange("changing margin works", "changing margin doesn't work");

        graph.fill = "rgb("+(c6.r)+","+c6.g+","+c6.b+")";
        onChange("changing fill works", "changing fill doesn't work");

        graph.stroke = "rgb("+(c7.r)+","+c7.g+","+c7.b+")";
        onChange("setting stroke works", "setting stroke doesn't work");

        return ret;
    }
});

