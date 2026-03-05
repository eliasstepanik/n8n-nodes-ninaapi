import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaSequence implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Sequence',
		name: 'ninaSequence',
		icon: 'fa:list-ol',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control sequences via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Sequence' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'ninaApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get JSON',
						value: 'getJson',
						description: 'Get full sequence JSON tree',
					},
					{
						name: 'Get State',
						value: 'getState',
						description: 'Get sequence state/status tree',
					},
					{
						name: 'Edit Item',
						value: 'editItem',
						description: 'Edit a sequence item value by path',
					},
					{
						name: 'Start',
						value: 'start',
						description: 'Start the sequence',
					},
					{
						name: 'Stop',
						value: 'stop',
						description: 'Stop the sequence',
					},
					{
						name: 'Reset',
						value: 'reset',
						description: 'Reset the sequence',
					},
					{
						name: 'Load',
						value: 'load',
						description: 'Load a sequence from the profile folder',
					},
					{
						name: 'List Available',
						value: 'listAvailable',
						description: 'List available sequences',
					},
					{
						name: 'Set Target',
						value: 'setTarget',
						description: 'Set sequence target coordinates',
					},
					{
						name: 'Skip',
						value: 'skip',
						description: 'Skip sequence items',
					},
				],
				default: 'getState',
			},
			// editItem params
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				required: true,
				default: '',
				description: 'Item path e.g. Imaging-0-ExposureTime',
				displayOptions: {
					show: {
						operation: ['editItem'],
					},
				},
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				required: true,
				default: '',
				description: 'New value to set',
				displayOptions: {
					show: {
						operation: ['editItem'],
					},
				},
			},
			// start param
			{
				displayName: 'Skip Validation',
				name: 'skipValidation',
				type: 'boolean',
				default: false,
				description: 'Whether to skip pre-flight validation',
				displayOptions: {
					show: {
						operation: ['start'],
					},
				},
			},
			// load param
			{
				displayName: 'Sequence Name',
				name: 'sequenceName',
				type: 'string',
				required: true,
				default: '',
				description: 'Name of sequence to load from profile folder',
				displayOptions: {
					show: {
						operation: ['load'],
					},
				},
			},
			// setTarget params
			{
				displayName: 'Target Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				description: 'Target name',
				displayOptions: {
					show: {
						operation: ['setTarget'],
					},
				},
			},
			{
				displayName: 'Right Ascension',
				name: 'ra',
				type: 'number',
				required: true,
				default: 0,
				description: 'Right Ascension in decimal degrees',
				displayOptions: {
					show: {
						operation: ['setTarget'],
					},
				},
			},
			{
				displayName: 'Declination',
				name: 'dec',
				type: 'number',
				required: true,
				default: 0,
				description: 'Declination in decimal degrees',
				displayOptions: {
					show: {
						operation: ['setTarget'],
					},
				},
			},
			{
				displayName: 'Rotation',
				name: 'rotation',
				type: 'number',
				default: 0,
				description: 'Rotation angle in degrees',
				displayOptions: {
					show: {
						operation: ['setTarget'],
					},
				},
			},
			{
				displayName: 'Index',
				name: 'index',
				type: 'number',
				default: 0,
				description: 'Target index in sequence',
				displayOptions: {
					show: {
						operation: ['setTarget'],
					},
				},
			},
			// skip param
			{
				displayName: 'Skip Type',
				name: 'type',
				type: 'options',
				required: true,
				options: [
					{ name: 'Current Items', value: 'CurrentItems' },
					{ name: 'To End', value: 'ToEnd' },
					{ name: 'To Imaging', value: 'ToImaging' },
				],
				default: 'CurrentItems',
				description: 'Skip type',
				displayOptions: {
					show: {
						operation: ['skip'],
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
					case 'getJson': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/json`,
						});
						break;
					}
					case 'getState': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/state`,
						});
						break;
					}
					case 'editItem': {
						const path = this.getNodeParameter('path', i) as string;
						const value = this.getNodeParameter('value', i) as string;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/edit`,
							qs: { path, value },
						});
						break;
					}
					case 'start': {
						const skipValidation = this.getNodeParameter('skipValidation', i, false) as boolean;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/start`,
							qs: { skipValidation },
						});
						break;
					}
					case 'stop': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/stop`,
						});
						break;
					}
					case 'reset': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/reset`,
						});
						break;
					}
					case 'load': {
						const sequenceName = this.getNodeParameter('sequenceName', i) as string;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/load`,
							qs: { sequenceName },
						});
						break;
					}
					case 'listAvailable': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/list-available`,
						});
						break;
					}
					case 'setTarget': {
						const qs: IDataObject = {};
						qs.name = this.getNodeParameter('name', i) as string;
						qs.ra = this.getNodeParameter('ra', i) as number;
						qs.dec = this.getNodeParameter('dec', i) as number;
						const rotation = this.getNodeParameter('rotation', i, '') as string | number;
						if (rotation !== '' && rotation !== undefined) qs.rotation = rotation;
						const index = this.getNodeParameter('index', i, '') as string | number;
						if (index !== '' && index !== undefined) qs.index = index;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/set-target`,
							qs,
						});
						break;
					}
					case 'skip': {
						const type = this.getNodeParameter('type', i) as string;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/sequence/skip`,
							qs: { type },
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
