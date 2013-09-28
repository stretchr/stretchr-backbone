/*
 * Backbone Stretchr Adapter
 * Inspired by Backbone Local Storage Adapter
*/

//Save original Backbone.sync
Backbone.originalSync = Backbone.sync;

Backbone.Stretchr = function() {
	var stretchr;

	return {
		sync: function(method, model, options, error) {
			var resp, 
				errorMessage,
				data;
			stretchr = model.stretchr || model.collection.stretchr;

			if (method == "read" && !model.id) {
				method = "readAll";
			}

			if (this[method]) {
				model.trigger("request", model, null, options);
				this[method](model, function(err, res) {
					if (err) {
						//TODO : Right now this just returns the raw response in the event of an error, not very useful
						model.trigger("error", err);
					} else {
						data = res;
						model.trigger("sync", model, data, options);
						if (options && options.success) {
							options.success(data);
						}
					}
				});
			} else {
				//FIXME : Is this correct?  Should write a test for an undefined method being called
				model.trigger("error", "Method undefined!");
			}
		},

		read: function(model, callback) {
			//process params and add them to the request if provided
			var req = stretchr.at(model.url());
			if (model.stretchrParams) {
				_.each(model.stretchrParams, function(value, key) {
					// NOTE : This may need to be changed to set.  set replaces, params adds to an array
					//handle arrays
					if (value instanceof Array) {
						for (var i in value) {
							req.param(key, value[i]);
						}
					} else {
						req.param(key, value);
					}
				});
			}

			//params are processed, now let's make the request
			req.read({
				success: function(response) {
					callback(null, response.data());
				},

				error: function(response) {
					callback(response.errorMessage());
				}
			});
		},

		readAll: function(model, callback) {
			//process params and add them to the request if provided
			// FIXME : readAll will overwrite some params it doesn't think it needs, like limit, to be most optimal.
			// May want to change this to use read and handle paging ourselves in backbone
			// This will provide better support for the desired nextPage() previousPage() functions
			var req = stretchr.at(model.url);
			if (model.stretchrParams) {
				_.each(model.stretchrParams, function(value, key) {
					// NOTE : This may need to be changed to set.  set replaces, params adds to an array
					if (value instanceof Array) {
						for (var i in value) {
							req.param(key, value[i]);
						}
					} else {
						req.param(key, value);
					}
				});
			}

			//params are done, make the request
			req.read({
				success: function(response) {
					callback(null, response.data()[Stretchr.ResponseKeyCollectionItems]);
				},
				error: function(response) {
					callback(response.errorMessage());
				}
			});
		},

		update: function(model, callback) {
			//call an actual update, b/c we want to delete fields if they aren't part of it any longer
			stretchr.at(model.url()).update(model.attributes, {
				success: function(response) {
					callback(null, response.changes()[Stretchr.ResponseKeyChangeInfoDeltas]);
				},
				error: function(response) {
					callback(response.errorMessage());
				}
			});
		},

		create: function(model, callback) {
			stretchr.at(model.url()).create(model.attributes, {
				success: function(response) {
					if (response.changes()[Stretchr.ResponseKeyChangeInfoDeltas] instanceof Array) {
						//TODO : Handle creating multiple at once
						callback(null, response.changes()[Stretchr.ResponseKeyChangeInfoDeltas][0])
					} else {
						//not an array
						callback(null, response.changes()[Stretchr.ResponseKeyChangeInfoDeltas])
					}
				},
				error: function(response) {
					callback(response.errorMessage());
				}
			});
		},

		delete: function(model, callback) {
			stretchr.at(model.url()).remove({
				success: function(response) {
					callback();
				},
				error: function(response) {
					callback(response.errorMessage());
				}
			});
		}
	}
}()

Backbone.sync = function(method, model, options, error) {
	//default to the original sync method
	var syncMethod = Backbone.originalSync;
	if (model.stretchr || (model.collection && model.collection.stretchr)) {
		//looks like we've got a stretchr object here, so update to the stretchr method
		syncMethod = Backbone.Stretchr.sync;
	}
	//call the appropriate sync method
	return syncMethod.apply(Backbone.Stretchr, [method, model, options, error]);
}