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

var EnigmaSchema = new Schema({

  studentID: { type: String },
  abolishFlag : { type: Boolean , default: false },

  clientCount: { type: Number, default: 0 },
  onlineClient: { type: [EnigmaClientSchema] },

  upThreshold: { type: Number, default: 0 },
  downThreshold: { type: Number, default: 0 },

  allowedFlow : { type: Number, default: 0 },
  upStream: { type: Number, default: 0 },
  donwStream { type: Number, default: 0 }
});


mongoose.model('EnigmaUser', EnigmaSchema, config.DB_PREFIX + 'enigma_usr');
mongoose.model('EnigmaClient', EnigmaSchema, config.DB_PREFIX + 'enigma_cli');