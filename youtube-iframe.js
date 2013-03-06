/*global window, YUI, document */
/**
 * A util for control youtube iframe API.
 *
 * @module youtube-iframe
 * @requires node ,base
 */
YUI.add("youtube-iframe", function (Y) {

    var MODULE_ID = "Y.YOUTUBE_IFRAME",
        _log;

    _log = function (message, type, module) {
        type = type || "info";
        module = module || MODULE_ID;
        Y.log(message, type, module);
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
    YOUTUBE_IFRAME.TYPE        = "application/x-vlc-plugin";
    YOUTUBE_IFRAME.VERSION     = "VideoLAN.VLCPlugin.2";
    YOUTUBE_IFRAME.CLASS_ID    = "clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921";
    YOUTUBE_IFRAME.PLUGIN_PAGE = "http://www.videolan.org";
    YOUTUBE_IFRAME.TEMPLATE = [
        '<object ',
        '    id="{id}" width="{width}" height="{height}" {type} >',
        '    <param name="autoplay" value="no">',
        '    <param name="autostart" value="no">',
        '    <param name="bgcolor" value="#000000">',
        '    <param name="toolbar" value="false">',
        '    <param name="src" value="">',
        '    <param name="wmode" value="window">',
        '</object>'
    ].join("");
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
                return this.get("object").input.time;
            },
            setter: function (value) {
                this.get("object").input.time = value;
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
                return this.get("object").input.length;
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
                return this.get("object").audio.volume;
            },
            setter: function (value) {
                this.get("object").audio.volume = value;
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
                this.get("object").video.fullscreen = value;
                return value;
            }
        }
    };

    Y.extend(YOUTUBE_IFRAME, Y.Base, {
        _mute       : false,
        _paused     : false,
        _retryCount : 0,
        _playTimer  : null,
        _checkState: function () {
            var that = this,
                state;
            _log("_checkState() is executed (" + that._retryCount + ").");
            try {
                // The following line might fails because VLC is not ready.
                state = YOUTUBE_IFRAME.STATE[that.get("object").input.state];
                if (that.get("state") !== state) {
                    that._set("state", state);
                    if (state === "opening" || state === "playing") {
                        that._set("state", "play");
                        that.fire("play");
                        return;
                    }
                }
            } catch (err) {
                that.fire("error", {
                    code: "1",
                    message: "VLC fails to create. Try again later..."
                });
                that._set("state", "error");
                that.get("container").removeChild(that.get("object"));
                that._create();
            }
            if (that._retryCount > 0) {
                Y.later(YOUTUBE_IFRAME.CHECK_INTERVAL, that, that._checkState);
                that._retryCount = that._retryCount - 1;
            } else {
                that.fire("error", {
                    code: "2",
                    message: "VLC fails to loading. Try again later..."
                });
                that._set("state", "error");
                _log("Retry too many times. Give up!", "error");
            }
        },
        _poll: function () {
            _log("_poll() is executed.");
            var that = this,
                input = that.get("object").input;
            if (input.length === 0 && input.time === 0) {
                that.fire("buffering");
                that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll);
                that._set("state", "buffering");
            } else if (
                ((input.length > 0 && input.time > 0) &&
                (input.length === input.time)) || input.state === 6
            ) {
                _log("ended is executed.");
                that.fire("ended");
                that._set("state", "ended");
                if (that._playTimer) {
                    that._playTimer.cancel();
                    that._playTimer = null;
                }
                return;
            } else {
                that.fire("playing", {
                    duration: input.length,
                    position: input.time
                });
                that._playTimer = Y.later(YOUTUBE_IFRAME.POLL_INTERVAL, that, that._poll);
                that._set("state", "playing");
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
            container = Y.one(container);
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
                html,
                token,
                size = that.get("size"),
                width = size[0],
                height = size[1],
                id = Y.guid(),
                node,
                object = that.get("object") || null;

            if (!object) {
                token = {
                    id     : id,
                    width  : width,
                    height : height,
                    type   : (Y.UA.gecko) ? "type=" + YOUTUBE_IFRAME.TYPE : ""
                };
                html = Y.substitute(YOUTUBE_IFRAME.TEMPLATE, token);
                container.append(html);
                object = document.getElementById(id);
                that._set("object", object);
                if (Y.UA.ie) {
                    object.setAttribute("classid", YOUTUBE_IFRAME.CLASS_ID);
                    object.setAttribute("pluginspage", YOUTUBE_IFRAME.PLUGIN_PAGE);
                } else {
                    object.setAttribute("type", YOUTUBE_IFRAME.TYPE);
                }
                object.setAttribute("version", YOUTUBE_IFRAME.VERSION);
            }
            try {
                object.playlist.clear();
                object.playlist.playItem(object.playlist.add(that.get("url")));
            } catch (e) {
                Y.log(e.message);
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

            that._create();
            that._retryCount = YOUTUBE_IFRAME.CHECK_RETRY;
            Y.later(YOUTUBE_IFRAME.CHECK_INTERVAL, that, that._checkState);
        },
        stop: function () {
            _log("stop() is executed.");
            var that = this,
                object = that.get("object");
            object.playlist.stop();
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
            object.playlist.togglePause();
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
            object.playlist.togglePause();
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
            object.audio.toggleMute();
            that._mute = true;
        },
        unmute: function () {
            _log("unmute() is executed.");
            var that = this,
                object = that.get("object");
            if (!that._mute) {
                _log("unmute() - The player isn't mute.");
                return;
            }
            object.audio.toggleMute();
            that._mute = false;
        },
        destructor: function () {
            _log("destructor() is executed.");
            var that = this,
                object = that.get("object");
            if (that.get("state") === "playing") {
                object.playlist.stop();
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
        "substitute"
    ]
});
