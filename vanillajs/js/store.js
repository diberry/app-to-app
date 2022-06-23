/*jshint eqeqeq:false */
(function (window) {
	'use strict';

	const baseUrl = 'http://localhost:5065';
	var todos = [];

	function Store(name, callback) {
		callback = callback || function () { };

		// get all items
		fetch(`${baseUrl}/todoitems`,
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
				// This is the JSON from our response
				todos = data;
				console.log(data);
				callback(todos);
			}).catch(function (err) {
				// There was an error
				console.warn('Something went wrong.', err);
			});

	}

	/**
	 * Finds items based on a query given as a JS object

	 * @example
	 * db.find({id: 123}, function (data) {
	 *	 // data will return any item that have id of 123
	 * });
	 */
	Store.prototype.find = function (query, callback) {
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

	/**
	 * Will retrieve all data from the collection
	 *
	 * @param {function} callback The callback to fire upon retrieving data
	 */
	Store.prototype.findAll = function (callback) {
		callback = callback || function () { };

		fetch(`${baseUrl}/todoitems`,
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

	/**
	 * Will save the given data to the DB. If no item exists it will create a new
	 * item, otherwise it'll simply update an existing item's properties
	 *
	 * @param {object} updateData The data to save back into the DB
	 * @param {function} callback The callback to fire after saving
	 * @param {number} id An optional param to enter an ID of an item to update
	 */
	Store.prototype.save = function (updateData, callback, id) {


		callback = callback || function () { };

		// If an ID was actually given, find the item and update each property
		if (id) {

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
	Store.prototype.remove = function (id, callback) {


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
	Store.prototype.drop = function (callback) {

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
	window.app.Store = Store;
})(window);
