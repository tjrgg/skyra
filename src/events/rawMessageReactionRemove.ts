import { WSMessageReactionRemove } from '@lib/types/DiscordAPI';
import { Events } from '@lib/types/Enums';
import { DiscordEvents } from '@lib/types/Events';
import { isTextBasedChannel } from '@utils/util';
import { TextChannel } from 'discord.js';
import { Event, EventStore } from 'klasa';

export default class extends Event {

	public constructor(store: EventStore, file: string[], directory: string) {
		super(store, file, directory, { name: DiscordEvents.MessageReactionRemove, emitter: store.client.ws });
	}

	public run(data: WSMessageReactionRemove) {
		const channel = this.client.channels.get(data.channel_id) as TextChannel;
		if (!channel || !channel.readable || !isTextBasedChannel(channel)) return;
		this.client.emit(Events.RoleReactionRemove, channel, data);
	}

}
