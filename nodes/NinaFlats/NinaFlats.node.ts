import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaFlats implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Flats',
		name: 'ninaFlats',
		icon: 'fa:sun',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control flat capture via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Flats' },
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
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get flat capture status',
					},
					{
						name: 'Stop',
						value: 'stop',
						description: 'Stop ongoing flat capture',
					},
					{
						name: 'Take Sky Flats',
						value: 'takeSkyFlats',
						description: 'Capture sky flats',
					},
					{
						name: 'Take Auto Flat (Brightness)',
						value: 'takeAutoFlatBrightness',
						description: 'Capture auto flats by panel brightness',
					},
					{
						name: 'Take Auto Flat (Exposure)',
						value: 'takeAutoFlatExposure',
						description: 'Capture auto flats by exposure time',
					},
					{
						name: 'Take Trained Dark Flat',
						value: 'takeTrainedDarkFlat',
						description: 'Capture trained dark flats',
					},
					{
						name: 'Take Trained Flat',
						value: 'takeTrainedFlat',
						description: 'Capture trained flats',
					},
				],
				default: 'getStatus',
			},
			// count param (takeSkyFlats, takeAutoFlatBrightness, takeAutoFlatExposure, takeTrainedDarkFlat, takeTrainedFlat)
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 10,
				description: 'Number of flats to capture',
				displayOptions: {
					show: {
						operation: [
							'takeSkyFlats',
							'takeAutoFlatBrightness',
							'takeAutoFlatExposure',
							'takeTrainedDarkFlat',
							'takeTrainedFlat',
						],
					},
				},
			},
			// minExposure param (takeSkyFlats, takeAutoFlatExposure)
			{
				displayName: 'Min Exposure',
				name: 'minExposure',
				type: 'number',
				default: 0,
				description: 'Minimum exposure time in seconds',
				displayOptions: {
					show: {
						operation: ['takeSkyFlats', 'takeAutoFlatExposure'],
					},
				},
			},
			// maxExposure param (takeSkyFlats, takeAutoFlatExposure)
			{
				displayName: 'Max Exposure',
				name: 'maxExposure',
				type: 'number',
				default: 0,
				description: 'Maximum exposure time in seconds',
				displayOptions: {
					show: {
						operation: ['takeSkyFlats', 'takeAutoFlatExposure'],
					},
				},
			},
			// histogramMean param (takeSkyFlats, takeAutoFlatBrightness, takeAutoFlatExposure)
			{
				displayName: 'Histogram Mean',
				name: 'histogramMean',
				type: 'number',
				default: 0,
				description: 'Target histogram mean 0-1',
				displayOptions: {
					show: {
						operation: ['takeSkyFlats', 'takeAutoFlatBrightness', 'takeAutoFlatExposure'],
					},
				},
			},
			// meanTolerance param (takeSkyFlats, takeAutoFlatBrightness, takeAutoFlatExposure)
			{
				displayName: 'Mean Tolerance',
				name: 'meanTolerance',
				type: 'number',
				default: 0,
				description: 'Tolerance for histogram mean',
				displayOptions: {
					show: {
						operation: ['takeSkyFlats', 'takeAutoFlatBrightness', 'takeAutoFlatExposure'],
					},
				},
			},
			// dither param (takeSkyFlats)
			{
				displayName: 'Dither',
				name: 'dither',
				type: 'boolean',
				default: false,
				description: 'Whether to enable dithering',
				displayOptions: {
					show: {
						operation: ['takeSkyFlats'],
					},
				},
			},
			// filterId param (all flat operations)
			{
				displayName: 'Filter ID',
				name: 'filterId',
				type: 'number',
				default: 0,
				description: 'Filter slot index',
				displayOptions: {
					show: {
						operation: [
							'takeSkyFlats',
							'takeAutoFlatBrightness',
							'takeAutoFlatExposure',
							'takeTrainedDarkFlat',
							'takeTrainedFlat',
						],
					},
				},
			},
			// binning param (all flat operations)
			{
				displayName: 'Binning',
				name: 'binning',
				type: 'string',
				default: '',
				description: 'Binning e.g. 1x1',
				displayOptions: {
					show: {
						operation: [
							'takeSkyFlats',
							'takeAutoFlatBrightness',
							'takeAutoFlatExposure',
							'takeTrainedDarkFlat',
							'takeTrainedFlat',
						],
					},
				},
			},
			// gain param (all flat operations)
			{
				displayName: 'Gain',
				name: 'gain',
				type: 'number',
				default: 0,
				description: 'Gain',
				displayOptions: {
					show: {
						operation: [
							'takeSkyFlats',
							'takeAutoFlatBrightness',
							'takeAutoFlatExposure',
							'takeTrainedDarkFlat',
							'takeTrainedFlat',
						],
					},
				},
			},
			// offset param (all flat operations)
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Offset',
				displayOptions: {
					show: {
						operation: [
							'takeSkyFlats',
							'takeAutoFlatBrightness',
							'takeAutoFlatExposure',
							'takeTrainedDarkFlat',
							'takeTrainedFlat',
						],
					},
				},
			},
			// minBrightness param (takeAutoFlatBrightness)
			{
				displayName: 'Min Brightness',
				name: 'minBrightness',
				type: 'number',
				default: 0,
				description: 'Minimum panel brightness',
				displayOptions: {
					show: {
						operation: ['takeAutoFlatBrightness'],
					},
				},
			},
			// maxBrightness param (takeAutoFlatBrightness)
			{
				displayName: 'Max Brightness',
				name: 'maxBrightness',
				type: 'number',
				default: 0,
				description: 'Maximum panel brightness',
				displayOptions: {
					show: {
						operation: ['takeAutoFlatBrightness'],
					},
				},
			},
			// exposureTime param (takeAutoFlatBrightness)
			{
				displayName: 'Exposure Time',
				name: 'exposureTime',
				type: 'number',
				default: 0,
				description: 'Exposure time in seconds',
				displayOptions: {
					show: {
						operation: ['takeAutoFlatBrightness'],
					},
				},
			},
			// brightness param (takeAutoFlatExposure)
			{
				displayName: 'Brightness',
				name: 'brightness',
				type: 'number',
				default: 0,
				description: 'Panel brightness',
				displayOptions: {
					show: {
						operation: ['takeAutoFlatExposure'],
					},
				},
			},
			// keepClosed param (takeAutoFlatBrightness, takeAutoFlatExposure, takeTrainedDarkFlat, takeTrainedFlat)
			{
				displayName: 'Keep Closed',
				name: 'keepClosed',
				type: 'boolean',
				default: false,
				description: 'Whether to keep panel closed after capture',
				displayOptions: {
					show: {
						operation: [
							'takeAutoFlatBrightness',
							'takeAutoFlatExposure',
							'takeTrainedDarkFlat',
							'takeTrainedFlat',
						],
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
							url: `${baseUrl}/flats/status`,
						});
						break;
					}
					case 'stop': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/flats/stop`,
						});
						break;
					}
					case 'takeSkyFlats': {
						const qs: IDataObject = {};
						const count = this.getNodeParameter('count', i, 10) as number;
						qs.count = count;
						const minExposure = this.getNodeParameter('minExposure', i, '') as string | number;
						if (minExposure !== '' && minExposure !== undefined) qs.minExposure = minExposure;
						const maxExposure = this.getNodeParameter('maxExposure', i, '') as string | number;
						if (maxExposure !== '' && maxExposure !== undefined) qs.maxExposure = maxExposure;
						const histogramMean = this.getNodeParameter('histogramMean', i, '') as string | number;
						if (histogramMean !== '' && histogramMean !== undefined) qs.histogramMean = histogramMean;
						const meanTolerance = this.getNodeParameter('meanTolerance', i, '') as string | number;
						if (meanTolerance !== '' && meanTolerance !== undefined) qs.meanTolerance = meanTolerance;
						const dither = this.getNodeParameter('dither', i, false) as boolean;
						qs.dither = dither;
						const filterId = this.getNodeParameter('filterId', i, '') as string | number;
						if (filterId !== '' && filterId !== undefined) qs.filterId = filterId;
						const binning = this.getNodeParameter('binning', i, '') as string;
						if (binning) qs.binning = binning;
						const gain = this.getNodeParameter('gain', i, '') as string | number;
						if (gain !== '' && gain !== undefined) qs.gain = gain;
						const offset = this.getNodeParameter('offset', i, '') as string | number;
						if (offset !== '' && offset !== undefined) qs.offset = offset;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/flats/skyflat`,
							qs,
						});
						break;
					}
					case 'takeAutoFlatBrightness': {
						const qs: IDataObject = {};
						const count = this.getNodeParameter('count', i, 10) as number;
						qs.count = count;
						const minBrightness = this.getNodeParameter('minBrightness', i, '') as string | number;
						if (minBrightness !== '' && minBrightness !== undefined) qs.minBrightness = minBrightness;
						const maxBrightness = this.getNodeParameter('maxBrightness', i, '') as string | number;
						if (maxBrightness !== '' && maxBrightness !== undefined) qs.maxBrightness = maxBrightness;
						const histogramMean = this.getNodeParameter('histogramMean', i, '') as string | number;
						if (histogramMean !== '' && histogramMean !== undefined) qs.histogramMean = histogramMean;
						const meanTolerance = this.getNodeParameter('meanTolerance', i, '') as string | number;
						if (meanTolerance !== '' && meanTolerance !== undefined) qs.meanTolerance = meanTolerance;
						const filterId = this.getNodeParameter('filterId', i, '') as string | number;
						if (filterId !== '' && filterId !== undefined) qs.filterId = filterId;
						const binning = this.getNodeParameter('binning', i, '') as string;
						if (binning) qs.binning = binning;
						const gain = this.getNodeParameter('gain', i, '') as string | number;
						if (gain !== '' && gain !== undefined) qs.gain = gain;
						const offset = this.getNodeParameter('offset', i, '') as string | number;
						if (offset !== '' && offset !== undefined) qs.offset = offset;
						const exposureTime = this.getNodeParameter('exposureTime', i, '') as string | number;
						if (exposureTime !== '' && exposureTime !== undefined) qs.exposureTime = exposureTime;
						const keepClosed = this.getNodeParameter('keepClosed', i, false) as boolean;
						qs.keepClosed = keepClosed;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/flats/auto-brightness`,
							qs,
						});
						break;
					}
					case 'takeAutoFlatExposure': {
						const qs: IDataObject = {};
						const count = this.getNodeParameter('count', i, 10) as number;
						qs.count = count;
						const minExposure = this.getNodeParameter('minExposure', i, '') as string | number;
						if (minExposure !== '' && minExposure !== undefined) qs.minExposure = minExposure;
						const maxExposure = this.getNodeParameter('maxExposure', i, '') as string | number;
						if (maxExposure !== '' && maxExposure !== undefined) qs.maxExposure = maxExposure;
						const histogramMean = this.getNodeParameter('histogramMean', i, '') as string | number;
						if (histogramMean !== '' && histogramMean !== undefined) qs.histogramMean = histogramMean;
						const meanTolerance = this.getNodeParameter('meanTolerance', i, '') as string | number;
						if (meanTolerance !== '' && meanTolerance !== undefined) qs.meanTolerance = meanTolerance;
						const brightness = this.getNodeParameter('brightness', i, '') as string | number;
						if (brightness !== '' && brightness !== undefined) qs.brightness = brightness;
						const filterId = this.getNodeParameter('filterId', i, '') as string | number;
						if (filterId !== '' && filterId !== undefined) qs.filterId = filterId;
						const binning = this.getNodeParameter('binning', i, '') as string;
						if (binning) qs.binning = binning;
						const gain = this.getNodeParameter('gain', i, '') as string | number;
						if (gain !== '' && gain !== undefined) qs.gain = gain;
						const offset = this.getNodeParameter('offset', i, '') as string | number;
						if (offset !== '' && offset !== undefined) qs.offset = offset;
						const keepClosed = this.getNodeParameter('keepClosed', i, false) as boolean;
						qs.keepClosed = keepClosed;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/flats/auto-exposure`,
							qs,
						});
						break;
					}
					case 'takeTrainedDarkFlat': {
						const qs: IDataObject = {};
						const count = this.getNodeParameter('count', i, 10) as number;
						qs.count = count;
						const filterId = this.getNodeParameter('filterId', i, '') as string | number;
						if (filterId !== '' && filterId !== undefined) qs.filterId = filterId;
						const binning = this.getNodeParameter('binning', i, '') as string;
						if (binning) qs.binning = binning;
						const gain = this.getNodeParameter('gain', i, '') as string | number;
						if (gain !== '' && gain !== undefined) qs.gain = gain;
						const offset = this.getNodeParameter('offset', i, '') as string | number;
						if (offset !== '' && offset !== undefined) qs.offset = offset;
						const keepClosed = this.getNodeParameter('keepClosed', i, false) as boolean;
						qs.keepClosed = keepClosed;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/flats/trained-dark-flat`,
							qs,
						});
						break;
					}
					case 'takeTrainedFlat': {
						const qs: IDataObject = {};
						const count = this.getNodeParameter('count', i, 10) as number;
						qs.count = count;
						const filterId = this.getNodeParameter('filterId', i, '') as string | number;
						if (filterId !== '' && filterId !== undefined) qs.filterId = filterId;
						const binning = this.getNodeParameter('binning', i, '') as string;
						if (binning) qs.binning = binning;
						const gain = this.getNodeParameter('gain', i, '') as string | number;
						if (gain !== '' && gain !== undefined) qs.gain = gain;
						const offset = this.getNodeParameter('offset', i, '') as string | number;
						if (offset !== '' && offset !== undefined) qs.offset = offset;
						const keepClosed = this.getNodeParameter('keepClosed', i, false) as boolean;
						qs.keepClosed = keepClosed;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/flats/trained-flat`,
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
