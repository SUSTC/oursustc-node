var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require("./../config/config.json");
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
  abolishFlag: { type: Boolean , default: false },

  last_auth_time: {type: Date, default :Date.now},
  last_connect_time: {type: Date, default :Date.now},
  last_disconnect_time: {type: Date, default :Date.now},

  clientCount: { type: Number, default: 0 },
  onlineClient: { type: [EnigmaClientSchema] },

  upThreshold: { type: Number, default: 0 },
  downThreshold: { type: Number, default: 0 },

  allowed_bytes: { type: Number, default: config.ENIGMA_DEFAULT_LIMIT },
  rx_bytes: { type: Number, default: 0 },
  tx_bytes: { type: Number, default: 0 }
});


mongoose.model('EnigmaUser', EnigmaSchema, config.DB_PREFIX + 'enigma_usr');
mongoose.model('EnigmaClient', EnigmaClientSchema, config.DB_PREFIX + 'enigma_cli');