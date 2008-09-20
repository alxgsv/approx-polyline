ApproxPolyline = function(gmap, lls, f, range, points){
	this.initialize = function(gmap, lls, f, range, points){
		this.gmap = gmap;
		this.lls = lls;
		this.f = f;
		this.len_map = this.get_distance_in_pixels(lls[0], lls[1]);
		this.len_f = Math.abs(range[1] - range[0]);
		this.angle =  - this.get_turn_angle();
		this.zoom = this.len_map/this.len_f;
		this.range = range;
		this.points = points;
		this.relative_point = this.transform_turn(
								this.transform_zoom(
		                        {x: range[0],
		                         y: f(range[0])}
		                      ));
		this.shift = {
			x: gmap.fromLatLngToContainerPixel(this.lls[0]).x - this.relative_point.x,
			y: gmap.fromLatLngToContainerPixel(this.lls[0]).y - this.relative_point.y
		}
	}
	this.transform_zoom = function(ll){
		/* Zo_Om */
		var x = ll.x * this.zoom;
		var y = ll.y * this.zoom;
		return {x: x, y:y};
		return ll;
	}
	this.transform_turn = function(ll){
		/* Turn */
		var x = Math.cos(this.angle)*ll.x + Math.sin(this.angle)*ll.y;
		var y = -Math.sin(this.angle)*ll.x + Math.cos(this.angle)*ll.y;
		return {x: x, y:y};
	}
	this.transform_shift = function(ll){
		/* Parallel shift */
		var x = ll.x + this.shift.x;
		var y = ll.y + this.shift.y;
		return {x: x, y:y};
	}
	this.transform_to_geo = function(ll){
		ll = this.transform_shift(this.transform_turn(this.transform_zoom(ll)));
		return this.gmap.fromContainerPixelToLatLng(new GPoint(ll.x, ll.y));
	}
	this.get_turn_angle = function(){
		var xy0 = this.gmap.fromLatLngToContainerPixel(this.lls[0]);
		var xy1 = this.gmap.fromLatLngToContainerPixel(this.lls[1]);
		var cathetus0 = xy1.x-xy0.x;
		var cathetus1 = xy1.y-xy0.y;
		var angle = Math.atan2(cathetus1,cathetus0);
		return angle;

	}
	this.get_distance_in_pixels = function(ll1, ll2){
		var p1 = this.gmap.fromLatLngToContainerPixel(ll1);
		var p2 = this.gmap.fromLatLngToContainerPixel(ll2);
		return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2));
	}
	this.get_pivots = function(){
		/* Get pivot's ordinates for polynomial
		   For the first time - simple even distribution
		*/
		var step = (this.range[1]-this.range[0])/this.points;
		var pivots = [];
		for(var p=0;p<=this.points;p++){
			pivots.push(this.range[0]+step*p);
		}
		return pivots;
	}
	this.get_map_lls = function(){
		var pivots = this.get_pivots();
		var lls = [];
		for (p in pivots){
			var x = pivots[p];
			var y = this.f(x);
			var ll = this.transform_to_geo({x:x, y:y});
			lls.push(ll);
		}
		return lls;

	}
	this.get_polyline = function(){
		return new GPolyline(this.get_map_lls());
	}
	this.initialize(gmap, lls, f, range, points);
}