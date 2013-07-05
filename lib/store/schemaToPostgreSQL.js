module.exports = {
  fieldName: function (name) {
    return name.toLowerCase()
            .replace(/\s|\(|\)|\./g, '_') // replace all non characters with _
            .replace(/__+/g, '_') // remove multiple _ in a row from last replace
            .replace(/^_/, '')
            .replace(/_$/, '');
  },

  importSchema: function (schema, create_indices_for) {
    var columns = [],
        indices = [],
        that = this;

    // create table scheme
    schema.forEach(function (desc) {
      var name = that.fieldName(desc.name),
          type;

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
      if (name === 'npi') type += ' PRIMARY KEY';
      columns.push(name + '  ' + type);
    });

    // create (btree) indices for specified columns
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

    return 'CREATE TABLE npis (' + columns.join(",\n") + '); '+indices.join('\n');
  }
};
