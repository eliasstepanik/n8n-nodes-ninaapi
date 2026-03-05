import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaRotator implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Rotator',
    name: 'ninaRotator',
    icon: 'fa:sync-alt',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Control Rotator via N.I.N.A. ninaAPI',
    defaults: { name: 'NINA Rotator' },
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
          { name: 'Get Info', value: 'getInfo', description: 'Get rotator info' },
          { name: 'Connect', value: 'connect', description: 'Connect to rotator device' },
          { name: 'Disconnect', value: 'disconnect', description: 'Disconnect from rotator device' },
          { name: 'List Devices', value: 'listDevices', description: 'List available rotator devices' },
          { name: 'Rescan', value: 'rescan', description: 'Rescan for rotator devices' },
          { name: 'Move', value: 'move', description: 'Move rotator to target position angle' },
          { name: 'Move Mechanical', value: 'moveMechanical', description: 'Move rotator to target mechanical position' },
          { name: 'Reverse', value: 'reverse', description: 'Enable or disable direction reversal' },
          { name: 'Set Mechanical Range', value: 'setMechanicalRange', description: 'Set the mechanical range type' },
          { name: 'Stop Move', value: 'stopMove', description: 'Stop rotator movement' },
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
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        required: true,
        description: 'Target position angle in degrees',
        displayOptions: { show: { operation: ['move'] } },
      },
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        required: true,
        description: 'Target mechanical position in degrees',
        displayOptions: { show: { operation: ['moveMechanical'] } },
      },
      {
        displayName: 'Reverse Direction',
        name: 'reverseDirection',
        type: 'boolean',
        default: false,
        required: true,
        description: 'Enable direction reversal',
        displayOptions: { show: { operation: ['reverse'] } },
      },
      {
        displayName: 'Range',
        name: 'range',
        type: 'options',
        options: [
          { name: '0-360', value: '0' },
          { name: '0-180', value: '1' },
          { name: 'Custom1', value: '2' },
          { name: 'Custom2', value: '3' },
        ],
        default: '0',
        required: true,
        description: 'Mechanical range type',
        displayOptions: { show: { operation: ['setMechanicalRange'] } },
      },
      {
        displayName: 'Range Start Position',
        name: 'rangeStartPosition',
        type: 'number',
        default: 0,
        description: 'Range start position in degrees',
        displayOptions: { show: { operation: ['setMechanicalRange'] } },
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
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/info`, qs });
            break;
          }
          case 'connect': {
            const qs: IDataObject = {};
            const to = this.getNodeParameter('to', i, '') as string;
            if (to) qs.to = to;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/connect`, qs });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/disconnect`, qs });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/list-devices`, qs });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/rescan`, qs });
            break;
          }
          case 'move': {
            const qs: IDataObject = {};
            qs.position = this.getNodeParameter('position', i) as number;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/move`, qs });
            break;
          }
          case 'moveMechanical': {
            const qs: IDataObject = {};
            qs.position = this.getNodeParameter('position', i) as number;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/move-mechanical`, qs });
            break;
          }
          case 'reverse': {
            const qs: IDataObject = {};
            qs.reverseDirection = this.getNodeParameter('reverseDirection', i) as boolean;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/reverse`, qs });
            break;
          }
          case 'setMechanicalRange': {
            const qs: IDataObject = {};
            qs.range = this.getNodeParameter('range', i) as string;
            const rangeStartPosition = this.getNodeParameter('rangeStartPosition', i, undefined) as number | undefined;
            if (rangeStartPosition !== undefined) qs.rangeStartPosition = rangeStartPosition;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/set-mechanical-range`, qs });
            break;
          }
          case 'stopMove': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/rotator/stop-move`, qs });
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
