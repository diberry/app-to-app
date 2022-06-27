/*jshint eqeqeq:false */
(function (window) {
    'use strict';
    const baseUrl = 'http://localhost:5065';

    function Store(name) {

        this._dbName = name;
        this._todoList = [];
        this._todoListInitialized = false;
    }

    Store.prototype.find = async function (query) {

        try {
            var partialTitle = query.title;

            const response = await this.fetchFromApi(`/todoitems/filter/${partialTitle}`, 'GET');

            if (!response.ok) callback(response);

            const jsonResponse = await response.json();
            callback(jsonResponse);
        } catch (err) {
            console.warn('Something went wrong.', err);
        };
    };

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

    Store.prototype.save = async function (updateData, callback, id) {

        callback = callback || function () { };

        let response = undefined;

        try {
            if (id) {
                response = await this.fetchFromApi('/todoitems', 'PUT', updateData);
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


    Store.prototype.fetchFromApi = async function (url, method, body) {

        console.log(`${method} ${url} ${JSON.stringify(body)}`);

        const response = await fetch(`${baseUrl}${url}`,
            {
                method: `${method}`,
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });

        return response;
    }

    // Export to window
    window.app = window.app || {};
    window.app.Store = Store;
})(window);