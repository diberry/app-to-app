/*jshint eqeqeq:false */
(function (window) {
    'use strict';

    let baseUrl;

    if(process.env.NODE_ENV==='development'){
        baseUrl = 'http://localhost:5065';
    } else {
        baseUrl = 'https://diberry-app-fe.azurewebsites.net';
    }


    /**
	 * Creates a new client side storage object and will create an empty
	 * collection if no collection already exists.
	 */
    function Store() {

        this._todoList = [];
    }

    /**
     * Get the authentication token - make a request to the client's server
     * to get a token.
     * 
     * @returns 
     */
    Store.prototype.getToken = function () {
        const response = await fetch(`document.location`,
            {
                method: `HEAD`
            });

        response.headers.split("\n")
            .map(x=>x.split(/: */,2))
            .filter(x=>x[0])
            .reduce((ac, x)=>{ac[x[0]] = x[1];return ac;}, {});

        
    }


    /**
     * Get client-side data list - doesn't refetch from server
     * @returns {Array} Returns the todo list
     */
    Store.prototype.getExistingData = function () {
        return Promise.resolve(this._todoList);
    }

    /**
     * 
     * @param {object} query to match against (i.e. {id: 3})
     * @param {*} callback 
     * @returns {object} todo item wrapped in callback
     */
    Store.prototype.find = async function (query, callback) {

		if (!callback) {
			return;
		}

		callback.call(this, this._todoList.filter(function (todo) {
			for (var q in query) {
				if (query[q] !== todo[q]) {
					return false;
				}
			}
			return true;
		}));
    };

    /**
     * Fetch data from server and update client-side data list
     * 
     * @param {function} callback 
     * @returns data or callback(data) - depending on who called it
     */
    Store.prototype.findAll = async function (callback) {
        try {

            const response = await this.fetchFromApi('/todoitems', 'GET')

            if (!response.ok) {

                if (callback !== undefined) return callback(response);
                return response;
            }

            const jsonResponse = await response.json();
            this._todoList = jsonResponse;
            console.log(`findAll: ${JSON.stringify(this._todoList)}`);

            if (callback !== undefined) return callback(jsonResponse);
            return jsonResponse;
        } catch (err) {
            console.warn('Something went wrong.', err);
        };
    };

    /**
     * Insert or update item to server and update client-side data list
     * 
     * @param {*} updateData 
     * @param {*} callback 
     * @param {*} id - only for update, not for insert
     */
    Store.prototype.save = async function (updateData, callback, id) {

        callback = callback || function () { };

        let response = undefined;

        try {
            if (id) {
                // used to update Title or Completed

                let originalItem = this._todoList.filter((item) => { return item.id === id });
                if(originalItem.length !== 1) throw Error("can't find item with id: " + id);

                let updatedItem = { ...(originalItem[0]), ...updateData };
                
                response = await this.fetchFromApi(`/todoitems/${id}`, 'PUT', updatedItem);
            } else {
                response = await this.fetchFromApi('/todoitems', 'POST', updateData)
            }

            if (!response.ok) throw response;

            await response.json();
            const responseGetAllData = await this.findAll();
            callback(responseGetAllData);
        } catch (err) {
            console.warn('Something went wrong.', err);
        }
    };

    /**
     * Remote item from server and update client-side data list
     * 
     * @param {*} id 
     * @param {*} callback 
     */
    Store.prototype.remove = async function (id, callback) {

        try {
            const response = await this.fetchFromApi(`/todoitems/${id}`, "DELETE");
            if (!response.ok) throw response;
            const responseGetAllData = await this.findAll();
            callback(responseGetAllData);
        } catch (err) {
            console.warn('Something went wrong.', err);
        }
    };

    /**
     * Delete all items from server and update client-side data list
     * 
     * @param {*} callback 
     */
    Store.prototype.drop = async function (callback) {

        try {
            const response = await this.fetchFromApi('/todoitems/', "DELETE");
            if (!response.ok) throw response;
            this._todoList = [];
            callback([]);
        } catch (err) {
            // There was an error
            console.warn('Something went wrong.', err);
        };
    };

    /**
     *  Fetch data from server
     * 
     * @param {*} url 
     * @param {*} method 
     * @param {*} body 
     * @returns 
     */
    Store.prototype.fetchFromApi = async function (url, method, body) {

        console.log(`${method} ${url} ${JSON.stringify(body)}`);

        const response = await fetch(`${baseUrl}${url}`,
            {
                method: `${method}`,
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
                headers: new Headers({
                    'Authorization': 'Bearer ' + localStorage.getItem('token'), 
                    'Content-Type': 'application/json'
                  }), 
            });

        return response;
    }

    // Export to window
    window.app = window.app || {};
    window.app.Store = Store;
})(window);