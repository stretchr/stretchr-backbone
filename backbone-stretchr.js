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
				this[method](model, function(err, res) {
					if (err) {
						//TODO : Handle the error!
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
			stretchr.at(model.url()).read(function(response) {
				if (response["~status"] == "200") {
					//success
					callback(null, response["~data"]);
				} else {
					//failure, just return the whole response!
					callback(response);
				}
			});
		},

		readAll: function(model, callback) {
			//in this case, model will always be null
			stretchr.at(model.url).readAll({onCompleted: function(response) {
				if (response["~status"] == "200" && response["~data"]) {
					callback(null, response["~data"]["~items"]);
				} else {
					//failure, just return the whole response!
					callback(response);
				}
			}});
		},

		update: function(model, callback) {
			//call an actual update, b/c we want to delete fields if they aren't part of it any longer
			stretchr.at(url).body(model.parameters).update(function(response) {
				res = response;
			});
		},

		create: function(model, callback) {
			var res;
			stretchr.at(url).body(model.parameters).create(function(response) {
				res = response;
			});
			return res;
		},

		destroy: function(model, callback) {
			var res;
			stretchr.at(url).remove(function(response) {
				res = response;
			});
			return res;
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