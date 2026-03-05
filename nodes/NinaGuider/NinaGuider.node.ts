import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaGuider implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Guider',
    name: 'ninaGuider',
    icon: 'fa:crosshairs',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Control Guider via N.I.N.A. ninaAPI',
    defaults: { name: 'NINA Guider' },
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
          { name: 'Get Info', value: 'getInfo', description: 'Get guider info (Connected, RMSError, PixelScale, LastGuideStep, State)' },
          { name: 'Connect', value: 'connect', description: 'Connect to guider device' },
          { name: 'Disconnect', value: 'disconnect', description: 'Disconnect from guider device' },
          { name: 'List Devices', value: 'listDevices', description: 'List available guider devices' },
          { name: 'Rescan', value: 'rescan', description: 'Rescan for guider devices' },
          { name: 'Start Guiding', value: 'startGuiding', description: 'Start auto-guiding' },
          { name: 'Stop Guiding', value: 'stopGuiding', description: 'Stop auto-guiding' },
          { name: 'Clear Calibration', value: 'clearCalibration', description: 'Clear guider calibration data' },
          { name: 'Get Graph', value: 'getGraph', description: 'Get guide steps history for graphing' },
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
        displayName: 'Calibrate',
        name: 'calibrate',
        type: 'boolean',
        default: false,
        description: 'Force recalibration before guiding',
        displayOptions: { show: { operation: ['startGuiding'] } },
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
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/info`, qs });
            break;
          }
          case 'connect': {
            const qs: IDataObject = {};
            const to = this.getNodeParameter('to', i, '') as string;
            if (to) qs.to = to;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/connect`, qs });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/disconnect`, qs });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/list-devices`, qs });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/rescan`, qs });
            break;
          }
          case 'startGuiding': {
            const qs: IDataObject = {};
            const calibrate = this.getNodeParameter('calibrate', i, false) as boolean;
            qs.calibrate = calibrate;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/start`, qs });
            break;
          }
          case 'stopGuiding': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/stop`, qs });
            break;
          }
          case 'clearCalibration': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/clear-calibration`, qs });
            break;
          }
          case 'getGraph': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/guider/graph`, qs });
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
