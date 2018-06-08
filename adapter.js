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

	this.parseData = function(chart, pivot) {
		var categories = [];
		var series = [];

		var values = [];

		var labels = dimensions.concat(measures);

		//Make sure that all labels are unique.
		for(var i = 0; i < labels.length; i++) {
			var similar = false;

			for(var j = 0; j < i; j++) {
				if (labels[i] == labels[j]) {
					labels[i] = labels[i] + ' ' + i;
				}
			}
		}

		if(dimensions.length == 2 && measures.length == 1 && pivot == true) { 
			for(var i = 0; i < hq.qDataPages[0].qMatrix.length; i++) {
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

			var pivoted = getPivotArray(values);

			//Init categories array
			for(var i = 0; i < pivoted.length; i++) {
				var object = {};
				object.name = pivoted[i][0];

				object.categories = pivoted[0];
				categories.push(object);
			}
			
			//init series array
			for (var i = 0; i < categories[0].categories.length; i++) {
				var object = {};
				object.name = categories[0].categories[i];
				object.data = [];
				series.push(object);
			}
			
			for(var i = 0; i < pivoted.length; i++) {
				for(var j = 0; j < pivoted[i].length; j++) {
					series[j].data.push(pivoted[i][j]);
				}
			}

			chart.xAxis[0].setCategories([]);
			chart.xAxis[0].setCategories(series[0].data);
			
			//Clear series before assigning new values
			for(var i = 1; i < chart.series.length; i++) {
				chart.series[i].setData([]);
				chart.series[i].name = '';
			}

			for(var i = 1; i < series.length; i++) {
				chart.series[i-1].setData(series[i].data);
				chart.series[i-1].name = series[i].name;
			}
		}
		else {
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

			//TODO: ADD SUPPORT FOR MULTIDIMENSIONAL DATA!!!!
			chart.xAxis[0].setCategories([]);
			chart.xAxis[0].setCategories(categories[0]);

			//Clear series before assigning new values
			for(var i = 1; i < chart.series.length; i++) {
				chart.series[i].setData([]);
			}

			for(var i = 0; i < measures.length; i++) {
				chart.series[i].setData(series[i]);
			}
		}
	};

	//Add events to chart
	this.addEvents = function(chart, view) {
		if(dimensions.length == 2 && measures.length == 1 && pivot == true) {
			//Pivoted graph is a special case. TODO: Add event handling
		}
		else {
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
		}
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

		//If hypercube contains less data than limit or pivoted mode is on, take all data
		if(limit > hq.qDataPages[0].qMatrix.length || (dimensions.length == 2 && measures.length == 1 && pivot == true)) {
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
	console.log(values);
	
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
			    	if(values[i][keys[j]] != 'NaN') {
			    		csv += values[i][keys[j]];
			    	}
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