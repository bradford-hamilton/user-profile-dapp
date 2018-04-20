/* eslint-disable */
import Web3 from 'web3';
// import contract from 'truffle-contract';
import jQuery from 'jquery';
import 'bootstrap';
import '../stylesheets/app.scss';

window.$ = window.jQuery = jQuery;

var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.');
        return;
      }

      if (accs.length == 0) {
        alert('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
        return;
      }

      accounts = accs;
      account = accounts[0];
    });
  },
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(`
      Using web3 detected from external source. If you find that your accounts
      don't appear or you have 0 MetaCoin, ensure you've configured that source
      properly. If using MetaMask, see the following link. Feel free to delete this
      warning. :) http://truffleframework.com/tutorials/truffle-and-metamask
    `);
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn(`
      No web3 detected. Falling back to http://127.0.0.1:9545. You should remove
      this fallback when you deploy live, as it's inherently insecure. Consider
      switching to Metamask for development. More info here:
      http://truffleframework.com/tutorials/truffle-and-metamask
    `);
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
  }

  App.start();
});
