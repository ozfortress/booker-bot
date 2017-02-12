let request = require('request');
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

    getServers(callback) {
        let query = qs.stringify({ key: this.key });

        request.get(
            `${this.base_url}/servers/?${query}`,
            (error, response, body) => {
                if (error || response.statusCode != 200) {
                    callback(error || response.statusCode, body);
                } else {
                    callback(null, JSON.parse(body));
                }
            }
        );
    }

    createBooking(user, hours, callback) {
        let query = qs.stringify({ key: this.key, user: vibeWorkaround(user), hours: hours });

        request.post(
            `${this.base_url}/bookings/?${query}`,
            (error, response, body) => {
                if (error || response.statusCode != 200) {
                    callback(error || response.statusCode, body);
                } else {
                    callback(null, JSON.parse(body));
                }
            }
        );
    }

    getBooking(user, callback) {
        user = encodeURIComponent(vibeWorkaround(user));
        let query = qs.stringify({ key: this.key });
        request.get(
            `${this.base_url}/bookings/${user}/?${query}`,
            (error, response, body) => {
                if (error || response.statusCode != 200) {
                    callback(error || response.statusCode, body);
                } else {
                    callback(null, JSON.parse(body));
                }
            }
        );
    }

    deleteBooking(user, callback) {
        user = encodeURIComponent(vibeWorkaround(user));
        let query = qs.stringify({ key: this.key });

        request.delete(
            `${this.base_url}/bookings/${user}/?${query}`,
            (error, response, body) => {
                if (error || response.statusCode != 204) {
                    callback(error || response.statusCode);
                } else {
                    callback(null);
                }
            }
        );
    }
}

module.exports = {
    Client: Client,
    version: version,
    vibeWorkaround: vibeWorkaround,
}
