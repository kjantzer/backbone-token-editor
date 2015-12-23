define(['../lib/bullseye'], function(bullseye){
	
	return Backbone.View.extend({
		
		className: 'token-editor-auto-complete',
		
		menu: [],
		
		_defaultOptions: {
			items: [],
			minLen: 2,
			maxResults: 4,
			minScore: 0.9
		},
		
		events: {
			'click > div': 'onClick'
		},
		
		initialize: function(){
			
			this.options = _.extend(this._defaultOptions, this.options||{});
			
			document.body.appendChild( this.el );
			
			this.position = bullseye(this.el, this.options.target, {
				caret: true,
				autoupdateToCaret: true
			})
			
			this.hide();
		},
		
		setItems: function(items){
			this.options.items = items
		},
		
		bindKeyboardEvents: function(){
			this.onKeydown = this.onKeydown || this._onKeydown.bind(this)
			this.onKeyup = this.onKeyup || this._onKeyup.bind(this)
			document.body.addEventListener('keydown', this.onKeydown, true)
			document.body.addEventListener('keyup', this.onKeyup, true)
		},
		
		unbindKeyboardEvents: function(){
			document.body.removeEventListener('keydown', this.onKeydown, true)
			document.body.removeEventListener('keyup', this.onKeyup, true)
		},
		
		_onKeydown: function(e){
			
			if( e.which == 27 || e.which == 38 || e.which == 40 || e.which == 13 || e.which == 9 ){
				
				if( e.which == 27 ) // esc
					this.hide();
				else if( e.which == 13 || e.which == 9 ) // enter or tab
					this.onSelect()
				else if( e.which == 38 ) // up
					this.selectPrev();
				else if( e.which == 40 ) // down
					this.selectNext();
				
				e.preventDefault();
				e.stopPropagation()
				return false;
			}
			
		},
		
		_onKeyup: function(e){
			if( e.which == 27 || e.which == 38 || e.which == 40 || e.which == 13 ){
				e.preventDefault();
				e.stopPropagation()
				return false;
			}
		},
		
		selectPrev: function(){
			this._selectIndex( this.selected - 1 < 0 ? this.menu.length -1 : this.selected - 1)
		},
		
		selectNext: function(){
			this._selectIndex( this.selected + 1 >= this.menu.length ? 0 : this.selected + 1)
		},
		
		_selectIndex: function(indx){
			this.el.childNodes[this.selected].classList.remove('selected')
			this.el.childNodes[indx].classList.add('selected')
			this.selected = indx;
		},
		
		onClick: function(e){
			Modal.alert('Use the <u>up</u> and <u>down</u> keys and press <code>enter</code> to select.')
			/*var el = e.currentTarget;
			this.selected = Array.prototype.indexOf.call(el.parentNode.childNodes, el);
			console.log(this.selected, el);
			this.onSelect();*/
		},
		
		onSelect: function(){
			this.trigger('select', this.menu[this.selected], this)
		},
		
		render: function(word){
			
			this.$el.html('')
			
			if( !word || word.length < this.options.minLen ){
				this.hide();
				
			}else{
				this.menuFor(word)
				
				if( this.menu.length > 0 ){
					this.show();
					this.selected = 0;
					this.menu.forEach(this.addMenuItem.bind(this))
				}
			}
		},
		
		addMenuItem: function(m, indx){
			this.$el.append('<div class="'+(indx==this.selected?'selected':'')+'" data=id="'+m.id+'">'+m.label+'</div>')
		},
		
		_score: function(str, term){
			if( typeof LiquidMetal === 'undefined' && !this._noScoreWarning ){
				this._noScoreWarning = true;
				console.warn('TokenEditor: cannot score auto complete results; LiquidMetal plugin is missing.');
				return 1;
			}
			else{
				return LiquidMetal.score(str, term)
			}
		},
		
		_scoreItem: function(m, word){
			var scores = []
			
			scores.push(this._score(m.label, word))
			
			// simple string hint
			if( m.hint && typeof m.hint == 'string' )
				scores.push(this._score(m.hint, word))
			
			// array of hints
			if( m.hint && Array.isArray(m.hint) )
				m.hint.forEach(function(str){
					scores.push(this._score(str, word))
				})
			
			return scores.sort().pop() // return the highest score
		},
		
		menuFor: function(word){
			var menu = [];
			
			if( this.options.items )
			this.options.items.forEach(function(m){
				
				var score = this._scoreItem(m, word);
				
				if( score >= this.options.minScore ){
					
					m.score = score;
					
					menu.push(m)
				}
			}.bind(this))
			
			_.sortBy(menu, function(m){ return m.score })
			
			return this.menu = menu;
		},
		
		show: function(){
			
			if( this.isShowing ) return;
			
			this.isShowing = true
			this.el.classList.add('show')
			this.bindKeyboardEvents();
			this.position.refresh();
		},
		
		hide: function(){
			this.isShowing = false;
			this.el.classList.remove('show')
			this.unbindKeyboardEvents();
			this.position.sleep();
		}
		
	})
	
})