import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { cdnFolder } from '@utils/constants';
import { fetchAvatar } from '@utils/util';
import { Canvas } from 'canvas-constructor';
import { promises as fsp } from 'fs';
import { KlasaMessage, KlasaUser } from 'klasa';
import { join } from 'path';

// Skyra's CDN assets folder
const THEMES_FOLDER = join(cdnFolder, 'img', 'banners');
const BADGES_FOLDER = join(cdnFolder, 'img', 'badges');

@ApplyOptions<SkyraCommandOptions>({
	bucket: 2,
	cooldown: 30,
	description: language => language.tget('COMMAND_PROFILE_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_PROFILE_EXTENDED'),
	requiredPermissions: ['ATTACH_FILES'],
	spam: true,
	usage: '[user:username]'
})
export default class extends SkyraCommand {

	private lightThemeTemplate: Buffer | null = null;
	private darkThemeTemplate: Buffer | null = null;
	private lightThemeDock: Buffer | null = null;
	private darkThemeDock: Buffer | null = null;

	public async run(message: KlasaMessage, [user = message.author]: [KlasaUser]) {
		const output = await this.showProfile(message, user);
		return message.channel.send({ files: [{ attachment: output, name: 'Profile.png' }] });
	}

	public async showProfile(message: KlasaMessage, user: KlasaUser) {
		const { users } = await DbSet.connect();
		const settings = await users.ensureProfile(user.id);

		/* Calculate information from the user */
		const previousLevel = Math.floor((settings.level / 0.2) ** 2);
		const nextLevel = Math.floor(((settings.level + 1) / 0.2) ** 2);
		const progressBar = Math.max(Math.round(((settings.points - previousLevel) / (nextLevel - previousLevel)) * 364), 6);

		/* Global leaderboard */
		const rank = await user.fetchRank();
		const [themeImageSRC, imgAvatarSRC] = await Promise.all([
			fsp.readFile(join(THEMES_FOLDER, `${settings.profile.bannerProfile}.png`)),
			fetchAvatar(user, 256)
		]);

		const TITLE = message.language.retrieve('COMMAND_PROFILE');
		const canvas = new Canvas(settings.profile.publicBadges.length ? 700 : 640, 391);
		if (settings.profile.publicBadges.length) {
			const badges = await Promise.all(settings.profile.publicBadges.map(name =>
				fsp.readFile(join(BADGES_FOLDER, `${name}.png`))));

			canvas.addImage(settings.profile.darkTheme ? this.darkThemeDock! : this.lightThemeDock!, 600, 0, 100, 391);
			let position = 20;
			for (const badge of badges) {
				canvas.addImage(badge, 635, position, 50, 50);
				position += 74;
			}
		}

		return canvas
			// Images
			.save()
			.createBeveledClip(10, 10, 620, 371, 8)
			.addImage(themeImageSRC, 9, 9, 188, 373)
			.restore()
			.addImage(settings.profile.darkTheme ? this.darkThemeTemplate! : this.lightThemeTemplate!, 0, 0, 640, 391)

			// Progress bar
			.setColor(`#${settings.profile.color.toString(16).padStart(6, '0') || 'FF239D'}`)
			.addBeveledRect(227, 352, progressBar, 9, 3)

			// Name title
			.setTextFont('35px RobotoRegular')
			.setColor(settings.profile.darkTheme ? '#F0F0F0' : '#171717')
			.addResponsiveText(user.username, 227, 73, 306)
			.setTextFont('25px RobotoLight')
			.addText(`#${user.discriminator}`, 227, 105)

			// Statistics Titles
			.addText(TITLE.GLOBAL_RANK, 227, 276)
			.addText(TITLE.CREDITS, 227, 229)
			.addText(TITLE.REPUTATION, 227, 181)

			// Experience
			.setTextFont('20px RobotoLight')
			.addText(TITLE.EXPERIENCE, 227, 342)

			// Statistics Values
			.setTextAlign('right')
			.setTextFont('25px RobotoLight')
			.addText(rank.toString(), 594, 276)
			.addText(`${settings.money} | ${settings.profile.vault}`, 594, 229)
			.addText(settings.reputations.toString(), 594, 181)
			.addText(settings.points.toString(), 594, 346)

			// Level
			.setTextAlign('center')
			.setTextFont('30px RobotoLight')
			.addText(TITLE.LEVEL, 576, 58)
			.setTextFont('40px RobotoRegular')
			.addText(settings.level.toString(), 576, 100)

			// Avatar
			.addImage(imgAvatarSRC, 32, 32, 142, 142, { type: 'round', radius: 71 })
			.toBufferAsync();
	}

	public async init() {
		[
			this.lightThemeTemplate,
			this.darkThemeTemplate,
			this.lightThemeDock,
			this.darkThemeDock
		] = await Promise.all([
			new Canvas(640, 391)
				.setAntialiasing('subpixel')
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#FFFFFF')
				.createBeveledPath(10, 10, 620, 371, 8)
				.fill()
				.createBeveledClip(10, 10, 620, 371, 5)
				.clearPixels(10, 10, 186, 371)
				.addCircle(103, 103, 70.5)
				.resetShadows()
				.setColor('#E8E8E8')
				.addBeveledRect(226, 351, 366, 11, 4)
				.toBufferAsync(),
			new Canvas(640, 391)
				.setAntialiasing('subpixel')
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#202225')
				.createBeveledPath(10, 10, 620, 371, 8)
				.fill()
				.createBeveledClip(10, 10, 620, 371, 5)
				.clearPixels(10, 10, 186, 371)
				.addCircle(103, 103, 70.5)
				.resetShadows()
				.setColor('#2C2F33')
				.addBeveledRect(226, 351, 366, 11, 4)
				.toBufferAsync(),
			new Canvas(100, 391)
				.setAntialiasing('subpixel')
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#E8E8E8')
				.createBeveledPath(10, 10, 80, 371, 8)
				.fill()
				.toBufferAsync(),
			new Canvas(100, 391)
				.setAntialiasing('subpixel')
				.setShadowColor('rgba(0, 0, 0, 0.7)')
				.setShadowBlur(7)
				.setColor('#272A2E')
				.createBeveledPath(10, 10, 80, 371, 8)
				.fill()
				.toBufferAsync()
		]);
	}

}

export interface ProfileTitles {
	GLOBAL_RANK: string;
	CREDITS: string;
	REPUTATION: string;
	EXPERIENCE: string;
	LEVEL: string;
}
