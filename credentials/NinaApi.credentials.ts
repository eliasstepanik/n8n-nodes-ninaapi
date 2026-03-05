import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NinaApi implements ICredentialType {
	name = 'ninaApi';

	displayName = 'NINA API';

	documentationUrl = 'https://github.com/christian-photo/ninaAPI';

	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'localhost',
			description: 'Hostname or IP address of the machine running NINA with ninaAPI plugin',
			required: true,
		},
		{
			displayName: 'Port',
			name: 'port',
			type: 'number',
			default: 1888,
			description: 'Port number of the ninaAPI server (default: 1888)',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '=http://{{$credentials.host}}:{{$credentials.port}}/v2/api',
			url: '/version',
			method: 'GET',
		},
	};
}
