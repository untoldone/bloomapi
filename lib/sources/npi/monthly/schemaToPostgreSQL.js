module.exports = {
	importSchema: function (schema) {
		var columns = [],
			that = this;

		// create table scheme
		schema.forEach(function (desc) {
			var type;

			if (desc.type === 'VARCHAR') {
				type = 'varchar(' + desc.length + ')';
			} else if (desc.type === 'NUMBER' && desc.length <= 4) {
				type = 'smallint';
			} else if (desc.type === 'NUMBER' && desc.length <= 9) {
				type = 'integer';
			} else if (desc.type === 'NUMBER' && desc.length <= 18) {
				type = 'bigint';
			} else if (desc.type === 'NUMBER') {
				type = 'numeric(' + desc.length + ')'
			} else if (desc.type === 'DATE') {
				type = 'date'
			} else {
				// ERROR, unknown type
				throw new Error('Unknown schemaToPostgre column type: ' + desc.type);
			}
			if (desc.name === 'npi') type += ' PRIMARY KEY';
			columns.push(desc.name + '  ' + type);
		});

		return 'CREATE TABLE npis_temp (' + columns.join(",\n") + ');';
	}
};
