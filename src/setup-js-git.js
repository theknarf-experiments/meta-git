// Setup js-git
let repo = {
	rootPath: '.git/'
};
require('js-git/mixins/fs-db')(repo, require('git-node-fs'));
require('js-git/mixins/create-tree')(repo);
require('js-git/mixins/pack-ops')(repo);
require('js-git/mixins/formats')(repo);

export default repo;
