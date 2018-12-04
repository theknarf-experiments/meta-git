import { dom } from 'isomorphic-jsx';

// Verify that you're in a git-repo
const fs = require('fs');
if(!fs.existsSync('./.git/')) {
	console.log('Current folder is not a git repo');
	process.exit();
}

// Get meta-repo branch name
const meta_branch_name = process.argv[2];
console.log(`Gennerating branch '${meta_branch_name}'`);

// Setup js-git
import repo from './setup-js-git';
