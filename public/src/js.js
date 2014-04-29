String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

function fueherendeNullen(zahl) {
    var zahl = String(zahl);
    if (zahl.length<2) { zahl = "0" + zahl };
    return zahl;
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}

$(document).ready(function() {
    var metex_list = [];
    var plot_list = [];
    var metex = {
        intervallId: null,
        intervallCount: 0,
        meassureCount: 0,
        stopTime: null,
        startTime: null,
        connected: false,
        connectionStartTime: null,
        graph: null,
        graphOptions: null,
        current_list: [],

        init: function() {
            var that = this;

            //this.graph = $.plot(".graph", [ plot_list ], this.graphOptions);

            $('.start').on('click', function(){
                that.startLogging();
            });

            $('.stop').on('click', function(){
                that.stopLogging();
            });

            $('#connection_status').on('click', function(){
                that.getConnectionStatus();
            });

            $('.download ul .pdf').on('click', function(){
                that.downloadAsPDF();
            });

            $('.download ul .csv').on('click', function(){
                that.downloadAsCSV();
            });

            $('.download ul .json').on('click', function(){
                that.downloadAsJSON();
            });

            // set display to start values
            $('#meassurement .time').html('88:88:88');
            $('#meassurement .value').html('8888');
            $('#meassurement .unit').html('88');

            console.log('server wird initialisiert ...');
            window.setTimeout(function(){that.connect();},2000);
        },

        getData: function (){
            var current_timestamp = new Date().getTime();
            var data = {};
                data.flow = 'ac';
                data.time = current_timestamp;
                // data.value = Math.sin(that.intervallCount);
                data.value = Math.round(Math.sin(this.intervallCount) * 100) / 100;
                data.unit = 'kw';

            return data;
        },

        renderView: function(data){
            var current_timestamp = new Date().getTime();

            $('#flow li').removeClass('active'); // clear flow

            // Daten holen

            // connection status true
            if (this.connected == true) {
                // $('#connection_status').addClass('connected');
                // $('#connection_status').html('[VERBUNDEN]');

                if (data.flow == 'dc') {
                    $('#flow .dc').addClass('active');
                }

                if (data.flow == 'ac') {
                    $('#flow .ac').addClass('active');
                }

                // messdaten
                var date = new Date(data.time);
                $('#meassurement .time').html(fueherendeNullen(date.getDay())+'.'+fueherendeNullen(date.getMonth())+'.'+date.getFullYear()+' '+fueherendeNullen(date.getHours())+':'+fueherendeNullen(date.getMinutes())+':'+fueherendeNullen(date.getSeconds()));
                $('#meassurement .value').html(data.value);
                $('#meassurement .unit').html(data.unit);
                $('#meassurement .duration').html(String((current_timestamp - this.startTime+1000)/1000).toHHMMSS());
            }

            // tell status
            if (this.stopTime != null) {
                $('.status').html('Messung läuft noch '+Math.ceil((this.stopTime-current_timestamp)/1000)+'s');
            } else {
                $('.status').html('Messung läuft');
            }

            return true;
        },

        getConnectionStatus: function(){
            if (this.connected !== true) {
                return this.connect();
            }

            var current_timestamp = new Date().getTime();
            var connection_uptime = this.connectionStartTime - current_timestamp;
            alert('Verbindung besteht seit '+connection_uptime);
        },

        connect: function(){
            //return false;

            var that = this;

            // if (verbindungsaufbau === false) {
            //     window.setTimeout(function(){that.connect();},1000);
            // }

            that.connected = true;

            var current_timestamp = new Date().getTime();
            that.connectionStartTime = current_timestamp;

            $('#connection_status').addClass('connected');
            $('#connection_status').html('[VERBUNDEN]');

            console.log('VERBUNDEN!');
        },

        startLogging: function() {
            console.log('starte logging');

            var that = this;
            var intervall = $('#intervall');
            var duration = $('#duration');

                that.meassureCount++;

            if (Number(intervall.val()) < 0) {
                console.log('Ungültige Eingabe für Intervall');
                return false;
            }

            if (Number(duration.val()) < 0) {
                console.log('Ungültige Eingabe für Meßdauer');
                return false;
            }

            if ((Number(duration.val()*1000) <= Number(intervall.val())) && Number(duration.val()) != 0) {
                console.log('Intervall darf nicht höher sein als Meßdauer');
                return false;
            }

            intervall.attr('disabled','disabled');
            duration.attr('disabled','disabled');

            $('.start').hide();
            $('.stop').show();
            $('.status').fadeIn();
            $('#meassurement').addClass('active');

            // set auto stop
            var current_timestamp = new Date().getTime();
            if (Number(duration.val()) != 0) {
                this.stopTime = current_timestamp + Number(duration.val())*1000;
            }

            this.startTime = current_timestamp;

            // start
            metex.intervallId = window.setInterval(function(){
                var current_timestamp = new Date().getTime();
                that.intervallCount++;

                if (metex.stopTime != null &&
                    metex.stopTime <= current_timestamp) {
                    metex.stopLogging();
                    return false;
                }

                var data = that.getData();

                that.current_list.push(data);
                plot_list.push([intervall.val()*that.intervallCount, data.value]);

                that.graph = $.plot(".graph", [ plot_list ], this.graphOptions);
                that.graph.setData([plot_list]);
                that.graph.draw();

                metex.renderView(data);

                console.log(that.intervallCount+'  '+data.time+'   '+data.flow+': '+data.value+' '+data.unit);
            },intervall.val());

            return true;
        },

        stopLogging: function() {
            console.log('stop logging');

            var intervall = $('#intervall');
            var duration = $('#duration');

            // backup list :)
            metex_list.push({
                id: this.meassureCount,
                intervallId: this.intervallId,
                intervallCount: this.intervallCount,
                stopTime: new Date().getTime(),
                startTime: this.startTime,
                connectionStartTime: this.connectionStartTime,
                intervall: intervall,
                duration: duration,
                list: this.current_list
            });



            intervall.removeAttr('disabled');
            duration.removeAttr('disabled');

            this.stopTime = null; // reset stop timer
            this.startTime = null;
            this.intervallCount = 0;
            this.current_list = [];
            plot_list = [];

            $('.start').show();
            $('.stop').hide();
            $('.status').html('Messung beendet');
            $('#meassurement').removeClass('active');
            $('#flow li').removeClass('active');
            window.setTimeout(function(){$('.status').fadeOut();},500);

            window.clearInterval(metex.intervallId);

            //plot_list.push(null);
            return true;
        },

        downloadAsCSV: function() {
            return false;

            // url
            // data:application/octet-stream,field1%2Cfield2%0Afoo%2Cbar%0Agoo%2Cgai%0A
        },

        downloadAsJSON: function() {
            return false;

            // url
            // data:application/octet-stream,field1%2Cfield2%0Afoo%2Cbar%0Agoo%2Cgai%0A
        },

        downloadAsPDF: function() {
            var doc = new jsPDF();
                doc.setProperties({
                    // '+this.model.get('title')+'
                    title: 'Messungen  ',
                    subject: 'Messungsübersicht',
                    author: 'Emre Konar, Jens Fried, Daniel Treptow',
                    keywords: '',
                    creator: 'Messungen Mess Client von Emre Konar, Jens Fried und Daniel Treptow'
                });

                // heading
                doc.setFont("helvetica");
                doc.setFontType("bold");
                doc.setFontSize(22);

                doc.text(20, 20, 'Messungen');

                // transactions list
                doc.setFontType("normal");
                var pos_y = 35;

                metex_list.forEach(function(meassure) {
                    doc.setFont("helvetica");
                    doc.setFontSize(10);
                    doc.setFontType("normal");
                    doc.text(20, pos_y, 'Messung Nr.: '+String(meassure.id));
                    pos_y += 5;

                    doc.setFont("helvetica");
                    doc.setFontSize(8);
                    doc.setFontType("normal");
                    doc.text(20, pos_y, 'Messungen: '+String(meassure.intervallCount+' (Intervall: '+(meassure.intervall.val()/100)+'/s)'));
                    pos_y += 3;
                    var date = new Date(meassure.startTime);
                    doc.text(20, pos_y, 'Startzeit: '+fueherendeNullen(date.getDay())+'.'+fueherendeNullen(date.getMonth())+'.'+date.getFullYear()+' '+fueherendeNullen(date.getHours())+':'+fueherendeNullen(date.getMinutes())+':'+fueherendeNullen(date.getSeconds()));
                    pos_y += 3;
                    doc.text(20, pos_y, 'Messdauer: '+String((meassure.stopTime-meassure.startTime)/1000)+'s');
                    pos_y += 5;

                    // transactions list heading
                    doc.setFont("courier");
                    doc.setFontSize(8);
                    doc.setFontType("bold");

                    doc.text(20, pos_y, 'Zeit');
                    doc.text(60, pos_y, 'Messung');
                    //doc.text(115, 30, 'Einheit');
                    pos_y += 4;

                    meassure.list.forEach(function(entry) {
                        doc.setFont("courier");
                        doc.setFontSize(8);
                        doc.setFontType("normal");

                        var date = new Date(entry.time);
                        doc.text(20, pos_y, String(fueherendeNullen(date.getDay())+'.'+fueherendeNullen(date.getMonth())+'.'+date.getFullYear()+' '+fueherendeNullen(date.getHours())+':'+fueherendeNullen(date.getMinutes())+':'+fueherendeNullen(date.getSeconds())));
                        doc.text(60, pos_y, String(entry.flow));
                        doc.text(65, pos_y, String(entry.value+' '+entry.unit));
                        //doc.text(115, pos_y, String(entry.unit));
                        pos_y += 3;
                    });

                    pos_y += 10;
                })

                // finally output or save or something
                doc.output('datauri');

            return true;
        }
    }

    metex.init();
});