/* Properties */
define( [], function () {
    'use strict';

    // *****************************************************************************
    // Dimensions & Measures
    // *****************************************************************************
    var dimensions = {
        uses: "dimensions",
        min: 1,
        max: 2
    };

    var measures = {
        uses: "measures",
        min: 1,
        max: 10
    };

    // *****************************************************************************
    // Appearance Section
    // *****************************************************************************
    var appearanceSection = {
        uses: "settings"
    };

    // *****************************************************************************
    // Sorting Section
    // *****************************************************************************
	var sorting = {
    	uses: "sorting"
  	};

    // *****************************************************************************
    // Highcharts Section
    // *****************************************************************************
    var highcharts = {
    	component: "expandable-items",
    	label: "Highcharts",
    	items: {
    		styles: {
    			type: "items",
    			label: "Styles",
    			items: {

    			}
    		},
    		wizard: {
    			type: "items",
    			label: "Wizard",
    			items: {
    				Definition: {
							label:"Definition",
							component: "textarea",
							rows: 7,
							maxlength: 5000,
							ref: "pr.def",
							show: false
					},
					ChartData: {
							label:"ChartData",
							component: "textarea",
							rows: 7,
							maxlength: 5000,
							ref: "pr.chart",
							show: false
					},
					Pivot: {
							type: "boolean",
							label: "Pivot Wizard data",
							ref: "pr.pivot",
							defaultValue: true,
							show: function(app) {
								if(app.qHyperCubeDef.qDimensions.length == 2 && app.qHyperCubeDef.qMeasures.length == 1) {
									return true;
								}
								return false;
							}
					},
					Wizard: {
							label:"Launch Wizard",
							component: "button",
							action: function(app) {
								toggleWizard("open", app.qInfo.qId);
							}
					}
    			}
    		}
    	}
    };

    // *****************************************************************************
    // Main property panel definition
    // *****************************************************************************
    return {
        type: "items",
        component: "accordion",
        items: {
            dimensions: dimensions,
            measures: measures,
            sorting: sorting,
            appearance: appearanceSection,
            charts: highcharts
        }
    };

} );
