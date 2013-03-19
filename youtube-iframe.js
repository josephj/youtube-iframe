/*global window, YUI, YT, document */
/**
 * A util for control youtube iframe API.
 *
 * @module youtube-iframe
 * @requires node ,base
 */
YUI.add("youtube-iframe", function (Y) {

    var MODULE_ID = "Y.YOUTUBE_IFRAME",
        _getParameter,
        _handleError,
        _handlePlayerReady,
        _handlePlayerStateChange,
        _log;

    _log = function (message, type, module) {
        type = type || "info";
        module = module || MODULE_ID;
        Y.log(message, type, module);
    };
    _getParameter = function (url, key) {
        _log("get vid is executed.");
        try {
            var urls, queryString;
            urls = url.split("?");
            if (urls.length >= 2) {
                queryString = Y.QueryString.parse(urls[1]);
                return queryString[key];
            }
        } catch (err) {
            _log("video-parse error occur " + err.message);
            Y.fire("video-parser:error");
        }
    };

    _handleError = function (event) {
        var that = this;
        _log("_handleError() is executed");
        that.fire("error", {
            code: event.data,
            message: " error"
        });
        that._set("state", "error");
        that.get("container").removeChild(that.get("object"));
        that._create();
    };
    _handlePlayerReady = function (event) {
        var that = this;
        _log("onPlayerReady() is executed");
        if (that.get("object")) {
            that.get("object").playVideo();
            that._set("object", event.target);
        }
    };
        /**
        *   youtube player states
        *   -1 (unstarted)
        *   0 (ended)
        *   1 (playing)
        *   2 (paused)
        *   3 (buffering)
        *   5 (video cued).
        */
    _handlePlayerStateChange = function (event) {
        var that = this,
            state = event.target.getPlayerState();
        _log("onPlayerStateChange() is executed :" + state);
        if (state === YT.PlayerState.PLAYING) {
            that.fire("playing");         // fire play
            that._set("state", "playing");
            that.get("object").setPlaybackQuality("highres");
            that._set("object", event.target);
            //console.log(that.get("object").getPlaybackQuality());
        } else if (state === YT.PlayerState.ENDED) {
            that.fire("ended");           // fire ended
            that._set("state", "ended");
        } else if (state === YT.PlayerState.BUFFERING) {
            that.fire("buffering");           // fire buffering
            that._set("state", "buffering");
        }
    };

    /**
     * An utility for youtube iframe API control.
     * The following is sample usage.
     *
     *     var vlc = new Y.YOUTUBE_IFRAME({
     *         container: "#foo"
     *         url: "http://dl.dropbox.com/u/10258402/GokKUqLcvD8.mp4",
     *     });
     *
     * @constructor
     * @class YOUTUBE_IFRAME
     * @param {Object} config attribute object
     */
    function YOUTUBE_IFRAME() {
        YOUTUBE_IFRAME.superclass.constructor.apply(this, arguments);
    }
    /**
     * The status code for youtube iframe API control.
     *
     * @property STATE
     */
    YOUTUBE_IFRAME.STATE = [
        "idle",
        "opening",
        "buffering",
        "playing",
        "paused",
        "stopped",
        "ended",
        "error"
    ];
    YOUTUBE_IFRAME.DEFAULT_WIDTH  = "1280px";
    YOUTUBE_IFRAME.DEFAULT_HEIGHT = "700px";
    YOUTUBE_IFRAME.CHECK_RETRY    = 3;
    YOUTUBE_IFRAME.CHECK_INTERVAL = 1000;
    YOUTUBE_IFRAME.POLL_INTERVAL  = 1000;
    YOUTUBE_IFRAME.INSTALLED      = true;
    YOUTUBE_IFRAME.ATTRS = {
        /**
         * The container to place object element.
         *
         * @attribute container
         * @type
         */
        "container": {
            value: null,
            writeOnce: true
        },
        /**
         * The object element.
         *
         * @attribute object
         * @type HTMLElement
         */
        "object": {
            value: null
        },
        /**
         * The video URL.
         *
         * @attribute url
         * @type String
         */
        "url" : {
            value : null
        },
        /**
         * The player's current state.
         *
         * @attribute state
         * @type String
         */
        "state" : {
            value: "idle",
            readOnly: true
        },
        /**
         * The iframe object is AutoPlay, reserve for develop.
         *
         * @attribute autoPlay
         * @type Boolean
         */
        "autoPlay" : {
            value: true,
            validator: Y.Lang.isBoolean
        },
        /**
         * The iframe object is installed in browser.
         *
         * @attribute installed
         * @type Boolean
         */
        "installed": {
            value: null,
            getter: function () {
                return YOUTUBE_IFRAME.INSTALLED;
            }
        },
        /**
         * The iframe input object's position (current playing time in milli second) .
         *
         * @attribute position
         * @type Number
         */
        "position": {
            value: null,
            getter: function () {
                return this.get("object").getCurrentTime();
            },
            setter: function (value) {
                this.get("object").seekTo(value);
                return value;
            },
            validator: Y.Lang.isNumber
        },
        /**
         * The video's total time in millionsecond.
         *
         * @attribute duration
         * @type Number
         */
        "duration": {
            value: null,
            getter: function () {
                return this.get("object").getDuration();
            },
            readOnly: true
        },
        /**
        * the iframe input object's volume .
        * @attribute volume
        * @type number
        */
        "volume": {
            value: 100,
            getter: function () {
                return this.get("object").getVolume();
            },
            setter: function (value) {
                this.get("object").setVolume(value);
            }
        },
        /**
         * The object's size.
         *
         * @attribute size
         * @type Array
         */
        "size": {
            value: [YOUTUBE_IFRAME.DEFAULT_WIDTH, YOUTUBE_IFRAME.DEFAULT_HEIGHT],
            validator: Y.Lang.isArray
        },
        /**
         *
         *
         * @attribute mode
         * @type boolean
         */
        "fullscreen": {
            value: false,
            validator: Y.Lang.isBoolean,
            setter: function (value) {
                return value;
            }
        }
    };

    Y.extend(YOUTUBE_IFRAME, Y.Base, {
        _mute       : false,
        _paused     : false,
        _playTimer  : null,
        _poll: function () {
            _log("_poll() is executed.");
            var that = this,
                object = that.get("object");
            if (object.get("state") === "buffering") {
                that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll);
            } else if (object.get("state") === "ended") {
                _log("ended is executed.");
                if (that._playTimer) {
                    that._playTimer.cancel();
                    that._playTimer = null;
                }
                return;
            } else {
                that.fire("playing", {
                    duration: object.getDuration(),
                    position: object.getCurrentTime()
                });
                that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll);
            }
        },
        _defPlayFn: function () {
            _log("_defPlayFn() is executed");
            var that = this;
            that.fire("ready");
            that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll, null);
        },
        initializer : function (config) {
            _log("initializer() is executed");
            var that = this,
                url,
                container;

            config = config || {};

            // Set container.
            container = config.container || "body";
            //container = Y.one(container);
            that._set("container", container);

            // Set Video URL.
            url = config.url || null;
            that._set("url", url);

            that.publish("error", {
                emitFacade: true
            });

            that.publish("play", {
                emitFacade: true,
                defaultFn: that._defPlayFn
            });

            that.publish("playing", {
                emitFacade: true
            });

            if (that.get("autoPlay")) {
                that.play();
            }
        },
        _create: function () {
            _log("_create() is executed.");
            var that = this,
                container = that.get("container"),
                size = that.get("size"),
                width = size[0],
                height = size[1],
                id = Y.guid(),
                node,
                ytPlayer,
                object = that.get("object") || null;
            if (!object) {
                ytPlayer = new YT.Player(container, {
                    height: height,
                    width: width,
                    videoId: _getParameter(that.get("url"), "v"),
                    events: {
                        "onReady": Y.bind(_handlePlayerReady, that),
                        "onStateChange": Y.bind(_handlePlayerStateChange, that),
                        "onError" : Y.bind(_handleError, that)
                    }
                });
                //console.log(ytPlayer.getCurrentTime());//.setPlaybackQuality("highres");
                that._set("object", ytPlayer);
            }
        },
        play: function (url) {
            _log("play() is executed.");
            var that = this,
                object = that.get("object");
            url = url || that.get("url");
            if (!url) {
                _log("You must provide either url argument or url attribute.", "error");
            } else {
                that._set("url", url);
            }
            _log("play() - The video URL is " + url);
            if (object) {
                object.loadVideoByUrl("http://www.youtube.com/v/" + _getParameter(url, "v") + "?version=3");
            }
            that._create();
        },
        stop: function () {
            _log("stop() is executed.");
            var that = this,
                object = that.get("object");
            object.stopVideo();
            if (that._playTimer) {
                that._playTimer.cancel();
                that._playTimer = null;
            }
            that._set("state", "stopped");
            that.fire("stop");
        },
        pause: function () {
            _log("pause() is executed.");
            var that = this,
                object = that.get("object");
            if (that._paused) {
                Y.log("pause() - The player has already been paused.", "warn", MODULE_ID);
                return;
            }
            object.pauseVideo();
            if (that._playTimer) {
                that._playTimer.cancel();
                that._playTimer = null;
            }
            that._paused = true;
            that._set("state", "paused");
            that.fire("pause");
        },
        resume: function () {
            _log("resume() is executed.");
            var that = this,
                object = that.get("object");
            if (!that._paused) {
                _log("resume() - The player isn't paused.");
                return;
            }
            object.playVideo();
            that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll);
            that.fire("resume");
            that._set("state", "playing");
            that._paused = false;
        },
        mute: function () {
            _log("mute() is executed.");
            var that = this,
                object = that.get("object");
            if (that._paused) {
                Y.log("mute() - The player has already been mute.", "warn", MODULE_ID);
                return;
            }
            object.mute();
            that._mute = true;
        },
        unmute: function () {
            _log("unmute() is executed.");
            var that = this,
                object = that.get("object");
            if (!object.isMuted()) {
                _log("unmute() - The player isn't mute.");
                return;
            }
            object.unMute();
            that._mute = false;
        },
        destructor: function () {
            _log("destructor() is executed.");
            var that = this,
                object = that.get("object");
            if (that.get("state") === "playing") {
                object.destroy();
                if (that._playTimer) {
                    that._playTimer.cancel();
                    that._playTimer = null;
                }
            }
            object.parentNode.removeChild(object);
            object = null;
        }
    });
    Y.YOUTUBE_IFRAME = YOUTUBE_IFRAME;
}, "0.0.1", {
    "group"    : "mui",
    "js"       : "youtube-iframe/youtube-iframe.js",
    "requires" : [
        "base",
        "node",
        "substitute",
        "querystring",
        "oop"
    ]
});
