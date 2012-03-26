/*
 RADIAL ACTIVE CLOCK FOR PACHUBE

 Created during the London Pachube Hackathon 2011
 Contact: @loleg http://oleg.utou.ch
 Details: http://ox4hs.utou.ch/pachube-radial

 Creative Commons Attribution 3.0 Unported License
 http://creativecommons.org/licenses/by/3.0/
*/
function radialGraph() {
	var self = this;
	
	self.init = function(element) {
		if (element != undefined) {
		  self.element = element;
		} else { return; }
		
		self.canvas = undefined;
		self.data = undefined;
		self.numdata = undefined;
		
		self.settings = {
		  resource: self.element.attributes["pachube-resource"].value
		, api_key: self.element.attributes["pachube-key"].value
		, FaceColor: "grey"
		, LineColor: "black" 
		, InnerColor: "white" 
		, OuterColor: "white"
		, BackgroundColor: "#fff"
		, TimeSpan: "24 hours"
		, ShowClock: true
		, Font: (self.element.style.font || "9pt Arial")
		};
		
		self.parse_pachube_options(self.element.attributes["pachube-options"].value);
		
		self.clocktime = (self.settings.TimeSpan == "24 hours");
		
		// create canvas
		graphId = 'radgraph' + Math.floor(Math.random() * 100000);
		self.element.innerHTML = '<canvas id="' + graphId + '"></canvas>';
		self.c = document.getElementById(graphId);
		self.b = document.body; 
		self.a = self.c.getContext('2d');
		
		self.width   = self.c.width = (parseInt(self.element.style.width) || 100);
		self.height  = self.c.height = (parseInt(self.element.style.height) || 100);
		self.centerX = self.width / 2;
		self.centerY = self.height / 2;
		self.radius  = self.width / 2.2;
		
		// load data
		self.msg = '( synchronizing )';
		self.data = undefined;
		self.updatePachube();

		// draw and start animation
		self.draw();
		
		// animate only if clock shown or waiting for data
		if (self.settings.ShowClock || self.numdata == undefined) {
			setInterval(self.draw, 1000);
		}
	};
	
	/* Animation loop */
	self.draw = function() {
		self.a.clearRect(0, 0, self.width, self.height);
		self.a.restore();
		
		// show clock if requested
		self.plotClockFace();
		if (self.settings.ShowClock) {
			self.plotClockHands();
		}
		
		// plot the main graph
		self.plotDataPoints();
	};
	
	/* Performs data correction */
	self.updateData = function() {
		
		// create color gradient 
   		self.gradient1 = self.a.createRadialGradient(0, 0, 0, 0, 0, self.radius);
		self.gradient1.addColorStop(0, self.hex2rgb(self.settings.InnerColor, 1.0));
		self.gradient1.addColorStop(1, self.hex2rgb(self.settings.OuterColor, 0.5));

		// 2 is fainter than 1
   		self.gradient2 = self.a.createRadialGradient(0, 0, 0, 0, 0, self.radius);
		self.gradient2.addColorStop(0, self.hex2rgb(self.settings.InnerColor, 0.5));
		self.gradient2.addColorStop(1, self.hex2rgb(self.settings.OuterColor, 0.6));
					   
		// determine range and parse values		
		self.numdata = [], self.datedata = [];
		min = 9999999999.0, max = 0.0;
		for (var i = 0; i < self.data.length; i += 1) {
			// parse and convert amount
			var amount = parseFloat(self.data[i].value);
			max = (max < amount) ? amount : max;
			min = (min > amount) ? amount : min;
			self.numdata.push(amount);
			var at = self.data[i].at;
			if (at.indexOf('.') > 0) {
				at = at.substring(0, at.indexOf('.'));
			}
			self.datedata.push(new Date(at));
		}
		self.scale = self.radius / (max - min);
		self.min = min; 
		self.max = max;
	};	
	
	/* Main data plotting */
	self.plotDataPoints = function() {
		if (self.data == undefined) return;
		if (self.numdata == undefined) self.updateData();
		
		self.a.save();
		self.a.translate(self.centerX, self.centerY);				
		
		// set render style
		self.a.fillStyle = self.gradient1; 
		self.a.strokeStyle = self.settings.LineColor;
		self.a.lineWidth = 1;
		
		// plot complete first half of the graph
		self.a.beginPath();
		self.plotDataRange(0, Math.floor(self.numdata.length / 2));
		// don't outline, just fill
		self.a.fill();
		
		// plot the second half
		self.a.beginPath();
		self.a.fillStyle = self.gradient2;
		self.plotDataRange(Math.ceil(self.numdata.length / 2), self.numdata.length);
		self.a.stroke();
		self.a.fill();		
		
		// restore context
		self.a.restore();
	}
	
	self.plotDataRange = function(start, end) {
		var sp = false, spd = null;
		for (var i = start; i < end; i++) {
			amount = (self.numdata[i] - self.min) * self.scale;
			
			// always clocktime?
			self.clocktime = true;
			
			// work out the data delta
			if (self.clocktime) {
				d = self.datedata[i];
				//dH = d.getUTCHours() + (d.getUTCMinutes() / 60) + (d.getUTCSeconds() / 3600);
				dH = d.getHours() + (d.getMinutes() / 60) + (d.getSeconds() / 3600);
				delta = dH / 12;
			} else {
				d = new Date();
				dH = d.getHours() + (d.getMinutes() / 60) + (d.getSeconds() / 3600);
				delta = (dH / 12) + (i / self.numdata.length);
			}
			
			// position
			dx1 = amount * Math.sin(6.28 * delta);
			dy1 = amount * -Math.cos(6.28 * delta);
			
			// info text (debug):
			/*
			dx2 = self.radius * Math.sin(6.28 * delta);
			dy2 = self.radius *-Math.cos(6.28 * delta);
			if (i>=self.numdata.length/2) dy2 += 10;
			self.a.fillText(self.datedata[i].getHours() + ' ' + self.numdata[i], dx2, dy2);
			*/
			
			if (!sp) {
				spd = [dx1, dy1]; sp = true;
				self.a.moveTo(dx1, dy1);
			} else {
				self.a.lineTo(dx1, dy1);
			}
		}
		// complete the object
		if (sp) self.a.lineTo(spd[0], spd[1]);
	};
		
	/* Plots the graph decoration */
	self.plotClockFace = function() {
		self.a.save();
		self.a.translate(self.centerX, self.centerY);

		self.a.strokeStyle = self.settings.FaceColor;
		self.a.fillStyle = self.settings.BackgroundColor;
		self.a.lineWidth = 3;
		
		// circle
		self.a.beginPath();
		self.a.arc(0, 0, self.radius, 0, Math.PI * 2, false);
		self.a.stroke();
		self.a.fill();
				
		// write message at top
		self.a.font = self.settings.Font;
		self.a.fillStyle = self.settings.FaceColor;
		self.a.fillText(self.msg, -self.msg.length * 3, -self.radius - 8);
		
		self.a.restore();
	}
	
	/* Plots clock hands */
	self.plotClockHands = function() {
		self.a.save();
		self.a.translate(self.centerX, self.centerY);

		self.a.strokeStyle = "rgba(0,0,0,0.3)";
		self.a.lineWidth = self.radius / 10;
			
		// calculate time			
		d = new Date();
		dS = d.getSeconds() / 60;
		dM = (d.getMinutes() + dS) / 60;
		dH = (d.getHours() + dM) / 12;
		pi2 = Math.PI * 2;
			
		// hour hand	
		self.a.beginPath();
		self.a.moveTo(0, 0);
		// draw it 10% shorter than the minute hand
		dx1 = 0.9 * self.radius * Math.sin(pi2 * dH);
		dy1 = 0.9 * self.radius *-Math.cos(pi2 * dH);
		self.a.lineTo(dx1, dy1);
		self.a.stroke();
		
		// minute hand	
		self.a.beginPath();
		self.a.moveTo(0, 0);
		dx1 = self.radius * Math.sin(pi2 * dM);
		dy1 = self.radius *-Math.cos(pi2 * dM);
		self.a.lineTo(dx1, dy1);
		self.a.stroke();
		
		// second arc
		self.a.beginPath();
		// 60 seconds as a full arc, not empty
		self.a.arc(0, 0, self.radius * 0.95, -pi2 / 4, (pi2 * ((dS == 0) ? 1.0 : dS)) - pi2 / 4, false);
		self.a.stroke();
		
		// restore context
		self.a.restore();
	}
	/* Parse standard pachube options from DIV attribute */
	self.parse_pachube_options = function(options) {
		if (options == undefined) { options = ""; }
		options_hash = new Array();

		re = /([^:]*):([^;]*);/;
		while (match = options.match(re)) {
		  options = options.replace(re, '');
		  options_hash[match[1].trim()] = match[2].trim();
		}
		
		self.settings.FaceColor = (options_hash["text-color"] || "#555555");
		self.settings.LineColor = (options_hash["line-color"] || "#0000ff");
		self.settings.InnerColor = (options_hash["grid-color"] || "#03030b");
		self.settings.OuterColor = (options_hash["border-color"] || "#a000ff");
		self.settings.BackgroundColor = (options_hash["background-color"] || "#ffffff");
		self.settings.TimeSpan = (options_hash["timespan"] || "24 hours");
		self.settings.ShowClock = (options_hash["showclock"] != "no")
	}
	
	/* Convert Pachube graph option to API call string */
	self.set_interval = function(str) {
		switch(str) {
		  case "3 months":
			self.settings.Interval = 86400 * 60;
			return "3month";
		  case "4 days":
			self.settings.Interval = 6000 * 60;
			return "4day";
		  case "last hour":
			self.settings.Interval = 500 * 60;
			return "1hour";
		  default:
		  case "24 hours": // default
			self.settings.Interval = 2000 * 60;
			self.settings.TimeSpan = "24 hours";
			return "24hour"
		}
	};
	
	/* Talks to Pachube server */
	self.updatePachube = function() {
	
		// get standard time span for request
		var pachube_duration = self.set_interval(self.settings.TimeSpan);

		if (typeof console != "undefined")
			console.log("Updating Pachube data: " + self.settings.resource + " - next in " + self.settings.Interval / 1000 + "s");
			
		// next update
		if (self.settings.Interval > 0)
			setTimeout(self.updatePachube, self.settings.Interval);

		// example data:
		//pachube_data = {"datapoints":[{"value":"15","at":"2011-04-07T16:44:59.183935Z"},{"value":"16","at":"2011-04-07T16:59:14.030452Z"},{"value":"15","at":"2011-04-07T17:14:27.122560Z"},{"value":"17","at":"2011-04-07T17:29:42.271850Z"},{"value":"14","at":"2011-04-07T17:44:54.355044Z"},{"value":"14","at":"2011-04-07T17:59:12.134586Z"},{"value":"15","at":"2011-04-07T18:14:28.220594Z"},{"value":"17","at":"2011-04-07T18:29:39.284115Z"},{"value":"15","at":"2011-04-07T18:44:49.355919Z"},{"value":"14","at":"2011-04-07T18:59:03.433940Z"},{"value":"15","at":"2011-04-07T19:14:18.204814Z"},{"value":"15","at":"2011-04-07T19:29:32.355172Z"},{"value":"14","at":"2011-04-07T19:44:46.445715Z"},{"value":"14","at":"2011-04-07T19:59:00.192018Z"},{"value":"16","at":"2011-04-07T20:14:17.345653Z"},{"value":"15","at":"2011-04-07T20:29:29.434235Z"},{"value":"14","at":"2011-04-07T20:44:43.465105Z"},{"value":"15","at":"2011-04-07T20:59:56.573651Z"},{"value":"16","at":"2011-04-07T21:14:10.366829Z"},{"value":"17","at":"2011-04-07T21:29:23.492094Z"},{"value":"16","at":"2011-04-07T21:44:32.599366Z"},{"value":"16","at":"2011-04-07T21:59:46.654597Z"},{"value":"16","at":"2011-04-07T22:14:59.712984Z"},{"value":"15","at":"2011-04-07T22:29:15.606399Z"},{"value":"16","at":"2011-04-07T22:44:33.649908Z"},{"value":"16","at":"2011-04-07T22:59:44.646654Z"},{"value":"17","at":"2011-04-07T23:14:01.554065Z"},{"value":"15","at":"2011-04-07T23:29:20.600770Z"},{"value":"16","at":"2011-04-07T23:44:35.719394Z"},{"value":"14","at":"2011-04-07T23:59:47.743861Z"},{"value":"15","at":"2011-04-08T00:14:01.614316Z"},{"value":"15","at":"2011-04-08T00:29:15.693070Z"},{"value":"16","at":"2011-04-08T00:44:28.739506Z"},{"value":"15","at":"2011-04-08T00:59:43.835052Z"},{"value":"15","at":"2011-04-08T01:14:53.903809Z"},{"value":"15","at":"2011-04-08T01:29:07.785615Z"},{"value":"15","at":"2011-04-08T01:44:21.925920Z"},{"value":"14","at":"2011-04-08T01:59:40.924225Z"},{"value":"15","at":"2011-04-08T02:14:59.021999Z"},{"value":"14","at":"2011-04-08T02:29:14.871638Z"},{"value":"17","at":"2011-04-08T02:44:29.968584Z"},{"value":"14","at":"2011-04-08T02:59:44.106261Z"},{"value":"14","at":"2011-04-08T03:13:58.892461Z"},{"value":"14","at":"2011-04-08T03:29:12.888355Z"},{"value":"14","at":"2011-04-08T03:44:29.075279Z"},{"value":"14","at":"2011-04-08T03:59:43.077131Z"},{"value":"13","at":"2011-04-08T04:14:59.217706Z"},{"value":"16","at":"2011-04-08T04:29:14.124672Z"},{"value":"15","at":"2011-04-08T04:44:29.171204Z"},{"value":"14","at":"2011-04-08T04:59:42.182922Z"},{"value":"15","at":"2011-04-08T05:14:56.280006Z"},{"value":"13","at":"2011-04-08T05:29:07.182355Z"},{"value":"13","at":"2011-04-08T05:44:24.201635Z"},{"value":"14","at":"2011-04-08T05:59:40.317856Z"},{"value":"14","at":"2011-04-08T06:14:56.910133Z"},{"value":"15","at":"2011-04-08T06:29:12.903718Z"},{"value":"15","at":"2011-04-08T06:44:30.094782Z"},{"value":"13","at":"2011-04-08T06:59:47.200396Z"},{"value":"13","at":"2011-04-08T07:14:04.087602Z"},{"value":"14","at":"2011-04-08T07:29:22.502268Z"},{"value":"15","at":"2011-04-08T07:44:38.259208Z"},{"value":"15","at":"2011-04-08T07:59:55.346005Z"},{"value":"15","at":"2011-04-08T08:14:11.328311Z"},{"value":"15","at":"2011-04-08T08:29:29.274750Z"},{"value":"15","at":"2011-04-08T08:44:46.531420Z"},{"value":"14","at":"2011-04-08T08:59:02.385426Z"},{"value":"13","at":"2011-04-08T09:14:21.437053Z"},{"value":"15","at":"2011-04-08T09:29:39.605456Z"},{"value":"15","at":"2011-04-08T09:44:55.607996Z"},{"value":"15","at":"2011-04-08T09:59:12.509692Z"},{"value":"12","at":"2011-04-08T10:14:30.667883Z"},{"value":"14","at":"2011-04-08T10:29:48.776043Z"},{"value":"14","at":"2011-04-08T10:44:04.725899Z"},{"value":"14","at":"2011-04-08T10:59:20.735292Z"},{"value":"17","at":"2011-04-08T11:14:36.937694Z"},{"value":"15","at":"2011-04-08T11:29:53.024392Z"},{"value":"13","at":"2011-04-08T11:44:08.950376Z"},{"value":"14","at":"2011-04-08T11:59:26.937512Z"},{"value":"15","at":"2011-04-08T12:14:45.091889Z"},{"value":"14","at":"2011-04-08T12:29:59.294185Z"},{"value":"14","at":"2011-04-08T12:44:13.136282Z"},{"value":"14","at":"2011-04-08T12:59:23.135278Z"},{"value":"15","at":"2011-04-08T13:14:36.467729Z"},{"value":"14","at":"2011-04-08T13:29:50.485737Z"},{"value":"14","at":"2011-04-08T13:44:06.165459Z"},{"value":"14","at":"2011-04-08T13:59:19.248566Z"},{"value":"16","at":"2011-04-08T14:14:34.314076Z"},{"value":"15","at":"2011-04-08T14:29:49.447366Z"},{"value":"13","at":"2011-04-08T14:44:03.091421Z"},{"value":"14","at":"2011-04-08T14:59:15.345151Z"},{"value":"13","at":"2011-04-08T15:14:29.446345Z"},{"value":"13","at":"2011-04-08T15:29:40.629051Z"},{"value":"13","at":"2011-04-08T15:44:54.710643Z"},{"value":"15","at":"2011-04-08T15:59:08.435566Z"},{"value":"14","at":"2011-04-08T16:14:23.537150Z"},{"value":"15","at":"2011-04-08T16:29:36.675310Z"}],"max_value":"20.0","at":"2011-04-08T16:39:44.321257Z","min_value":"8.0","tags":["temperature2"],"unit":{"label":"Celcius","symbol":"c"},"current_value":"14","version":"1.0.0","id":"1"}; self.data = pachube_data.datapoints; self.msg = self.settings.TimeSpan; return;
		
		// fetch remote datastream
		jQuery.getJSON("https://api.pachube.com/v2/" + self.settings.resource 
				+ ".json?duration=" + pachube_duration 
				+ "&key=" + self.settings.api_key,
			function(data) {
				self.numdata = undefined;
				self.data = data.datapoints;
				self.msg = self.settings.TimeSpan;				
			}
		);
	};
	
	/* http://snipplr.com/view.php?codeview&id=43542 */
	self.hex2rgb = function(hex, opacity) {
		var rgb = hex.replace('#', '').match(/(.{2})/g);

		var i = 3;
		while (i--) {
		rgb[i] = parseInt(rgb[i], 16);
		}

		if (typeof opacity == 'undefined') {
		return 'rgb(' + rgb.join(', ') + ')';
		}

		return 'rgba(' + rgb.join(', ') + ', ' + opacity + ')';
	};
}

/* Load jQuery if needed */
if (typeof jQuery === "undefined") { // || jQuery.fn.jquery !== '1.4.2'
	var script_tag = document.createElement('script');
	script_tag.setAttribute("type", "text/javascript");
	script_tag.setAttribute("src",  "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js")
	script_tag.onload = startRadialGraph;
	script_tag.onreadystatechange = function () { // Same thing but for IE
		if (this.readyState == 'complete' || this.readyState == 'loaded') startRadialGraph(false);
	}
	document.getElementsByTagName("head")[0].appendChild(script_tag);
} else {
	startRadialGraph(true);
}

function startRadialGraph(safemode) {
	//if (safemode != false) $.noConflict();
	jQuery(document).ready(function ($) {
		$(".pachube-radial").each(function() {
			if ($(this).hasClass("p-r-init")) return;
			$(this).addClass("p-r-init"); // ensures only once init
			(new radialGraph()).init(this);
		});
	});
}