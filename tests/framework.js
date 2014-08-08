/******************************************************************************
 * testing
 *   startup
 *    - check that testing framework works
 *    - check that can exists and is structured in the expected way
 *
 *   run
 *    - tests should test one thing at a time
 *     For visual tests:
 *      - create stage and canvas for each test
 *      - save each change in graphics as a ImageData for comparison later
 *      - when not testing default color, randomize it and make sure the set color is used
 *     For Data tests:
 *      - save and convey the data checked and what it means
 * 
 *   finish
 *    - display failed tests on top
 *    - click on tests for more info
 *****************************************************************************/

function Test (config) {
    config = config||{};
    
    this.title = config.title||"";
    this.description = config.description||"";
    this.s = config.success||"";
    this.f = config.failure||"";
    
    if (config.setup instanceof Function)
        this._setup = config.setup;
    
    if (config.run instanceof Function)
        this._run = config.run;

    if (config.teardown instanceof Function)
        this._teardown = config.teardown;

    framework.tests.push(this);
}
Test.prototype = {
    "title" : "",
    "description" : "",
    "s" : "",
    "f" : "",

    "status" : "untouched",
    "untouched" : function () {
        return "This test has not been run";
    },
    "setup" : function () {
        return "This test has unexpectedly crashed on setup";
    },
    "running" : function () {
        return "This test has unexpectedly crashed on run";
    },
    "teardown" : function () {
        return "This test has unexpectedly crashed on teardown";
    },
    "success" : function () {
        return '<span style="color: green;">Success!</span> '
            + this.s;
    },
    "failure" : function () {
        return '<span style="color: red;">Failure!</span> '
            + this.f;
    },
    "error" : function () {
        return '<span style="color: red;">Error!</span>';
    },
    "display" : function () {
        var h2 = document.createElement("h2");
        h2.innerHTML = this.title;

        var p1 = document.createElement("p");
        p1.innerHTML = this.description;

        var p2 = document.createElement("p");
        p2.innerHTML = this[this.status]();

        var ul = document.createElement("ul");
        for (var i=0;i<this.info.length;i++) {
            var li = document.createElement("li");
            li.innerHTML = this.info[i];
            ul.appendChild(li);
        }

        var table = document.createElement("table");
        table.setAttribute("class", "snapshots");
        var tr = document.createElement("tr");
        var columns = 3; // number of td tags per row
        for (var i=0;i<this.snapshots.length;i++) {
            var td = document.createElement("td");
            var canvas = document.createElement("canvas");
            canvas.width = this.snapshots[i].width;
            canvas.height = this.snapshots[i].height;
            canvas.getContext("2d").putImageData(this.snapshots[i], 0, 0);
            td.appendChild(canvas);
            tr.appendChild(td);
            if (i%columns == columns-1 || i==this.snapshots.length-1) {
                table.appendChild(tr);
                tr = document.createElement("tr");
            }
        }

        var div = document.createElement("div");
        div.appendChild(table);
        div.appendChild(h2);
        div.appendChild(p1);
        div.appendChild(p2);
        div.appendChild(ul);
        return div;
    },

    setup : function () {
        this.status = "setup";
        this.info = [];
        this.snapshots = [];
        this._setup();
    },
    _setup : function () {},

    run : function () {
        this.status = "running";
        //try {
            if (this._run()) {
                this.status = "success";
            } else {
                this.status = "failure";
            }
        /*} catch (e) {
            this.status = "error";
            this.info.push("runtime error: "+JSON.stringify(e));
        }*/
    },
    _run : function () {return false;},

    teardown : function () {
        var s = this.status;
        this.status = "teardown";
        this._teardown();
        this.status = s;
    },
    _teardown : function () {},
}


