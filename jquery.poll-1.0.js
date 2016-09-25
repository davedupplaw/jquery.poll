/*
Copyright (C) 2013 David Dupplaw

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * 	Shows bars that represent the frequency of some data. Use the setData()
 *	method to update the display. This must contain an array of objects,
 *	where the object contains a 'value' field which contains the numerical
 *	frequency of the category and 'title' which is the title of the category.
 *	e.g. [{title:'obj1',value:1},{title:'obj2',value:0.5}...]. Bars can be
 *	highlighted using the setHighlight(h) method where h is an array of
 *	bar titles, e.g. ['obj1','obj2'...].
 * 
 * 	@author David Dupplaw <dpd@ecs.soton.ac.uk>
 *	@created December 2011
 *	@updated 3rd October 2013 - Updated for new jQuery widget factory. Added highlight and mouseover
 */
(function($){
var PollBarGraphWidget =
{
	/** Gets the width of the widget */
	getWidth: function() { return this.options.width; },
	
	/** Set the width of the widget */
	setWidth: function(w) { this.options.width = w; this.element.width(w); this.updateGraph(); },

	/** Gets the height of the widget */
	getHeight: function() { return this.options.height; },
	
	/** Set the height of the widget */
	setHeight: function(h) { this.options.height = h; this.element.height(h); this.updateGraph(); },

	/** Get the x-axis label */
	getXAxisLabel: function() { return this.options.XAxisLabel; },
	
	/** Set the x-axis label */
	setXAxisLabel: function(h) { this.options.XAxisLabel = h; this.updateGraph(); },

	/** Get the y-axis label */
	getYAxisLabel: function() { return this.options.YAxisLabel; },
	
	/** Set the y-axis label */
	setYAxisLabel: function(h) { this.options.YAxisLabel = h; this.updateGraph(); },

	/** Set which bars are to be highlighted */
	setHighlights: function(h) { this.options.highlightBars = h; this.updateGraph(); },

	/** Get the data being displayed */
	getData: function() { return this._data; },
	
	/** Set the data */
	setData: function( data ) 
	{ 
		this._finalData = data;
		this._syncDataArrays();
		this.options.maxY = this.getMaxDataValue();
		this.updateAnimation();
	},
	
	// Ensures that the final data array
	// and the current data array have the
	// same index elements
	_syncDataArrays: function()
	{
		var finalData = this._finalData;
		var currentData = this.getData();
		var data = new Array();
		
		// Add any missing elements from
		// the final data element
		for( d in finalData )
		{
			var x = this._getDataElement( finalData[d].title );
			if( x == null )
					data.push( { title: finalData[d].title, value: 0 } );
			else	data.push( { title: currentData[x].title, value: currentData[x].value } );
		}
		
		this._data = data;
	},
	
	_getDataElement: function( title )
	{
		var data = this.getData();
		for( x in data )
			if( data[x] && data[x].title == title )
				return x;
		return null;
	},
	
	_requireAnimation: function()
	{
		var endAnim = this.options.endAnimation;
		var data = this.getData();
		var finalData = this._finalData;
		for( d in finalData )
		{
			var x = this._getDataElement( finalData[d].title );
			// shouldn't ever be null, but just to be safe
			if( x != null )
			{
				var diff = Math.abs(data[x].value-finalData[d].value);
				if( diff > endAnim )
					return true;
			}
		}
		
		return false;
	},

	getMaxDataValue: function()
	{
		var max = 0;
		var data = this.getData();
		if( data == null ) return 0;
		for( i = 0; i < data.length; i++ )
			if( data[i].value-0 > max-0 )
				max = data[i].value-0;
		
		if( this.options.onlyScaleUp && this.options.maxY > max )
			return this.options.maxY;
				
		return max;		
	},

	updateAnimation: function()
	{
		if( this._requireAnimation() )
		{
			var finalData = this._finalData;
			var data = this.getData();
			var animationAmount = this.options.animationAmount;
			
			// We need to move the values of the currently
			// displayed data closer to the final data element
			for( d in finalData )
			{
				var x = this._getDataElement( finalData[d].title );
				// shouldn't ever be null, but just to be sure
				if( x != null )
				{
					var fdv = finalData[d].value;
					var  dv = data[x].value;
					var diff = dv-fdv;
					data[x].value -= diff * animationAmount;
					this._data = data;
				}
			}
			
			// update the display
			this.updateGraph();

			// set a timer for the next round
			var speed = this.options.animationSpeed;
			var x = this;
			this.element.oneTime( speed, function(){
				x.updateAnimation(); 
			});
		}
		else
		{
			// if we're in updateAnimation and found
			// we don't need to animate, then we should
			// ensure that the current data reflects
			// the final data array
			this._data = this._finalData;
			this.updateGraph();
		}
	},
	
	updateGraph: function()
	{
		this.options.maxY = this.getMaxDataValue();
		
		var canvas = document.getElementById(this.element.attr("id")+"_canvas");
		canvas.width = this.getWidth();
		canvas.height = this.getHeight();

		var ctx = canvas.getContext('2d');
		
		this.drawGraphLabels( ctx );
		ctx.strokeStyle = this.options.axesStyle;
		ctx.lineWidth = this.options.axesWidth;
		this.drawYAxis( ctx );
		this.drawXAxis( ctx );
		this.drawData( ctx );		
	},
	
	drawGraphLabels: function( ctx )
	{
		var width = this.getWidth();
		var height = this.getHeight();
		var xAxis = this.getXAxisLabel();
		var xLabelDim = ctx.measureText( xAxis );
		var yAxis = this.getYAxisLabel();
		var yLabelDim = ctx.measureText( yAxis );

		// Draw X axis label
	  	ctx.fillStyle = this.options.axesLabelStyle;
	  	ctx.font = "8pt Helvetiker, sans-serif";				
	  	ctx.fillText( xAxis, (width/2)-(xLabelDim.width/2), height );
		
		// Draw Y axis label
		ctx.save();
		ctx.rotate( Math.PI/2 );
	  	ctx.font = "8pt Helvetiker, sans-serif";				
	  	ctx.fillText( yAxis, (height/2)-(yLabelDim.width/2), 0 );
		ctx.restore();
	},
	
	drawXAxis: function( ctx )
	{
		var width = this.getWidth();
		var height = this.getHeight();
		
		var xAxisFromBottom = this.options.XAxisFromBottom;
		var yAxisFromLeft = this.options.YAxisFromLeft;
		
		// Draw X axis
		drawPolygon( ctx, [ [yAxisFromLeft, height-xAxisFromBottom], 
							[width, height-xAxisFromBottom] ] );

	},
	
	drawYAxis: function( ctx ) 
	{
		var width = this.getWidth();
		var height = this.getHeight();
		var xAxisFromBottom = this.options.XAxisFromBottom;
		var yAxisFromLeft = this.options.YAxisFromLeft;
		
		// Draw major values
		ctx.save();
		var maxY = this.options.maxY;
		var minY = this.options.minY;
		
		if( maxY - minY < 1 )
			maxY = minY + 1;
		
		var yScale = (height-xAxisFromBottom)/(maxY-minY);
		var diff = maxY - minY;
		var startSpacing = 4;
		
		var graphHeight = height-xAxisFromBottom;
		var spacing = graphHeight/startSpacing;
		var valSpacing = diff/startSpacing;
		var minSpacing = this.options.minYTickSpacing;
		while( spacing < minSpacing )
		{
			valSpacing *= 2;
			spacing *= 2;
		} 
		
		valSpacing = Math.floor( valSpacing );
		if( valSpacing == 0 )
			valSpacing = 1;
		
		ctx.lineWidth = this.options.tickLineWidth;
		ctx.strokeStyle = this.options.tickStyle;
		
		var y = minY;
		var yy = (height-xAxisFromBottom)-(y*yScale); 
		while( yy > 0 )
		{
			y += valSpacing;
			yy = (height-xAxisFromBottom)-(y*yScale);
			
			drawLine( ctx, [[yAxisFromLeft,yy],[width,yy]] );

		  	ctx.fillStyle = ctx.strokeStyle;
		  	ctx.font = "7pt Helvetiker, sans-serif";
		  	var label = ""+y;
		  	var labelWidth = ctx.measureText( label );
	  		ctx.fillText( label, yAxisFromLeft-2-labelWidth.width, yy-2 );
		}
		ctx.restore();
		
		// Draw Y axis
		drawPolygon( ctx, [ [yAxisFromLeft, height-xAxisFromBottom], 
							[yAxisFromLeft, 0] ] );							
	},
	
	drawData: function( ctx )
	{
		var data = this.getData();
		
		if( data == null || data.length == 0 )
			return;
		
		// Get the total data size
	  	var acc = 0;
	  	var data = this.getData();
	  	for( dObject in data )
	  		acc += data[dObject].value;
	  	
		var showPercentage = this.options.showPercentage;
		var showCount = this.options.showCount;

		var width = this.getWidth();
		var height = this.getHeight();
		var xAxisFromBottom = this.options.XAxisFromBottom;
		var yAxisFromLeft = this.options.YAxisFromLeft;
		var maxY = this.options.maxY;
		var minY = this.options.minY;
		if( maxY - minY < 1 )
			maxY = minY + 1;
				
		var graphWidth = width - yAxisFromLeft;
		var barWidth = graphWidth / this.getData().length;
		var xAxisYPos = height - xAxisFromBottom;
		var yScale = xAxisYPos/(maxY-minY);
		
		var xPos = yAxisFromLeft;
		for( dataObject in data )
		{
			var poly = new Array();

			if( this.options.highlightBars.indexOf( data[dataObject].title ) == -1 )
			{
				ctx.lineWidth = this.options.barStrokeWidth;
				ctx.strokeStyle = this.options.barStrokeStyle;
				ctx.fillStyle = this.options.barFillStyle;
			}
			else
			{
				ctx.lineWidth = this.options.barStrokeWidthHighlight;
				ctx.strokeStyle = this.options.barStrokeStyleHighlight;
				ctx.fillStyle = this.options.barFillStyleHighlight;
			}

			poly.push( [xPos,          xAxisYPos ] );
			poly.push( [xPos,          xAxisYPos-(data[dataObject].value*yScale)] );
			poly.push( [xPos+barWidth, xAxisYPos-(data[dataObject].value*yScale)] );
			poly.push( [xPos+barWidth, xAxisYPos ] );

			fillPolygon( ctx, poly );			
			drawPolygon( ctx, poly );
			
			this.drawBarText( ctx, data[dataObject], barWidth, data[dataObject].value*yScale, xPos, xAxisYPos )
			
			if( showPercentage || showCount )
				this.drawBarStats( ctx, data[dataObject], barWidth, data[dataObject].value*yScale, xPos, xAxisYPos, acc  );
			
			xPos += barWidth;
		}
	},
	
	drawBarText: function( ctx, dataObject, barWidth, barHeight, xPos, yPos )
	{
		ctx.save();

		var fontName = this.options.barTextFont;
		var startFontSize = barWidth;
		
		if( this.options.highlightBars.indexOf( dataObject.title ) == -1 )
			  	ctx.fillStyle = this.options.barTextStyle;
		else	ctx.fillStyle = this.options.barTextStyleHighlight;
		
	  	ctx.font = ""+startFontSize+"pt "+fontName;
	  	
	  	var defaultLabelSize = ctx.measureText( dataObject.title );
	  
	  	// if the text will 
	  	var textTooSmall = false;
	  	while( defaultLabelSize.width > barHeight && !textTooSmall )
	  	{
	  		startFontSize = Math.floor(startFontSize*0.75);
	  		
	  		if( startFontSize < 12 )
	  			textTooSmall = true;
	  		
		  	ctx.font = ""+startFontSize+"pt "+fontName;		  	
		  	defaultLabelSize = ctx.measureText( dataObject.title );
	  	}

	  	// font size got too small
	  	if( textTooSmall )
	  	{
	  		// We draw the text outside of the box
		  	ctx.font = "24pt "+fontName;		  	
	  		ctx.translate( xPos+25, yPos-barHeight );
			ctx.rotate( -Math.PI/3 );
		  	ctx.fillText( dataObject.title, 0,0 );
	  	}
	  	else
	  	{
			ctx.rotate( -Math.PI/2 );
		  	ctx.fillText( dataObject.title, -yPos, xPos+barWidth-4 );
	  	}
	  	
		ctx.restore();
	},
	
	isInteger: function(s){ return parseInt(s,10)===s; },
	
	drawBarStats: function( ctx, dataObject, barWidth, barHeight, xPos, yPos, acc )
	{
		ctx.save();
		
		var showPercentage = this.options.showPercentage;
		var showCount = this.options.showCount;
		var minPC = this.options.showStatsAbove;
		var fontName = this.options.barStatsFont;
		var startFontSize = this.options.barStatsFontSize;
		
	  	ctx.fillStyle = this.options.barStatsStyle;
	  	ctx.font = ""+startFontSize+"pt "+fontName;
	
	  	var percent = dataObject.value / acc * 100;
	  	var pc = ""+parseFloat(percent).toFixed(2)+"%";
	  	
	  	var freq = dataObject.value;
	  	if( !this.isInteger( freq ) )
	  		freq = ""+dataObject.value.toFixed(2);

	  	if( !isNaN(percent) && percent > minPC )
	  	{  	
	  		var y = yPos + startFontSize + 4;
		  	if( showPercentage )
		  	{
		  		var pcw = ctx.measureText( pc );
		  		ctx.fillText( pc, xPos+barWidth/2-pcw.width/2, y-barHeight );
		  		y += startFontSize+4;
		  	}
		  	
		  	if( showCount )
		  	{
		  		var cnw = ctx.measureText( freq );
		  		ctx.fillText( freq, xPos+barWidth/2-cnw.width/2, y-barHeight );
		  	}
	  	}
	  	
	  	
		ctx.restore();
	},
	
	_checkBarHover: function( x, y )
	{
		// If it's called with no values, use the last values
		var xx = x; var yy = y;
		if( x == undefined || y == undefined )
		{	xx = this.options.lastX; yy = this.options.lastY; }

		var width = this.getWidth();
		var height = this.getHeight();
		var xAxisFromBottom = this.options.XAxisFromBottom;
		var yAxisFromLeft = this.options.YAxisFromLeft;
		var maxY = this.options.maxY;
		var minY = this.options.minY;
		if( maxY - minY < 1 )
			maxY = minY + 1;
				
		var graphWidth = width - yAxisFromLeft;
		var barWidth = graphWidth / this.getData().length;
		var xAxisYPos = height - xAxisFromBottom;
		var yScale = xAxisYPos/(maxY-minY);
		
		// Loop through the data and find the size/location of each bar.		
		var data = this.getData();
		var xPos = yAxisFromLeft;
		var	hoverBar = null;
		for( dataObject in data )
		{
			if( xx >= xPos && xx < xPos+barWidth &&
				yy >= xAxisYPos - (data[dataObject].value*yScale) &&
				yy < xAxisYPos )
			{
				hoverBar = {
					object : data[dataObject],
					location: {
						x : xPos,
						y : xAxisYPos - (data[dataObject].value * yScale),
						barWidth: barWidth
					}
				};
				break;
			}
			xPos += barWidth;
		}
		
		// Check whether we're moved to a new bar
		if( (hoverBar != null && this.options.lastHoverBar == null) ||
			(hoverBar != null && hoverBar.object.title != this.options.lastHoverBar.object.title) )
		{
			if( this.options.hoverBarCallback != null )
				this.options.hoverBarCallback( hoverBar );
		}		

		// Store then for next time.
		this.options.lastX = x;
		this.options.lastY = y;
		this.options.lastHoverBar = hoverBar;
	},
	
	_init: function()
	{
		var caption = $("<p id='"+this.element.attr("id")+"_caption' class='caption'>"+this.options.title+"</p>");
		
		if( this.options.titlePosition == "above" && this.options.title != "" )
			this.element.append( caption );
		
		this.element.append( "<canvas id='"+
			this.element.attr("id")+"_canvas' />" );
			
		this.element.append( "<div id='mm'/>" );

		// Add a mouse listener so that we can determine which bar we're hovering over.
		var canvas = document.getElementById(this.element.attr("id")+"_canvas");
		var xThis = this;
		this.options.lastHoverBar = null;
		canvas.addEventListener( "mousemove", function( evt )
		{
	        var rect = canvas.getBoundingClientRect();
	        var x = evt.clientX - rect.left;
			var y = evt.clientY - rect.top;
			xThis._checkBarHover( x, y );
		}, false );

		if( this.options.titlePosition == "below" && this.options.title != "" )
			this.element.append( caption );

		this.setWidth(this.getWidth());
		this.setHeight(this.getHeight());			
	},

	options:
	{
		// Width and height of chart
		width: 300,
		height: 300,
		
		// Whether to draw the axes
		drawXAxis: true,
		drawYAxis: true,
		
		// The Axis labels and positions
		XAxisLabel: "X-Axis",
		XAxisFromBottom: 15,
		YAxisLabel: "Y-Axis",
		YAxisFromLeft: 15,
		
		// Colour of the axes labels
		axesLabelStyle: '#AAA',
		
		// The width and colour of the axes lines
		axesStyle: '#AAA',
		axesWidth: 2,
	
		// Default scaling on the Y axis
		// (will be over-ridden if autoScale is true)
		maxY: 10,
		minY: 0,
		
		// The minimum spacing of the value lines
		// on the graph Y axis
		minYTickSpacing: 10,
		
		// The style of the value lines on the graph
		// Y axis (including the value text)
		tickLineWidth: 1,
		tickStyle: '#AAA',
		
		// Scaling on the X axis
		tickX: 1,
		tickXWidth: 25,
	
		// The stroke, fill colour and stroke width
		// of the bars that are drawn in bar mode
		barStrokeWidth: 1,
		barFillStyle: '#FC0',
		barStrokeStyle: '#000',

		// The stroke, fill colour and stroke width
		// of the bars that are drawn when highlighted
		barStrokeWidthHighlight: 1,
		barFillStyleHighlight: '#F00',
		barStrokeStyleHighlight: '#000',
		
		barTextStyle: '#DA0',
		barTextStyleHighlight: '#FFF',
		
		// This is the font used for the bar text.
		// Leave off the size from the front
		barTextFont: "Helvetiker, sans-serif",
		
		// For drawing the stats of the bar
		barStatsStyle: '#540',
		barStatsFont: "Helvetiker, sans-serif",
		
		// Size of the text on the bar
		barStatsFontSize: 8,
		
		// Whether to display the percentage of the bar 
		showPercentage: true,
		
		// Whether to show the actual frequency value
		showCount: true,
		
		// For bars that are small, whether to show the
		// stats (percentage value)
		showStatsAbove: 20,
	
		// At what speed to slide the graph along
		animationSpeed: 10,
		animationAmount: 0.1,
	
		// If we're sliding the graph before we add new
		// data, then the data we want to add sits here.
		dataAwaitingDisplay: [],
	
		// While sliding the current offset is here
		currentSlideOffset: 0,
		
		// The title to display for the graph
		title: "",
		
		// Position of title "above" or "below"
		titlePosition: "below",
			
		// Data minimum distance
		endAnimation: 0.1,
		
		// Which bars to highlight (array of titles)
		highlightBars: [],
		
		// Callback function for when a bar is hovered over
		// The function will receive an object containing the
		// name of the bar, it's value, and its location
		hoverBarCallback: null,
		
		// When auto-scaling the graph, only ever scale to a
		// bigger value. Never scale smaller. This avoids the
		// graph bouncing around during an update.
		onlyScaleUp: true,
	}
}

$.widget( "dd.pollbargraph", PollBarGraphWidget );

}(jQuery));