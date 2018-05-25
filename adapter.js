define([], function() {

	//Get dimension names
	this.getDimensions = function() {
		dimensions = [];

		for (var i = 0; i < hq.qDimensionInfo.length; i++) {
			dimensions.push(hq.qDimensionInfo[i].qFallbackTitle);
		}
	};

	//Get measure names
	this.getMeasures = function() {
		measures = [];
		
		for (var i = 0; i < hq.qMeasureInfo.length; i++) {
			measures.push(hq.qMeasureInfo[i].qFallbackTitle);
		}
	};

	this.parseData = function(chart) {
		var categories = [];
		var series = [];

		//Init categories array
		for(var i = 0; i < dimensions.length; i++) {
			var cat = [];
			categories.push(cat);
		}	

		//Init measures array
		for(var i = 0; i < measures.length; i++) {
			var ser = [];
			series.push(ser);
		}		

		//Fill dimension and measures arrays
		for(var i = 0; i < data.length; i++) {

			for(var j = 0; j < dimensions.length; j++) {
				categories[j].push(data[i][j].qText);	
			}
			
			for(var j = 0; j < measures.length; j++) {
				series[j].push(data[i][(dimensions.length + j)].qNum);	
			}
		}

		//TODO: ADD SUPPORT FOR 2 DIMENSIONAL DATA!!!!
		chart.xAxis[0].setCategories(categories[0]);

		for(var i = 0; i < measures.length; i++) {
			chart.series[i].setData(series[i]);
		}
	};

	//Add events to chart
	this.addEvents = function(chart, view) {
		chart.series.forEach(function(s){
			s.options.point.events = {
			    click: function(){
			       var selected = chart.xAxis[0].categories.indexOf(this.category);

			       if(!this.selected) {
			       		this.select(true, true);
			       }
			       else {
			       		this.select(false, true);
			       }
			       
			       view.selectValues(0, [selected], true);
		    	}
		  	}
		})
	};

	//Get paged data 
	this.getData = function(view, $element, layout) {
		data = [];
		var rows = 0;
		var count = view.backendApi.getRowCount();

		view.backendApi.eachDataRow(function(index, row) {
      		rows = index;
      		data.push(row);
    	});

    	if(count > rows + 1) {
    		
    		var request = [{
	    		qTop: rows + 1,
	        	qLeft: 0,
	        	qWidth: 10,
	        	qHeight: Math.min(1000, count - rows)
	      	}];

	      	view.backendApi.getData(request).then(function(page) {
	        	view.paint($element, layout);
	      	});

	      	return false;
    	}

    	return true;
	};

	//Prepare limited dataset for wizard preview
	this.getWizardData = function(limit, pivot) {
		var lim = limit;
		var labels = dimensions.concat(measures);
		var values = [];

		//Make sure that all labels are unique.
		for(var i = 0; i < labels.length; i++) {
			var similar = false;

			for(var j = 0; j < i; j++) {
				if (labels[i] == labels[j]) {
					labels[i] = labels[i] + ' ' + i;
				}
			}
		}

		sampleData = "";

		//If hypercube contains less data than limit, take all data
		if(limit > hq.qDataPages[0].qMatrix.length) {
			lim = hq.qDataPages[0].qMatrix.length;
		}

		//Form Object array from hypercube
		for(var i = 0; i < lim; i++) {
			var object = {};
			for(var j = 0; j < hq.qDataPages[0].qMatrix[i].length; j++) {
				if(j < dimensions.length) {
					object[labels[j]] = hq.qDataPages[0].qMatrix[i][j].qText; 
				}
				else {
					object[labels[j]] = hq.qDataPages[0].qMatrix[i][j].qNum;
				}
			}
			values.push(object);
		}

		//Form csv-string for Highcharts editor data provider.
		//CSV-form is normal or pivoted depending on selection and number of 
		//dimensions and measures
		if(dimensions.length == 2 && measures.length == 1 && pivot == true) {
			var pivoted = getPivotArray(values);
			sampleData = formCSV(pivoted, null, true);
		}
		else {
			sampleData = formCSV(values, labels, false);	
		}
	};

  	return this;
});

function formCSV(values, labels, pivot) {

	var csv = "";
	
	if(pivot == false) {
		//Form CSV header
		for(var i = 0; i < labels.length; i++) {			
			if(i != labels.length - 1) {
				csv += '\"' + labels[i] + '\";';
			}
			else {
				csv += '\"' + labels[i] + '\"';
			}
		}

		csv += '\r\n';

		//Add data to CSV
		for(i = 0; i < values.length; i++) {
			var keys = Object.keys(values[i]);

			for(j = 0; j < keys.length; j++) {
				if(j < dimensions.length) {
			    	csv += '\"' + values[i][keys[j]] + '\"';
			    }
			    else {
			    	csv += values[i][keys[j]];
			    }

			    if(j < labels.length - 1) {
			    	csv += ';';
			    }
			}
			
			if(i < values.length - 1) {
				csv += '\r\n';
			}
		}	
	}
	else {
		//Form pivoted CSV header
		for (var i = 0; i < values[0].length; i++) {
			csv += '\"' + values[0][i] + '\"';

			if(i < values[0].length - 1) {
				csv += ';';
			}
		}

		csv += '\r\n';

		//Add data to pivoted CSV
		for (var i = 1; i < values.length; i++) {

			csv += '\"' + values[i][0] + '\";';

			for (var j = 1; j < values[i].length; j++) {
				
				if(values[i][j] != null) {
					csv += values[i][j];
				}

				if(j < values[i].length - 1) {
					csv += ';';
				}
			}

			if(i < values.length - 1) {
				csv += '\r\n';
			}
		}
	}

	return csv;
}

function getPivotArray(values) {
        
    var temp = [];
    var result = {};
    var pivoted = [];
    var newCols = [];

    var rowIndex = 0;
    var colIndex = 1;
    var dataIndex = 2;

    for (var i = 0; i < values.length; i++) {
    	var keys = Object.keys(values[i]);
    	var obj = [];

    	for (var j = 0; j < keys.length; j++) {
    		obj.push(values[i][keys[j]]);
    	}
    	temp.push(obj);
    }

    for (var i = 0; i < temp.length; i++) {
 
        if (!result[temp[i][rowIndex]]) {
            result[temp[i][rowIndex]] = {};
        }
        result[temp[i][rowIndex]][temp[i][colIndex]] = temp[i][dataIndex];

        if (newCols.indexOf(temp[i][colIndex]) == -1) {
            newCols.push(temp[i][colIndex]);
        }
    }

    newCols.sort();
    var item = [];

    //Add Header Row
    item.push('');
    item.push.apply(item, newCols);
    pivoted.push(item);

    //Add content 
    for (var key in result) {
        item = [];
        item.push(key);
        for (var i = 0; i < newCols.length; i++) {
            item.push(result[key][newCols[i]] || null);
        }
        pivoted.push(item);
    }

    return pivoted;
}