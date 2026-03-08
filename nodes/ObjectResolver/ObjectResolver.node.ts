import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class ObjectResolver implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Object Resolver',
		name: 'objectResolver',
		icon: 'fa:crosshairs',
		group: ['transform'],
		version: 1,
		subtitle: '={{"Resolve " + $parameter["objectName"]}}',
		description: 'Resolve astronomical object names to RA/Dec coordinates via SIMBAD Sesame',
		defaults: { name: 'Object Resolver' },
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Object Name',
				name: 'objectName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'M 63',
				description: 'Name of the astronomical object (e.g. M 31, NGC 5055, IC 1396, Andromeda)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const objectName = this.getNodeParameter('objectName', i) as string;

				if (!objectName.trim()) {
					throw new NodeOperationError(this.getNode(), 'Object name cannot be empty', {
						itemIndex: i,
					});
				}

				const xml = (await this.helpers.httpRequest({
					method: 'GET',
					url: `https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-ox/A?${encodeURIComponent(objectName.trim())}`,
					returnFullResponse: false,
				})) as string;

				const raMatch = xml.match(/<jradeg>([^<]+)<\/jradeg>/);
				const decMatch = xml.match(/<jdedeg>([^<]+)<\/jdedeg>/);
				const nameMatch = xml.match(/<oname>([^<]+)<\/oname>/);
				const typeMatch = xml.match(/<otype>([^<]+)<\/otype>/);
				const posMatch = xml.match(/<jpos>([^<]+)<\/jpos>/);

				if (!raMatch || !decMatch) {
					throw new NodeOperationError(
						this.getNode(),
						`Could not resolve object "${objectName}". Verify the name is a valid astronomical catalog identifier.`,
						{ itemIndex: i },
					);
				}

				const raDeg = parseFloat(raMatch[1]);
				const decDeg = parseFloat(decMatch[1]);

				const responseData: IDataObject = {
					name: nameMatch ? nameMatch[1] : objectName,
					type: typeMatch ? typeMatch[1] : '',
					ra: raDeg,
					dec: decDeg,
					position: posMatch ? posMatch[1] : '',
				};

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray([responseData]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push(
						...this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray({ error: (error as Error).message }),
							{ itemData: { item: i } },
						),
					);
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
