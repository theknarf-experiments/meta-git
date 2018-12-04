import { dom } from 'isomorphic-jsx';
import fs from 'fs';
import repo from './setup-js-git';
import middleware from './branch-serve-express-middleware';
import express from 'express';

// Verify that you're in a git-repo
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

// TODO: I might need to run something to unpack?
// TODO: Support recursivly resolving tree's
// TODO: reload the branch / comitt / tree every time, aka some kind of --watch mode

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

		// Start express server
		const app = express(),
				port = 3000;

		app.use(middleware);

		app.use((req, res, next) => {
			res.status(404).send(
				<html><body> Page not found </body></html>
			)
		});

		app.listen(port, () => console.log(`Serving branch '${branch_name}' on http://localhost:${port}/`) );
	});
});
