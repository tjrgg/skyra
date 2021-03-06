import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { assetsFolder } from '@utils/constants';
import { fetchAvatar, radians } from '@utils/util';
import { Canvas } from 'canvas-constructor';
import { promises as fsp } from 'fs';
import { KlasaMessage, KlasaUser } from 'klasa';
import { join } from 'path';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['goof', 'goofy', 'daddy', 'goofie', 'goofietime'],
	bucket: 2,
	cooldown: 30,
	description: language => language.tget('COMMAND_GOOFYTIME_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_GOOFYTIME_EXTENDED'),
	requiredPermissions: ['ATTACH_FILES'],
	runIn: ['text'],
	spam: true,
	usage: '<user:username>'
})
export default class extends SkyraCommand {

	private kTemplate: Buffer | null = null;

	public async run(message: KlasaMessage, [user]: [KlasaUser]) {
		const attachment = await this.generate(message, user);
		return message.channel.send({ files: [{ attachment, name: 'It\'s Goofy time.png' }] });
	}

	public async generate(message: KlasaMessage, user: KlasaUser) {
		const [goofied, goofy] = await Promise.all([
			fetchAvatar(user, 128),
			fetchAvatar(message.author, 128)
		]);

		return new Canvas(356, 435)
			.addImage(this.kTemplate!, 0, 0, 356, 435)

			// Draw Goofy
			.addCircularImage(goofy, 245, 98, 46)

			// Draw the kid in the floor
			.translate(120, 321)
			.rotate(radians(-45))
			.addCircularImage(goofied, 0, 0, 25)

			// Draw the buffer
			.toBufferAsync();
	}

	public async init() {
		this.kTemplate = await fsp.readFile(join(assetsFolder, './images/memes/goofy.png'));
	}

}
