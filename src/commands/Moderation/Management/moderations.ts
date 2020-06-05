import { Collection } from '@discordjs/collection';
import { ModerationManagerEntry } from '@lib/structures/ModerationManagerEntry';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { PermissionLevels } from '@lib/types/Enums';
import { LanguageKeys } from '@lib/types/Languages';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, Moderation } from '@utils/constants';
import { getColor } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage, KlasaUser, util } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['moderation'],
	bucket: 2,
	cooldown: 10,
	description: language => language.tget('COMMAND_MODERATIONS_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_MODERATIONS_EXTENDED'),
	permissionLevel: PermissionLevels.Moderator,
	requiredPermissions: ['MANAGE_MESSAGES'],
	runIn: ['text'],
	usage: '<mutes|warnings|warns|all:default> [user:username]'
})
export default class extends RichDisplayCommand {

	public async run(message: KlasaMessage, [action, target]: ['mutes' | 'warnings' | 'warns' | 'all', KlasaUser?]) {
		const response = await message.sendEmbed(new MessageEmbed()
			.setDescription(message.language.tget('SYSTEM_LOADING'))
			.setColor(BrandingColors.Secondary));

		const entries = (await (target ? message.guild!.moderation.fetch(target.id) : message.guild!.moderation.fetch()))
			.filter(this.getFilter(action, target));
		if (!entries.size) throw message.language.tget('COMMAND_MODERATIONS_EMPTY');

		const display = new UserRichDisplay(new MessageEmbed()
			.setColor(getColor(message))
			.setAuthor(this.client.user!.username, this.client.user!.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setTitle(message.language.tget('COMMAND_MODERATIONS_AMOUNT', entries.size)));

		// Fetch usernames
		const usernames = await (target ? this.fetchAllModerators(entries) : this.fetchAllUsers(entries));

		// Set up the formatter
		const durationDisplay = message.language.duration.bind(message.language);
		const shouldDisplayName = action === 'all';
		const i18n = message.language.tget('COMMAND_MODERATIONS_ENTRY_DATA');
		const format = target
			? this.displayModerationLogFromModerators.bind(this, i18n, usernames, durationDisplay, shouldDisplayName)
			: this.displayModerationLogFromUsers.bind(this, i18n, usernames, durationDisplay, shouldDisplayName);

		for (const page of util.chunk([...entries.values()], 10)) {
			display.addPage((template: MessageEmbed) => {
				for (const entry of page) {
					const field = format(entry);
					template.addField(field.name, field.value);
				}
				return template;
			});
		}

		await display.start(response, message.author.id);
		return response;
	}

	private displayModerationLogFromModerators(i18n: LanguageKeys['COMMAND_MODERATIONS_ENTRY_DATA'], users: Map<string, string>, duration: DurationDisplay, shouldDisplayName: boolean, entry: ModerationManagerEntry) {
		const remainingTime = entry.duration === null || entry.createdAt === null ? null : (entry.createdAt + entry.duration) - Date.now();
		const isExpired = remainingTime !== null && remainingTime <= 0;
		const formattedModerator = users.get(entry.flattenedModerator);
		const formattedReason = entry.reason || i18n.REASON_NONE;
		const formattedDuration = i18n.FORMATTED_DURATION(remainingTime, isExpired);
		const formattedValue = i18n.FORMATTED_VALUE('moderator', formattedModerator as string, formattedReason, formattedDuration);
		return {
			name: i18n.TITLE(shouldDisplayName, entry),
			value: i18n.VALUE(isExpired, formattedValue)
		};
	}

	private displayModerationLogFromUsers(i18n: LanguageKeys['COMMAND_MODERATIONS_ENTRY_DATA'], users: Map<string, string>, duration: DurationDisplay, shouldDisplayName: boolean, entry: ModerationManagerEntry) {
		const remainingTime = entry.duration === null || entry.createdAt === null ? null : (entry.createdAt + entry.duration) - Date.now();
		const isExpired = remainingTime !== null && remainingTime <= 0;
		const formattedUser = users.get(entry.flattenedUser);
		const formattedReason = entry.reason || i18n.REASON_NONE;
		const formattedDuration = i18n.FORMATTED_DURATION(remainingTime, isExpired);
		const formattedValue = i18n.FORMATTED_VALUE('user', formattedUser as string, formattedReason, formattedDuration);
		return {
			name: i18n.TITLE(shouldDisplayName, entry),
			value: i18n.VALUE(isExpired, formattedValue)
		};
	}

	private async fetchAllUsers(entries: Collection<number, ModerationManagerEntry>) {
		const users = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.flattenedUser;
			if (!users.has(id)) users.set(id, await this.client.userTags.fetchUsername(id));
		}
		return users;
	}

	private async fetchAllModerators(entries: Collection<number, ModerationManagerEntry>) {
		const moderators = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.flattenedModerator;
			if (!moderators.has(id)) moderators.set(id, await this.client.userTags.fetchUsername(id));
		}
		return moderators;
	}

	private getFilter(type: 'mutes' | 'warnings' | 'warns' | 'all', target: KlasaUser | undefined) {
		switch (type) {
			case 'mutes':
				return target
					? (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Mute)
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Mute)
						&& !entry.invalidated && !entry.appealType;
			case 'warns':
			case 'warnings':
				return target
					? (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Warn)
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Warn)
						&& !entry.invalidated && !entry.appealType;
			case 'all':
			default:
				return target
					? (entry: ModerationManagerEntry) => entry.duration !== null
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.duration !== null
						&& !entry.invalidated && !entry.appealType;
		}
	}

}

type DurationDisplay = (time: number) => string;
