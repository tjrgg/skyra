const { API, toJSON } = require('../../index');

module.exports = class extends API {

	run({ guildID }) {
		return (guild => guild ? guild.roles.values().map(toJSON.role) : null)(this.client.guilds.get(guildID));
	}

};