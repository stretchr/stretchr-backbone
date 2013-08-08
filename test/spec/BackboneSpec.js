describe("Stretchr-Backbone", function() {
	var model, collection, stretchr;

	var responses = {
		readSingleObject: {
			"~data" : {
				"field" : "value"
			},
			"~status" : 200
		},

		readAllObjects: {
			"~data" : {
				"~items" : [
					{
						"field" : "value"
					},
					{
						"field" : "value"
					}
				]
			},
			"~status" : 200
		},

		updateObject: {

		}
	}

	var Model = Backbone.Model.extend({

	});

	var Collection = Backbone.Collection.extend({
		model: Model
	});

	beforeEach(function() {
		stretchr = Stretchr.NewTestSession(),
			model = new Model(),
			collection = new Collection();
	});

	it("Should let us set the stretchr object", function() {
		model.stretchr = stretchr;
		model.url = "collection";

		expect(model.stretchr).toEqual(stretchr);
	});

	it("Should let me save a model", function() {
		stretchr.respond(responses.readSingleObject);
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf"
		model.fetch();

		expect(stretchr.requests[0].action).toEqual("read");
		expect(stretchr.requests[0].path).toEqual("collection/asdf");
		expect(model.get("field")).toEqual("value");
	});

	it("Should trigger a sync method on the model", function() {
		stretchr.respond(responses.readSingleObject);
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";

		var sync = 0;
		model.on("sync", function() {sync = 1;});

		model.fetch();
		expect(sync).toEqual(1);
	});

	it("Should let me read ALL objects", function() {
		stretchr.respond(responses.readAllObjects);
		collection.stretchr = stretchr;
		collection.url = "collection";
		collection.fetch();

		expect(stretchr.requests[0].action).toEqual("read");
		expect(stretchr.requests[0].path).toEqual("collection");
		expect(collection.size()).toEqual(2);
		expect(collection.models[0].get("field")).toEqual("value");
	});

});