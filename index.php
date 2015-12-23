<html>
<head>

<title>Backbone.js Token Editor</title>
<meta charset="utf-8"></meta>

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-44608486-7', 'kjantzer.github.io');
  ga('send', 'pageview');

</script>

<!-- Backbone.js Dependencies -->
<script src="lib/jquery.min.js"></script>
<script src="lib/underscore.min.js"></script>
<script src="lib/underscore.string.min.js"></script>
<script src="lib/backbone.min.js"></script>
<script src="lib/backbone.subviews.js"></script>

<script src="lib/liquidmetal.js"></script>
<script src="lib/require.js"></script>

<link href="style.css" rel="stylesheet" type="text/css">
<script src="token-editor.min.js"></script>

</head>
<body>

<a href="https://github.com/kjantzer/backbone-token-editor" class="github-corner"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#fff; color:#7E57C2; position: absolute; top: 0; border: 0; right: 0;"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a><style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style>


<header>
    
    <nav class="menu">
        <a class="menu-btn" onclick="this.parentNode.classList.toggle('open')"><img src="lib/list.png"></a>
        <ul>
            <?php
            $menu = file_get_contents('https://gist.githubusercontent.com/kjantzer/9abbb6cc17d1b6699221/raw');
            $menu = $menu ? json_decode($menu, true) : array();
            foreach($menu as $item):?>
            <li><a href="http://kjantzer.github.io/<?php echo $item['key'] ?>">
                <?php echo $item['label'] ?>
                <div class="description"><?php echo isset($item['description']) ? $item['description'] : '' ?></div>
            </a></li>
            <?php endforeach; ?>
        </ul>
    </nav>
	
	<h1>
		Token Editor
	</h1>
	
	<h3>
		Merging the idea of a "tag list" and "@mention" auto-complete into one.
	</h3>
    
    <article>
		<div id="empty"></div>
		<p><small><i>Try typing: banana, apple, orange, strawberry, blueberry</i></small></p>
	</article>
	
</header>

<section>
	
    <h1>Overview</h1>
    
	<p><b>Version 0.2.0</b></p>
	
	<p>A basic text editor with tokens that are used via auto-complete. Tokens cannot be modified by the keyboard but appear as "objects" within
	the text box.</p>
	
	<p>The editor is designed to be used completely with the keyboard only, thus, the auto-complete results cannot be selected with the mouse.</p>
		
	<p>Instead, use the <b>up and down arrows</b> to choose, then press <b>enter</b> to select.</p>

    <p><i>Note: this plugin was developed for use in Chrome. Other webkit browsers should work too, but untested. If you find browser issues, please <a href="https://github.com/kjantzer/backbone-token-editor/issues">post a ticket</a></i></p>

	<hr>
	
	<div>
		
        
		<h1>Demo</h1>
        <small style="float:right"><i>Double+click to edit</i></small>
        
		<div id="prefilled"></div>
		
		<br>
        <div style="text-align: right">
			<a onclick="prefilledString()">View as String</a> &nbsp;&nbsp;&nbsp;
			<a onclick="prefilledJSON()">View as JSON</a>
		</div>
		
		<pre id="prefilled-json"></pre>
		
		
	</div>
    
    <hr>
    
    <h1>Options</h1>
    
    <br>
    
    <h3><code>className: ''</code></h3>
    <p>Optional classname for the token editor. Useful for applying themes and different styles.</p>
    
    <hr>
    
    <h3><code>value: ''</code></h3>
    <p>The value of the editor upon initialization. </p>
    
    <p>The value can be an HTML string or JSON structure. Both of these values can be retrieved from the editor with <code>toHTML()</code> and <code>toJSON()</code> respectively</p>
    
    <b>HTML</b>
    <pre style="white-space: pre-line;">
I would like a &lt;span contenteditable=&quot;false&quot; class=&quot;token&quot; data-id=&quot;1&quot; data-color=&quot;yellow&quot;&gt;&lt;span&gt;banana&lt;/span&gt;&lt;/span&gt;, but not an &lt;span contenteditable=&quot;false&quot; class=&quot;token&quot; data-id=&quot;2&quot; data-color=&quot;various&quot;&gt;&lt;span&gt;apple&lt;/span&gt;&lt;/span&gt;.&lt;br class=&quot;newline&quot;&gt;A few &lt;span contenteditable=&quot;false&quot; class=&quot;token&quot; data-id=&quot;4&quot; data-color=&quot;red&quot;&gt;&lt;span&gt;strawberry&lt;/span&gt;&lt;/span&gt;s would be nice too!
    </pre>
    
    <b>JSON</b>
    <pre>
