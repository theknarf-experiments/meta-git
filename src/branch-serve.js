import { dom } from 'isomorphic-jsx';

// Verify that you're in a git-repo
const fs = require('fs');
if(!fs.existsSync('./.git/')) {
	console.log('Current folder is not a git repo');
	process.exit();
}

// Check if branch exists
const branch_name = process.argv[2],
		branch_file = `./.git/refs/heads/${branch_name}`;

if(!fs.existsSync(branch_file)) {
	console.log(`Branch "${branch_name}" doesn't seem to exist`);
	process.exit();
}

const commit_hash = fs.readFileSync(branch_file, 'utf8').replace(/\n$/, '');

if(commit_hash == "") {
	console.log(`Branch "${branch_name}" misses commit hash / file empty`);
	process.exit();
}

// Setup js-git
let repo = {
	rootPath: '.git/'
};
require('js-git/mixins/create-tree')(repo);
require('js-git/mixins/pack-ops')(repo);
require('js-git/mixins/formats')(repo);
require('js-git/mixins/fs-db')(repo, require('fs'));

// Check if commit exists
//  PS. we need to parse the repo first, as the commit might be an object or in a pack-file
repo.loadAs('commit', commit_hash, (err, commit) => {
	if(err) {
		console.log('error reading commit', err);
		process.exit();
	}

	// Check if tree exists
	repo.loadAs('tree', commit.tree, (err, tree) => {
		if(err) {
			console.log('error reading commit', err);
			process.exit();
		}

		console.log(tree);

		// Start express server
		const express = require('express'),
			app = express(),
			port = 3000;

		app.use((req, res, next) => {
			// Lookup resource in tree and serve if found
			let path = req.path;

			// Strip any leading /
			if(path.charAt(0) == '/')
				path = path.substring(1);

			// Default resolve
			if(path == "")
				path = 'index.html';

			console.log(`Request for file ${path}`);

			if(tree.hasOwnProperty(path)) {
				repo.loadAs('blob', tree[path].hash, (err, blob) => {
					if(err) {
						console.log('error reading blob');
						next();
						return;
					}

					if(path.match(/\.html$/))
						res.setHeader('Content-Type', 'text/html; charset=UTF-8');

					res.setHeader('Content-Length', Buffer.byteLength(blob));
					res.end(blob);
				});
			} else {
				next();
			}
		});

		app.use((req, res, next) => {
			res.status(404).send(
				<html><body> Page not found </body></html>
			)
		});

		app.listen(port, () => console.log(`Serving branch '${branch_name}' on http://localhost:${port}/`) );
	});
});
