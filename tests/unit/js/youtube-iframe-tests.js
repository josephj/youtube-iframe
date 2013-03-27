/*global window, YUI, YT, document */
YUI.add("youtube-iframe-tests", function (Y) {

    var Assert = Y.Assert,
        suite = new Y.Test.Suite("youtube-iframe"),
        _player,
        createPlayer;

    createPlayer = function (o) {
        o = o || {};
        var attrs = {
            "container": "#container",
            "autoPlay": true,
            "url": "http://www.youtube.com/watch?v=faVCwOesYl8"
        };
        return new Y.YoutubeIframe(Y.merge(attrs, o));
    };

    _player = new Y.YoutubeIframe({
        "container": "#container2",
        "autoPlay": true,
        "url": "https://www.youtube.com/watch?v=pg1lpgdTRuo",
        "size": ["400px", "300px"]
    });

    suite.add(new Y.Test.Case({
        name: "Y.YoutubeIframe",
        //======================
        // Setup and tear down
        //======================
        setUp: function () {
            this.player = null;
        },
        tearDown: function () {
            if (this.player) {
                this.player.destroy();
            }
        },
        //======================
        // Tests
        //======================
        "instance should be rendered without url attribute": function () {
            this.player = new Y.YoutubeIframe({
                "container": "#container"
            });

            Assert.isTrue(this.player instanceof Y.YoutubeIframe);
        },
        "instance should be rendered without autoPlay attribute": function () {
            this.player = new Y.YoutubeIframe({
                "container": "#container",
                "url": "http://www.youtube.com/watch?v=faVCwOesYl8"
            });
            Assert.isTrue(this.player instanceof Y.YoutubeIframe);
        },
        "instance should be an YT.Player instance": function () {
            this.player = new Y.YoutubeIframe({
                "container": "#container",
                "size": ["100px", "100px"],
                "url": "http://www.youtube.com/watch?v=faVCwOesYl8"
            });
            Assert.isTrue(this.player.get("instance") instanceof YT.Player);
        },
        "container should be converted to iframe": function () {
            this.player = new Y.YoutubeIframe({
                "container": "#container",
                "size": ["100px", "100px"],
                "url": "http://www.youtube.com/watch?v=faVCwOesYl8"
            });
            Assert.isTrue(Y.one("#container").get("nodeName").toLowerCase() === "iframe");
        },
        "duration should be readOnly": function () {
            var that = this;
            that.player = createPlayer();
            that.player.on("playing", function () {
                that.resume(function () {
                    var notExpected = 3000,
                        beforeValue,
                        afterValue;
                    beforeValue = that.player.get("duration");
                    that.player.set("duration", notExpected);
                    afterValue = that.player.get("duration");
                    Assert.isNumber(afterValue);
                    Assert.areEqual(beforeValue, afterValue);
                });
            });
            that.wait();
        },
        "duration should not equal to zero after state changes to 'playing'": function () {
            Assert.isTrue(_player.get("duration") > 0);
        },
        "ready event should be triggered after initialization": function () {
            this.player = createPlayer();
            this.player.on("ready", function () {
                this.resume();
                Assert.pass();
            }, this);
            this.wait();
        },
        "mode should always be 0": function () {
            this.player = createPlayer();
            Assert.areEqual(0, this.player.get("mode"));
        },
        "position could be configured at initialization": function () {
            var that = this,
                expected = 3;
            that.player = createPlayer({
                "container": "#container",
                "autoPlay": true,
                "position": expected,
                "url": "http://www.youtube.com/watch?v=faVCwOesYl8"
            });
            that.player.on("playing", function () {
                this.resume(function () {
                    Assert.areEqual(expected, that.player.get("position"));
                });
            }, that);
            that.wait();
        },
        "position should be updated by setting position attribute": function () {
            var expected = 1000;
            _player.set("position", expected);
            Assert.areEqual(expected, _player.get("position"));
        },
        "position should not equal to zero after playing for 3 secs": function () {
            this.player = createPlayer({"autoPlay": false});
            this.player.on("ready", function () {
                this.resume();
                this.wait(function () {
                    Assert.areNotEqual(0, this.player.get("position"));
                }, 3000);
            }, this);
            this.wait(1000);
        },
        "size of container should be equal to size attribute": function () {
            var width,
                height,
                node;

            this.player = new Y.YoutubeIframe({
                "container": "#container",
                "size": ["100px", "100px"],
                "url": "http://www.youtube.com/watch?v=faVCwOesYl8"
            });
            node = Y.one("#container");
            width = node.get("offsetWidth") + "px";
            height = node.get("offsetHeight") + "px";
            Assert.areEqual("100px,100px", width + "," + height);
        },
        "state should be 'initializing' at the beginning": function () {
            this.player = createPlayer();
            Assert.areEqual("initializing", this.player.get("state"));
        },
        "state should be 'ready' immediately after player is ready": function () {
            var that = this;
            that.player = new Y.YoutubeIframe({
                "container": "#container",
                "autoPlay": true,
                "url": "http://www.youtube.com/watch?v=faVCwOesYl8"
            });
            that.player.on("ready", function () {
                that.resume(function () {
                    Assert.areEqual("ready", that.player.get("state"));
                });
            });
            that.wait();
        },
        "state should be 'paused' after pause method executes": function () {
            var that = this;
            _player.pause();
            Assert.areEqual("paused", _player.get("state"));
        },
        "state should be 'playing' after play method executes after paused": function () {
            var that = this;
            _player.resume();
            Assert.areEqual("playing", _player.get("state"));
        },
        "state should be 'stopped' after stop method executes": function () {
            var that = this;
            _player.stop();
            Assert.areEqual("stopped", _player.get("state"));
        },
        "state should be 'play' after play executes after stop": function () {
            _player.play();
            Assert.areEqual("play", _player.get("state"));
        },
        "url should be updated after play method executes": function () {
            var expected = "http://www.youtube.com/watch?v=u1zgFlCw8Aw";
            _player.play(expected);
            Assert.areEqual(expected, _player.get("url"));
        }
    }));

    Y.Test.Runner.add(suite);

}, "@VERSION", {
    "requires": [
        "youtube-iframe",
        "test"
    ]
});
