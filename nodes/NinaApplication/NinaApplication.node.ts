import {
  type IExecuteFunctions,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeConnectionTypes,
  NodeOperationError,
} from 'n8n-workflow';

export class NinaApplication implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NINA Application',
    name: 'ninaApplication',
    icon: 'fa:desktop',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with the NINA application',
    defaults: { name: 'NINA Application' },
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
            name: 'Get Version',
            value: 'getVersion',
            description: 'Get the plugin version string',
            action: 'Get plugin version',
          },
          {
            name: 'Get NINA Version',
            value: 'getNinaVersion',
            description: 'Get the NINA application version',
            action: 'Get NINA version',
          },
          {
            name: 'Get Application Start',
            value: 'getApplicationStart',
            description: 'Get the NINA application start time',
            action: 'Get application start time',
          },
          {
            name: 'Get Plugin Settings',
            value: 'getPluginSettings',
            description: 'Get plugin settings including access control and thumbnail options',
            action: 'Get plugin settings',
          },
          {
            name: 'Get Equipment Info',
            value: 'getEquipmentInfo',
            description: 'Get all equipment info bundled in one call',
            action: 'Get all equipment info',
          },
          {
            name: 'Switch Tab',
            value: 'switchTab',
            description: 'Switch the active tab in the NINA application',
            action: 'Switch NINA tab',
          },
          {
            name: 'Get Current Tab',
            value: 'getCurrentTab',
            description: 'Get the current active tab name',
            action: 'Get current tab',
          },
          {
            name: 'Take Screenshot',
            value: 'takeScreenshot',
            description: 'Take a screenshot of the NINA application',
            action: 'Take screenshot',
          },
          {
            name: 'Get Plugins',
            value: 'getPlugins',
            description: 'Get a list of installed plugin folder names',
            action: 'Get installed plugins',
          },
          {
            name: 'Get Logs',
            value: 'getLogs',
            description: 'Get application log entries with optional level filtering',
            action: 'Get application logs',
          },
        ],
        default: 'getVersion',
      },
      // getNinaVersion params
      {
        displayName: 'Friendly',
        name: 'friendly',
        type: 'boolean',
        default: false,
        description: 'Whether to return a human-friendly version string',
        displayOptions: {
          show: {
            operation: ['getNinaVersion'],
          },
        },
      },
      // switchTab params
      {
        displayName: 'Tab',
        name: 'tab',
        type: 'options',
        required: true,
        options: [
          { name: 'Equipment', value: 'equipment' },
          { name: 'Sky Atlas', value: 'skyatlas' },
          { name: 'Framing', value: 'framing' },
          { name: 'Flat Wizard', value: 'flatwizard' },
          { name: 'Sequencer', value: 'sequencer' },
          { name: 'Imaging', value: 'imaging' },
          { name: 'Options', value: 'options' },
        ],
        default: 'imaging',
        description: 'NINA tab to switch to',
        displayOptions: {
          show: {
            operation: ['switchTab'],
          },
        },
      },
      // takeScreenshot params
      {
        displayName: 'Resize',
        name: 'resize',
        type: 'boolean',
        default: false,
        description: 'Whether to resize the screenshot',
        displayOptions: {
          show: {
            operation: ['takeScreenshot'],
          },
        },
      },
      {
        displayName: 'Quality',
        name: 'quality',
        type: 'number',
        default: 90,
        description: 'JPEG quality 1-100',
        typeOptions: {
          minValue: 1,
          maxValue: 100,
        },
        displayOptions: {
          show: {
            operation: ['takeScreenshot'],
          },
        },
      },
      {
        displayName: 'Size',
        name: 'size',
        type: 'string',
        default: '',
        description: 'Size string e.g. 1920x1080',
        displayOptions: {
          show: {
            operation: ['takeScreenshot'],
          },
        },
      },
      {
        displayName: 'Scale',
        name: 'scale',
        type: 'number',
        default: -1,
        description: 'Scale factor (leave at -1 to omit)',
        displayOptions: {
          show: {
            operation: ['takeScreenshot'],
          },
        },
      },
      // getLogs params
      {
        displayName: 'Line Count',
        name: 'lineCount',
        type: 'number',
        default: 100,
        description: 'Number of log lines to return',
        displayOptions: {
          show: {
            operation: ['getLogs'],
          },
        },
      },
      {
        displayName: 'Log Level',
        name: 'level',
        type: 'options',
        options: [
          { name: 'All', value: '' },
          { name: 'Debug', value: 'DEBUG' },
          { name: 'Info', value: 'INFO' },
          { name: 'Warning', value: 'WARNING' },
          { name: 'Error', value: 'ERROR' },
        ],
        default: '',
        description: 'Log level filter',
        displayOptions: {
          show: {
            operation: ['getLogs'],
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
          case 'getVersion': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/version`,
              qs,
            });
            break;
          }
          case 'getNinaVersion': {
            const qs: IDataObject = {};
            qs.friendly = this.getNodeParameter('friendly', i) as boolean;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/version/nina`,
              qs,
            });
            break;
          }
          case 'getApplicationStart': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/application-start`,
              qs,
            });
            break;
          }
          case 'getPluginSettings': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/plugin/settings`,
              qs,
            });
            break;
          }
          case 'getEquipmentInfo': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/equipment/info`,
              qs,
            });
            break;
          }
          case 'switchTab': {
            const qs: IDataObject = {};
            qs.tab = this.getNodeParameter('tab', i) as string;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/application/switch-tab`,
              qs,
            });
            break;
          }
          case 'getCurrentTab': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/application/get-tab`,
              qs,
            });
            break;
          }
          case 'takeScreenshot': {
            const qs: IDataObject = {};
            qs.resize = this.getNodeParameter('resize', i) as boolean;
            qs.quality = this.getNodeParameter('quality', i) as number;
            const size = this.getNodeParameter('size', i, '') as string;
            if (size) qs.size = size;
            const scale = this.getNodeParameter('scale', i, -1) as number;
            if (scale !== -1) qs.scale = scale;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/application/screenshot`,
              qs,
            });
            break;
          }
          case 'getPlugins': {
            const qs: IDataObject = {};
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/application/plugins`,
              qs,
            });
            break;
          }
          case 'getLogs': {
            const qs: IDataObject = {};
            qs.lineCount = this.getNodeParameter('lineCount', i) as number;
            const level = this.getNodeParameter('level', i) as string;
            if (level) qs.level = level;
            responseData = await this.helpers.httpRequest({
              method: 'GET',
              url: `${baseUrl}/application/logs`,
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
