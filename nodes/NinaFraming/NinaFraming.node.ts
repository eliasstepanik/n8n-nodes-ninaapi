import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaFraming implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Framing',
		name: 'ninaFraming',
		icon: 'fa:border-all',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control framing via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Framing' },
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
						name: 'Get Info',
						value: 'getInfo',
						description: 'Get framing info and current settings',
					},
					{
						name: 'Set Source',
						value: 'setSource',
						description: 'Set sky survey source',
					},
					{
						name: 'Set Coordinates',
						value: 'setCoordinates',
						description: 'Set framing coordinates',
					},
					{
						name: 'Slew',
						value: 'slew',
						description: 'Slew to current framing coordinates',
					},
					{
						name: 'Set Rotation',
						value: 'setRotation',
						description: 'Set framing rotation angle',
					},
					{
						name: 'Determine Rotation',
						value: 'determineRotation',
						description: 'Determine rotation via plate solve',
					},
					{
						name: 'Get Moon Separation',
						value: 'getMoonSeparation',
						description: 'Get moon phase and separation for a target',
					},
				],
				default: 'getInfo',
			},
			// setSource param
			{
				displayName: 'Source',
				name: 'source',
				type: 'string',
				required: true,
				default: '',
				description: 'Sky survey source name e.g. HIPS2FITS, SDSS',
				displayOptions: {
					show: {
						operation: ['setSource'],
					},
				},
			},
			// setCoordinates params
			{
				displayName: 'RA (Degrees)',
				name: 'RAangle',
				type: 'number',
				required: true,
				default: 0,
				description: 'RA in decimal degrees',
				displayOptions: {
					show: {
						operation: ['setCoordinates'],
					},
				},
			},
			{
				displayName: 'DEC (Degrees)',
				name: 'DECangle',
				type: 'number',
				required: true,
				default: 0,
				description: 'DEC in decimal degrees',
				displayOptions: {
					show: {
						operation: ['setCoordinates'],
					},
				},
			},
			// slew params
			{
				displayName: 'Slew Option',
				name: 'slewOption',
				type: 'options',
				options: [
					{ name: 'None', value: '' },
					{ name: 'Center', value: 'Center' },
					{ name: 'Rotate', value: 'Rotate' },
				],
				default: '',
				description: 'Slew option',
				displayOptions: {
					show: {
						operation: ['slew'],
					},
				},
			},
			{
				displayName: 'Wait for Result',
				name: 'waitForResult',
				type: 'boolean',
				default: true,
				description: 'Whether to wait for slew to complete',
				displayOptions: {
					show: {
						operation: ['slew'],
					},
				},
			},
			// setRotation param
			{
				displayName: 'Rotation',
				name: 'rotation',
				type: 'number',
				required: true,
				default: 0,
				description: 'Rotation angle in degrees',
				displayOptions: {
					show: {
						operation: ['setRotation'],
					},
				},
			},
			// determineRotation param
			{
				displayName: 'Wait for Result',
				name: 'waitForResult',
				type: 'boolean',
				default: true,
				description: 'Whether to wait for plate solve to complete',
				displayOptions: {
					show: {
						operation: ['determineRotation'],
					},
				},
			},
			// getMoonSeparation params
			{
				displayName: 'Target RA (Degrees)',
				name: 'ra',
				type: 'number',
				required: true,
				default: 0,
				description: 'Target RA in decimal degrees',
				displayOptions: {
					show: {
						operation: ['getMoonSeparation'],
					},
				},
			},
			{
				displayName: 'Target Dec (Degrees)',
				name: 'dec',
				type: 'number',
				required: true,
				default: 0,
				description: 'Target Dec in decimal degrees',
				displayOptions: {
					show: {
						operation: ['getMoonSeparation'],
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
							url: `${baseUrl}/framing/info`,
						});
						break;
					}
					case 'setSource': {
						const source = this.getNodeParameter('source', i) as string;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/framing/set-source`,
							qs: { source },
						});
						break;
					}
					case 'setCoordinates': {
						const RAangle = this.getNodeParameter('RAangle', i) as number;
						const DECangle = this.getNodeParameter('DECangle', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/framing/set-coordinates`,
							qs: { RAangle, DECangle },
						});
						break;
					}
					case 'slew': {
						const qs: IDataObject = {};
						const slewOption = this.getNodeParameter('slewOption', i, '') as string;
						qs.slewOption = slewOption;
						const waitForResult = this.getNodeParameter('waitForResult', i, true) as boolean;
						qs.waitForResult = waitForResult;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/framing/slew`,
							qs,
						});
						break;
					}
					case 'setRotation': {
						const rotation = this.getNodeParameter('rotation', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/framing/set-rotation`,
							qs: { rotation },
						});
						break;
					}
					case 'determineRotation': {
						const waitForResult = this.getNodeParameter('waitForResult', i, true) as boolean;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/framing/determine-rotation`,
							qs: { waitForResult },
						});
						break;
					}
					case 'getMoonSeparation': {
						const ra = this.getNodeParameter('ra', i) as number;
						const dec = this.getNodeParameter('dec', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/astro-util/moon-separation`,
							qs: { ra, dec },
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
