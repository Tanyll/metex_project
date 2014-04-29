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
        stopTime: null,
        startTime: null,
        connected: false,
        connectionStartTime: null,
        graph: null,
        graphOptions: null,
        init: function() {
            var that = this;

            $('.start').on('click', function(){
                that.startLogging();
            });

            $('.stop').on('click', function(){
                that.stopLogging();
            });

            $('#connection_status').on('click', function(){
                that.getConnectionStatus();
            });

            $('ul.download .pdf').on('click', function(){
                that.downloadAsPDF();
            });

            $('ul.download .csv').on('click', function(){
                that.downloadAsCSV();
            });

            $('ul.download .json').on('click', function(){
                that.downloadAsJSON();
            });

            // set display to start values
            $('#meassurement .time').html('88:88:88');
            $('#meassurement .value').html('8888');
            $('#meassurement .unit').html('88');

            // this.graph = $.plot(".graph", [ plot_list ], this.graphOptions);

            that.connect();
        },

        getData: function (){

        },

        renderView: function(data){
            var current_timestamp = new Date().getTime();

            $('#flow li').removeClass('active'); // clear flow

            $('#connection_status').removeClass('connected'); // connection status false / clear
            $('#connection_status').html('[NICHT VERBUNDEN]');

            // Daten holen

            // connection status true
            if (this.connected == true) {
                $('#connection_status').addClass('connected');
                $('#connection_status').html('[VERBUNDEN]');

                if (data.flow == 'dc') {
                    $('#flow .dc').addClass('active');
                }

                if (data.flow == 'ac') {
                    $('#flow .ac').addClass('active');
                }

                // messdaten
                var date = new Date(data.time);
                $('#meassurement .time').html(date.getDay()+'.'+date.getMonth()+'.'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds());
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

            // add data to graph


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
            return false;

            var that = this;

            if (verbindungsaufbau === false) {
                window.setTimeout(function(){that.connect();},1000);
            }

            that.connected = true;

            var current_timestamp = new Date().getTime();
            that.connectionStartTime = current_timestamp;
        },

        startLogging: function() {
            console.log('starte logging');

            var that = this;
            var intervall = $('#intervall');
            var duration = $('#duration');

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

                var data = {};
                    data.flow = 'ac';
                    data.time = current_timestamp;
                    data.value = Math.sin(that.intervallCount);
                    data.unit = 'kw';

                metex_list.push(data);
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

            intervall.removeAttr('disabled');
            duration.removeAttr('disabled');

            this.stopTime = null; // reset stop timer
            this.startTime = null;
            this.intervallCount = 0;
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

                doc.text(10, 20, 'Messungen');

                // transactions list heading
                doc.setFont("courier");
                doc.setFontSize(8);
                doc.setFontType("bold");

                doc.text(10, 30, 'time');
                doc.text(40, 30, 'wert');
                doc.text(115, 30, 'enheit');

                // transactions list
                doc.setFontType("normal");
                var pos_y = 35;
                this.collection.each(function(events) {
                    doc.text(10, pos_y, metex_list.time);
                    doc.text(40, pos_y, metex_list.value);
                    doc.text(115, pos_y, metex_list.unit);
                    pos_y += 3;
                });

                // finally output or save or something
                doc.output('datauri');

            return true;
        }
    }

    metex.init();
});