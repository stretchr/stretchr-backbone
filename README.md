# BackStretchr
A backbone integration for Stretchr

## Setup

Include both the stretchr js sdk and the backbone stretchr library.
```
<script src="js/stretchr.js"></script>
<script src="js/stretchr-backbone.js"></script>
```

Now define the stretchr object
```
var stretchr = Stretchr.NewSession("project", "public-key", "private-key");
```

And finally, pass it in with any of your backbone stretchr objects

## Collection Support
```
var Collection = Backbone.Collection.extend({
	stretchr: stretchr
});
```

## Model Support
```
var Model = Backbone.Model.extend({
	idAttribute: "~id",
	stretchr: stretchr
});
```

## Setting Params

```
var Collection = Backbone.Collection.extend({
	stretchr: stretchr,
	stretchrParams: {
		"include" : "~parent",
		"offset" : 200,
		":name" : ["Ryan", "Mat"],
		":age" : ">21",
		"versioning" : true
	}

});
```