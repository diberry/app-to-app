/*jshint eqeqeq:false */
(function (window) {
	'use strict';
    const baseUrl = 'http://localhost:5065';
	/**
	 * Creates a new client side storage object and will create an empty
	 * collection if no collection already exists.
	 *
	 * @param {string} name The name of our DB we want to use
	 * @param {function} callback Our fake DB uses callbacks because in
	 * real life you probably would be making AJAX calls
	 */
	function Store(name) {

		this._dbName = name;
        this._todoList = [];
        this._todoListInitialized = false;

	}

	/**
	 * Finds items based on a query given as a JS object
	 *
	 * @param {object} query The query to match against (i.e. {foo: 'bar'})
	 * @param {function} callback	 The callback to fire when the query has
	 * completed running
	
	 * @example
	 * db.find({foo: 'bar', hello: 'world'}, function (data) {
	 *	 // data will return any items that have foo: bar and
	 *	 // hello: world in their properties
	 * });
	 */
	Store.prototype.find = function (query, callback) {
		if (!callback) {
			return;
		}
        
        var partialTitle = query.title;

		this.fetchFromApi(`/todoitems/filter/${partialTitle}`,'GET')
        .then(function (response) {

            // The API call was successful!
            if (response.ok) {
                return response.json();
            }

            // There was an error
            return Promise.reject(response);

        }).then(function (data) {
            // partial set of Todos - not full list
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
		callback = callback || function () {};

        if(this._todoListInitialized){
            callback(_todoList);
        }

        this.fetchFromApi('/todoitems','GET').then(function (response) {

            // The API call was successful!
            if (response.ok) {
                return response.json();
            }

            // There was an error
            return Promise.reject(response);

        }).then(this.setData.bind(this))
        .then(function (data) {

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

		callback = callback || function() {};

		// If an ID was actually given, find the item and update each property
		if (id) {
            // returns all data
            this.fetchFromApi('/todoitems','PUT', updateData)
            .then(function (response) {

                // The API call was successful!
                if (response.ok) {
                    return response.json();
                }
    
                // There was an error
                return Promise.reject(response);
    
            })
            .then(this.findAll.bind(this))
            .then(function (data) {
                // return all todos
                callback(data);
            }).catch(function (err) {
                // There was an error
                console.warn('Something went wrong.', err);
            });
		} else {

            // returns 1 data
            this.fetchFromApi('/todoitems','POST', updateData)
            .then(function (response) {

                // The API call was successful!
                if (response.ok) {
                    return response.json();
                }
    
                // There was an error
                return Promise.reject(response);
    
            })
            .then(function (insertedObject) {
                // return all todos
                callback.call(this, [insertedObject]);
            }).catch(function (err) {
                // There was an error
                console.warn('Something went wrong.', err);
            });
			
		}
	};

	/**
	 * Will remove an item from the Store based on its ID
	 *
	 * @param {number} id The ID of the item you want to remove
	 * @param {function} callback The callback to fire after saving
	 */
	Store.prototype.remove = function (id, callback) {

        fetch(`/todoitems/${id}`,"DELETE")
        .then(function (response) {

            // The API call was successful!
            if (response.ok) {
                return Promise.resolve([]);
            }

            // There was an error
            return Promise.reject(response);

        })            
        .then(this.findAll.bind(this))
        .then(function (data) {

            callback(data);
        }).catch(function (err) {
            // There was an error
            console.warn('Something went wrong.', err);
        });

	};

	/**
	 * Will drop all storage and start fresh
	 *
	 * @param {function} callback The callback to fire after dropping the data
	 */
	Store.prototype.drop = function (callback) {

        fetch('/todoitems/',"DELETE")
        .then(function (response) {

            // The API call was successful!
            if (response.ok) {
                return Promise.resolve([]);
            }

            // There was an error
            return Promise.reject(response);

        })
        .then(this.findAll.bind(this))
        .then(function (data) {

            callback(data);
        }).catch(function (err) {
            // There was an error
            console.warn('Something went wrong.', err);
        });
	};

    Store.prototype.fetchFromApi = function(url, method, body){
        return fetch(`${baseUrl}${url}`,
        {
            method: `${method}`,
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
    }
    Store.prototype.setData = function(data){
        console.log(data);

            this._todoListInitialized = true;
            this._todoList=data;
        return Promise.resolve(data);
    }

	// Export to window
	window.app = window.app || {};
	window.app.Store = Store;
})(window);