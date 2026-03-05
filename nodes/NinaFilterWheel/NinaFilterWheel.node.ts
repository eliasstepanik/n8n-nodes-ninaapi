import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaFilterWheel implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Filter Wheel',
    name: 'ninaFilterWheel',
    icon: 'fa:filter',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Control Filter Wheel via N.I.N.A. ninaAPI',
    defaults: { name: 'NINA Filter Wheel' },
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
          { name: 'Get Info', value: 'getInfo', description: 'Get filter wheel info (Connected, SelectedFilter, AvailableFilters, IsMoving)' },
          { name: 'Connect', value: 'connect', description: 'Connect to filter wheel device' },
          { name: 'Disconnect', value: 'disconnect', description: 'Disconnect from filter wheel device' },
          { name: 'List Devices', value: 'listDevices', description: 'List available filter wheel devices' },
          { name: 'Rescan', value: 'rescan', description: 'Rescan for filter wheel devices' },
          { name: 'Change Filter', value: 'changeFilter', description: 'Change to a specific filter slot' },
          { name: 'Get Filter Info', value: 'getFilterInfo', description: 'Get info for a specific filter slot' },
          { name: 'Add Filter', value: 'addFilter', description: 'Add a new empty filter slot' },
          { name: 'Remove Filter', value: 'removeFilter', description: 'Remove a filter slot' },
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
        displayName: 'Filter ID',
        name: 'filterId',
        type: 'number',
        default: 0,
        required: true,
        description: 'Filter slot index to change to',
        displayOptions: { show: { operation: ['changeFilter'] } },
      },
      {
        displayName: 'Filter ID',
        name: 'filterId',
        type: 'number',
        default: 0,
        required: true,
        description: 'Filter slot index',
        displayOptions: { show: { operation: ['getFilterInfo'] } },
      },
      {
        displayName: 'Filter ID',
        name: 'filterId',
        type: 'number',
        default: 0,
        required: true,
        description: 'Filter slot index to remove',
        displayOptions: { show: { operation: ['removeFilter'] } },
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
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/info`, qs });
            break;
          }
          case 'connect': {
            const qs: IDataObject = {};
            const to = this.getNodeParameter('to', i, '') as string;
            if (to) qs.to = to;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/connect`, qs });
            break;
          }
          case 'disconnect': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/disconnect`, qs });
            break;
          }
          case 'listDevices': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/list-devices`, qs });
            break;
          }
          case 'rescan': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/rescan`, qs });
            break;
          }
          case 'changeFilter': {
            const qs: IDataObject = {};
            qs.filterId = this.getNodeParameter('filterId', i) as number;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/change-filter`, qs });
            break;
          }
          case 'getFilterInfo': {
            const qs: IDataObject = {};
            qs.filterId = this.getNodeParameter('filterId', i) as number;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/filter-info`, qs });
            break;
          }
          case 'addFilter': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/add-filter`, qs });
            break;
          }
          case 'removeFilter': {
            const qs: IDataObject = {};
            qs.filterId = this.getNodeParameter('filterId', i) as number;
            responseData = await this.helpers.httpRequest({ method: 'GET', url: `${baseUrl}/equipment/filterwheel/remove-filter`, qs });
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
