import { WeebCommand } from '../../index';

export default class extends WeebCommand {

	public constructor(client: Client, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: (language) => language.get('COMMAND_WLICK_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WLICK_EXTENDED'),
			queryType: 'lick',
			responseName: 'COMMAND_WLICK',
			usage: '<user:username>'
		});
	}

}