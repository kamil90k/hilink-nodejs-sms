const xml      = require('xml2js');
const xml2js   = xml.Parser();

let xmlWrapped = {};

xmlWrapped.string2Obj = function(body){
	return new Promise(function(resolve, reject){
				xml2js.parseString(body, function(err, data){
					if(!!err) reject(err);
					resolve(data);
			})
	})
}

xmlWrapped.obj2String = function(obj){
	let builder = new xml.Builder();

	return builder.buildObject(obj);
}

module.exports = xmlWrapped;
