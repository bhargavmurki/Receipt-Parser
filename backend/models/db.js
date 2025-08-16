const Datastore = require('nedb-promises');
const path = require('path');

// Store DB file under models/receipts.db
const db = Datastore.create({
  filename: path.join(__dirname, 'receipts.db'),
  autoload: true,
  timestampData: true
});

module.exports = db;
