import { dom } from 'isomorphic-jsx';
import fs from 'fs';
import path from 'path';
import repo from './setup-js-git';
import Dropdown from './components/dropdown.js';

// This provides symbolic names for the octal modes used by git trees.
import modes from 'js-git/lib/modes';

const AUTHOR_NAME  = 'meta-git',
		AUTHOR_EMAIL = 'noreply@meta-git.github.io';

// Verify that you're in a git-repo
if(!fs.existsSync('./.git/')) {
	console.log('Current folder is not a git repo');
	process.exit();
}

const head_folder = './.git/refs/heads/',
		heads = fs.readdirSync(head_folder);

// Get meta-repo branch name
const branch_name = process.argv[2],
		branch_file = `${head_folder}${branch_name}`;

console.log(`Gennerating branch '${branch_name}'`);

const Page = ({children}) => '<!DOCTYPE html>' +
	<html>
		<head>

		</head>
		<body>
			{children}
		</body>
	</html>;

const index_page =
	<Page>
		<h1> {path.basename(process.cwd())} </h1>
		<div class="branch">
			<Dropdown label="Switch branch">
				{heads.map(head =>
					<div><a href="#"> {head} </a></div>
				)}
			</Dropdown>
		</div>
		<div class="filelist">

		</div>
		<div class="readme">

		</div>
	</Page>;

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
