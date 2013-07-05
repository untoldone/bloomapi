module.exports = {

	generate_sql: function (create_indices_for) {
		var indices = [];

		create_indices_for.forEach(function(column){
			if (typeof(column) === 'string') {
				indices.push('CREATE INDEX ON npis ('+column+' ASC NULLS LAST);');
			} else if (typeof(column) === 'object' && column.length === 2 ) {
				indices.push('CREATE INDEX ON npis ('+column[0]+' , '+column[1]+' ASC NULLS LAST);');
			} else {
				// ERROR, unknown index definition
				throw new Error('Unknown index definition: ' + JSON.stringify(column));
			}
		})

		return indices.join('\n');
	}
};
