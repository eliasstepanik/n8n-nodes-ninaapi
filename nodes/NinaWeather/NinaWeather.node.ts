import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeConnectionTypes,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaWeather implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Weather',
    name: 'ninaWeather',
    icon: 'fa:cloud',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with the NINA Weather equipment',
    defaults: { name: 'NINA Weather' },
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
            description: 'Get weather station info including temperature, wind speed, humidity, and more',
            action: 'Get weather info',
          },
          {
            name: 'Connect',
            value: 'connect',
            description: 'Connect to the weather station device',
            action: 'Connect to weather station',
          },
          {
            name: 'Disconnect',
            value: 'disconnect',
            description: 'Disconnect from the weather station device',
            action: 'Disconnect from weather station',
          },
          {
            name: 'List Devices',
            value: 'listDevices',
            description: 'List all available weather station devices',
            action: 'List weather devices',
          },
          {
            name: 'Rescan',
            value: 'rescan',
            description: 'Rescan for available weather station devices',
            action: 'Rescan for weather devices',
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
              url: `${baseUrl}/equipment/weather/info`,
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
              url: `${baseUrl}/equipment/weather/connect`,
              qs,
            });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/weather/disconnect`,
              qs,
            });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/weather/list-devices`,
              qs,
            });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/weather/rescan`,
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
