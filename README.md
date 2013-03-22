youtube-iframe
==============

We design this utility to help Youtube iframe plugin with YUI wrapper.

How to use.
-------
1. Add youtube iframe script 
~~~~
<script type="text/javascript" src="//www.youtube.com/iframe_api"></script>
~~~~

2. Sample code
<pre><code>
var config       = {
    "container": "#yt",  // HTML selector, it can be id, class or html tag name (like body)
    "size": ["1280px","780px"],  //width, height in px
    "hasControl": true,          //show control?
    "autoPlay": false,			 //auto play or not
    "url": "http://www.youtube.com/watch?v=faVCwOesYl8" //youtube url
};
var player          = new Y.YoutubeIframe(config);
	</code></pre>

3. Play youtube video
<pre><code>
player.play("http://www.youtube.com/watch?v=faVCwOesYl8");
	</code></pre>

4. Listen event
<pre><code>
player.on("ready", _handleReady);

player.on("playing", function (e) {
    position: e.position,
    duration: e.duration
});

player.on("ended", _handleEnded);
player.on("error", _handleError);

	</code></pre>

Reference: https://developers.google.com/youtube/iframe_api_reference