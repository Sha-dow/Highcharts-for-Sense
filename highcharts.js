/* Main Javascript */

var editor = null;
var hq = null;
var app = null;
var model = null;
var adapter = null;

var dimensions = [];
var measures = [];
var data = [];
var chartdata = [];
var sampleData = "";

var models = [];
var apps = [];

var defaultJSON = '../extensions/highcharts/chart.json';

require.config({
  paths: {
	  'highcharts': "../extensions/highcharts/Highcharts-6.0.4/code/highcharts-main",
	  'highcharts-more': "../extensions/highcharts/Highcharts-6.0.4/code/highcharts-more",
	  'highcharts-3d': "../extensions/highcharts/Highcharts-6.0.4/code/highcharts-3d",
	  'data': "../extensions/highcharts/Highcharts-6.0.4/code/modules/data",
	  'exporting': "../extensions/highcharts/Highcharts-6.0.4/code/modules/exporting",
	  'funnel': "../extensions/highcharts/Highcharts-6.0.4/code/modules/funnel",
	  'solidgauge': "../extensions/highcharts/Highcharts-6.0.4/code/modules/solid-gauge",
	  'stock': "../extensions/highcharts/Highcharts-6.0.4/code/modules/stock",
	  'highed': "../extensions/highcharts/highcharts-editor.standalone.0.2.0/highcharts-editor.min",
	  'adv': "../extensions/highcharts/highcharts-editor.standalone.0.2.0/highcharts-editor.advanced.min",
	  'templates': "../extensions/highcharts/highcharts-editor.standalone.0.2.0/highcharts-editor.module.highcharts.min",
	  'stocktemplates': "../extensions/highcharts/highcharts-editor.standalone.0.2.0/highcharts-editor.module.highstock.min"
	},
	shim: {
	  'highcharts': {
		exports: 'highcharts'
	  },
	  'highcharts-more': {
		deps: ['highcharts'],
		exports: 'highcharts-more'
	  },
	  'highcharts-3d': {
		deps: ['highcharts'],
		exports: 'highcharts-3d'
	  },
	  'data': {
		deps: ['highcharts'],
		exports: 'data'
	  },
	  'exporting': {
		deps: ['highcharts'],
		exports: 'exporting'
	  },
	  'funnel': {
		deps: ['highcharts'],
		exports: 'funnel'
	  },
	  'solidgauge': {
		deps: ['highcharts'],
		exports: 'solidgauge'
	  },
	  'stock': {
		deps: ['highcharts'],
		exports: 'stock'
	  },
	  'highed': {
		deps: ['highcharts'],
		exports: 'highed'
	  },
	  'adv': {
		deps: ['highed'],
		exports: 'adv'
	  },
	  'templates': {
		deps: ['highed'],
		exports: 'templates'
	  },
	  'stocktemplates': {
		deps: ['highed'],
		exports: 'stocktemplates'
	  }
	}
});

define( [
		'jquery',
		'js/qlik',
        './properties',
        './init',
        './adapter',

        "text!./wizardmodal.html",
        "text!./style.css",
        "text!./highcharts-editor.standalone.0.2.0/highcharts-editor.min.css",
        
        'highcharts',
        'highcharts-more',
        'highcharts-3d',
        'data',
        'exporting',
        'funnel',
        'solidgauge',
        'stock',
        'highed',
        'adv',
        'templates',
        'stocktemplates'
    ],
    function ( $, qlik, props, init, adp, mod, css, hcss) {
        
        'use strict';

        $( '<div>' ).html( mod ).appendTo( 'body' ); 
        $( '<style>' ).html( css ).appendTo( 'head' );
        $( '<style>' ).html( hcss ).appendTo( 'head' );

        return {
            definition: props,
            initialProperties: init,
            support: { snapshot: true, export: true },
            paint: function ( $element , layout ) {
            	app = layout;
            	hq = layout.qHyperCube;
            	model = this;

            	if(models.indexOf(this) == -1){
            		models.push(this);
            	}

            	if(apps.indexOf(app) == -1){
            		apps.push(app);
            	}

            	adapter = adp;

            	//Parent node for chart
            	$element.html( '<div id="highcharts-div-' + layout.qInfo.qId + '" class="hc-main"></div>' ).height($element.height());
            	var div = document.getElementById('highcharts-div-' + layout.qInfo.qId);

            	//If chart is created render it
            	if(app.pr.chart != null) {
            		div.innerHTML = '';
            		var chart = new Highcharts.Chart('highcharts-div-' + layout.qInfo.qId, JSON.parse(app.pr.chart));

        			if(adapter.getData(this, $element, layout)) {
        				adapter.getDimensions();
						adapter.getMeasures();

						adapter.parseData(chart, app.pr.pivot);
						adapter.addEvents(chart, this);

						if(app.pr.size == true) {
							chart.setSize(model.$element.width(), model.$element.height());
						}
        			}
            	}
            	else {
            		//TODO: Add instructions
            		div.innerHTML = '<p class="hc-info-text">Please run Chart wizard to define style for your chart. Rerun wizard if you change dimensions/measures!</p><p class="hc-warning">THIS IS EARLY BETA VERSION. NOT FOR PRODUCTION USE!</p>';
            	}
            },
            destroy: function($element) {

            	//If object is deleted make garbage collection and delete models 
            	for(var i = 0; i < models.length; i++) {
            		if(models[i].options.id == this.options.id) {
            			models.splice(i, 1);
            		}
            	}

            	for(var i = 0; i < apps.length; i++) {
					if(apps[i].qInfo.qId == this.options.id) {
						apps.splice(i, 1);
					}
				}
            }
        }
    }
);

//Function for opening/closing Highcharts wizard
function toggleWizard(state, objectID) {
	var modal = document.getElementById('wizardView');
	var wizard = document.getElementById('wizard');

	//Set model and app to point correct object. 
	//ObjectID tells what HC object sent the wizard request
	for(var i = 0; i < models.length; i++) {
		if(models[i].options.id == objectID) {
			model = models[i];
		}
	}

	for(var i = 0; i < apps.length; i++) {
		if(apps[i].qInfo.qId == objectID) {
			app = apps[i];
		}
	}

	if(state == "open") {
		modal.style.display = "block";	

		adapter.getDimensions();
		adapter.getMeasures();
		adapter.getWizardData(50, app.pr.pivot);

		highed.ready(function () {
			
			wizard.innerHTML = '';
			editor = highed.Editor('wizard');

			//Get init-file and load it to wizard.
        	setTimeout(function(){ 
        		var def = null;

        		if(app.pr.def == null) {
        			loadJSON(function(response) {
        				def = JSON.parse(response);
        				def.settings.dataProvider.csv = sampleData;
        				editor.chart.loadProject(def);	
					});	
        		}
        		else {
        			def = JSON.parse(app.pr.def);
        			def.settings.dataProvider.csv = sampleData;
        			editor.chart.loadProject(def);
        		}

    		}, 500);
    	});
	}
	else if (state == "close") {
		modal.style.display = "none";

		//Save wizard project and chart JSON to properties
		model.backendApi.getProperties().then(function(reply){
	 		reply.pr.def = JSON.stringify(editor.chart.toProject());
	 		reply.pr.chart = JSON.stringify(editor.getEmbeddableJSON());
	 		model.backendApi.setProperties(reply);
		});
	}
	else {
		console.log("Unknown state");
	}
}

//Async function for loading JSON files
function loadJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', defaultJSON, true);

    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    }
    xobj.send(null);
}