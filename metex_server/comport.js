var ModulSerialPort = require('serialport');

var SerialPort = ModulSerialPort.SerialPort;
var sp = new SerialPort("COM3", {
  parser: ModulSerialPort.parsers.raw
}, false); // this is the openImmediately flag [default is true]

sp.open(function () {
  console.log('open');
  sp.on('data', function(data) {
    console.log('data received: ' + data);
  });
  sp.write("ls\n", function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
});