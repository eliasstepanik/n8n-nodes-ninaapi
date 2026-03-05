import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaSwitch implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Switch',
    name: 'ninaSwitch',
    icon: 'fa:toggle-on',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with the NINA Switch equipment',
    defaults: { name: 'NINA Switch' },
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
            description: 'Get switch device info',
            action: 'Get switch info',
          },
          {
            name: 'Connect',
            value: 'connect',
            description: 'Connect to the switch device',
            action: 'Connect to switch',
          },
          {
            name: 'Disconnect',
            value: 'disconnect',
            description: 'Disconnect from the switch device',
            action: 'Disconnect from switch',
          },
          {
            name: 'List Devices',
            value: 'listDevices',
            description: 'List all available switch devices',
            action: 'List switch devices',
          },
          {
            name: 'Rescan',
            value: 'rescan',
            description: 'Rescan for available switch devices',
            action: 'Rescan for switch devices',
          },
          {
            name: 'Set Value',
            value: 'setValue',
            description: 'Set the value of a switch at a given index',
            action: 'Set switch value',
          },
        ],
        default: 'getInfo',
      },
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
      {
        displayName: 'Switch Index',
        name: 'index',
        type: 'number',
        required: true,
        default: 0,
        description: 'Switch index/slot',
        displayOptions: {
          show: {
            operation: ['setValue'],
          },
        },
      },
      {
        displayName: 'Value',
        name: 'value',
        type: 'number',
        required: true,
        default: 0,
        description: 'Value to set',
        displayOptions: {
          show: {
            operation: ['setValue'],
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
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/switch/info`,
              qs,
            });
            break;
          }
          case 'connect': {
            const qs: IDataObject = {};
            const to = this.getNodeParameter('to', i, '') as string;
            if (to) qs.to = to;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/switch/connect`,
              qs,
            });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/switch/disconnect`,
              qs,
            });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/switch/list-devices`,
              qs,
            });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/switch/rescan`,
              qs,
            });
            break;
          }
          case 'setValue': {
            const qs: IDataObject = {};
            qs.index = this.getNodeParameter('index', i) as number;
            qs.value = this.getNodeParameter('value', i) as number;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/switch/set`,
              qs,
            });
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
