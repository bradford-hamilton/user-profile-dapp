const UserProfile = artifacts.require('UserProfile'); /* eslint-disable-line */

module.exports = (deployer) => {
  deployer.deploy(UserProfile);
};
