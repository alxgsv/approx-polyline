ApproxPolyline = function(gmap, lls, f, range, points){
	this.gmap = gmap;
	this.lls = lls;
	this.f = f;
	this.range = range;
	this.points = points;

	// Calculating zoom correction
	this.len_map = this.get_distance_in_pixels(lls[0], lls[1]);
	this.len_f = Math.abs(range[1] - range[0]);
	this.zoom = this.len_map/this.len_f;

	// Calculating alpha correction
	this.angle =  - this.get_turn_angle();

	/* Relative point is first point of polyline,
	   zoomed and turned*/
	this.relative_point = this.transform_turn(
							this.transform_zoom(
	                        {x: range[0],
	                         y: f(range[0])}
	                      ));
	// Calculating shift correction
	this.shift = {
		x: gmap.fromLatLngToContainerPixel(this.lls[0]).x - this.relative_point.x,
		y: gmap.fromLatLngToContainerPixel(this.lls[0]).y - this.relative_point.y

	}
}

ApproxPolyline.prototype.transform_zoom = function(point){
	/* Zo_Om */
	point.x *= this.zoom;
	point.y *= this.zoom;
	return point;
}
ApproxPolyline.prototype.transform_turn = function(point){
	/* Turn */
	var cosa = Math.cos(this.angle);
	var sina = Math.sin(this.angle);
	var x = cosa*point.x + sina*point.y;
	var y = -sina*point.x + cosa*point.y;
	return {x: x, y:y};
}
ApproxPolyline.prototype.transform_shift = function(point){
	/* Parallel shift */
	point.x += this.shift.x;
	point.y += this.shift.y;
	return point;
}
ApproxPolyline.prototype.transform_to_geo = function(point){
	/* Convert point using zoom, turn, shift
	   one by one and transforming to geo coodrinates.
	   Returns GLatLng object */
	point = this.transform_shift(this.transform_turn(this.transform_zoom(point)));
	return this.gmap.fromContainerPixelToLatLng(new GPoint(point.x, point.y));
}
ApproxPolyline.prototype.get_turn_angle = function(){
	/*
		Returns an angle for turn transformation
	*/
	var xy0 = this.gmap.fromLatLngToContainerPixel(this.lls[0]);
	var xy1 = this.gmap.fromLatLngToContainerPixel(this.lls[1]);
	var cathetus0 = xy1.x - xy0.x;
	var cathetus1 = xy1.y - xy0.y;
	return Math.atan2(cathetus1, cathetus0);

}
ApproxPolyline.prototype.get_distance_in_pixels = function(ll1, ll2){
	/*
		Returns distanse between two GLatLng objects in pixels
		at current map zoom
	*/
	var p1 = this.gmap.fromLatLngToContainerPixel(ll1);
	var p2 = this.gmap.fromLatLngToContainerPixel(ll2);
	return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
ApproxPolyline.prototype.get_pivots = function(){
	/* Get pivot's ordinates for polynomial
	   For the first time - simple even distribution
	*/
	var step = (this.range[1]-this.range[0])/this.points;
	var pivots = [];
	for(var p=0;p<=this.points;p++){
		pivots.push(this.range[0] + step*p);
	}
	return pivots;
}
ApproxPolyline.prototype.get_map_lls = function(){
	/* Returns array of vertexes of resulting polyline
	   as GLatLng objects.
	   Abscissas calculated using equal distribution.
	*/
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
ApproxPolyline.prototype.get_polyline = function(){
	return new GPolyline(this.get_map_lls());
}
