/*global window, YUI, YT, document */
/**
 * A util for control youtube iframe API.
 *
 * @module youtube-iframe
 * @requires node ,base
 */
YUI.add("youtube-iframe", function (Y) {

    var MODULE_ID = "youtube-iframe",
        _getParameter,
        _log;

    _log = function (message, type, module) {
        type = type || "info";
        module = module || MODULE_ID;
        Y.log(message, type, module);
    };
    _getParameter = function (url, key) {
        _log("_getParameter() is executed.");
        var urls, queryString;
        urls = url.split("?");
        if (urls.length >= 2) {
            queryString = Y.QueryString.parse(urls[1]);
            return queryString[key];
        }
    };
    /**
     * An utility for youtube iframe API control.
     * The following is sample usage.
     *
     *     var vlc = new Y.YoutubeIframe({
     *         container: "#foo"
     *         url: "http://www.youtube.com/watch?v=uA378g_gD1I",
     *     });
     *
     * @constructor
     * @class YoutubeIframe
     * @param {instance} config attribute instance
     */
    function YoutubeIframe() {
        YoutubeIframe.superclass.constructor.apply(this, arguments);
    }
    /**
     * The status code for youtube iframe API control.
     *
     * @property STATE
     */
    YoutubeIframe.STATE = [
        "initializing",
        "ready",
        "idle",
        "buffering",
        "playing",
        "paused",
        "stopped",
        "ended",
        "error"
    ];
    YoutubeIframe.DEFAULT_WIDTH  = "1280px";
    YoutubeIframe.DEFAULT_HEIGHT = "700px";
    YoutubeIframe.CHECK_RETRY    = 3;
    YoutubeIframe.CHECK_INTERVAL = 1000;
    YoutubeIframe.POLL_INTERVAL  = 1000;
    YoutubeIframe.INSTALLED      = true;
    YoutubeIframe.YOUTUBE_URL    = "http://www.youtube.com/v/{vid}?version=3";
    YoutubeIframe.ATTRS = {
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
            value: null,
            readOnly: true
        },
        /**
         * The video URL.
         *
         * @attribute url
         * @type String
         */
        "url" : {
            value : null,
            writeOnce: true
        },
        /**
         * The player's current state.
         *
         * @attribute state
         * @type String
         */
        "state" : {
            value: "initializing",
            readOnly: true
        },
        /**
         * The iframe instance is AutoPlay, reserve for develop.
         *
         * @attribute autoPlay
         * @type Boolean
         */
        "autoPlay" : {
            value: false,
            validator: Y.Lang.isBoolean
        },
         /**
         * The iframe instance hasControl, reserve for develop.
         *
         * @attribute hasControl
         * @type Boolean
         */
        "hasControl" : {
            value: true,
            validator: Y.Lang.isBoolean
        },
        /**
         * The iframe instance is installed in browser.
         * For extension, not yet impelement.
         * @attribute installed
         * @type Boolean
         */
        "installed": {
            value: null,
            getter: function () {
                return YoutubeIframe.INSTALLED;
            }
        },
        /**
         * The iframe input instance's position (current playing time in milli second) .
         *
         * @attribute position
         * @type Number
         */
        "position": {
            value: 0,
            getter: function () {
                if (this.get("instance") && this.get("instance").getCurrentTime()) {
                    return this.get("instance").getCurrentTime();
                }
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
                if (this.get("instance") && this.get("instance").getDuration()) {
                    return this.get("instance").getDuration();
                } else {
                    return null;
                }
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
                if (this.get("instance") && this.get("instance").getVolume()) {
                    return this.get("instance").getVolume();
                } else {
                    return null;
                }
            }
        },
        /**
         * The instance's size.
         *
         * @attribute size
         * @type Array
         */
        "size": {
            value: [YoutubeIframe.DEFAULT_WIDTH, YoutubeIframe.DEFAULT_HEIGHT],
            validator: Y.Lang.isArray
        },
        /**
         *
         * For extension. 
         * @attribute mode
         * @type integer
         */
        "mode": {
            value: 0,
            validator: Y.Lang.isInteger,
            setter: function (value) {
                return value;
            }
        },
         /**
         *
         * small, medium, large , hd720, hd1080, highres, default
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

    Y.extend(YoutubeIframe, Y.Base, {
        _mute       : false,
        _paused     : false,
        _playTimer  : null,
        _poll: function () {
            _log("_poll() is executed.");
            var that = this,
                instance = that.get("instance"),
                state = instance.getPlayerState();
            switch (state) {
            case YT.PlayerState.PLAYING:
                that.fire("playing", {
                    duration: instance.getDuration() * 1000,
                    position: instance.getCurrentTime() * 1000
                });
                that._playTimer = Y.later(YoutubeIframe.POLL_INTERVAL, that, that._poll);
                break;
            case YT.PlayerState.ENDED:
                _log("ended is executed.");
                if (that._playTimer) {
                    that._playTimer.cancel();
                    that._playTimer = null;
                }
                return;
            case YT.PlayerState.BUFFERING:
                that._playTimer = Y.later(YoutubeIframe.POLL_INTERVAL, that, that._poll);
                break;
            case YT.PlayerState.PAUSED:
                if (that._playTimer) {
                    that._playTimer.cancel();
                    that._playTimer = null;
                }
                break;
            }
        },

         /**
        *   2  The request contains an invalid parameter value.
        *   5  The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.
        *   100  The video requested was not found. 
        *   101  The owner of the requested video does not allow it to be played in embedded players.
        *   150  This error is the same as 101. It's just a 101 error in disguise!
        */
        _handleError : function (e) {
            var that = this;
            _log("_handleError() is executed");
            that.fire("error", {
                code: e.data,
                message: " error"
            });
            that._set("state", "error");
            that.get("container").removeChild(that.get("instance"));
        },
        _handlePlayerReady : function (e) {
            var that = this;
            _log("_handlePlayerReady() is executed");
            if (that.get("instance")) {
                that._set("state", "ready");
                that._set("instance", e.target);
                that.fire("ready");
                if (that.get("autoPlay")) {
                    e.target.playVideo();
                }
                if (that.get("position") !== 0) {
                    e.target.seekTo(that.get("position"));
                }
            }
        },
        /**
        *   youtube player states
        *   -1 (unstarted)
        *   0 (ended)
        *   1 (playing)
        *   2 (paused)
        *   3 (buffering)
        *   5 (video cued).
        */
        _handlePlayerStateChange : function (e) {
            var that = this,
                state = e.target.getPlayerState();
            _log("onPlayerStateChange() is executed :" + state);
            switch (state) {
            case YT.PlayerState.PLAYING:
                that._set("state", "playing");
                that._set("resolution", that.get("instance").getPlaybackQuality());
                that._set("instance", e.target);
                that._playTimer = Y.later(1000, that, that._poll, null);
                that.fire("stateChange", {"newVal": "playing"});         // fire play
                break;
            case YT.PlayerState.ENDED:
                that._set("state", "ended");
                that.fire("stateChange", {"prevVal": "playing", "newVal": "ended"});           // fire ended
                break;
            case YT.PlayerState.BUFFERING:
                that._set("state", "buffering");
                that.fire("stateChange", {"prevVal": "initializing", "newVal": "buffering"});           // fire ended
                break;
            case YT.PlayerState.PAUSED:
                that._set("state", "paused");
                that.fire("stateChange", {"prevVal": "playing", "newVal": "paused"});           // fire ended
                break;
            }
        },
        _defPositionFn : function (e) {
            _log("_defPositionFn() is executed");
            this.get("instance").seekTo(e.newVal);
        },
        _defResolutionFn : function (e) {
            _log("_defResolutionFn() is executed");
            this.get("instance").setPlaybackQuality(e.newVal);
        },
        _defVolumeFn : function (e) {
            _log("_defVolumeFn() is executed");
            this.get("instance").setVolume(e.newVal);
        },
        initializer : function (config) {
            _log("initializer() is executed");
            var that = this,
                url,
                hasControl,
                position,
                container;

            config = config || {};
            container = config.container || "body";
            position = config.position || 0;
            that._set("position", position);
            container = Y.one(container);
            that._set("container", container);
            url = config.url || null;
            that._set("url", url);
            if (config.size) {
                that._set("size", config.size);
            }
            that.on("resolutionChange", that._defResolutionFn);
            that.on("volumeChange", that._defVolumeFn);
            that._set("hasControl", config.hasControl || false);
            that.publish("error", {
                emitFacade: true
            });
            that.publish("play", {
                emitFacade: true
            });
            that.publish("playing", {
                emitFacade: true
            });
            if (url) {
                that._create();
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
                nodeId,
                instance = that.get("instance") || null;

            if (!container.hasAttribute("id")) {
                container.setAttribute("id", Y.guid());
                nodeId =  Y.guid();
            } else {
                nodeId = container.getAttribute("id");
            }
            if (!instance) {
                ytPlayer = new YT.Player(nodeId, {
                    height: height,
                    width: width,
                    playerVars: { "controls": Number(that.get("hasControl")) },
                    videoId: _getParameter(that.get("url"), "v"),
                    events: {
                        "onReady": Y.bind(that._handlePlayerReady, that),
                        "onStateChange": Y.bind(that._handlePlayerStateChange, that),
                        "onError" : Y.bind(that._handleError, that)
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
            if (instance && instance.loadVideoByUrl) {
                instance.loadVideoByUrl(Y.Lang.sub(YoutubeIframe.YOUTUBE_URL, {vid: _getParameter(url, "v")}));
            } else {
                that._create();
            }
        },
        stop: function () {
            _log("stop() is executed.");
            var that = this,
                instance = that.get("instance");
            if (that.get("state") !== "playing") {
                return;
            }
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
            that._playTimer = Y.later(YoutubeIframe.POLL_INTERVAL, that, that._poll);
            that.fire("resume");
            that._set("state", "playing");
            that._paused = false;
        },
        mute: function () {
            _log("mute() is executed.");
            var that = this,
                instance = that.get("instance");
            if (instance.isMuted() || that._paused) {
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
    Y.YoutubeIframe = YoutubeIframe;
}, "0.0.1", {
    "group"    : "mui",
    "js"       : "youtube-iframe/youtube-iframe.js",
    "requires" : [
        "base",
        "node",
        "querystring",
        "oop"
    ]
});
