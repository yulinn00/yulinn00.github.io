class Canvas2d {
    constructor(canvas, width, height, background = '#000000', scale = 1) {
	this.canvas = canvas;
	this.ctx = canvas.getContext('2d');
	this.width = width;
	this.height = height;
	this.background = background;
	this.scale = scale;
    }

    clear() {
	this.ctx.fillStyle = this.background;
	this.ctx.fillRect(0, 0, this.width / this.scale, this.height / this.scale);
    }

    lineRel(x1, y1, dx, dy) {
	this.line(x1, y1, x1 + dx, y1 + dy);
    }

    line(x1, y1, x2, y2) {
	const ctx = this.ctx;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	//ctx.closePath();
	ctx.stroke();
    }

    arc(x, y, r, from = 0, to = 2 * Math.PI, fill = false) {
	const ctx = this.ctx;
	ctx.beginPath();
	ctx.arc(x, y, r, from, to);
	if (fill)
	    ctx.fill();
	ctx.stroke();
    }

    posFromEvent(e) {
	const rect = this.canvas.getBoundingClientRect();
	const elementPageX = rect.left + window.scrollX;
	const elementPageY = rect.top + window.scrollY;
	
	
	return { x: e.pageX - elementPageX, y: e.pageY - elementPageY };
    }

    poly(pts) {
	const ctx = this.ctx;
	ctx.beginPath();
	ctx.moveTo(pts[0][0], pts[0][1]);
	for (var i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i][0], pts[i][1]);
	}
	ctx.closePath();
    }

    fillPoly() {
	this.poly(arguments);
	this.ctx.fill();
    }

    drawPoly() {
	this.poly(arguments);
	this.ctx.stroke();
    }

    drawTriangle(cx, cy, a, scale, color, edge_color) {
	a /= 2;
	const a1 = Math.PI * (a - 0.75);
	const a2 = Math.PI * (a - 0.25);
	const x1 = cx + scale * Math.cos(a1);
	const y1 = cy + scale * Math.sin(a1);
	const x2 = cx + scale * Math.cos(a2);
	const y2 = cy + scale * Math.sin(a2);
	this.ctx.fillStyle = color;
	this.fillPoly([cx, cy], [x1, y1], [x2, y2]); 
	if (edge_color != null) {
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = edge_color;
            this.line(x1, y1, x2, y2);
	}
    }

}

function randomChoice(ar) {
    return ar[Math.floor(Math.random() * ar.length)];
}

function randomSample(ar, k) {
    const ix = ar.map((x, i) => i)
    for (var i = 0; i < k; i++) {
	var r = Math.floor(Math.random() * (ix.length - i)) + i;
	var t = ix[r];
	ix[r] = ix[i];
	ix[i] = t;
    }
    return ix.slice(0,k).map((i) => ar[i]);
}

function dist(xy0, xy1) {
    return Math.sqrt((xy0.x - xy1.x) ** 2 + (xy0.y - xy1.y) ** 2);
}

function vertexCoords(center, num_vertices, radius) {
    var coords = [];
    for (var i = 0; i < num_vertices; i++) {
	coords.push({x:center.x + radius * Math.cos( Math.PI * 2 / num_vertices * i), y:center.y + radius * Math.sin( Math.PI * 2 / num_vertices * i)});
    }
    return coords;
}

function labelCoords(center, num_vertices, radius) {
    var coords = [];
    for (var i = 0; i < num_vertices; i++) {
	coords.push({x:center.x + radius * Math.cos( Math.PI * 2 / num_vertices * i) - 5, y:center.y + radius * Math.sin( Math.PI * 2 / num_vertices * i) + 7});
    }
    return coords;
}

const BOARD_COLOR = "#f0f0f0";

COLOR = { RED: 'red', BLUE: 'blue', NONE: ''};

const VERTEX_RADIUS = 12;
const POLYGON_RADIUS = 120;
const LABEL_RADIUS = 145;
const EDGE_WIDTH = 4;
const MOVING_WIDTH = 7;
const ACTIVE_WIDTH = 7;
const ACTIVE_COUNT = 10;
const WINNING_LOSING_WIDTH = 1;

class CompleteGraph {
    constructor(canvas, num_vertices, center, radius = POLYGON_RADIUS, vertex_radius = VERTEX_RADIUS, label_radius = LABEL_RADIUS) {
	this.cv = canvas;
	this.num_vertices = num_vertices;
	this.center = center;
	this.radius = radius;
	this.vertex_radius = vertex_radius;
	this.label_radius = label_radius;
	this.vertex_coords = vertexCoords(this.center, this.num_vertices, this.radius);
	this.label_coords = labelCoords(this.center, this.num_vertices, this.label_radius);

	this.edges = [];
	this.labelVertices = false;
    }

    addEdge(v0, v1, color = 'black') {
	const e = {vertices: [v0, v1], color: color};
	this.edges.push(e)
	return e;
    }

    render() {
	this.renderEdges();
	this.renderVertices();
    }

    renderEdges() {
	for (var e of this.edges) {
	    if (e.color == NONE)
		continue;
	    this.cv.ctx.lineWidth = 2;
	    this.cv.ctx.strokeStyle = e.color;
	    this.cv.line(this.vertex_coords[e.vertices[0]].x, this.vertex_coords[e.vertices[0]].y, this.vertex_coords[e.vertices[1]].x, this.vertex_coords[e.vertices[1]].y);
	}	    
    }

    renderEdge(e, dashed = false) {
	if (e.color == NONE)
	    return;
	if (dashed)
	    this.cv.ctx.setLineDash([10, 5]);
	this.cv.ctx.lineWidth = 2;
	this.cv.ctx.strokeStyle = e.color;
	this.cv.line(this.vertex_coords[e.vertices[0]].x, this.vertex_coords[e.vertices[0]].y, this.vertex_coords[e.vertices[1]].x, this.vertex_coords[e.vertices[1]].y);
    }

    renderVertices(color = 'black') {
	this.cv.ctx.strokeStyle = 'black';
	this.cv.ctx.fillStyle = color;
	this.cv.ctx.lineWidth = '2';
	for (var xy of this.vertex_coords) {
	    this.cv.arc(xy.x, xy.y, this.vertex_radius, 0, 2 * Math.PI, true);
	}
	if (!this.labelVertices)
	    return;
	var i = 0;
	for (var xy of this.label_coords) {
	    this.cv.ctx.fillStyle = 'black';
	    this.cv.ctx.font = "16px Times";
	    this.cv.ctx.fillText(`${i}`, xy.x, xy.y);
	    i++;
	}
    }

    renderVertex(v, color = 'black') {
	this.cv.ctx.strokeStyle = 'black';
	this.cv.ctx.fillStyle = color;
	this.cv.ctx.lineWidth = '2';
	this.cv.arc(this.vertex_coords[v].x, this.vertex_coords[v].y, this.vertex_radius, 0, 2 * Math.PI, true);

	if (!this.labelVertices)
	    return;
	this.cv.ctx.fillStyle = 'black';
	this.cv.ctx.font = "16px Times";
	this.cv.ctx.fillText(`${v}`, this.label_coords[v].x, this.label_coords[v].y);
    }
}
