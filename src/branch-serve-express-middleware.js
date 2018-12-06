import { dom } from 'isomorphic-jsx';
import fs from 'fs';
import repo from './setup-js-git';

const branch_name = process.argv[2],
		branch_file = `./.git/refs/heads/${branch_name}`;

function express_middleware(req, res, next) {
	// Check if branch exists
	if(!fs.existsSync(branch_file)) {
		console.log(`Branch "${branch_name}" doesn't seem to exist`);
		process.exit();
	}

	const commit_hash = fs.readFileSync(branch_file, 'utf8').replace(/\n$/, '');

	if(commit_hash == "") {
		console.log(`Branch "${branch_name}" misses commit hash / file empty`);
		process.exit();
	}

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
						console.log('error reading blob', err);
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
	});
}

export default express_middleware;
