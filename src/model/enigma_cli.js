var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var ObjectId = Schema.ObjectId;

var EnigmaClientSchema = new Schema({
  lanIP: { type: String },
  wanIP: { type: String },
  onlineTime: { type: Date, default: Date.now }
});

/*EnigmaClientSchema.virtual('timeUpdate').get(function () {
  
});*/

mongoose.model('EnigmaClient', EnigmaClientSchema, config.DB_PREFIX + 'enigma_cli');