import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeConnectionTypes,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaProfile implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Profile',
    name: 'ninaProfile',
    icon: 'fa:user-cog',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with NINA profiles and profile settings',
    defaults: { name: 'NINA Profile' },
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
            name: 'List Profiles',
            value: 'listProfiles',
            description: 'List all available profiles with their names and IDs',
            action: 'List all profiles',
          },
          {
            name: 'Get Active Profile',
            value: 'getActiveProfile',
            description: 'Get the currently active profile and its settings',
            action: 'Get active profile',
          },
          {
            name: 'Change Value',
            value: 'changeValue',
            description: 'Change a specific setting value in the active profile',
            action: 'Change profile value',
          },
          {
            name: 'Switch Profile',
            value: 'switchProfile',
            description: 'Switch to a different profile by its GUID',
            action: 'Switch profile',
          },
          {
            name: 'Get Horizon',
            value: 'getHorizon',
            description: 'Get the horizon profile with altitudes and azimuths arrays',
            action: 'Get horizon profile',
          },
        ],
        default: 'listProfiles',
      },
      // changeValue params
      {
        displayName: 'Setting Path',
        name: 'settingpath',
        type: 'string',
        required: true,
        default: '',
        description: 'Setting path e.g. CameraSettings-PixelSize',
        displayOptions: {
          show: {
            operation: ['changeValue'],
          },
        },
      },
      {
        displayName: 'New Value',
        name: 'newValue',
        type: 'string',
        required: true,
        default: '',
        description: 'New value to set',
        displayOptions: {
          show: {
            operation: ['changeValue'],
          },
        },
      },
      // switchProfile params
      {
        displayName: 'Profile ID',
        name: 'profileid',
        type: 'string',
        required: true,
        default: '',
        description: 'Profile GUID to switch to',
        displayOptions: {
          show: {
            operation: ['switchProfile'],
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
          case 'listProfiles': {
            const qs: IDataObject = {};
            qs.active = false;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/profile/show`,
              qs,
            });
            break;
          }
          case 'getActiveProfile': {
            const qs: IDataObject = {};
            qs.active = true;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/profile/show`,
              qs,
            });
            break;
          }
          case 'changeValue': {
            const qs: IDataObject = {};
            qs.settingpath = this.getNodeParameter('settingpath', i) as string;
            qs.newValue = this.getNodeParameter('newValue', i) as string;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/profile/change-value`,
              qs,
            });
            break;
          }
          case 'switchProfile': {
            const qs: IDataObject = {};
            qs.profileid = this.getNodeParameter('profileid', i) as string;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/profile/switch`,
              qs,
            });
            break;
          }
          case 'getHorizon': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/profile/horizon`,
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
