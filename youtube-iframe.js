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
        var urls, queryString;
        urls = url.split("?");
        if (urls.length >= 2) {
            queryString = Y.QueryString.parse(urls[1]);
            return queryString[key];
        }
    };

    _handleError = function (e) {
        var that = this;
        _log("_handleError() is executed");
        that.fire("error", {
            code: e.data,
            message: " error"
        });
        that._set("state", "error");
        that.get("container").removeChild(that.get("instance"));
        that._create();
    };
    _handlePlayerReady = function (e) {
        var that = this;
        _log("onPlayerReady() is executed");
        if (that.get("instance")) {
            //that.get("instance").playVideo();
            that._set("instance", e.target);
            that.fire("ready");
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
    _handlePlayerStateChange = function (e) {
        var that = this,
            state = e.target.getPlayerState();
        _log("onPlayerStateChange() is executed :" + state);
        if (state === YT.PlayerState.PLAYING) {
            that.fire("playing");         // fire play
            that._set("state", "playing");
           //that.get("instance").setPlaybackQuality("highres");
            that._set("resolution", that.get("instance").getPlaybackQuality());
            that._playTimer = Y.later(1000, that, that._poll, null);
            that._set("instance", e.target);
            if (document.getElementById("focusable-link")) {
                window.setTimeout(document.getElementById("focusable-link").focus(), 2000);
            }
            //console.log(that.get("instance").getPlaybackQuality());
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
     * @param {instance} config attribute instance
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
    YOUTUBE_IFRAME.YOUTUBE_URL    = "http://www.youtube.com/v/";
    YOUTUBE_IFRAME.YOUTUBE_URL_VERSION    = "?version=3";
    YOUTUBE_IFRAME.ATTRS = {
        /**
         * The container to place instance element.
         *
         * @attribute container
         * @type
         */
        "container": {
            value: null,
            writeOnce: true
        },
        /**
         * The instance element.
         *
         * @attribute instance
         * @type HTMLElement
         */
        "instance": {
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
         * The iframe instance is AutoPlay, reserve for develop.
         *
         * @attribute autoPlay
         * @type Boolean
         */
        "autoPlay" : {
            value: true,
            validator: Y.Lang.isBoolean
        },
        /**
         * The iframe instance is installed in browser.
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
         * The iframe input instance's position (current playing time in milli second) .
         *
         * @attribute position
         * @type Number
         */
        "position": {
            value: null,
            getter: function () {
                return this.get("instance").getCurrentTime();
            },
            setter: function (value) {
                this.get("instance").seekTo(value);
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
                return this.get("instance").getDuration();
            },
            readOnly: true
        },
        /**
        * the iframe input instance's volume .
        * @attribute volume
        * @type number
        */
        "volume": {
            value: 100,
            getter: function () {
                return this.get("instance").getVolume();
            },
            setter: function (value) {
                this.get("instance").setVolume(value);
            }
        },
        /**
         * The instance's size.
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
        },
         /**
         *
         *
         * @attribute resolution
         * @type string
         */
        "resolution": {
            value: "",
            validator: Y.Lang.isString,
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
                instance = that.get("instance"),
                state = instance.getPlayerState();
            if (state === YT.PlayerState.BUFFERING) {
                that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll);
            } else if (state ===  YT.PlayerState.ENDED) {
                _log("ended is executed.");
                if (that._playTimer) {
                    that._playTimer.cancel();
                    that._playTimer = null;
                }
                return;
            } else {
                that.fire("playing", {
                    duration: instance.getDuration() * 1000,
                    position: instance.getCurrentTime() * 1000
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
                ytPlayer,
                instance = that.get("instance") || null;
            if (!instance) {
                ytPlayer = new YT.Player(container, {
                    height: height,
                    width: width,
                    playerVars: { "controls": 0 },
                    videoId: _getParameter(that.get("url"), "v"),
                    events: {
                        "onReady": Y.bind(_handlePlayerReady, that),
                        "onStateChange": Y.bind(_handlePlayerStateChange, that),
                        "onError" : Y.bind(_handleError, that)
                    }
                });
                //console.log(ytPlayer.getCurrentTime());//.setPlaybackQuality("highres");
                that._set("instance", ytPlayer);
            }
        },
        play: function (url) {
            _log("play() is executed.");
            var that = this,
                instance = that.get("instance");
            url = url || that.get("url");
            if (!url) {
                _log("You must provide either url argument or url attribute.", "error");
            } else {
                that._set("url", url);
            }
            _log("play() - The video URL is " + url);
            if (instance) {
                instance.loadVideoByUrl(YOUTUBE_IFRAME.YOUTUBE_URL + _getParameter(url, "v") + YOUTUBE_IFRAME.YOUTUBE_URL_VERSION);
            }
            that._create();
        },
        stop: function () {
            _log("stop() is executed.");
            var that = this,
                instance = that.get("instance");
            instance.stopVideo();
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
                instance = that.get("instance");
            if (that._paused) {
                Y.log("pause() - The player has already been paused.", "warn", MODULE_ID);
                return;
            }
            instance.pauseVideo();
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
                instance = that.get("instance");
            if (!that._paused) {
                _log("resume() - The player isn't paused.");
                return;
            }
            instance.playVideo();
            that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll);
            that.fire("resume");
            that._set("state", "playing");
            that._paused = false;
        },
        mute: function () {
            _log("mute() is executed.");
            var that = this,
                instance = that.get("instance");
            if (that._paused) {
                Y.log("mute() - The player has already been mute.", "warn", MODULE_ID);
                return;
            }
            instance.mute();
            that._mute = true;
        },
        unmute: function () {
            _log("unmute() is executed.");
            var that = this,
                instance = that.get("instance");
            if (!instance.isMuted()) {
                _log("unmute() - The player isn't mute.");
                return;
            }
            instance.unMute();
            that._mute = false;
        },
        destructor: function () {
            _log("destructor() is executed.");
            var that = this,
                instance = that.get("instance");
            if (that.get("state") === "playing") {
                if (that._playTimer) {
                    that._playTimer.cancel();
                    that._playTimer = null;
                }
            }
            instance.destroy();
            instance = null;
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
