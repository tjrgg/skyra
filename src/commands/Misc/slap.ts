import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { CLIENT_ID } from '@root/config';
import { ApplyOptions } from '@skyra/decorators';
import { assetsFolder } from '@utils/constants';
import { fetchAvatar, radians } from '@utils/util';
import { Canvas } from 'canvas-constructor';
import { promises as fsp } from 'fs';
import { KlasaMessage, KlasaUser } from 'klasa';
import { join } from 'path';

@ApplyOptions<SkyraCommandOptions>({
	bucket: 2,
	cooldown: 30,
	description: language => language.tget('COMMAND_SLAP_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_SLAP_EXTENDED'),
	requiredPermissions: ['ATTACH_FILES'],
	runIn: ['text'],
	spam: true,
	usage: '<user:username>'
})
export default class extends SkyraCommand {

	private kTemplate: Buffer | null = null;
	private readonly skyraID = CLIENT_ID;

	public async run(message: KlasaMessage, [user]: [KlasaUser]) {
		const attachment = await this.generate(message, user);
		return message.channel.send({ files: [{ attachment, name: 'slap.png' }] });
	}

	public async generate(message: KlasaMessage, user: KlasaUser) {
		let selectedUser: KlasaUser | undefined = undefined;
		let slapper: KlasaUser | undefined = undefined;
		if (user.id === message.author.id && this.client.options.owners.includes(message.author.id)) throw '💥';
		if (user === message.author) [selectedUser, slapper] = [message.author, this.client.user!];
		else if (this.client.options.owners.concat(this.skyraID).includes(user.id)) [selectedUser, slapper] = [message.author, user];
		else [selectedUser, slapper] = [user, message.author];

		const [robin, batman] = await Promise.all([
			fetchAvatar(selectedUser, 256),
			fetchAvatar(slapper, 256)
		]);

		/* Initialize Canvas */
		return new Canvas(950, 475)
			.addImage(this.kTemplate!, 0, 0, 950, 475)

			// Draw Batman
			.save()
			.setTransform(-1, 0, 0, 1, 476, 173)
			.rotate(radians(-13.96))
			.addCircularImage(batman, 0, 0, 79)
			.restore()

			// Draw Robin
			.translate(244, 265)
			.rotate(radians(-24.53))
			.addCircularImage(robin, 0, 0, 93)

			// Draw the buffer
			.toBufferAsync();
	}

	public async init() {
		this.kTemplate = await fsp.readFile(join(assetsFolder, './images/memes/slap.png'));
	}

}
