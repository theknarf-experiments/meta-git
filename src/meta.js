import { dom } from 'isomorphic-jsx';
import fs from 'fs';
import repo from './setup-js-git';

// This provides symbolic names for the octal modes used by git trees.
import modes from 'js-git/lib/modes';

const AUTHOR_NAME  = 'meta-git',
		AUTHOR_EMAIL = 'noreply@meta-git.github.io';

// Verify that you're in a git-repo
if(!fs.existsSync('./.git/')) {
	console.log('Current folder is not a git repo');
	process.exit();
}

// Get meta-repo branch name
const branch_name = process.argv[2],
		branch_file = `./.git/refs/heads/${branch_name}`;

console.log(`Gennerating branch '${branch_name}'`);

const index_page = '<!DOCTYPE html>' +
	<html>
		<head>

		</head>
		<body>
			<h1> index </h1>
		</body>
	</html>;


repo.saveAs('blob', Buffer.from(index_page, 'utf8'), (err, blobHash) => {
	if(err) throw err;

	const tree = {
		'index.html': { mode: modes.file, hash: blobHash }
	};

	repo.saveAs('tree', tree, (err, treeHash) => {
		if(err) throw err;

		const commit = {
			author: { name: AUTHOR_NAME, email: AUTHOR_EMAIL },
			tree: treeHash,
			message: 'Updated meta-git branch',
			parents: []
		};

		repo.saveAs('commit', commit, (err, hash) => {
			if(err) throw err;

			fs.writeFile(branch_file, Buffer.from(hash, 'utf8'), (err) => {
				if(err) throw err;
			});
		});
	});
});
