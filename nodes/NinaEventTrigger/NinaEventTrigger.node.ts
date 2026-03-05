import {
	type IDataObject,
	type INodeType,
	type INodeTypeDescription,
	type ITriggerFunctions,
	type ITriggerResponse,
} from 'n8n-workflow';
import WebSocket from 'ws';

export class NinaEventTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NINA Event Trigger',
		name: 'ninaEventTrigger',
		icon: 'fa:satellite',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers when a N.I.N.A. event occurs via WebSocket',
		defaults: { name: 'NINA Event Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'ninaApi', required: true }],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'All Events', value: 'all' },
					{ name: 'Autofocus Finished', value: 'AUTOFOCUS-FINISHED' },
					{ name: 'Autofocus Point Added', value: 'AUTOFOCUS-POINT-ADDED' },
					{ name: 'Autofocus Starting', value: 'AUTOFOCUS-STARTING' },
					{ name: 'Camera Connected', value: 'CAMERA-CONNECTED' },
					{ name: 'Camera Disconnected', value: 'CAMERA-DISCONNECTED' },
					{ name: 'Capture Finished', value: 'API-CAPTURE-FINISHED' },
					{ name: 'Dome Connected', value: 'DOME-CONNECTED' },
					{ name: 'Dome Disconnected', value: 'DOME-DISCONNECTED' },
					{ name: 'Dome Shutter Closed', value: 'DOME-SHUTTER-CLOSED' },
					{ name: 'Dome Shutter Opened', value: 'DOME-SHUTTER-OPENED' },
					{ name: 'Filter Changed', value: 'FILTERWHEEL-CHANGED' },
					{ name: 'Filter Wheel Connected', value: 'FILTERWHEEL-CONNECTED' },
					{ name: 'Filter Wheel Disconnected', value: 'FILTERWHEEL-DISCONNECTED' },
					{ name: 'Focuser Connected', value: 'FOCUSER-CONNECTED' },
					{ name: 'Focuser Disconnected', value: 'FOCUSER-DISCONNECTED' },
					{ name: 'Guider Connected', value: 'GUIDER-CONNECTED' },
					{ name: 'Guider Disconnected', value: 'GUIDER-DISCONNECTED' },
					{ name: 'Guider Started', value: 'GUIDER-START' },
					{ name: 'Guider Stopped', value: 'GUIDER-STOP' },
					{ name: 'Image Saved', value: 'IMAGE-SAVE' },
					{ name: 'Live Stack Status', value: 'STACK-STATUS' },
					{ name: 'Live Stack Updated', value: 'STACK-UPDATED' },
					{ name: 'Mount After Meridian Flip', value: 'MOUNT-AFTER-FLIP' },
					{ name: 'Mount Before Meridian Flip', value: 'MOUNT-BEFORE-FLIP' },
					{ name: 'Mount Connected', value: 'MOUNT-CONNECTED' },
					{ name: 'Mount Disconnected', value: 'MOUNT-DISCONNECTED' },
					{ name: 'Mount Homed', value: 'MOUNT-HOMED' },
					{ name: 'Mount Parked', value: 'MOUNT-PARKED' },
					{ name: 'Mount Unparked', value: 'MOUNT-UNPARKED' },
					{ name: 'Rotator Connected', value: 'ROTATOR-CONNECTED' },
					{ name: 'Rotator Disconnected', value: 'ROTATOR-DISCONNECTED' },
					{ name: 'Safety Monitor Connected', value: 'SAFETY-CONNECTED' },
					{ name: 'Safety Monitor Disconnected', value: 'SAFETY-DISCONNECTED' },
					{ name: 'Safety Status Changed', value: 'SAFETY-CHANGED' },
					{ name: 'Sequence Finished', value: 'SEQUENCE-FINISHED' },
					{ name: 'Sequence Item Failed', value: 'SEQUENCE-ENTITY-FAILED' },
					{ name: 'Sequence Starting', value: 'SEQUENCE-STARTING' },
					{ name: 'User Focused', value: 'FOCUSER-USER-FOCUSED' },
				],
				default: 'all',
				description: 'Filter events to receive',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse | undefined> {
		const credentials = await this.getCredentials('ninaApi');
		const eventFilter = this.getNodeParameter('event') as string;
		const wsUrl = `ws://${credentials.host}:${credentials.port}/v2/socket`;

		const ws = new WebSocket(wsUrl);

		ws.on('message', (data: Buffer) => {
			try {
				const message = JSON.parse(data.toString()) as IDataObject;
				if (eventFilter === 'all' || message['Event'] === eventFilter) {
					this.emit([this.helpers.returnJsonArray([message])]);
				}
			} catch (_e) {
				// skip invalid JSON
			}
		});

		ws.on('error', (error: Error) => {
			this.logger.error(`NINA WebSocket error: ${error.message}`);
		});

		return {
			closeFunction: async () => {
				ws.close();
			},
		};
	}
}
