let fetch = require('node-fetch');
let qs = require("querystring");

const version = 'v1';

function vibeWorkaround(user) {
    return user.replace(/\//g, "");
}

class Client {
    constructor(options) {
        this.endpoint = options.endpoint;
        this.key = options.key;

        this.base_url = `${this.endpoint}/api/${version}`
    }

    async getServers(callback) {
        let query = qs.stringify({ key: this.key });

        try {
            let response = await fetch(`${this.base_url}/servers/?${query}`);
            let json = await response.json();

            if (response.status != 200) {
                callback(response.status, json)
            } else {
                callback(null, json);
            }
        } catch (err) {
            callback('' + err);
        }
    }

    async createBooking(user, hours, callback) {
        let query = qs.stringify({ key: this.key, user: vibeWorkaround(user), hours: hours });

        try {
            let response = await fetch(`${this.base_url}/bookings/?${query}`, {method: 'POST'});
            let json = await response.json();

            if (response.status != 200) {
                callback(response.status, json)
            } else {
                callback(null, json);
            }
        } catch (err) {
            callback('' + err);
        }
    }

    async getBooking(user, callback) {
        user = encodeURIComponent(vibeWorkaround(user));
        let query = qs.stringify({ key: this.key });


        try {
            let response = await fetch(`${this.base_url}/bookings/${user}/?${query}`);
            let json = await response.json();

            if (response.status != 200) {
                callback(response.status, json)
            } else {
                callback(null, json);
            }
        } catch (err) {
            callback('' + err);
        }
    }

    async deleteBooking(user, callback) {
        user = encodeURIComponent(vibeWorkaround(user));
        let query = qs.stringify({ key: this.key });

        try {
            let response = await fetch(`${this.base_url}/bookings/${user}/?${query}`, {method: 'DELETE'});
            let json = await response.json();

            if (response.status != 204) {
                callback(response.status, json)
            } else {
                callback(null, json);
            }
        } catch (err) {
            callback('' + err);
        }
    }
}

module.exports = {
    Client: Client,
    version: version,
    vibeWorkaround: vibeWorkaround,
}
