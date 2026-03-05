import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaFlatDevice implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Flat Device',
    name: 'ninaFlatDevice',
    icon: 'fa:lightbulb',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Control Flat Device via N.I.N.A. ninaAPI',
    defaults: { name: 'NINA Flat Device' },
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
          { name: 'Get Info', value: 'getInfo', description: 'Get flat device info (Connected, LightOn, CoverState, Brightness, SupportsOpenClose, SupportsLight)' },
          { name: 'Connect', value: 'connect', description: 'Connect to flat device' },
          { name: 'Disconnect', value: 'disconnect', description: 'Disconnect from flat device' },
          { name: 'List Devices', value: 'listDevices', description: 'List available flat devices' },
          { name: 'Rescan', value: 'rescan', description: 'Rescan for flat devices' },
          { name: 'Set Light', value: 'setLight', description: 'Turn light panel on or off' },
          { name: 'Set Cover', value: 'setCover', description: 'Open or close the cover' },
          { name: 'Set Brightness', value: 'setBrightness', description: 'Set brightness level of the light panel' },
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
        displayName: 'Light On',
        name: 'on',
        type: 'boolean',
        default: true,
        required: true,
        description: 'Turn light panel on or off',
        displayOptions: { show: { operation: ['setLight'] } },
      },
      {
        displayName: 'Close Cover',
        name: 'closed',
        type: 'boolean',
        default: true,
        required: true,
        description: 'True=close cover, False=open cover',
        displayOptions: { show: { operation: ['setCover'] } },
      },
      {
        displayName: 'Brightness',
        name: 'brightness',
        type: 'number',
        default: 0,
        required: true,
        description: 'Brightness level (device-specific range)',
        displayOptions: { show: { operation: ['setBrightness'] } },
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
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/info`, qs });
            break;
          }
          case 'connect': {
            const qs: IDataObject = {};
            const to = this.getNodeParameter('to', i, '') as string;
            if (to) qs.to = to;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/connect`, qs });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/disconnect`, qs });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/list-devices`, qs });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/rescan`, qs });
            break;
          }
          case 'setLight': {
            const qs: IDataObject = {};
            qs.on = this.getNodeParameter('on', i) as boolean;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/set-light`, qs });
            break;
          }
          case 'setCover': {
            const qs: IDataObject = {};
            qs.closed = this.getNodeParameter('closed', i) as boolean;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/set-cover`, qs });
            break;
          }
          case 'setBrightness': {
            const qs: IDataObject = {};
            qs.brightness = this.getNodeParameter('brightness', i) as number;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/flatdevice/set-brightness`, qs });
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
