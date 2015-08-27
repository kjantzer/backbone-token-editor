/*
	Token Editor 0.1.0
	
	A basic text editor with tokens that are used via auto-complete.
	Tokens can not be modified by the keyboard but appear as "objects" within
	the text box.
	
	This plugin merges the idea of a "tag list" and "@mention" auto-complete.
	
	http://kjantzer.github.io/backbone-token-editor/
	
	@author Kevin Jantzer, Blackstone Audio Inc.
	@since 2015-08-24
	
	@DEPENDENCIES
	[Bullseye](https://github.com/bevacqua/bullseye)
	
	TODO:
	- Inserting tokens does not get tracked in undo manager making undo/redo funky
		Maybe I should create my own undo manager? would need to keep track of content and caret position.
	- `&nbsp;` appears sometimes when typing after a token
	
*/
define(['auto-complete'], function(AutoCompleteView){
	
	return Backbone.View.extend({
		
		className: 'token-editor',
		
		_defaultOptions: {
			className: '',
			value: '',				// html string or JSON format,
			autoComplete: {},		// options for auto complete
			allowPaste: false,
			allowStyling: false,	// bold/italics keyboard shorcuts
			editing: false, 		// set to true if you want to be in edit mode upon init
			dblClickToEdit: true
		},
		
		events: {
			'dblclick': 'onDblClick',
			'click': 'onClick',
			'blur': 'onBlur',
			'keydown': 'onKeydown',
			'keyup': 'onKeyup',
			'keypress': 'onKeypress',
			'paste': 'onPaste',
			'contextmenu .token': 'onTokenClick'
		},
		
		initialize: function(){
			
			window.tokenEditor = this; // TEMP
			
			this.options = _.extend(this._defaultOptions, this.options||{});
			this.history =[];
			this.historyAt = 0;
			
			if( this.options.className )
				this.el.classList.add(this.options.className)
			
			var autoCompleteOptions = this.options.autoComplete;
			autoCompleteOptions.target = this.el;
			
			this.subview('auto-complete') || this.subview('auto-complete', new AutoCompleteView(autoCompleteOptions))
			this.listenTo(this.subview('auto-complete'), 'select', this.onAutoCompleteSelect)
			
			if( this.options.items )
				this.setAutoCompleteItems(this.options.items)
				
			this.setValue()
			this.markHistory();
			
			if( this.options.editing )
				this.edit();
		},
		
		isEditing: function(){
			return this.el.contentEditable == 'true'
		},
		
		edit: function(doEdit){
			this.el.contentEditable = doEdit !== false
		},
		
		render: function(){
			
			this.delegateEvents();
			
			return this;
		},
		
		setValue: function(val){
			
			if( arguments.length == 0 )
				val = this.options.value;
			else
				this.options.value = val;
				
			var html = typeof val == 'string' ? val : this.jsonToHTML(val)
			
			this.el.innerHTML = html;
			
			html ? this.el.classList.remove('empty') : this.el.classList.add('empty')
			
			this.endWithBrTag();
		},
		
		tokenMenu: function(el){
			if( this.options.tokenMenu )
				return function(){ return this.options.tokenMenu(this, el, this.items) }.bind(this)
			else 
				return false;
		},
		
		onTokenClick: function(e){
			
			if( !this.isEditing() ) return;
			
			var menu = this.tokenMenu(e.currentTarget);
			
			if( menu )
			$(e.currentTarget).dropdown(menu, {
				align: 'bottom',
				w: 120,
				trigger: 'none'
			})
			
			if( menu && !this.metaKey() ){		// for development, if ctrl/cmd then right click acts as normal
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		},
		
		// sets the items available in 'auto complete'
		setAutoCompleteItems: function(items){
			this.items = items;
			this.subview('auto-complete').setItems(items);
		},
		
		// when a users selects an 'auto complete' item
		onAutoCompleteSelect: function(data, autoComplete){
			autoComplete.hide();
			this.replaceWithToken(data)
		},
		
		onDblClick: function(){
			if( this.options.dblClickToEdit == true && !this.isEditing() ){
				this.edit(true)
				this.focusEnd();
			}
		},
		
		// when clicked somewhere else in the editor, hide auto complete
		onClick: function(){ this.subview('auto-complete').hide(); },
		onBlur: function(){ this.subview('auto-complete').hide(); this.trigger('blur', this) },
		
		makeToken: function(d){
			var node = document.createElement('span');
			node.contentEditable = false;
			node.classList.add('token');
			
			_.each(d.attrs, function(val, key){
				node.setAttribute('data-'+key, val);
			})
			
			var label = document.createElement('span');
			label.innerHTML = d.label;
			node.appendChild(label)
			
			return node.outerHTML;
			
			return '<span contenteditable=false class="token" data-id="'+d.id+'"><span>'+d.label+'</span></span>';
		},
		
		insertToken: function(d){
			this.insertHTML( this.makeToken(d) )
		},
		
		replaceWithToken: function(token){
			
			clearTimeout( this.historyTimeout )
			
			var sel = window.getSelection(),
				range = sel.getRangeAt(0),
				text = range.endContainer.textContent.slice(0, range.endOffset ),
				lastSpace = text.lastIndexOf(' ') > -1 ? text.lastIndexOf(' ') : text.lastIndexOf(' ');
				word = lastSpace > -1 ? text.slice(lastSpace+1) : text;
			
			// delete the word the user was typing so we can replace it with a token
			range.setStart(range.endContainer, lastSpace+1);
			range.deleteContents();
			
			this.insertToken(token);
		},
		
		currentWord: function(){
				
			var sel = window.getSelection(),
				range = sel.getRangeAt(0);
			
			if( range.endContainer == this.el 
			|| !range.endContainer.textContent ) return;
			
			var text = range.endContainer.textContent.slice(0, range.endOffset ),
				lastSpace = text.lastIndexOf(' ') > -1 ? text.lastIndexOf(' ') : text.lastIndexOf(' ');
				word = lastSpace > -1 ? text.slice(lastSpace+1) : text;
			
			//console.log('current word: ', word);
			return word;
		},
		
		onPaste: function(e){
			if( this.options.allowPaste != true ){
				e.preventDefault(); // disable pasting so we dont have to do style cleanup
				return false;
			}else{
				this.markHistoryIn(0);
			}
		},
		
		onKeydown: function(e){
			
			// disable style commands like bold an italic
			if( this.metaKey() && (e.keyCode === 66 /* bold */ || e.keyCode === 73 /* italics */)){
				
				if( this.options.allowStyling !== true )
					return false;
				else
					this.markHistoryIn(0);
			}
			
			// override undo/redo for our own built in history manager
			if( this.metaKey() && e.keyCode === 90 ){ // ctrl/cmd + z
				e.shiftKey ? this.redo() : this.undo()
				return false;
			}
			
			// on enter, force `<br>` tags instead of <div> or <p>
			if (e.keyCode === 13) {
				
				// if at the end of editor, a trailing <br> is needed to make the cursor jump to the next line
				if( this.getSelection().start >= this.length() )
					document.execCommand('insertHTML', false, '<br class="newline"><br>');
				else
					document.execCommand('insertHTML', false, '<br class="newline">');
					
				this.markHistoryIn(0);
				
				return false;
			}
		},
		
		onKeyup: function(e){
			
			// re-render auto-complete with the current word
			_.defer(function(){
				this.subview('auto-complete').render( this.currentWord() )
			}.bind(this))
			
			// make sure we end with a `<br>` tag.
			clearTimeout( this.keyupTimeout )
			this.keyupTimeout = setTimeout(this.endWithBrTag.bind(this), 300);
			
		},
		
		onKeypress: function(e){
			this.markHistoryIn(500);
		},
		
		endWithBrTag: function () {
			
			// dont do this if auto complete showing, cause when calling `replaceWithToken`, it would replace more than the word
			// if 300ms passed before selecting
			if( this.subview('auto-complete').isShowing ) return;
			
			if( !this.el.innerHTML.match(/<br>$/) ){
				
				if( !this.isInFocus() )
					this.focusEnd();
				
				var sel = window.getSelection();
				
				// no selection after telling to focus? then the editor is not in the DOM
				if( sel.type == 'None'){
					this.el.appendChild(document.createElement('br'))
					return;
				}
				
				var range = sel.getRangeAt(0);
				var frag = document.createDocumentFragment()
				var br = frag.appendChild( document.createElement('br') );
				
				//document.execCommand('insertHTML', false, frag);
				this.el.appendChild(frag)
				
				range = range.cloneRange();
				range.setStartBefore(br);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
			
		},
		
		insertHTML: function(html){
			
			if( !this.isInFocus() )
				this.focusEnd();
			
			// http://stackoverflow.com/a/6691294/484780
			sel = window.getSelection();
			
	        if (sel.getRangeAt && sel.rangeCount) {
	            range = sel.getRangeAt(0);
	            range.deleteContents();

	            var el = document.createElement("div");
	            el.innerHTML = html;
				
	            var frag = document.createDocumentFragment(), node, lastNode;
	            
				while ( (node = el.firstChild) ) {
	                lastNode = frag.appendChild(node);
	            }
				
	            range.insertNode(frag);

	            // Preserve the selection
	            if (lastNode) {
	                range = range.cloneRange();
	                range.setStartAfter(lastNode);
	                range.collapse(true);
	                sel.removeAllRanges();
	                sel.addRange(range);
	            }
				
				this.markHistory();
	        }
		
		},
		
		length: function(){
			return this.el.innerText.trim().replace(/\n/g, '').length
		},
		
		isInFocus: function(){
			return document.activeElement == this.el
		},
		
		// focuses editor and sets caret position
		focus: function(atChar){
			if( atChar < 0 || atChar > this.length() )
				atChar = 0;
			
			this.setSelection(atChar, atChar);
		},
		
		// focuses editor at the end
		focusEnd: function(){
			this.focus(this.length())
		},
		
		selectAll: function(){ this.setSelection(0, this.length()) },
		
		jsonToHTML: function(json){
			var self = this;
			var lines = _.map(json, function(row){
				return _.reduce(row, function(str, d){
					if( typeof d == 'string' )
						return str + d
					else if( d.label !== undefined )
						return str + self.makeToken(d)
						
					// legacy support
					else
						return str + self._objectTextareaObjectToHTML(d)
				}, '')
			})
			return lines.join('<br class="newline">');
		},
		
		// legacy support
		_objectTextareaObjectToHTML: function(d){
			if( d.type == 'text' )
				return d.data.text;
			
			var attrs = _.clone(d.data);
			var label = d.data.text; delete attrs.text;
			
			return this.makeToken({label: label, attrs: attrs})
		},
		
		toHTML: function(){
			return this.el.innerHTML.replace(/<br>$/, '');
		},
		
		toString: function(){
			return _.stripTags( this.toHTML().replace(/<br class="newline">/g, "\n") )
		},
		
		// creates a JSON structure of the editor content
		toJSON: function(){
			
			var html = this.toHTML();
			
			if( !html ) return [];
			
			// split each row by the `<br>` tag
			var json = html.split('<br class="newline">');
			
			// covert each row to array of strings and objects 
			json = _.map(json, function(str){
				
				// make a temp DOM element for navigating through child nodes
				var div = document.createElement('div')
				div.innerHTML = str;
				
				// row data
				var row = [];
				
				// make each node an object
				_.each(div.childNodes, function(node){
					
					// simple string of text
					if( !node.tagName )
						row.push(node.textContent)
					
					// spans are 'tokens', so make them an {}
					else if( node.tagName == 'SPAN'){
						row.push({
							label: node.textContent,
							attrs: _.clone(node.dataset)
						})
					}
					
				})
				
				return row;
				
			})
			
			return json;
		},
		
		// Legacy support until code that relies on old objectTextarea format is updated
		toObjectTextarea: function(){
			var json = this.toJSON();
			
			return _.map(json, function(row){ return _.map(row, function(d){
			
				if( typeof d == 'string' ){
					return {type: "text", data: {text: d}}
				}else{
					var attrs = d.attrs;
					attrs.text = d.label;
					return {type: "bubble", data: attrs}
				}
				
			})})
		},
		
		setSelection: function(start, end) {
			
			var range = document.createRange(),
				count = 0, startNode, endNode;
			
			_.each(this.el.childNodes, function(node, indx){
				
				var len = (node.innerText ? node.innerText.length : node.length) || 0;
				
				count = count + len;
				
				//console.log(count, len);
				
				// found start of selection
				if( (count > start || (count == start && len == 0)) && !startNode ){
					
					startNode = node;
					range.setStart(node, node.tagName ? 0 : start - (count - len)  )
					
				}
				
				if( (count > end || (count == end && len == 0)) && !endNode ){
					
					endNode = node;
					
					if( node.tagName && len > 0 )
						if( node.nextSibling )
							range.setEnd(node.nextSibling, 0)
						else
							range.setEnd(node, 0)
					else
						range.setEnd(node, end - (count - len) )
				}
				
			})
			
			this.el.focus();
			
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
			
			return;
			
			// http://stackoverflow.com/a/16100733/484780
	    },
		
		getSelection: function() {
			
			var sel = window.getSelection();
			
			if( sel.type == 'None' )
				return {
					start: this.length(),
					end: this.length()
				}
				
	        var range = sel.getRangeAt(0);
	        
			var preSelectionRange = range.cloneRange();
	        preSelectionRange.selectNodeContents(this.el);
	        preSelectionRange.setEnd(range.startContainer, range.startOffset);
	        var start = preSelectionRange.toString().length;

	        return {
	            start: start,
	            end: start + range.toString().length
	        };
	    },
		
		metaKey: function(e){
			e = e || event;
			return e && (e.ctrlKey || e.altKey || e.metaKey);
		},
		
		markHistory: function(){
			// splices history at current history index (and removes all history after current index)
			this.history.splice(this.historyAt+1, Number.MAX_VALUE, {
				caret: this.getSelection(),
				content: this.el.innerHTML
			})
			
			this.historyAt = this.history.length - 1;
		},
		
		markHistoryIn: function(ms){
			clearTimeout( this.historyTimeout )
			this.historyTimeout = setTimeout(this.markHistory.bind(this), ms||0);
		},
		
		undo: function(){
			if( this.historyAt <= 0 ) return;
			this.applyHistory(this.history[ --this.historyAt ])
		},
		
		redo: function(){
			if( this.historyAt >= this.history.length - 1 ) return;
			this.applyHistory(this.history[ ++this.historyAt ])
		},
		
		applyHistory: function(hist){
			this.el.innerHTML = hist.content;
			this.setSelection(hist.caret.start, hist.caret.end)
		},
		
	})
	
})