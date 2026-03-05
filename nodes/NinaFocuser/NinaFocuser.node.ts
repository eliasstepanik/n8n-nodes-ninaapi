import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaFocuser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Focuser',
		name: 'ninaFocuser',
		icon: 'fa:bullseye',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control the Focuser via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Focuser' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'ninaApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Info',
						value: 'getInfo',
						description: 'Get focuser info and status',
					},
					{
						name: 'Connect',
						value: 'connect',
						description: 'Connect to a focuser device',
					},
					{
						name: 'Disconnect',
						value: 'disconnect',
						description: 'Disconnect from the current focuser device',
					},
					{
						name: 'List Devices',
						value: 'listDevices',
						description: 'List all available focuser devices',
					},
					{
						name: 'Rescan',
						value: 'rescan',
						description: 'Rescan for available focuser devices',
					},
					{
						name: 'Move',
						value: 'move',
						description: 'Move focuser to a target position',
					},
					{
						name: 'Stop Move',
						value: 'stopMove',
						description: 'Stop the current focuser movement',
					},
					{
						name: 'Auto Focus',
						value: 'autoFocus',
						description: 'Run autofocus routine',
					},
					{
						name: 'Get Last Autofocus',
						value: 'getLastAutofocus',
						description: 'Get the last autofocus report',
					},
					{
						name: 'Reverse Direction',
						value: 'reverseDirection',
						description: 'Enable or disable reverse direction',
					},
				],
				default: 'getInfo',
			},
			// connect param
			{
				displayName: 'Device ID',
				name: 'to',
				type: 'string',
				default: '',
				description: 'Device ID to connect to',
				displayOptions: {
					show: {
						operation: ['connect'],
					},
				},
			},
			// move param
			{
				displayName: 'Position',
				name: 'position',
				type: 'number',
				required: true,
				default: 0,
				description: 'Target focuser position in steps',
				displayOptions: {
					show: {
						operation: ['move'],
					},
				},
			},
			// autoFocus param
			{
				displayName: 'Cancel',
				name: 'cancel',
				type: 'boolean',
				default: false,
				description: 'Whether to cancel the running autofocus',
				displayOptions: {
					show: {
						operation: ['autoFocus'],
					},
				},
			},
			// reverseDirection param
			{
				displayName: 'Reversing',
				name: 'reversing',
				type: 'boolean',
				required: true,
				default: false,
				description: 'Whether to enable reverse direction',
				displayOptions: {
					show: {
						operation: ['reverseDirection'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('ninaApi');
		const baseUrl = `http://${credentials.host}:${credentials.port}/v2/api`;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: IDataObject | IDataObject[];

				switch (operation) {
					case 'getInfo': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/info`,
						});
						break;
					}
					case 'connect': {
						const qs: IDataObject = {};
						const to = this.getNodeParameter('to', i, '') as string;
						if (to) qs.to = to;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/connect`,
							qs,
						});
						break;
					}
					case 'disconnect': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/disconnect`,
						});
						break;
					}
					case 'listDevices': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/list-devices`,
						});
						break;
					}
					case 'rescan': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/rescan`,
						});
						break;
					}
					case 'move': {
						const position = this.getNodeParameter('position', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/move`,
							qs: { position },
						});
						break;
					}
					case 'stopMove': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/stop-move`,
						});
						break;
					}
					case 'autoFocus': {
						const cancel = this.getNodeParameter('cancel', i, false) as boolean;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/auto-focus`,
							qs: { cancel },
						});
						break;
					}
					case 'getLastAutofocus': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/last-af`,
						});
						break;
					}
					case 'reverseDirection': {
						const reversing = this.getNodeParameter('reversing', i) as boolean;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/focuser/pins/reverse`,
							qs: { reversing },
						});
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						Array.isArray(responseData) ? responseData : [responseData as IDataObject],
					),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push(
						...this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray({ error: (error as Error).message }),
							{ itemData: { item: i } },
						),
					);
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
