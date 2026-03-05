import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaMount implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Mount',
		name: 'ninaMount',
		icon: 'fa:compass',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Control the Mount via N.I.N.A. ninaAPI',
		defaults: { name: 'NINA Mount' },
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
						description: 'Get mount info and status',
					},
					{
						name: 'Connect',
						value: 'connect',
						description: 'Connect to a mount device',
					},
					{
						name: 'Disconnect',
						value: 'disconnect',
						description: 'Disconnect from the current mount device',
					},
					{
						name: 'List Devices',
						value: 'listDevices',
						description: 'List all available mount devices',
					},
					{
						name: 'Rescan',
						value: 'rescan',
						description: 'Rescan for available mount devices',
					},
					{
						name: 'Home',
						value: 'home',
						description: 'Slew mount to home position',
					},
					{
						name: 'Set Tracking',
						value: 'setTracking',
						description: 'Set the mount tracking mode',
					},
					{
						name: 'Park',
						value: 'park',
						description: 'Park the mount',
					},
					{
						name: 'Unpark',
						value: 'unpark',
						description: 'Unpark the mount',
					},
					{
						name: 'Meridian Flip',
						value: 'meridianFlip',
						description: 'Perform a meridian flip',
					},
					{
						name: 'Slew',
						value: 'slew',
						description: 'Slew mount to target coordinates',
					},
					{
						name: 'Stop Slew',
						value: 'stopSlew',
						description: 'Stop the current slew',
					},
					{
						name: 'Set Park Position',
						value: 'setParkPosition',
						description: 'Set current position as park position',
					},
					{
						name: 'Sync',
						value: 'sync',
						description: 'Sync mount to coordinates or plate-solve and sync',
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
			// setTracking param
			{
				displayName: 'Tracking Mode',
				name: 'mode',
				type: 'number',
				required: true,
				default: 0,
				description:
					'Tracking mode: 0=Sidereal, 1=Lunar, 2=Solar, 3=King, 4=Stopped',
				displayOptions: {
					show: {
						operation: ['setTracking'],
					},
				},
			},
			// slew params
			{
				displayName: 'Right Ascension',
				name: 'ra',
				type: 'number',
				required: true,
				default: 0,
				description: 'Right Ascension in decimal degrees',
				displayOptions: {
					show: {
						operation: ['slew'],
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
			{
				displayName: 'Center',
				name: 'center',
				type: 'boolean',
				default: false,
				description: 'Whether to plate solve and center after slew',
				displayOptions: {
					show: {
						operation: ['slew'],
					},
				},
			},
			{
				displayName: 'Rotate',
				name: 'rotate',
				type: 'boolean',
				default: false,
				description: 'Whether to rotate to target angle',
				displayOptions: {
					show: {
						operation: ['slew'],
					},
				},
			},
			{
				displayName: 'Rotation Angle',
				name: 'rotationAngle',
				type: 'number',
				default: 0,
				description: 'Target rotation angle in degrees',
				displayOptions: {
					show: {
						operation: ['slew'],
					},
				},
			},
			// sync params
			{
				displayName: 'Right Ascension (Sync)',
				name: 'ra',
				type: 'number',
				default: 0,
				description: 'RA to sync to (omit to platesolve-sync)',
				displayOptions: {
					show: {
						operation: ['sync'],
					},
				},
			},
			{
				displayName: 'Declination (Sync)',
				name: 'dec',
				type: 'number',
				default: 0,
				description: 'Dec to sync to (omit to platesolve-sync)',
				displayOptions: {
					show: {
						operation: ['sync'],
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
							url: `${baseUrl}/equipment/mount/info`,
						});
						break;
					}
					case 'connect': {
						const qs: IDataObject = {};
						const to = this.getNodeParameter('to', i, '') as string;
						if (to) qs.to = to;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/connect`,
							qs,
						});
						break;
					}
					case 'disconnect': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/disconnect`,
						});
						break;
					}
					case 'listDevices': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/list-devices`,
						});
						break;
					}
					case 'rescan': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/rescan`,
						});
						break;
					}
					case 'home': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/home`,
						});
						break;
					}
					case 'setTracking': {
						const mode = this.getNodeParameter('mode', i) as number;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/tracking`,
							qs: { mode },
						});
						break;
					}
					case 'park': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/park`,
						});
						break;
					}
					case 'unpark': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/unpark`,
						});
						break;
					}
					case 'meridianFlip': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/flip`,
						});
						break;
					}
					case 'slew': {
						const ra = this.getNodeParameter('ra', i) as number;
						const dec = this.getNodeParameter('dec', i) as number;
						const qs: IDataObject = { ra, dec };
						const waitForResult = this.getNodeParameter('waitForResult', i, true) as boolean;
						qs.waitForResult = waitForResult;
						const center = this.getNodeParameter('center', i, false) as boolean;
						qs.center = center;
						const rotate = this.getNodeParameter('rotate', i, false) as boolean;
						qs.rotate = rotate;
						const rotationAngle = this.getNodeParameter('rotationAngle', i, 0) as number;
						if (rotate) qs.rotationAngle = rotationAngle;
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/slew`,
							qs,
						});
						break;
					}
					case 'stopSlew': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/slew/stop`,
						});
						break;
					}
					case 'setParkPosition': {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/set-park-position`,
						});
						break;
					}
					case 'sync': {
						const qs: IDataObject = {};
						const syncRa = this.getNodeParameter('ra', i, 0) as number;
						const syncDec = this.getNodeParameter('dec', i, 0) as number;
						if (syncRa !== 0 || syncDec !== 0) {
							qs.ra = syncRa;
							qs.dec = syncDec;
						}
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/equipment/mount/sync`,
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
