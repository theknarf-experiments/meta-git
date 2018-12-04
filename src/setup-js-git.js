// Setup js-git
let repo = {
	rootPath: '.git/'
};
require('js-git/mixins/create-tree')(repo);
require('js-git/mixins/pack-ops')(repo);
require('js-git/mixins/formats')(repo);
require('js-git/mixins/fs-db')(repo, require('fs'));

export default repo;