// checks if two ImageData objects are the same
// tolerance says how many unmatched pixels are allowed
var equalImages = function (a, b, tolerance) {
    if (typeof tolerance != "number")
        tolerance = 0;
    if (a.data.length != b.data.length)
        return false;
    var i = a.data.length;
    while (i) {
        i-=4;
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

var detectColor = function (a, color) {
    var i = a.data.length;
    while (i) {
        i-=4;
        if (a.data[i] == color.r
        && a.data[i+1] == color.g
        && a.data[i+2] == color.b)
            return true;
    }
    return false;
}


// takes two ImageData objects of equal pixel count
// returns a new ImageData object with red marking diff of two given
var difference = function (a, b) {
    var diff = document.createElement("canvas").getContext("2d").createImageData(a.width, a.height);
    if (a.data.length != b.data.length)
        return false;
    var i = a.data.length;
    while (i) {
        i-=4;
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

function randomColor () {
    /*var range = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F",];
    var color = "#";
    for (var i=0;i<6;i++)
        color += range[Math.floor(Math.random()*range.length)];
    return color;*/
    return {
        r:Math.floor(Math.random()*256),
        g:Math.floor(Math.random()*256),
        b:Math.floor(Math.random()*256)};
}

var framework = {
    tests : [],
    inits : [],
    loading : [],
    initiated : false,

    testAll : function () {
        this.startup();
        if (this.initiated) {
            this.run();
            this.finish();
        }
    },
    
    startup : function () {
        for (var i=0;i<this.inits.length;i++) {
            var t = this.inits[i];
            //try {
                t.setup();
                t.run();
                t.teardown();
            /*} catch (e) {
                t.info.push("startup error:"+JSON.stringify(e));
            }*/
        }
        if(this.inits[0].status == "failure"
        && this.inits[1].status == "success"
        && this.inits[2].status == "success"
        && this.inits[3].status == "success") {
            this.initiated = true;
        } else {
            this.initiated = false;
            this.tests = this.inits;
            this.buildList();
            var div = document.createElement("div");
            div.innerHTML = "Test interupted, startup tests failed!";
            div.style.color = "red";
            document.getElementsByTagName("body")[0].appendChild(div);
        }

    },

    run : function () {
        for (var i=0;i<this.tests.length;i++) {
            var t = this.tests[i];
            //try {
                t.setup();
                t.run();
                t.teardown();
            /*} catch (e) {
                t.info.push("test error:"+JSON.stringify(e));
            }*/
        }
    },

    finish : function () {
        if (this.loading.length == 0) {
            this.buildList();
            if (this.timeout) {
                clearTimeout(this.timeout);
                delete this.timeout;
            }
        } else {
            var body = document.getElementsByTagName("body")[0];
            body.innerHTML = "<b>Building....</b>";
            var self = this;
            this.timeout = setTimeout(function () {
                self.buildList();
                delete self.timeout;
            }, 1000);
        }
    },

    buildList : function () {
        var body = document.getElementsByTagName("body")[0];
        body.innerHTML = "";
        var table = document.createElement("table");
        var tr = document.createElement("tr");
        var td = document.createElement("th");
        td.innerHTML = "Test";
        tr.appendChild(td);

        td = document.createElement("th");
        td.innerHTML = "Description";
        tr.appendChild(td);

        td = document.createElement("th");
        td.innerHTML = "Status";
        tr.appendChild(td);
        table.appendChild(tr);

        var self = this;
        for (var i=0;i<this.tests.length;i++) {
            var t = this.tests[i];
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var button = document.createElement("button");
            button.innerHTML = t.title;
            button.index = i;
            button.onclick = function () {self.show(this.index);};
            td.appendChild(button);
            tr.appendChild(td);

            td = document.createElement("td");
            td.innerHTML = t.description;
            tr.appendChild(td);

            td = document.createElement("td");
            td.innerHTML = t[t.status]();
            tr.appendChild(td);
            table.appendChild(tr);
        }
        body.appendChild(table);
    },

    show : function (index) {
        var body = document.getElementsByTagName("body")[0];
        body.innerHTML = ""
        body.appendChild(this.tests[index].display());

        var button = document.createElement("button");
        button.innerHTML = "Back to List";
        var self = this;
        button.onclick = function () {self.buildList();};
        body.appendChild(button);
    },
};

// stop backspace from sending browser to previous page
// function to possibly override keypress
// taken from http://jimblackler.net/BackspaceTrap.htm
trapfunction = function(event) {
    var keynum;
    if (window.event) { // eg. IE
        keynum = window.event.keyCode;
    } else if (event.which) { // eg. Firefox
        keynum = event.which;
    }

    if (keynum == 8) { // backspace has code 8
        // thing to do instead of changing page
        framework.buildList(); 
        return false;
        // nullifies the backspace
    }
    return true;
}
document.onkeydown = trapfunction; // IE, Firefox, Safari
document.onkeypress = trapfunction; // only Opera needs the backspace nullifying in onkeypress

window.addEventListener('load', function () {
    framework.testAll();
}, false);
