/*jshint eqeqeq:false */
(function (window) {
	'use strict';

	const baseUrl = 'http://localhost:5065';

	function DataApi(callback) {

		this.todos = [];
		this.dataInitialized = false;
		console.log(`DataApi object initialized`);
		callback = callback || function () { };


	}

	/**
	 * Finds items based on a query given as a JS object

	 * @example
	 * db.find({id: 123}, function (data) {
	 *	 // data will return any item that have id of 123
	 * });
	 */
	DataApi.prototype.find = function (query, callback) {

		console.log(`DataApi find`);

		if (!callback) {
			return;
		}

		fetch(`${baseUrl}/todoitems/${query.id}`,
			{
				method: 'Get',
				headers: { 'Content-Type': 'application/json' }
			}).then(function (response) {

				// The API call was successful!
				if (response.ok) {
					return response.json();
				}

				// There was an error
				return Promise.reject(response);

			}).then(function (data) {
				console.log(data);
				callback(data);
			}).catch(function (err) {
				// There was an error
				console.warn('Something went wrong.', err);
			});

	};
	DataApi.prototype.count = function (callback) {
		var counts = {
			active: 0,
			completed: 0,
			total: 0
		};

		console.log(`Model getCount`);

		this.todos.forEach(function (todo) {
			if (counts.completed) {
				counts.completed++;
			} else {
				counts.active++;
			}

			counts.total++;
		});
		callback(counts);
	}

	/**
	 * Will retrieve all data from the collection
	 *
	 * @param {function} callback The callback to fire upon retrieving data
	 */
	DataApi.prototype.findAll = function (callback) {

		console.log(`DataApi findAll`);

		callback = callback || function () { };

		if(this.dataInitialized){
			callback(this.todos);
		} 

		fetch(`${baseUrl}/todoitems`,
			{   mode: 'cors',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			}).then(function (response) {

				// The API call was successful!
				if (response.ok) {
					return response.json();
				}

				// There was an error
				return Promise.reject(response);

			}).then(function (data) {
				console.log(data);
				this.todos = data;
				this.dataInitialized = true;
				callback(data);
			}).catch(function (err) {
				// There was an error
				console.warn('Something went wrong.', err);
			});


	};

	/**
	 * Will save the given data to the DB. If no item exists it will create a new
	 * item, otherwise it'll simply update an existing item's properties
	 *
	 * @param {object} updateData The data to save back into the DB
	 * @param {function} callback The callback to fire after saving
	 * @param {number} id An optional param to enter an ID of an item to update
	 */
	DataApi.prototype.save = function (updateData, callback, id) {
		console.log(`DataApi save`);

		callback = callback || function () { };

		// If an ID was actually given, find the item and update each property
		if (id) {

			console.log(`DataApi update`);

			fetch(`${baseUrl}/todoitems/${id}`,
				{
					method: 'Put',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				}).then(function (response) {

					// The API call was successful!
					if (response.ok) {
						return response.json();
					}

					// There was an error
					return Promise.reject(response);

				}).then(function (data) {
					console.log(data);
					callback([data]);
				}).catch(function (err) {
					// There was an error
					console.warn('Something went wrong.', err);
				});


		} else {
			console.log(`DataApi insert`);
			fetch(`${baseUrl}/todoitems`,
				{
					method: 'Post',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				}).then(function (response) {

					// The API call was successful!
					if (response.ok) {
						return response.json();
					}

					// There was an error
					return Promise.reject(response);

				}).then(function (data) {
					console.log(data);
					callback([data]);
				}).catch(function (err) {
					// There was an error
					console.warn('Something went wrong.', err);
				});

		}
	};

	// Delete 1
	DataApi.prototype.remove = function (id, callback) {
		console.log(`DataApi remove`);

		fetch(`${baseUrl}/todoitems/${id}`,
			{
				method: 'Delete',
				headers: { 'Content-Type': 'application/json' }
			}).then(function (response) {

				// The API call was successful!
				if (response.ok) {
					return response.json();
				}

				// There was an error
				return Promise.reject(response);

			}).then(function (data) {
				console.log(data);
				callback(todos);
			}).catch(function (err) {
				// There was an error
				console.warn('Something went wrong.', err);
			});

	};

	// Delete all todos
	DataApi.prototype.drop = function (callback) {

		console.log(`DataApi drop`);

		fetch(`${baseUrl}/todoitems`,
			{
				method: 'Delete',
				headers: { 'Content-Type': 'application/json' }
			}).then(function (response) {

				// The API call was successful!
				if (response.ok) {
					return response.json();
				}

				// There was an error
				return Promise.reject(response);

			}).then(function (data) {
				console.log(data);
				todos = [];
				callback([]);
			}).catch(function (err) {
				// There was an error
				console.warn('Something went wrong.', err);
			});

	};

	// Export to window
	window.app = window.app || {};
	window.app.DataApi = DataApi;
})(window);
