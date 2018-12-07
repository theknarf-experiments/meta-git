import { dom } from 'isomorphic-jsx';
import fs from 'fs';
import path from 'path';
import repo from './setup-js-git';
import Dropdown from './components/dropdown.js';
import remark from 'remark';
import html from 'remark-html';

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
			<style>{`
				header, .branch, .files, .readme {
					margin: 25px;
				}

				.files {
					border: 1px solid #ddd;
				}
			`}</style>
		</head>
		<body>
			{children}
		</body>
	</html>;

const index_page =
	<Page>
		<header>
			<h1> {path.basename(process.cwd())} </h1>
		</header>
		<div class="branch">
			<Dropdown label="Switch branch">
				{heads.map(head =>
					<div><a href={head + '.html'} target="content"> {head} </a></div>
				)}
			</Dropdown>
		</div>
		<iframe width="100%" name="content" src="master.html" frameBorder="0" onload={`
			this.style.height = this.contentWindow.document.body.scrollHeight + 'px';
		`}> </iframe>
	</Page>;

const tree = {}

function savefile(filename, file) {
	return new Promise((resolve, reject) => {
		repo.saveAs('blob', Buffer.from(file, 'utf8'), (err, blobHash) => {
			if(err) return reject(err);
			tree[filename] = { mode: modes.file, hash: blobHash };
			resolve();
		});
	});
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
				console.log(`Updated branch ${branch_name} with hash ${hash}`);
			});
		});
	})
};

const Tree = ({ tree }) => {
	return <div class="files">
		<style>{`
			.file {
				padding: 5px;
				border-bottom: 1px solid #ddd;
			}
			.file:last-child {
				border-bottom: none;
			}
		`}</style>
		{ Object.keys(tree).map( file => <div class="file"> {file} </div> ) }
	</div>;
};

const readme = ({ tree }) => {
	const readme = Object.keys(tree).find( name => name.match(/readme\.md$/i) );
	if(typeof readme == 'undefined')
		return <div> No readme </div>;

	return new Promise( (resolve, reject) => {
		repo.loadAs('blob', tree[readme].hash, (err, blob) => {
			if(err) return reject(err);

			remark()
				.use(html)
				.process(blob, (err, html) => {
					if(err) return reject(err);

					resolve(html.contents);
				});
		});
	} );
};

// Gennerate file view from tree for branch
Promise
	.all( heads.map(loadTreeFromBranch) )
	.then(trees => {
		const promises = trees
			.map( ({ branch_name, tree }) => ({ branch_name, tree, promise: readme({tree}) }) )
			.map( ({ branch_name, tree, promise }) =>
				promise.then( readme =>
					savefile( `${branch_name}.html`, <Page>
						<Tree tree={tree} />
						<div class="readme">{readme}</div>
					</Page> )
				)
			);

		promises.push(savefile('index.html', index_page))

		Promise.all(promises).then(() => saveTree(tree));
	});

