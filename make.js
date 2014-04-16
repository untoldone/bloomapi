var child_process = require('child_process'),
    cmd = './bin/bloomapi ' + process.argv.slice(2).join(' '),
    child;

// This is a holdover for v0.2.0 -- make.js will be removed then
child = child_process.exec(cmd);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

