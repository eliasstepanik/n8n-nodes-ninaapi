import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaLiveStack implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Live Stack',
		name: 'ninaLiveStack',
		icon: 'fa:layer-group',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control live stacking via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Live Stack' },
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
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get live stack status (running or stopped)',
					},
					{
						name: 'Start',
						value: 'start',
						description: 'Start live stacking',
					},
					{
						name: 'Stop',
						value: 'stop',
						description: 'Stop live stacking',
					},
					{
						name: 'Get Available Images',
						value: 'getAvailableImages',
						description: 'Get list of available stacked images',
					},
					{
						name: 'Get Image',
						value: 'getImage',
						description: 'Get a stacked image by target and filter',
					},
					{
						name: 'Get Image Info',
						value: 'getImageInfo',
						description: 'Get stacked image info by target and filter',
					},
				],
				default: 'getStatus',
			},
			// target param (getImage, getImageInfo)
			{
				displayName: 'Target',
				name: 'target',
				type: 'string',
				required: true,
				default: '',
				description: 'Target name',
				displayOptions: {
					show: {
						operation: ['getImage', 'getImageInfo'],
					},
				},
			},
			// filter param (getImage, getImageInfo)
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'string',
				required: true,
				default: '',
				description: 'Filter name',
				displayOptions: {
					show: {
						operation: ['getImage', 'getImageInfo'],
					},
				},
			},
			// getImage optional params
			{
				displayName: 'Resize',
				name: 'resize',
				type: 'boolean',
				default: false,
				description: 'Whether to resize the image',
				displayOptions: {
					show: {
						operation: ['getImage'],
					},
				},
			},
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'number',
				default: 90,
				description: 'JPEG quality 1-100',
				displayOptions: {
					show: {
						operation: ['getImage'],
					},
				},
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'string',
				default: '',
				description: 'Image size',
				displayOptions: {
					show: {
						operation: ['getImage'],
					},
				},
			},
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'number',
				default: 1,
				description: 'Scale factor',
				displayOptions: {
					show: {
						operation: ['getImage'],
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
					case 'getStatus': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/livestack/status`,
						});
						break;
					}
					case 'start': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/livestack/start`,
						});
						break;
					}
					case 'stop': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/livestack/stop`,
						});
						break;
					}
					case 'getAvailableImages': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/livestack/image/available`,
						});
						break;
					}
					case 'getImage': {
						const target = this.getNodeParameter('target', i) as string;
						const filter = this.getNodeParameter('filter', i) as string;
						const qs: IDataObject = {};
						const resize = this.getNodeParameter('resize', i, false) as boolean;
						qs.resize = resize;
						const quality = this.getNodeParameter('quality', i, 90) as number;
						qs.quality = quality;
						const size = this.getNodeParameter('size', i, '') as string;
						if (size) qs.size = size;
						const scale = this.getNodeParameter('scale', i, '') as string | number;
						if (scale !== '' && scale !== undefined) qs.scale = scale;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/livestack/image/${encodeURIComponent(target)}/${encodeURIComponent(filter)}`,
							qs,
						});
						break;
					}
					case 'getImageInfo': {
						const target = this.getNodeParameter('target', i) as string;
						const filter = this.getNodeParameter('filter', i) as string;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/livestack/image/${encodeURIComponent(target)}/${encodeURIComponent(filter)}/info`,
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
