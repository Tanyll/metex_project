String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
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
    var metex = {
        connected: true,
        intervallId: null, // here
        stopTime: null,
        startTime: null,
        graph: new Rickshaw.Graph( {
            element: document.querySelector(".graph"),
            width: 800,
            height: 300,
            renderer: 'scatterplot',
            //stroke: true,
            series: [{
                color: 'steelblue',
                data: metex_list
            }]
        }),
        xAxis: null,
        yAxis: null,
        init: function() {
            var that = this;

            // this.xAxis = new Rickshaw.Graph.Axis.Time({
            //     graph: this.graph
            // });

            // this.yAxis = new Rickshaw.Graph.Axis.Y({
            //     graph: this.graph
            // });

            $('.start').on('click', function(){
                that.startLogging();
            });

            $('.stop').on('click', function(){
                that.stopLogging();
            });

            $('#meassurement .time').html('88:88:88'); // clear meassurement
            $('#meassurement .value').html('8888');
            $('#meassurement .unit').html('88');
        },

        getData: function (){

        },

        renderView: function(data){
            console.log('renderView');
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
            this.graph.render();
            // this.yAxis.render();
            // this.xAxis.render();
        },

        startLogging: function() {
            console.log('starte logging');

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
            //metex.renderView(data);
            metex.intervallId = window.setInterval(function(){
                var current_timestamp = new Date().getTime();

                if (metex.stopTime != null &&
                    metex.stopTime <= current_timestamp) {
                    metex.stopLogging();
                    return false;
                }

                var data = {};
                    data.flow = 'ac';
                    data.time = current_timestamp;
                    data.value = '120';
                    data.unit = 'kw';
                    data.x = current_timestamp/100000000000;
                    data.y = 2.5*(current_timestamp/100000000000);

                metex_list.push(data);
                console.log(data.x);

                metex.renderView(data);
            },intervall.val());
        },

        stopLogging: function() {
            console.log('stop logging');

            var intervall = $('#intervall');
            var duration = $('#duration');

            this.stopTime = null; // reset stop timer
            this.startTime = null;

            intervall.removeAttr('disabled');
            duration.removeAttr('disabled');

            $('.start').show();
            $('.stop').hide();
            $('#meassurement').removeClass('active');
            $('.status').html('Messung beendet');
            window.setTimeout(function(){$('.status').fadeOut();},500)

            window.clearInterval(metex.intervallId);
        },

        downloadAsCSV: function() {

        },

        downloadAsJSON: function() {

        },

        downloadAsPDF: function() {

        }
    }

    metex.init();
});