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
				"~deltas": [{
					"~updated" : 1234
				}]
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

		notFound: {
			"~status":404
		},

		badRequest: {
			"~errors":[
				{"~message":"HTTP Method not supported."}
			],
			"~status":400
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
		expect(stretchr.transport().requests()[0][0]["_body"]).toBeDefined();
		expect(stretchr.transport().requests()[0][0]["_body"]["name"]).toEqual("ryan");
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
		expect(stretchr.transport().requests()[0][0]["_body"]).toBeDefined();
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

		var request, sync, success, error;

		model.on("request", function() {
			request = 1;
		});
		model.on("sync", function() {
			sync = 1;
		});

		model.fetch();

		expect(request).toEqual(1);
		expect(sync).toEqual(1);

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.notFound;
		}
	});

	it("Should fire callbacks for a model", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readSingleObject;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";

		var success, fail;

		model.fetch({
			success: function() {
				success = 1;
			}
		});

		expect(success).toEqual(1);

		//now test errors
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.notFound;
		}
		model.fetch({
			error: function() {
				fail = 1;
			}
		});
		expect(fail).toEqual(1);
	});

	it("Should fire callbacks for a collection", function() {
		var success, fail;
		collection.stretchr = stretchr;
		collection.url = "collection";

		//test success
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.readAllObjects;
		}

		collection.fetch({
			success: function() {
				success = 1;
			}
		});

		expect(success).toEqual(1);

		//now test errors
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.notFound;
		}
		collection.fetch({
			error: function() {
				fail = 1;
			}
		});
		expect(fail).toEqual(1);
	});

	it("Should fire an error event on errors", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.notFound;
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

		//TODO : make the backbone objects support the stretchr "where" system
		expect(stretchr.transport().requests()[0][0]["_params"].data("offset")[0]).toEqual(100);
		expect(stretchr.transport().requests()[0][0]["_params"].data("include")[0]).toEqual("~parent");
		expect(stretchr.transport().requests()[0][0]["_params"].data(":age")[0]).toEqual(">21");
		expect(stretchr.transport().requests()[0][0]["_params"].data(":name")).toEqual(["Ryan", "Mat"]);
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

		expect(stretchr.transport().requests()[0][0]["_params"].data("include")[0]).toEqual("~parent");

	});

	it("Should know how to perform a patch", function() {
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.updateObject;
		}
		model = new Model({age: 22});
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";
		model.save({name: "ryan"}, {patch: true});

		expect(stretchr.transport().requests()[0][0]["_method"]).toEqual(Stretchr.MethodPatch);
		expect(stretchr.transport().requests()[0][0]["_path"]).toEqual("collection/asdf");
		expect(model.get(Stretchr.ResponseKeyChangeInfoUpdated)).toEqual(1234);
		expect(stretchr.transport().requests()[0][0]["_body"]).toBeDefined();
		expect(stretchr.transport().requests()[0][0]["_body"]["age"]).toBeUndefined();
		expect(stretchr.transport().requests()[0][0]["_body"]["name"]).toEqual("ryan");
	});

	it("Should pass the correct info for all errors", function() {
		var errors;

		/**
		 * READ
		 */
		stretchr.transport().fakeResponse = function(request, options) {
			return responses.notFound;
		}
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf";

		var error;

		model.fetch({
			error: function(m, err) {
				errors = err;
			}
		});
		//test 404
		expect(errors["~status"]).toEqual(404);

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.badRequest;
		}

		model.fetch({
			error: function(m, err) {
				errors = err;
			}
		});

		// test 400
		expect(errors["~status"]).toEqual(400);
		expect(errors["~errors"][0]["~message"]).toEqual("HTTP Method not supported.");

		/*
		 * READ ALL
		 */

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.notFound;
		}
		collection.stretchr = stretchr;
		collection.url = "collection";

		var error;

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.badRequest;
		}

		collection.fetch({
			error: function(m, err) {
				errors = err;
			}
		});

		// test 400
		expect(errors["~status"]).toEqual(400);
		expect(errors["~errors"][0]["~message"]).toEqual("HTTP Method not supported.");

		/*
		 * CREATE
		 */
		collection.stretchr = stretchr;
		collection.url = "collection";

		var error;

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.badRequest;
		}

		collection.create({name: "ryan"}, {
			error: function(m, err) {
				errors = err;
			}
		});

		// test 400
		expect(errors["~status"]).toEqual(400);
		expect(errors["~errors"][0]["~message"]).toEqual("HTTP Method not supported.");

		/*
		 * UPDATE
		 */
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf"

		var error;

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.badRequest;
		}

		model.save({name: "ryan"}, {
			error: function(m, err) {
				errors = err;
			}
		});

		// test 400
		expect(errors["~status"]).toEqual(400);
		expect(errors["~errors"][0]["~message"]).toEqual("HTTP Method not supported.");

		/*
		 * PATCH
		 */
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf"

		var error;

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.badRequest;
		}

		model.save({name: "ryan"}, {
			patch: true,
			error: function(m, err) {
				errors = err;
			}
		});

		// test 400
		expect(errors["~status"]).toEqual(400);
		expect(errors["~errors"][0]["~message"]).toEqual("HTTP Method not supported.");

		/*
		 * DELETE
		 */
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf"

		var error;

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.badRequest;
		}

		model.destroy({
			patch: true,
			error: function(m, err) {
				errors = err;
			}
		});

		// test 400
		expect(errors["~status"]).toEqual(400);
		expect(errors["~errors"][0]["~message"]).toEqual("HTTP Method not supported.");

	});

	it("Should catch when an update was actually a create", function() {
		// updates return an object of deltas, creates return an array of objects of deltas.
		// Sometimes a create gets sent as an update if the interface is
		// building up the object before posting it to the server, so we should check for
		// this on the delta returns
		model.stretchr = stretchr;
		model.urlRoot = "collection";
		model.id = "asdf"

		var error;

		stretchr.transport().fakeResponse = function(request, options) {
			return responses.createObject;
		}

		model.save({name: "ryan"});

		// test 400
		expect(model.get("~created")).toEqual(1234);

	})

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