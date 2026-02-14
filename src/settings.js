import * as fs from 'fs';

export let ssc = JSON.parse(fs.readFileSync('config/ssc.json'));
export let discord = JSON.parse(fs.readFileSync('config/discord.json'));
export let secrets = JSON.parse(fs.readFileSync('config/secrets.json'));
