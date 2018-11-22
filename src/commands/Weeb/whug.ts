import { WeebCommand } from '../../index';

export default class extends WeebCommand {

	public constructor(client: Client, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: (language) => language.get('COMMAND_WHUG_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WHUG_EXTENDED'),
			queryType: 'hug',
			responseName: 'COMMAND_WHUG',
			usage: '<user:username>'
		});
	}

}