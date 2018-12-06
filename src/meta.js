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

// Get meta-repo branch name
const branch_name = process.argv[2],
		head_folder = './.git/refs/heads/',
		heads = fs.readdirSync(head_folder).filter(head => head !== branch_name),
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
					<div><a href={head + '.html'} target="content"> {head} </a></div>
				)}
			</Dropdown>
		</div>
		<iframe name="content" src="dummy.html" frameBorder="0"> </iframe>
	</Page>;

const dummy_page =
	<Page>
		Dummy page
	</Page>

const tree = {}
const promises = [];

function savefile(filename, file) {
	promises.push(new Promise((resolve, reject) => {
		repo.saveAs('blob', Buffer.from(file, 'utf8'), (err, blobHash) => {
			if(err) return reject(err);
			tree[filename] = { mode: modes.file, hash: blobHash };
			resolve();
		});
	}));
}

const loadTreeFromBranch = ( branch_name ) => {
	const commit_hash = fs.readFileSync(head_folder + branch_name, 'utf8').replace(/\n$/, '');
	
	if(commit_hash == "") {
		console.log(`Branch "${branch_name}" misses commit hash / file empty`);
		process.exit();
	}

	return new Promise((resolve, reject) => {
		repo.loadAs('commit', commit_hash, (err, commit) => {
			if(err) reject(err);

			repo.loadAs('tree', commit.tree, (err, tree) => {
				if(err) reject(err);

				resolve({ branch_name, tree });
			});
		});
	});
}

const saveTree = (tree) => {
	repo.saveAs('tree', tree, (err, treeHash) => {
		if(err) throw err;

		console.log('Files in tree: ', Object.keys(tree));

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
	})
};

const Tree = ({ tree }) =>
	<div> TODO </div>;

// Gennerate file view from tree for branch
Promise
	.all( heads.map(loadTreeFromBranch) )
	.then(trees => {
		trees.forEach( ({ branch_name, tree }) => {
			savefile( `${branch_name}.html`, <Tree tree={tree} /> );
		} );

		savefile('index.html', index_page);
		savefile('dummy.html', dummy_page);

		Promise.all(promises).then(() => saveTree(tree));
	});

