import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaDome implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Dome',
    name: 'ninaDome',
    icon: 'fa:home',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Control Dome via N.I.N.A. ninaAPI',
    defaults: { name: 'NINA Dome' },
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
          { name: 'Get Info', value: 'getInfo', description: 'Get dome info (Azimuth, ShutterStatus, AtHome, AtPark, Connected, etc.)' },
          { name: 'Connect', value: 'connect', description: 'Connect to dome device' },
          { name: 'Disconnect', value: 'disconnect', description: 'Disconnect from dome device' },
          { name: 'List Devices', value: 'listDevices', description: 'List available dome devices' },
          { name: 'Rescan', value: 'rescan', description: 'Rescan for dome devices' },
          { name: 'Open Shutter', value: 'openShutter', description: 'Open the dome shutter' },
          { name: 'Close Shutter', value: 'closeShutter', description: 'Close the dome shutter' },
          { name: 'Stop', value: 'stop', description: 'Stop all dome movement' },
          { name: 'Set Follow', value: 'setFollow', description: 'Enable or disable dome following telescope' },
          { name: 'Sync', value: 'sync', description: 'Sync dome to telescope coordinates' },
          { name: 'Slew', value: 'slew', description: 'Slew dome to target azimuth' },
          { name: 'Set Park Position', value: 'setParkPosition', description: 'Set current position as park position' },
          { name: 'Park', value: 'park', description: 'Park the dome' },
          { name: 'Home', value: 'home', description: 'Slew dome to home position' },
        ],
        default: 'getInfo',
      },
      {
        displayName: 'Device ID',
        name: 'to',
        type: 'string',
        default: '',
        description: 'Device ID to connect to',
        displayOptions: { show: { operation: ['connect'] } },
      },
      {
        displayName: 'Enable Follow',
        name: 'enabled',
        type: 'boolean',
        default: true,
        required: true,
        description: 'Enable dome following telescope',
        displayOptions: { show: { operation: ['setFollow'] } },
      },
      {
        displayName: 'Azimuth',
        name: 'azimuth',
        type: 'number',
        default: 0,
        required: true,
        description: 'Target azimuth in degrees 0-360',
        displayOptions: { show: { operation: ['slew'] } },
      },
      {
        displayName: 'Wait To Finish',
        name: 'waitToFinish',
        type: 'boolean',
        default: true,
        description: 'Wait for slew to complete',
        displayOptions: { show: { operation: ['slew'] } },
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
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/info`, qs });
            break;
          }
          case 'connect': {
            const qs: IDataObject = {};
            const to = this.getNodeParameter('to', i, '') as string;
            if (to) qs.to = to;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/connect`, qs });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/disconnect`, qs });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/list-devices`, qs });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/rescan`, qs });
            break;
          }
          case 'openShutter': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/open`, qs });
            break;
          }
          case 'closeShutter': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/close`, qs });
            break;
          }
          case 'stop': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/stop`, qs });
            break;
          }
          case 'setFollow': {
            const qs: IDataObject = {};
            qs.enabled = this.getNodeParameter('enabled', i) as boolean;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/set-follow`, qs });
            break;
          }
          case 'sync': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/sync`, qs });
            break;
          }
          case 'slew': {
            const qs: IDataObject = {};
            qs.azimuth = this.getNodeParameter('azimuth', i) as number;
            const waitToFinish = this.getNodeParameter('waitToFinish', i, true) as boolean;
            qs.waitToFinish = waitToFinish;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/slew`, qs });
            break;
          }
          case 'setParkPosition': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/set-park-position`, qs });
            break;
          }
          case 'park': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/park`, qs });
            break;
          }
          case 'home': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/dome/home`, qs });
            break;
          }
          default:
            throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
        }

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(Array.isArray(responseData) ? responseData : [responseData as IDataObject]),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push(...this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray({ error: (error as Error).message }),
            { itemData: { item: i } },
          ));
          continue;
        }
        throw error;
      }
    }
    return [returnData];
  }
}
