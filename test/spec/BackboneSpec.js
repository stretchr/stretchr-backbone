describe("Stretchr-Backbone", function() {
	var model, collection,
		stretchr = new Stretchr.Client("proj", "key"),
		transporter;

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
			"~changes":{
				"~replaced":1,
				"~deltas": {
					"~updated" : 1234
				}
			},
			"~status":200
		},

		createObject: {
			"~changes":
			{
			    "~created":1,
			    "~deltas":[{"~id":"asdf", "~created":1234, "~updated":1234}]
			},
			"~status":201
		},

		deleteObject: {
			"~changes":{
				"~deleted":1
			},
			"~status":200
		},

		errorResponse: {
			"~status":404
		}
	}

	var Model = Backbone.Model.extend({

	});

	var Collection = Backbone.Collection.extend({
		model: Model
	});

	beforeEach(function() {
		model = new Model(),
			collection = new Collection();
		transporter = new Stretchr.TestTransport();
		stretchr.setTransport(transporter);
	});

	it("Should let us set the stretchr object", function() {
		model.stretchr = stretchr;
		model.url = "collection";

		expect(model.stretchr).toEqual(stretchr);
	});

	it("Should let me save a model", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readSingleObject;
		}

		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf"
		model.fetch();

		expect(stretchr.transport().requests()[0][0]["_method"]).toEqual(Stretchr.MethodGet);
		expect(stretchr.transport().requests()[0][0]["_path"]).toEqual("collection/asdf");
		expect(model.get("field")).toEqual("value");
	});

	it("Should trigger a sync method on the model", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readSingleObject;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";

		var sync = 0;
		model.on("sync", function() {sync = 1;});

		model.fetch();
		expect(sync).toEqual(1);
	});

	it("Should let me read ALL objects", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readAllObjects;
		}
		collection.stretchr = stretchr;
		collection.url = "collection";
		collection.fetch();

		expect(stretchr.transport().requests()[0][0]["_method"]).toEqual(Stretchr.MethodGet);
		expect(stretchr.transport().requests()[0][0]["_path"]).toEqual("collection");
		expect(collection.size()).toEqual(2);
		expect(collection.models[0].get("field")).toEqual("value");
	});

	it("Should let me update an object", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.updateObject;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";
		model.set("name", "ryan");
		model.save();

		expect(stretchr.transport().requests()[0][0]["_method"]).toEqual(Stretchr.MethodPut);
		expect(stretchr.transport().requests()[0][0]["_path"]).toEqual("collection/asdf");
		expect(model.get(Stretchr.ResponseKeyChangeInfoUpdated)).toEqual(1234);
		expect(stretchr.transport().requests()[0][0].params["body"]).toBeDefined();
	});

	it("Should let me create an object inside collection", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.createObject;
		}
		collection.stretchr = stretchr;
		collection.url = "collection";
		collection.create({name: "ryan"});

		expect(stretchr.transport().requests()[0][0]["_method"]).toEqual(Stretchr.MethodPost);
		expect(stretchr.transport().requests()[0][0]["_path"]).toEqual("collection");
		expect(collection.models[0].get(Stretchr.ResponseKeyChangeInfoCreated)).toEqual(1234);
		expect(stretchr.transport().requests()[0][0].params["body"]).toBeDefined();
	});

	it("Should let me delete an object", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.deleteObject;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";
		model.set("name", "ryan");
		model.destroy();

		expect(stretchr.transport().requests()[0][0]["_method"]).toEqual(Stretchr.MethodDelete);
		expect(stretchr.transport().requests()[0][0]["_path"]).toEqual("collection/asdf");
	});

	it("Should fire all the correct events for read", function() {
		//TODO : Check events fired for both collections and models, make sure that request, sync, remove/add, etc... are all fired
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readSingleObject;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";

		var request, sync;

		model.on("request", function() {
			request = 1;
		});
		model.on("sync", function() {
			sync = 1;
		});

		model.fetch();

		expect(request).toEqual(1);
		expect(sync).toEqual(1);
	});

	it("Should fire an error event on errors", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.errorResponse;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";

		var error;

		model.on("error", function() {
			error = 1;
		});

		model.fetch();

		expect(error).toEqual(1);
	});

	it("Should not fire an error when no error", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readSingleObject;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";

		var error;

		model.on("error", function() {
			error = 1;
		});

		model.fetch();

		expect(error).toBeUndefined();
	});

	it("Should let me set params on collections", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readAllObjects;
		}
		collection.stretchr = stretchr;
		collection.stretchrParams = {"include" : "~parent", "offset" : 100, ":age" : ">21", ":name" : ["Ryan", "Mat"] };
		collection.url = "collection";
		collection.fetch();

		expect(stretchr.transport().requests()[0][0].params.offset[0]).toEqual(100);
		expect(stretchr.requests[0].params.include[0]).toEqual("~parent");
		expect(stretchr.requests[0].params[":age"][0]).toEqual(">21");
		expect(stretchr.requests[0].params[":name"]).toEqual(["Ryan", "Mat"]);
	});

	it("Should let me set params on models", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readSingleObject;
		}
		model.stretchr = stretchr;
		model.stretchrParams = {"include" : "~parent"};
		model.urlRoot = "users";
		model.id = "ryan";

		model.fetch();

		expect(stretchr.requests[0].params.include[0]).toEqual("~parent");

	});

	xit("Should call update from within a collection", function() {
		stretchr.respond(responses.updateObject);
		collection.stretchr = stretchr;
		collection.url = "collection";
		collection.add([{name: "ryan", id: "asdf"}])
		collection.sync();

		expect(collection.size()).toEqual(1);
		expect(stretchr.requests[0].action).toEqual("update");
		expect(stretchr.requests[0].path).toEqual("collection/asdf");
		expect(collection.models[0].get("~updated")).toEqual(1234);
	});

});