# Backbone.js Stretchr Integration
This is the official Stretchr bindings for BackboneJS - a lightweight framework for building front end applications in Javascript.  This integration is designed to get out of your way as quickly as possible and let experienced and new Backbone developers focus on building their applications and not worry about their backend.

Most Backbone apps can be migrated to stretchr with just a single line in each of your collections.

## Setup

Include both the stretchr js sdk and the backbone stretchr library.

```html
<script src="js/stretchr.js"></script>
<script src="js/stretchr-backbone.js"></script>
```

Now define the stretchr object

```javascript
var stretchr = new Stretchr.Client("account", "project", "key");
```

And finally, set it in any of your Backbone Collections and Models that should be persisted to Stretchr.

## Collection Support

```javascript
var Collection = Backbone.Collection.extend({
	stretchr: stretchr
});
```

## Model Support

```javascript
var Model = Backbone.Model.extend({
	idAttribute: "~id",
	stretchr: stretchr
});
```

And that's it, you're app is now storing and reading data from Stretchr.

## Setting Params
If you would like to take advantage of some of Stretchr's unique features inside of your app, you can do so by setting the stretchrParams for your collection as well.

```javascript
var Collection = Backbone.Collection.extend({
	stretchr: stretchr,
	stretchrParams: {
		"include" : "~parent",
		"skip" : 200,
		":name" : ["Ryan", "Mat"],
		":age" : ">21",
		"versioning" : true
	}
});
```
