let Discord = require("discord.js");
let columnify = require("columnify");
let stringSimilarity = require('string-similarity');
let base32 = require('hi-base32');

let SSC = require("./ssc.js");
let settings = require("./settings.js");

"use strict";

// The Discord API stupidly doesn't have a method to get the person's actual name on discord
function fullname(user) {
    return `${user.username}#${user.discriminator}`;
}

const HELP_MESSAGE = "```\
Discord Server Booker Usage\n\
---------------------------\n\
/book                   - Book a new server\n\
/unbook                 - Return a server\n\
/string                 - Get the string for your active booking\n\
/demos [username]       - Get STV demo link (user optional)\n\
/servers                - List the status of all servers\n\
/help                   - Display this message\n\n\
Commands can be sent in the #bookings channel or via PM to the bot.\n\
Bot written by smeso and /dev/zero.\n\
```";

const BOOKING_DURATION = 3; // hours

const SIMILARITY_MARGIN = 0.7;

let ssc = new SSC.Client({
    endpoint: settings.ssc.endpoint,
    key: settings.secrets.ssc_key,
});

let discordBot = new Discord.Client( { fetchAllMembers: true } );

discordBot.login(settings.secrets.discord_token);

discordBot.on("ready", () => {
    console.log("Discord Bot connected to server.");
    discordBot.user.setStatus("online");
    discordBot.user.setGame("catch with Elizabeth!");
});

discordBot.on("message", msg => {
    let content = msg.content;
    let user = msg.author;

    let prefix = content[0];
    let command = content.substring(1, content.length).split(" ");

    // Ignore all messages that aren't DMs or aren't in the channels
    if (msg.channel.type !== "dm" && !settings.discord.channels.includes(msg.channel.name)) {
        return;
    }

    if (prefix === "!" || prefix === "/") {
        Log(`${fullname(user)}: ${content}`);

        // command to function mappings
        book = () => BookServer(user);
        unbook = () => UnbookServer(user);
        demos = () => RequestDemos(user, command[1]);
        servers = () => ServerList(msg.channel);
        server_status = () => ServerStatus(user);
        help = () => msg.channel.sendMessage(HELP_MESSAGE);

        commandFunctions = {
            "book": book,
            "unbook": unbook,
            "return": unbook,
            "reset": unbook,
            "demos": demos,
            "demo": demos,
            "servers": servers,
            "status": servers,
            "string": server_status,
            "help": help,
        }

        commandFn = commandFunctions[command[0]];
        if (commandFn) {
            commandFn();
        }
    }
});

// LOGGING

function Log() {
    let message = `[${new Date()}] ${Array.from(arguments).join(' ')}`;
    console.log(message);
}

function LogError() {
    // console.log(arguments);
    Log("[ERROR]", Array.from(arguments).slice(1).join(' '));
}

function SendError(user) {
    // console.log(arguments);
    LogError.apply(null, arguments);
    user.sendMessage("Something went wrong, please notify your local administrator to check the logs.");
}

// COMMANDS

function BookServer(user) {
    ssc.createBooking(fullname(user), BOOKING_DURATION, (error, result) => {
        if (error) {
            if (error == 409) {
                ResendServer(user);
                return;
            } else if (error == 500) {
                try {
                    let json = JSON.parse(result);
                    if (json['statusMessage'] == "No server available") {
                        user.sendMessage(`There are no available servers left to book`);
                        return;
                    }
                } catch (e) {}
            }

            SendError(user, error, result);
            return;
        }

        let server = result.server;
        let string = '```' + server['connect-string'] + '```';
        let msg = `Your booking for Server **${server.name}** lasts **${BOOKING_DURATION} hours**:\n${string}`;
        user.sendMessage(msg);
    });
}

function ResendServer(user) {
    ssc.getBooking(fullname(user), (error, result) => {
        if (error) {
            SendError(user, error, result);
            return;
        }

        let server = result.server;
        let string = '```' + server['connect-string'] + '```';
        let msg = `You have already booked Server **${server.name}** for **${BOOKING_DURATION} hours**:\n${string}`;
        user.sendMessage(msg);
    });
}

function ServerStatus(user) {
    ssc.getBooking(fullname(user), (error, result) => {
        if (error) {
            if (error == 404) {
                user.sendMessage("You have not booked a server.");
                returnl
            }

            SendError(user, error, result);
            return;
        }

        let server = result.server;
        let string = '```' + server['connect-string'] + '```';
        let msg = `You have booked Server **${server.name}**:\n${string}`;
    });
}

function UnbookServer(user) {
    ssc.deleteBooking(fullname(user), (error, result) => {
        if (error) {
            if (error == 404) {
                user.sendMessage("You have not booked a server.");
                return;
            }

            SendError(user, error, result);
            return;
        }

        user.sendMessage("You have successfully unbooked the server.");
    });
}

function ServerList(channel) {
    ssc.getServers((error, result) => {
        if (error) {
            SendError(channel, error, result);
            return;
        }

        let data = result.servers.map(server => {
            let booking = server.booking;
            let user = '';
            if (booking) {
                user = booking.user;
            }

            return {
                Name: server.name,
                Status: server.status,
                Address: server.address,
                Booker: user,
            };
        });

        let options = {
            columnSplitter: ' | ',
            columns: ["Name", "Status", "Address", "Booker"],
            config: {
                Name: { minWidth: 6, align: 'center' },
                Status: { minWidth: 10 }
            }
        };

        let table = columnify(data, options);

        channel.sendMessage('```' + table + '```');
    });
}

function RequestDemos(user, target) {
    target = target || fullname(user);

    let plainUsers = FindDiscordUsers(target);

    let decodedName = '';
    let decodedUsers = [];
    try {
        decodedName = base32.decode(target.toUpperCase());
        decodedUsers = FindDiscordUsers(decodedName);
    } catch (e) {
        // Ignore
    }

    let result = [];
    let users = plainUsers.concat(decodedUsers);

    users.forEach(foundUser => {
        let escapedName = SSC.vibeWorkaround(fullname(foundUser)); // Remove once vibe.d bug is fixed
        // Demo urls use the base32 lower-case RFC 4648 representation of a user's name
        let encodedName = base32.encode(escapedName).toLowerCase();
        let url = `${settings.ssc.demo_root_path}/${settings.ssc.client}/${encodedName}`;

        result.push(`- **@${fullname(foundUser)}** : ${url}`);
    });

    let name = `'${target}'`
    if (decodedUsers.length > 0) {
        name += ` (${decodedName})`
    }
    let message = `Found *${users.length}* users for **${name}**:\n\n${result.join('\n')}`;
    user.sendMessage(message);
}

// HELPERS

function FindDiscordUsers(query) {
    let matches = [];
    let similarity = string => stringSimilarity.compareTwoStrings(query, string);

    // Look through all guilds and their users
    discordBot.guilds.forEach(guild => {
        guild.members.forEach(member => {
            let user = member.user;

            // Check username and fullname for similarity
            let value = Math.max(
                similarity(user.username),
                similarity(fullname(user))
            );

            if (value > SIMILARITY_MARGIN) {
                matches.push([value, user]);
            }
        });
    });

    // Return sorted by value, the users
    return matches.sort((a, b) => a[0] - b[0]).map(e => e[1]);
}

// PROCESS LISTENERS

process.on('uncaughtException', err => {
  console.log(err);
});

process.on("SIGINT", () => {
    discordBot.destroy();
    process.exit();
});

process.on("exit", () => {
    discordBot.destroy();
    process.exit();
});