[
  [
    "I would like a ",
    {
      "label": "banana",
      "attrs": {
        "id": "1",
        "color": "yellow"
      }
    },
    ", but not an ",
    {
      "label": "apple",
      "attrs": {
        "id": "2",
        "color": "various"
      }
    },
    "."
  ],
  [
    "A few ",
    {
      "label": "strawberry",
      "attrs": {
        "id": "4",
        "color": "red"
      }
    },
    "s would be nice too!"
  ]
]
    </pre>
    
    <hr>
    
    <h3><code>autoComplete: {}</code></h3>
    <p>The options for auto-complete. The most important one being <code>items</code></p>
    
    <pre>
{
  items: [],
  minLen: 2,
  maxResults: 4,
  minScore: 0.9
}
    </pre>
    
    <b>items: []</b>
    <p>The items to appear in auto-complete. This option can be set later on using <code>setAutoCompleteItems</code></p>
    <p><code>label</code> is required. <code>attrs</code> is optional and extendable with any data. A likely attribute would be an <code>id</code></p>
    
    <pre>
[
  {label: 'banana', attrs:{id: '1', color: 'yellow'}},
  {label: 'apple', attrs:{id: '2', color: 'various'}},
  {label: 'orange', attrs:{id: '3', color: 'orange'}},
  {label: 'strawberry', attrs:{id: '4', color: 'red'}},
  {label: 'blueberry', attrs:{id: '5', color: 'blue'}},
  {label: 'apple sauce', attrs:{id: '6', color: 'pale yellow'}},
  {label: 'apple juice', attrs:{id: '7', color: 'pale yellow'}},
]
    </pre>
    
    <p>A <code>hint</code> property can be added (string or array of strings) to trigger autocomplete.</p>
    
    <pre>
[
  {label: 'banana', hint:'fruit', attrs:{id: '1'}},
  {label: 'apple', hint:['fruit', 'manzana'], attrs:{id: '2'}},
  {label: 'carrot', hint:'vegetable', attrs:{id: '3'}},
]
    </pre>
    
    <p>Typing <code>fruit</code> will display <code>banana</code> and <code>apple</code></p>
    
    <hr>
    
    <h3><code>multiLines: true</code></h3>
    <p>Set this to false if you want the editor to perform more like an input with no line breaks. The editor will still grow in height when wrapping words.</p>
    
    <p><b>TODO:</b> make editor look and act like an input where text overflows and scrolls while user types.</p>
    
    <hr>
    
    <h3><code>allowPaste: false</code></h3>
    <p>Pasting is disabled by default so extraneous styles and tags are not put in to the editor. You can enable pasting if you wish, but know the editor may have unintended issues.</p>
    
    <p><b>TODO:</b> add a <code>cleanup</code> method for when pasting is enabled.</p>
    
    <hr>
    
    <h3><code>allowStyling: false</code></h3>
    <p>By default, keyboard shortcuts for <b>bold</b> and <i>italics</i> are disabled. Set to <code>true</code> to allow this feature.</p>
    
    <small><i>Note: <code>toJSON()</code> does not retain styling tags. You'll want to use <code>toHTML()</code></i></small>
    
    <hr>
    
    <h3><code>editing: false</code></h3>
    <p>Should the editor be in editing mode upon initialization?</p>
    
    <hr>
    
    <h3><code>dblClickToEdit: true</code></h3>
    <p>Unless <code>editing: true</code> the editor will not be editable until the <code>edit()</code> method is called. By default, <b>double clicking</b> on the editor enables editing. You can turn this feature off if you wish to control it programmatically</p>

    <hr>
    
    <h1>Dependencies</h1>
    
    <p><a href="http://backbonejs.org">Backbone.js</a> (and its dependencies: underscore, jquery)</p>
    <p><a href="https://github.com/kjantzer/backbone-subviews">Backbone.subviews</a></p>
    <p><a href="http://gabceb.github.io/underscore.string.site/">Underscore.string</a></p>
    <p><a href="https://github.com/kjantzer/liquidmetal/">LiquidMetal.js</a> - fuzzy search in auto-complete</p>
    <p><a href="https://github.com/bevacqua/bullseye">Bullseye</a> - positioning of auto-complete</p>
    
    <hr>
    
    <h1>License</h1>
    
    <p>MIT © <a href="http://kevinjantzer.com">Kevin Jantzer</a></p>


    <hr>

    <small>Built by <a href="http://kevinjantzer.com">Kevin Jantzer</a>, <a href="http://blackstoneaudio.com">Blackstone Audio Inc.</a></small>


</section>

<script type="text/javascript" src="demo.js"></script>

</body>
</html>
