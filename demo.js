$(function() {
	
	require(['token-editor'], function(TokenEditor){
		
		var autoCompleteItems = [
			{label: 'banana', attrs:{id: '1', color: 'yellow'}},
			{label: 'apple', attrs:{id: '2', color: 'various'}},
			{label: 'orange', attrs:{id: '3', color: 'orange'}},
			{label: 'strawberry', attrs:{id: '4', color: 'red'}},
			{label: 'blueberry', attrs:{id: '5', color: 'blue'}},
			{label: 'apple sauce', attrs:{id: '6', color: 'pale yellow'}},
			{label: 'apple juice', attrs:{id: '7', color: 'pale yellow'}},
		];
		
		window.emptyEditor = new TokenEditor({items: autoCompleteItems});
		
		document.getElementById('empty').appendChild( emptyEditor.el )
		emptyEditor.render()
        
        setTimeout(function(){
            emptyEditor.edit(true);
            emptyEditor.focusEnd();
        }, 100)
		
		
		var prefilledValue = [["I would like a ",{"label":"banana","attrs":{"id":"1","color":"yellow"}},", but not an ",{"label":"apple","attrs":{"id":"2","color":"various"}},"."],["A few ",{"label":"strawberry","attrs":{"id":"4","color":"red"}},"s would be nice too!"]];
		
		window.prefilledEditor = new TokenEditor({items: autoCompleteItems, value: prefilledValue});
		
		document.getElementById('prefilled').appendChild( prefilledEditor.el )
		prefilledEditor.render()
		
		window.prefilledString = function(){
			document.getElementById('prefilled-json').innerHTML = prefilledEditor.toString();
		}
		
		window.prefilledJSON = function(){
			
			document.getElementById('prefilled-json').innerHTML = JSON.stringify(prefilledEditor.toJSON(), null, "  ")
		}
	})

})