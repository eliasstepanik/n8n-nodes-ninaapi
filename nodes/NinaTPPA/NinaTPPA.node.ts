import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class NinaTPPA implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA TPPA (Polar Alignment)',
		name: 'ninaTPPA',
		icon: 'fa:compass',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Control Three-Point Polar Alignment (TPPA) in N.I.N.A. via the ninaAPI WebSocket /tppa channel',
		defaults: { name: 'NINA TPPA' },
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
						name: 'Start Alignment',
						value: 'start',
						description:
							'Start TPPA and collect alignment measurements until timeout or mount movement',
					},
					{
						name: 'Stop Alignment',
						value: 'stop',
						description: 'Stop a running TPPA session',
					},
					{
						name: 'Pause Alignment',
						value: 'pause',
						description: 'Pause a running TPPA session',
					},
					{
						name: 'Resume Alignment',
						value: 'resume',
						description: 'Resume a paused TPPA session',
					},
				],
				default: 'start',
			},

			// ─── Start Alignment Parameters ────────────────────────────────────────────

			{
				displayName: 'Collect Results For (Seconds)',
				name: 'timeout',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 120,
				description:
					'How long (in seconds) to listen for alignment measurements before returning. Set higher for full alignment runs.',
			},
			{
				displayName: 'Exposure Time',
				name: 'exposureTime',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 2,
				description: 'Exposure time in seconds for each plate-solve image',
			},
			{
				displayName: 'Manual Mode',
				name: 'manualMode',
				type: 'boolean',
				displayOptions: { show: { operation: ['start'] } },
				default: false,
				description: 'Whether to use manual mode (user moves mount manually between points)',
			},
			{
				displayName: 'Target Distance',
				name: 'targetDistance',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0.5,
				description:
					'Distance (in degrees) the mount moves between alignment points',
			},
			{
				displayName: 'Move Rate',
				name: 'moveRate',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0.1,
				description: 'Mount movement rate (arcsec/second)',
			},
			{
				displayName: 'East Direction',
				name: 'eastDirection',
				type: 'boolean',
				displayOptions: { show: { operation: ['start'] } },
				default: true,
				description: 'Whether to move the mount eastward between alignment points',
			},
			{
				displayName: 'Start From Current Position',
				name: 'startFromCurrentPosition',
				type: 'boolean',
				displayOptions: { show: { operation: ['start'] } },
				default: false,
				description: 'Whether to start alignment from the current mount position',
			},
			{
				displayName: 'Alignment Tolerance (Arcmin)',
				name: 'alignmentTolerance',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 1.0,
				description: 'Acceptable polar alignment error in arcminutes',
			},
			{
				displayName: 'Search Radius',
				name: 'searchRadius',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0.5,
				description: 'Plate-solve search radius in degrees',
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'string',
				displayOptions: { show: { operation: ['start'] } },
				default: '',
				description: 'Filter name to use during alignment exposures (leave empty for current filter)',
			},
			{
				displayName: 'Binning',
				name: 'binning',
				type: 'string',
				displayOptions: { show: { operation: ['start'] } },
				default: '1x1',
				description: 'Camera binning mode (e.g. 1x1, 2x2)',
			},
			{
				displayName: 'Gain',
				name: 'gain',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: -1,
				description: 'Camera gain (-1 = use default)',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: -1,
				description: 'Camera offset (-1 = use default)',
			},
			{
				displayName: 'Initial Alt Degrees',
				name: 'altDegrees',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0,
				description: 'Initial altitude position – degrees component',
			},
			{
				displayName: 'Initial Alt Minutes',
				name: 'altMinutes',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0,
				description: 'Initial altitude position – arcminutes component',
			},
			{
				displayName: 'Initial Alt Seconds',
				name: 'altSeconds',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0,
				description: 'Initial altitude position – arcseconds component',
			},
			{
				displayName: 'Initial Az Degrees',
				name: 'azDegrees',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0,
				description: 'Initial azimuth position – degrees component',
			},
			{
				displayName: 'Initial Az Minutes',
				name: 'azMinutes',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0,
				description: 'Initial azimuth position – arcminutes component',
			},
			{
				displayName: 'Initial Az Seconds',
				name: 'azSeconds',
				type: 'number',
				displayOptions: { show: { operation: ['start'] } },
				default: 0,
				description: 'Initial azimuth position – arcseconds component',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const WebSocket = require('ws') as typeof import('ws');
		const credentials = await this.getCredentials('ninaApi');
		const wsUrl = `ws://${credentials.host}:${credentials.port}/v2/tppa`;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: IDataObject | IDataObject[];

				if (operation === 'start') {
					const timeout = this.getNodeParameter('timeout', i, 120) as number;
					const exposureTime = this.getNodeParameter('exposureTime', i) as number;
					const manualMode = this.getNodeParameter('manualMode', i) as boolean;
					const targetDistance = this.getNodeParameter('targetDistance', i) as number;
					const moveRate = this.getNodeParameter('moveRate', i) as number;
					const eastDirection = this.getNodeParameter('eastDirection', i) as boolean;
					const startFromCurrentPosition = this.getNodeParameter('startFromCurrentPosition', i) as boolean;
					const alignmentTolerance = this.getNodeParameter('alignmentTolerance', i) as number;
					const searchRadius = this.getNodeParameter('searchRadius', i) as number;
					const filter = this.getNodeParameter('filter', i, '') as string;
					const binning = this.getNodeParameter('binning', i) as string;
					const gain = this.getNodeParameter('gain', i) as number;
					const offset = this.getNodeParameter('offset', i) as number;
					const altDegrees = this.getNodeParameter('altDegrees', i) as number;
					const altMinutes = this.getNodeParameter('altMinutes', i) as number;
					const altSeconds = this.getNodeParameter('altSeconds', i) as number;
					const azDegrees = this.getNodeParameter('azDegrees', i) as number;
					const azMinutes = this.getNodeParameter('azMinutes', i) as number;
					const azSeconds = this.getNodeParameter('azSeconds', i) as number;

					const command: IDataObject = {
						Action: 'start-alignment',
						ManualMode: manualMode,
						TargetDistance: targetDistance,
						MoveRate: moveRate,
						EastDirection: eastDirection,
						StartFromCurrentPosition: startFromCurrentPosition,
						AltDegrees: altDegrees,
						AltMinutes: altMinutes,
						AltSeconds: altSeconds,
						AzDegrees: azDegrees,
						AzMinutes: azMinutes,
						AzSeconds: azSeconds,
						AlignmentTolerance: alignmentTolerance,
						ExposureTime: exposureTime,
						Binning: binning,
						Gain: gain,
						Offset: offset,
						SearchRadius: searchRadius,
					};
					if (filter) command.Filter = filter;

					const collected: IDataObject[] = [];

					await new Promise<void>((resolve, reject) => {
						const ws = new WebSocket(wsUrl);
						const timer = setTimeout(() => {
							ws.terminate();
							resolve();
						}, timeout * 1000);

						ws.on('open', () => {
							ws.send(JSON.stringify(command));
						});

						ws.on('message', (data: Buffer) => {
							try {
								const raw = data.toString();
								// Messages can be plain strings (confirmations) or JSON objects
								let parsed: IDataObject;
								try {
									parsed = JSON.parse(raw) as IDataObject;
								} catch {
									parsed = { message: raw };
								}
								collected.push(parsed);
							} catch {
								// ignore unparseable frames
							}
						});

						ws.on('error', (err: Error) => {
							clearTimeout(timer);
							reject(new Error(`TPPA WebSocket error: ${err.message}`));
						});

						ws.on('close', () => {
							clearTimeout(timer);
							resolve();
						});
					});

					// Return all collected messages; last measurement typically has the best errors
					const measurements = collected.filter(
						(m) => m.AzimuthError !== undefined || m.AltitudeError !== undefined,
					);
					const lastMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

					responseData = {
						allMessages: collected,
						measurements,
						lastMeasurement,
						measurementCount: measurements.length,
					};
				} else {
					// stop / pause / resume – fire command and wait for a single confirmation
					const actionMap: Record<string, string> = {
						stop: 'stop-alignment',
						pause: 'pause-alignment',
						resume: 'resume-alignment',
					};

					const command = { Action: actionMap[operation] };
					const confirmations: IDataObject[] = [];

					await new Promise<void>((resolve, reject) => {
						const ws = new WebSocket(wsUrl);
						const timer = setTimeout(() => {
							ws.terminate();
							resolve();
						}, 10_000); // 10 s max for a simple command

						ws.on('open', () => {
							ws.send(JSON.stringify(command));
						});

						ws.on('message', (data: Buffer) => {
							try {
								const raw = data.toString();
								let parsed: IDataObject;
								try {
									parsed = JSON.parse(raw) as IDataObject;
								} catch {
									parsed = { message: raw };
								}
								confirmations.push(parsed);
								// One response is enough for control commands
								clearTimeout(timer);
								ws.close();
								resolve();
							} catch {
								// ignore
							}
						});

						ws.on('error', (err: Error) => {
							clearTimeout(timer);
							reject(new Error(`TPPA WebSocket error: ${err.message}`));
						});

						ws.on('close', () => {
							clearTimeout(timer);
							resolve();
						});
					});

					responseData =
						confirmations.length > 0
							? confirmations[0]
							: { message: `${operation} command sent` };
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
