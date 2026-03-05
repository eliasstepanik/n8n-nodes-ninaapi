import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Image',
		name: 'ninaImage',
		icon: 'fa:image',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Retrieve and manage images via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Image' },
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
						name: 'Get Prepared Image',
						value: 'getPreparedImage',
						description: 'Get the currently prepared image',
					},
					{
						name: 'Get Image',
						value: 'getImage',
						description: 'Get an image by index',
					},
					{
						name: 'Solve Prepared Image',
						value: 'solvePreparedImage',
						description: 'Plate solve the prepared image',
					},
					{
						name: 'Solve Image',
						value: 'solveImage',
						description: 'Plate solve an image by index',
					},
					{
						name: 'Set Image Prefix',
						value: 'setImagePrefix',
						description: 'Set file prefix for an image by index',
					},
					{
						name: 'Get Image History',
						value: 'getImageHistory',
						description: 'Get image history',
					},
					{
						name: 'Get Thumbnail',
						value: 'getThumbnail',
						description: 'Get thumbnail for an image by index',
					},
				],
				default: 'getImageHistory',
			},
			// index param (getImage, solveImage, setImagePrefix, getThumbnail)
			{
				displayName: 'Index',
				name: 'index',
				type: 'number',
				required: true,
				default: 0,
				description: 'Image index',
				displayOptions: {
					show: {
						operation: ['getImage', 'solveImage', 'setImagePrefix', 'getThumbnail'],
					},
				},
			},
			// prefix param (setImagePrefix)
			{
				displayName: 'Prefix',
				name: 'prefix',
				type: 'string',
				required: true,
				default: '',
				description: 'File prefix to add',
				displayOptions: {
					show: {
						operation: ['setImagePrefix'],
					},
				},
			},
			// imageType param (getImage, solveImage, setImagePrefix, getThumbnail, getImageHistory)
			{
				displayName: 'Image Type',
				name: 'imageType',
				type: 'options',
				options: [
					{ name: 'Light', value: 'LIGHT' },
					{ name: 'Dark', value: 'DARK' },
					{ name: 'Bias', value: 'BIAS' },
					{ name: 'Flat', value: 'FLAT' },
					{ name: 'Snapshot', value: 'SNAPSHOT' },
				],
				default: 'LIGHT',
				description: 'Image type',
				displayOptions: {
					show: {
						operation: ['getImage', 'solveImage', 'setImagePrefix', 'getThumbnail', 'getImageHistory'],
					},
				},
			},
			// resize param (getPreparedImage, getImage)
			{
				displayName: 'Resize',
				name: 'resize',
				type: 'boolean',
				default: false,
				description: 'Whether to resize the image',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// quality param (getPreparedImage, getImage)
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'number',
				default: 90,
				description: 'JPEG quality 1-100',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// size param (getPreparedImage, getImage)
			{
				displayName: 'Size',
				name: 'size',
				type: 'string',
				default: '',
				description: 'Image size',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// scale param (getPreparedImage, getImage)
			{
				displayName: 'Scale',
				name: 'scale',
				type: 'number',
				default: 1,
				description: 'Scale factor',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// factor param (getPreparedImage, getImage)
			{
				displayName: 'Factor',
				name: 'factor',
				type: 'number',
				default: 1,
				description: 'Factor value',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// blackClipping param (getPreparedImage, getImage)
			{
				displayName: 'Black Clipping',
				name: 'blackClipping',
				type: 'number',
				default: 0,
				description: 'Black clipping value',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// unlinked param (getPreparedImage, getImage)
			{
				displayName: 'Unlinked',
				name: 'unlinked',
				type: 'boolean',
				default: false,
				description: 'Whether to use unlinked stretch',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// debayer param (getPreparedImage, getImage)
			{
				displayName: 'Debayer',
				name: 'debayer',
				type: 'boolean',
				default: false,
				description: 'Whether to debayer the image',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// autoPrepare param (getPreparedImage, getImage)
			{
				displayName: 'Auto Prepare',
				name: 'autoPrepare',
				type: 'boolean',
				default: true,
				description: 'Whether to auto prepare the image',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// bayerPattern param (getPreparedImage, getImage)
			{
				displayName: 'Bayer Pattern',
				name: 'bayerPattern',
				type: 'string',
				default: '',
				description: 'Bayer pattern override',
				displayOptions: {
					show: {
						operation: ['getPreparedImage', 'getImage'],
					},
				},
			},
			// getImageHistory params
			{
				displayName: 'All Images',
				name: 'all',
				type: 'boolean',
				default: false,
				description: 'Whether to return all images',
				displayOptions: {
					show: {
						operation: ['getImageHistory'],
					},
				},
			},
			{
				displayName: 'History Index',
				name: 'historyIndex',
				type: 'number',
				default: 0,
				description: 'Specific image index in history',
				displayOptions: {
					show: {
						operation: ['getImageHistory'],
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
					case 'getPreparedImage': {
						const qs: IDataObject = {};
						const resize = this.getNodeParameter('resize', i, false) as boolean;
						qs.resize = resize;
						const quality = this.getNodeParameter('quality', i, 90) as number;
						qs.quality = quality;
						const size = this.getNodeParameter('size', i, '') as string;
						if (size) qs.size = size;
						const scale = this.getNodeParameter('scale', i, '') as string | number;
						if (scale !== '' && scale !== undefined) qs.scale = scale;
						const factor = this.getNodeParameter('factor', i, '') as string | number;
						if (factor !== '' && factor !== undefined) qs.factor = factor;
						const blackClipping = this.getNodeParameter('blackClipping', i, '') as string | number;
						if (blackClipping !== '' && blackClipping !== undefined) qs.blackClipping = blackClipping;
						const unlinked = this.getNodeParameter('unlinked', i, false) as boolean;
						qs.unlinked = unlinked;
						const debayer = this.getNodeParameter('debayer', i, false) as boolean;
						qs.debayer = debayer;
						const autoPrepare = this.getNodeParameter('autoPrepare', i, true) as boolean;
						qs.autoPrepare = autoPrepare;
						const bayerPattern = this.getNodeParameter('bayerPattern', i, '') as string;
						if (bayerPattern) qs.bayerPattern = bayerPattern;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/prepared-image`,
							qs,
						});
						break;
					}
					case 'getImage': {
						const index = this.getNodeParameter('index', i) as number;
						const qs: IDataObject = {};
						const resize = this.getNodeParameter('resize', i, false) as boolean;
						qs.resize = resize;
						const quality = this.getNodeParameter('quality', i, 90) as number;
						qs.quality = quality;
						const size = this.getNodeParameter('size', i, '') as string;
						if (size) qs.size = size;
						const scale = this.getNodeParameter('scale', i, '') as string | number;
						if (scale !== '' && scale !== undefined) qs.scale = scale;
						const factor = this.getNodeParameter('factor', i, '') as string | number;
						if (factor !== '' && factor !== undefined) qs.factor = factor;
						const blackClipping = this.getNodeParameter('blackClipping', i, '') as string | number;
						if (blackClipping !== '' && blackClipping !== undefined) qs.blackClipping = blackClipping;
						const unlinked = this.getNodeParameter('unlinked', i, false) as boolean;
						qs.unlinked = unlinked;
						const debayer = this.getNodeParameter('debayer', i, false) as boolean;
						qs.debayer = debayer;
						const autoPrepare = this.getNodeParameter('autoPrepare', i, true) as boolean;
						qs.autoPrepare = autoPrepare;
						const bayerPattern = this.getNodeParameter('bayerPattern', i, '') as string;
						if (bayerPattern) qs.bayerPattern = bayerPattern;
						const imageType = this.getNodeParameter('imageType', i, 'LIGHT') as string;
						qs.imageType = imageType;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/image/${index}`,
							qs,
						});
						break;
					}
					case 'solvePreparedImage': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/prepared-image/solve`,
						});
						break;
					}
					case 'solveImage': {
						const index = this.getNodeParameter('index', i) as number;
						const qs: IDataObject = {};
						const imageType = this.getNodeParameter('imageType', i, 'LIGHT') as string;
						qs.imageType = imageType;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/image/${index}/solve`,
							qs,
						});
						break;
					}
					case 'setImagePrefix': {
						const index = this.getNodeParameter('index', i) as number;
						const prefix = this.getNodeParameter('prefix', i) as string;
						const qs: IDataObject = { prefix };
						const imageType = this.getNodeParameter('imageType', i, 'LIGHT') as string;
						qs.imageType = imageType;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/image/${index}/prefix`,
							qs,
						});
						break;
					}
					case 'getImageHistory': {
						const qs: IDataObject = {};
						const all = this.getNodeParameter('all', i, false) as boolean;
						qs.all = all;
						const historyIndex = this.getNodeParameter('historyIndex', i, '') as string | number;
						if (historyIndex !== '' && historyIndex !== undefined) qs.index = historyIndex;
						const imageType = this.getNodeParameter('imageType', i, 'LIGHT') as string;
						qs.imageType = imageType;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/image-history`,
							qs,
						});
						break;
					}
					case 'getThumbnail': {
						const index = this.getNodeParameter('index', i) as number;
						const qs: IDataObject = {};
						const imageType = this.getNodeParameter('imageType', i, 'LIGHT') as string;
						qs.imageType = imageType;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/image/thumbnail/${index}`,
							qs,
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
