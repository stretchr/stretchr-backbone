/**

  Backbone Stretch Integration
   - requires Stretchr JS SDK

  by Ryan Quinn
  Copyright (c) 2013 Stretchr, Inc.

  Please consider promoting this project if you find it useful.

  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
  to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies
  or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
  PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
  FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
  DEALINGS IN THE SOFTWARE.

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
						if (options && options.error) {
							options.error(err);
						}
					} else {
						data = res;
						//FIXME : Looks like backbone doesn't fire sync/error like I thought
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
							req.params(key, value[i]);
						}
					} else {
						req.params(key, value);
					}
				});
			}

			//params are processed, now let's make the request
			req.read({
				success: function(response) {
					callback(null, response.data());
				},

				error: function(response) {
					callback(response.errorMessage() || "unknown error");
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
							req.params(key, value[i]);
						}
					} else {
						req.params(key, value);
					}
				});
			}

			//params are done, make the request
			req.read({
				success: function(response) {
					callback(null, response.data()[Stretchr.ResponseKeyCollectionItems]);
				},
				error: function(response) {
					callback(response.errorMessage() || "unknown error");
				}
			});
		},

		update: function(model, callback) {
			//call a create, b/c we want to delete fields if they aren't part of it any longer, so this will send a put
			stretchr.at(model.url()).create(model.attributes, {
				success: function(response) {
					callback(null, response.changes().data()[Stretchr.ResponseKeyChangeInfoDeltas]);
				},
				error: function(response) {
					callback(response.errorMessage());
				}
			});
		},

		patch: function(model, callback) {
			stretchr.at(model.url()).update(model.changedAttributes(), {
				success: function(response) {
					callback(null, response.changes().data()[Stretchr.ResponseKeyChangeInfoDeltas]);
				},
				error: function(response) {
					callback(response.errorMessage());
				}
			})
		},

		create: function(model, callback) {
			stretchr.at(model.url()).create(model.attributes, {
				success: function(response) {
					if (response.changes()[Stretchr.ResponseKeyChangeInfoDeltas] instanceof Array) {
						//TODO : Handle creating multiple at once
						callback(null, response.changes().data()[Stretchr.ResponseKeyChangeInfoDeltas][0])
					} else {
						//not an array
						callback(null, response.changes().data()[Stretchr.ResponseKeyChangeInfoDeltas][0])
					}
				},
				error: function(response) {
					callback(response.errorMessage() || "unknown error");
				}
			});
		},

		delete: function(model, callback) {
			stretchr.at(model.url()).remove({
				success: function(response) {
					callback();
				},
				error: function(response) {
					callback(response.errorMessage() || "unknown error");
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