import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeConnectionTypes,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaSafetyMonitor implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Safety Monitor',
    name: 'ninaSafetyMonitor',
    icon: 'fa:shield-alt',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with the NINA Safety Monitor equipment',
    defaults: { name: 'NINA Safety Monitor' },
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
            description: 'Get safety monitor info including IsSafe, Connected, and Name',
            action: 'Get safety monitor info',
          },
          {
            name: 'Connect',
            value: 'connect',
            description: 'Connect to the safety monitor device',
            action: 'Connect to safety monitor',
          },
          {
            name: 'Disconnect',
            value: 'disconnect',
            description: 'Disconnect from the safety monitor device',
            action: 'Disconnect from safety monitor',
          },
          {
            name: 'List Devices',
            value: 'listDevices',
            description: 'List all available safety monitor devices',
            action: 'List safety monitor devices',
          },
          {
            name: 'Rescan',
            value: 'rescan',
            description: 'Rescan for available safety monitor devices',
            action: 'Rescan for safety monitor devices',
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
              url: `${baseUrl}/equipment/safetymonitor/info`,
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
              url: `${baseUrl}/equipment/safetymonitor/connect`,
              qs,
            });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/safetymonitor/disconnect`,
              qs,
            });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/safetymonitor/list-devices`,
              qs,
            });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/safetymonitor/rescan`,
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
