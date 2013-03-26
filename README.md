youtube-iframe
==============

![Build Status](https://api.travis-ci.org/miiicasa/youtube-iframe.png?branch=master)

We design this utility to help Youtube iframe plugin with YUI wrapper.

## How to use

1. Add youtube iframe script

    ```html
    <script type="text/javascript" src="//www.youtube.com/iframe_api"></script>
    ````
1. Sample code - config and player.

    ```javascript
    var config = {
        "container": "#yt",  // HTML selector, it can be id, class or html tag name (like body)
        "size": ["1280px","780px"],  //width, height in px
        "hasControl": true,          //show control?
        "autoPlay": false,                   //auto play or not
        "url": "http://www.youtube.com/watch?v=faVCwOesYl8" //youtube url
    };
    var player = new Y.YoutubeIframe(config);
    ```
1. Play youtube video with an existed player.

    ```javascript
    player.play("http://www.youtube.com/watch?v=faVCwOesYl8");
    ```
1. Listen event

    ```javascript
    player.on("ready", _handleReady);
    player.on("playing", function (e) {
        position: e.position,
        duration: e.duration
    });
    player.on("ended", _handleEnded);
    player.on("error", _handleError);
    ```

## Reference

* [YouTube Player API for Embedded Iframe](https://developers.google.com/youtube/iframe_api_reference)
