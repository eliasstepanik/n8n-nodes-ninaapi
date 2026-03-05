import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaCamera implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Camera',
		name: 'ninaCamera',
		icon: 'fa:camera',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control the Camera via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Camera' },
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
						description: 'Get camera info and status',
					},
					{
						name: 'Connect',
						value: 'connect',
						description: 'Connect to a camera device',
					},
					{
						name: 'Disconnect',
						value: 'disconnect',
						description: 'Disconnect from the current camera device',
					},
					{
						name: 'List Devices',
						value: 'listDevices',
						description: 'List all available camera devices',
					},
					{
						name: 'Rescan',
						value: 'rescan',
						description: 'Rescan for available camera devices',
					},
					{
						name: 'Set Readout',
						value: 'setReadout',
						description: 'Set the camera readout mode',
					},
					{
						name: 'Set Readout (Image)',
						value: 'setReadoutImage',
						description: 'Set the readout mode for normal images',
					},
					{
						name: 'Set Readout (Snapshot)',
						value: 'setReadoutSnapshot',
						description: 'Set the readout mode for snapshots',
					},
					{
						name: 'Cool',
						value: 'cool',
						description: 'Cool the camera to a target temperature',
					},
					{
						name: 'Warm',
						value: 'warm',
						description: 'Warm the camera up',
					},
					{
						name: 'Abort Exposure',
						value: 'abortExposure',
						description: 'Abort the current camera exposure',
					},
					{
						name: 'Dew Heater',
						value: 'dewHeater',
						description: 'Enable or disable the dew heater',
					},
					{
						name: 'Set USB Limit',
						value: 'setUsbLimit',
						description: 'Set the USB bandwidth limit',
					},
					{
						name: 'Set Binning',
						value: 'setBinning',
						description: 'Set the camera binning mode',
					},
					{
						name: 'Capture Image',
						value: 'captureImage',
						description: 'Capture an image with the camera',
					},
					{
						name: 'Get Capture Statistics',
						value: 'getCaptureStatistics',
						description: 'Get statistics from the last capture',
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
			// setReadout param
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'number',
				required: true,
				default: 0,
				description: 'Readout mode index',
				displayOptions: {
					show: {
						operation: ['setReadout'],
					},
				},
			},
			// setReadoutImage param
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'number',
				required: true,
				default: 0,
				description: 'Readout mode for normal images',
				displayOptions: {
					show: {
						operation: ['setReadoutImage'],
					},
				},
			},
			// setReadoutSnapshot param
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'number',
				required: true,
				default: 0,
				description: 'Readout mode for snapshots',
				displayOptions: {
					show: {
						operation: ['setReadoutSnapshot'],
					},
				},
			},
			// cool params
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				required: true,
				default: -10,
				description: 'Target temperature in Celsius',
				displayOptions: {
					show: {
						operation: ['cool'],
					},
				},
			},
			{
				displayName: 'Duration (Minutes)',
				name: 'minutes',
				type: 'number',
				default: 5,
				description: 'Duration in minutes',
				displayOptions: {
					show: {
						operation: ['cool', 'warm'],
					},
				},
			},
			{
				displayName: 'Cancel',
				name: 'cancel',
				type: 'boolean',
				default: false,
				description: 'Whether to cancel ongoing cooling/warming',
				displayOptions: {
					show: {
						operation: ['cool', 'warm'],
					},
				},
			},
			// dewHeater param
			{
				displayName: 'Power',
				name: 'power',
				type: 'boolean',
				required: true,
				default: false,
				description: 'Whether to enable or disable the dew heater',
				displayOptions: {
					show: {
						operation: ['dewHeater'],
					},
				},
			},
			// setUsbLimit param
			{
				displayName: 'USB Limit',
				name: 'limit',
				type: 'string',
				required: true,
				default: '',
				description: 'USB limit value',
				displayOptions: {
					show: {
						operation: ['setUsbLimit'],
					},
				},
			},
			// setBinning param
			{
				displayName: 'Binning',
				name: 'binning',
				type: 'string',
				required: true,
				default: '1x1',
				description: 'Binning mode e.g. 2x2',
				displayOptions: {
					show: {
						operation: ['setBinning'],
					},
				},
			},
			// captureImage params
			{
				displayName: 'Duration (Seconds)',
				name: 'duration',
				type: 'number',
				default: 1,
				description: 'Exposure duration in seconds',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Gain',
				name: 'gain',
				type: 'number',
				default: 0,
				description: 'Gain setting',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
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
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Plate Solve',
				name: 'solve',
				type: 'boolean',
				default: false,
				description: 'Whether to plate solve after capture',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Save Image',
				name: 'save',
				type: 'boolean',
				default: false,
				description: 'Whether to save image to disk',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Wait for Result',
				name: 'waitForResult',
				type: 'boolean',
				default: true,
				description: 'Whether to wait for capture to complete',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Get Result',
				name: 'getResult',
				type: 'boolean',
				default: true,
				description: 'Whether to return result data',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Resize',
				name: 'resize',
				type: 'boolean',
				default: false,
				description: 'Whether to resize output image',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'JPEG Quality',
				name: 'quality',
				type: 'number',
				default: 90,
				description: 'JPEG quality 1-100',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Target Name',
				name: 'targetName',
				type: 'string',
				default: '',
				description: 'Target name for file',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Omit Image Data',
				name: 'omitImage',
				type: 'boolean',
				default: false,
				description: 'Whether to omit image data from response',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Skip Auto Stretch',
				name: 'skipAutoStretch',
				type: 'boolean',
				default: false,
				description: 'Whether to skip auto stretch',
				displayOptions: {
					show: {
						operation: ['captureImage'],
					},
				},
			},
			{
				displayName: 'Only Save Raw',
				name: 'onlySaveRaw',
				type: 'boolean',
				default: false,
				description: 'Whether to only save raw FITS',
				displayOptions: {
					show: {
						operation: ['captureImage'],
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
							url: `${baseUrl}/equipment/camera/info`,
						});
						break;
					}
					case 'connect': {
						const qs: IDataObject = {};
						const to = this.getNodeParameter('to', i, '') as string;
						if (to) qs.to = to;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/connect`,
							qs,
						});
						break;
					}
					case 'disconnect': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/disconnect`,
						});
						break;
					}
					case 'listDevices': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/list-devices`,
						});
						break;
					}
					case 'rescan': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/rescan`,
						});
						break;
					}
					case 'setReadout': {
						const mode = this.getNodeParameter('mode', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/set-readout`,
							qs: { mode },
						});
						break;
					}
					case 'setReadoutImage': {
						const mode = this.getNodeParameter('mode', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/set-readout/image`,
							qs: { mode },
						});
						break;
					}
					case 'setReadoutSnapshot': {
						const mode = this.getNodeParameter('mode', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/set-readout/snapshot`,
							qs: { mode },
						});
						break;
					}
					case 'cool': {
						const temperature = this.getNodeParameter('temperature', i) as number;
						const qs: IDataObject = { temperature };
						const coolMinutes = this.getNodeParameter('minutes', i, 5) as number;
						qs.minutes = coolMinutes;
						const coolCancel = this.getNodeParameter('cancel', i, false) as boolean;
						qs.cancel = coolCancel;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/cool`,
							qs,
						});
						break;
					}
					case 'warm': {
						const qs: IDataObject = {};
						const warmMinutes = this.getNodeParameter('minutes', i, 5) as number;
						qs.minutes = warmMinutes;
						const warmCancel = this.getNodeParameter('cancel', i, false) as boolean;
						qs.cancel = warmCancel;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/warm`,
							qs,
						});
						break;
					}
					case 'abortExposure': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/abort-exposure`,
						});
						break;
					}
					case 'dewHeater': {
						const power = this.getNodeParameter('power', i) as boolean;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/dew-heater`,
							qs: { power },
						});
						break;
					}
					case 'setUsbLimit': {
					const limit = this.getNodeParameter('limit', i, '') as string;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/usb-limit`,
							qs: { limit },
						});
						break;
					}
					case 'setBinning': {
						const binning = this.getNodeParameter('binning', i) as string;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/set-binning`,
							qs: { binning },
						});
						break;
					}
					case 'captureImage': {
						const qs: IDataObject = {};
						const duration = this.getNodeParameter('duration', i, 1) as number;
						qs.duration = duration;
						const gain = this.getNodeParameter('gain', i, 0) as number;
						qs.gain = gain;
						const imageType = this.getNodeParameter('imageType', i, 'LIGHT') as string;
						qs.imageType = imageType;
						const solve = this.getNodeParameter('solve', i, false) as boolean;
						qs.solve = solve;
						const save = this.getNodeParameter('save', i, false) as boolean;
						qs.save = save;
						const waitForResult = this.getNodeParameter('waitForResult', i, true) as boolean;
						qs.waitForResult = waitForResult;
						const getResult = this.getNodeParameter('getResult', i, true) as boolean;
						qs.getResult = getResult;
						const resize = this.getNodeParameter('resize', i, false) as boolean;
						qs.resize = resize;
						const quality = this.getNodeParameter('quality', i, 90) as number;
						qs.quality = quality;
						const targetName = this.getNodeParameter('targetName', i, '') as string;
						if (targetName) qs.targetName = targetName;
						const omitImage = this.getNodeParameter('omitImage', i, false) as boolean;
						qs.omitImage = omitImage;
						const skipAutoStretch = this.getNodeParameter('skipAutoStretch', i, false) as boolean;
						qs.skipAutoStretch = skipAutoStretch;
						const onlySaveRaw = this.getNodeParameter('onlySaveRaw', i, false) as boolean;
						qs.onlySaveRaw = onlySaveRaw;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/capture`,
							qs,
						});
						break;
					}
					case 'getCaptureStatistics': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/camera/capture/statistics`,
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
