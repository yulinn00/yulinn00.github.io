const width = 4;
const height = 4;


var w = 120;
var h = 160;
var innerSep = 1;
var outerSep = 10
var lineWidth = 3;

var innerCellWidth = w + innerSep;
var innerCellHeight = h + innerSep;

var borderLeft = outerSep / 2;
var borderTop = outerSep / 2;
var borderWidth = 3 * outerSep / 2 + w;
var borderHeight = 3 * outerSep / 2 + h;

//top left tile is row 1 col 1
var boardLeft = borderWidth;
var boardTop = borderHeight;
var boardRight = boardLeft + innerCellWidth * width - innerSep;
var boardBottom = boardTop + innerCellHeight * height - innerSep;

var borderRightStart = boardRight + outerSep;
var borderBottomStart = boardBottom + outerSep;

var canvasWidth = 3 * outerSep + (width + 2) * (w + innerSep) - innerSep;
var canvasHeight = 3 * outerSep + (height + 2) * (h + innerSep) - innerSep;

var endpointCoords = [
    [0, -h / 2],
    [w / 2, -h / 2],
    [w / 2, 0],
    [w / 2, h / 2],
    [0, h / 2],
    [-w / 2, h / 2],
    [-w / 2, 0],
    [-w / 2, -h / 2]];

function resize(newW, newH, newInnerSep, newOutSep, newLineWidth) {
    w = newW;
    h = newH;
    innerSep = newInnerSep;
    outerSep = newOutSep;
    lineWidth = newLineWidth;

    innerCellWidth = w + innerSep;
    innerCellHeight = h + innerSep;

    borderLeft = outerSep / 2;
    borderTop = outerSep / 2;
    borderWidth = 3 * outerSep / 2 + w;
    borderHeight = 3 * outerSep / 2 + h;

    boardLeft = borderWidth;
    boardTop = borderHeight;
    boardRight = boardLeft + innerCellWidth * width - innerSep;
    boardBottom = boardTop + innerCellHeight * height - innerSep;

    borderRightStart = boardRight + outerSep;
    borderBottomStart = boardBottom + outerSep;

    canvasWidth = 3 * outerSep + (width + 2) * (w + innerSep) - innerSep;
    canvasHeight = 3 * outerSep + (height + 2) * (h + innerSep) - innerSep;

    endpointCoords = [
	[0, -h / 2],
	[w / 2, -h / 2],
	[w / 2, 0],
	[w / 2, h / 2],
	[0, h / 2],
	[-w / 2, h / 2],
	[-w / 2, 0],
	[-w / 2, -h / 2]];

}


var lineColor = 'black';
var tileColor = "#f0f0a0";
var boardColor = 'white'
var frameColor = '#804040'
var canvasColor = 'white';
const polygonColors = [
    'Magenta',
    'Turquoise',
    'Teal',
    'DarkRed',
    'SlateBlue'
];
const pathColors = [
    'Gold',
    'LimeGreen',
    'Red',
    'SlateBlue',
    'DarkRed',
    'Teal',
    'Turquoise',
    'Magenta'
];

function recolor(newLineColor, newTileColor, newBoardColor, newFrameColor, newCanvasColor) {
    lineColor = newLineColor;
    tileColor = newTileColor;
    boardColor = newBoardColor;
    frameColor = newFrameColor;
    canvasColor = newCanvasColor;
}


var cv = null;
var moving = null;
var rotating = null;
const moveHistory = [];
var onInFrameOnlyChangedHandler = null;
var highlightRectigons =true;
var highlightPaths =true;
pathTiles = [];
pathLength = 0;
startCp = [4, 3, 0]

//
//   7-0-1
//   |   |
//   6   2
//   |   |
//   5-4-3
//
const spokeLength = [ 4, 5, 3, 5, 4, 5, 3, 5];
class Tile {
    constructor(line1_at, line2_at, r, c) {
	this.lines_at = [line1_at, line2_at];
	this.line_color = lineColor;
	this.r = r;
	this.c = c;
	this.spokeLength = spokeLength[line1_at] + spokeLength[line2_at];
    }
    rotate() {
	this.lines_at[0] = (this.lines_at[0] + 4) % 8;
	this.lines_at[1] = (this.lines_at[1] + 4) % 8;
    }
}

const endpoints = [
    [0, 1],
    [0, 7],
    [1, 2],
    [2, 3],
    [0, 2],
    [0, 6],
    [1, 3],
    [1, 7],
    [0, 3],
    [0, 5],
    [2, 5],
    [2, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7]];

function makeTiles() {
    const tiles = [];
    endpoints.forEach((ep, i) => {
	tiles.push(new Tile(ep[0], ep[1], Math.floor(i / width) + 1, i % width + 1));
    });
    return tiles;
}

function drawTile(cv, tile, at = null, angle = 0, border = 0) {
    var atx, aty;
    [atx, aty] = at === null ? centerCoords(tile.r, tile.c) : at;
    cv.ctx.fillStyle = tileColor;
    vertices = [];
    for (var i of [1,3,5,7]) {
	if (angle == 0)
	    vertices.push([atx + endpointCoords[i][0], aty + endpointCoords[i][1]]);
	else {
	    const a = angle * Math.PI / 2 * angle
	    var ep = [endpointCoords[i][0] * Math.cos(a) - endpointCoords[i][1] * Math.sin(a),
		      endpointCoords[i][0] * Math.sin(a) + endpointCoords[i][1] * Math.cos(a)];
	    vertices.push([atx + ep[0], aty + ep[1]]);
	}
    }
    cv.ctx.strokeStyle = 'black'
    cv.ctx.lineWidth = 0.5;
    cv.fillPoly(...vertices);
    cv.ctx.strokeStyle = tile.line_color;
    cv.ctx.lineWidth = lineWidth;
    for (var i = 0; i < tile.lines_at.length; i++) {
	if (angle == 0)
	    cv.line(atx, aty, atx + endpointCoords[tile.lines_at[i]][0], aty + endpointCoords[tile.lines_at[i]][1])
	else {
	    const a = angle * Math.PI / 2 * angle
	    var ep = [endpointCoords[tile.lines_at[i]][0] * Math.cos(a) - endpointCoords[tile.lines_at[i]][1] * Math.sin(a),
		      endpointCoords[tile.lines_at[i]][0] * Math.sin(a) + endpointCoords[tile.lines_at[i]][1] * Math.cos(a)];
	    cv.line(atx, aty, atx + ep[0], aty + ep[1]);
	}
    }
    if (border != 0) {
	cv.ctx.strokeStyle = 'black';
	cv.ctx.lineWidth = border;
	cv.poly(vertices);
    }
}


function centerCoords(row, col) {
    if (1 <= row && row <= height && 1<= col && col <= width)
	return [3 * outerSep / 2 + (w + innerSep) * (col + 0.5) - 1.5 * innerSep, 3 * outerSep / 2 + (h + innerSep) * (row + 0.5) - 1.5 * innerSep];
    const x_offset = col == 0 ? -outerSep : (col > width ? outerSep : 0);
    const y_offset = row == 0 ? -outerSep : (row > height ? outerSep : 0);
    return [x_offset + 3 * outerSep / 2 + (w + innerSep) * (col + 0.5) - 1.5 * innerSep, y_offset + 3 * outerSep / 2 + (h + innerSep) * (row + 0.5) - 1.5 * innerSep];
}

function pointToRowCol(p) {
    var c = -1;
    var r = -1;
    if (borderLeft <= p.x && p.x < borderLeft + w)
	c = 0;
    else if (boardLeft <= p.x && p.x < boardRight) {
	c = Math.floor((p.x - boardLeft) / innerCellWidth);
	if (p.x -boardLeft - c * innerCellWidth < innerCellWidth)
	    c += 1; // cells start at 1
	else
	    c = -1; // outside cell
	
    }
    else if (borderRightStart <= p.x && p.x < borderRightStart + w)
	c = width + 1;

    if (borderTop <= p.y && p.y < borderTop + h)
	r = 0;
    else if (boardTop <= p.y && p.y < boardBottom) {
	r = Math.floor((p.y - boardTop) / innerCellHeight);
	if (p.y - boardTop - r * innerCellHeight < innerCellHeight)
	    r += 1; // cells start at 1
	else
	    r = -1; // outside cell
	
    }
    else if (borderBottomStart <= p.y && p.y < borderBottomStart + h)
	r = height + 1;

    return [r,c];
}
	  
function drawBoard(cv) {
    cv.clear();
    cv.ctx.fillStyle = frameColor;
    cv.ctx.strokeStyle = 'black'
    cv.ctx.lineWidth = 0.5;
    cv.fillPoly(
	[centerCoords(0, 0)[0] + endpointCoords[3][0], centerCoords(0,0)[1] + endpointCoords[3][1]],
	[centerCoords(0, width + 1)[0] + endpointCoords[5][0], centerCoords(0, width + 1)[1] + endpointCoords[5][1]],
	[centerCoords(height + 1, width + 1)[0] + endpointCoords[7][0], centerCoords(height + 1, width + 1)[1] + endpointCoords[7][1]],
	[centerCoords(height + 1, 0)[0] + endpointCoords[1][0], centerCoords(height + 1, 0)[1] + endpointCoords[1][1]]);
    cv.ctx.fillStyle = boardColor;
    cv.fillPoly(
	[centerCoords(1, 1)[0] + endpointCoords[7][0], centerCoords(1,1)[1] + endpointCoords[7][1]],
	[centerCoords(1, width)[0] + endpointCoords[1][0], centerCoords(1, width)[1] + endpointCoords[1][1]],
	[centerCoords(height, width)[0] + endpointCoords[3][0], centerCoords(height, width)[1] + endpointCoords[3][1]],
	[centerCoords(height, 1)[0] + endpointCoords[5][0], centerCoords(height, 1)[1] + endpointCoords[5][1]]);
    if (moving !== null) {
	for (var t of cv.tiles) {
	    if (t != moving.tile)
		drawTile(cv, t);
	}
	const at = centerCoords(moving.tile.r, moving.tile.c);
	drawTile(cv, moving.tile, [at[0] + moving.dx, at[1] + moving.dy], 0, 1);
    }
    else if (rotating !== null) {
	for (var t of cv.tiles) {
	    if (t != rotating.tile)
		drawTile(cv, t);
	}
	drawTile(cv, rotating.tile, null, rotating.angle);
    } else {
	for (var t of cv.tiles) {
	    drawTile(cv, t);
	}
    }
    cv.colorPolygons();
    cv.colorPaths();
}



class Canvas2d {
    static canvasList = [];

    constructor(canvas, tiles, width, height, background = '#000000', scale = 1) {
	this.canvas = canvas;
	this.setTiles(tiles)
	this.canvas.width = width;
	this.canvas.height = height;
	this.ctx = canvas.getContext('2d');
	this.width = width;
	this.height = height;
	this.background = background;
	this.scale = scale;
	Canvas2d.canvasList.push(this);
	this.polygons = [];
	this.paths = [];
    }

    clear() {
	this.ctx.fillStyle = this.background;
	this.ctx.fillRect(0, 0, this.width / this.scale, this.height / this.scale);
    }

    remove() {
	for (var i = 0; i < this.canvasList.length; i++) {
	    if (Canvas2d.canvasList[i] == this) {
		Canvas2d.canvasList.splice(i,1);
		return;
	    }
	}
		
    }

    static
    fromCanvas(canvas) {
	for (var cv of Canvas2d.canvasList) {
	    if (cv.canvas == canvas)
		return cv;
	}
	return null;
    }

    setTiles(tiles) {
	this.tiles = tiles;
	tiles.forEach((t) => {t.cv = this;});
	this.updatePolygons();
	this.updatePaths();
    }

    tileAt(r, c) {
	for (var t of this.tiles) {
	    if (t.r == r && t.c == c)
		return t;
	}
	return null;
    }
    
    fromStringCode(code) {
	const tiles = this.tiles;
	var i = 0;
	var unused_r, unused_c;

	tiles.forEach((t) => { t.r = -1; t.c = -1});
	const extended = code.length == width * height ? false : true;
	for (var r = extended ? 0 : 1; r < (extended ? 2 : 1) + height; r++) {
	    for (var c = extended ? 0 : 1; c < (extended ? 2 : 1) + width; c++) {
		if (code.charAt(i) == 'z') {
		    i += 1;
		    continue;
		}
		const n = code.charCodeAt(i);
		i += 1;
		var rotate = n > 0x60;
		const ep = rotate ? endpoints[n - 0x61] : endpoints[n - 0x41];
		const t = tiles.filter((t) => (t.lines_at[0] == ep[0] && t.lines_at[1] == ep[1]) ||
				       (t.lines_at[0] == (ep[0] + 4) % 8 && t.lines_at[1] == (ep[1] + 4) % 8))[0];
		t.r = r;
		t.c = c;
		if ((rotate && t.lines_at[0] != (ep[0] + 4) % 8) || (!rotate && t.lines_at[0] != ep[0]))
		    t.rotate();
	    }
	}
	var emptyRow = height + 1;
	var emptyCol = 0;
	while (tiles.filter((t) => t.r == -1 || t.c == -1).length > 0) {
	    while (tiles.filter((t) => t.r == emptyRow && t.c == emptyCol).length > 0) {
		if (emptyRow == 0 || emptyRow == height + 1)
		    emptyCol += 1;
		else
		    emptyCol += width + 1;
		if (emptyCol > width +1) {
		    emptyRow -= 1;
		    emptyCol = 0;
		}
	    }
	    const t = tiles.filter((t) => t.r == -1 || t.c == -1)[0];
	    t.r = emptyRow;
	    t.c = emptyCol;
	}
	this.updatePolygons();
	this.updatePaths();
	drawBoard(this);
    }

    static endpointMap = [ 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W' ,'NW'];

    toGraphFormat() {
	const newTiles = [];
	for (var t of this.tiles) {
	    if (t.r == 0 || t.r > height) continue;
	    if (t.c == 0 || t.c > width) continue;
	    var r, c;
	    [r,c] = [height - t.r, t.c - 1];
	    const newT = {col: c, row: r, ends: [Canvas2d.endpointMap[t.lines_at[0]], Canvas2d.endpointMap[t.lines_at[1]]]};
	    newTiles.push(newT);
	}
	return newTiles;
    }

    cp_coords_list() {
	var coords = [];
	for (var r = 0; r <= height; r++ ) {
	    for (var c = 0; c <= width; c++) {
		coords.push([c * innerCellWidth, r * innerCellheight]);
		if (c < width)
		    coords.push([c * innerCellWidth + innerCellWidth / 2, r * innerCellheight]);
		if (r < height)
		    coords.push([c * innerCellWidth, r * innerCellheight + innerCellheight / 2]);
	    }
	}
	return coords;
    }

    isAdjacentAt(r1, c1, s1, r2, c2) {
	if (r1 == r2) {
	    if (c1 == c2)
		return s1;
	    if (c1 == c2 + 1) {
		return s1 == 7 ? 1 : (s1 == 6 ? 2 : ( s1 == 5 ? 3 : -1));
	    }
	    if (c2 == c1 + 1) {
		return s1 == 1 ? 7 : (s1 == 2 ? 6 : ( s1 == 3 ? 5 : -1));
	    }
	    return -1;
	} else if (c1 == c2) {
	    if (r1 == r2 + 1) {
		return s1 == 7 ? 5 : (s1 == 0 ? 4 : ( s1 == 1 ? 3 : -1));
	    }
	    if (r2 == r1 + 1) {
		return s1 == 5 ? 7 : (s1 == 4 ? 0 : ( s1 == 3 ? 1 : -1));
	    }
	    return -1;
	}
	if (Math.abs(r1 - r2) != 1 || Math.abs(c1 - c2) != 1)
	    return -1;
	if (r2 > r1)
	    return c2 > c1 ?  (s1 == 3 ? 7 : -1) : (s1 == 5 ? 1 : -1);
	else
	    return c2 > c1 ?  (s1 == 1 ? 5 : -1) : ( s1 == 7 ? 3 : -1);
	
    }
    
    areAdjacentConnectionPoints( r1, c1, s1, r2, c2, s2) {
	return s2 == this.isAdjacentAt(r1, c1, s1, r2, c2);
    }

    boardCoordsAtCp(r0, c0, s0) {
	const adjacent = [];
	for (var r = Math.max(1, r0 - 1); r<= Math.min(height, r0 + 1); r++) {
	    for (var c = Math.max(1, c0 - 1); c <= Math.min(width, c0 + 1); c++) {
		const s = this.isAdjacentAt(r0, c0, s0, r, c);
		if (s != -1)
		    adjacent.push([r, c, s]);
	    }
	}
	return adjacent;
    }
    
    pathTileAt(cp, first = false) {
	const adjacentList = this.boardCoordsAtCp(...cp);
	var tile;
	var tileCount = 0;
	for (var coords of adjacentList) {
	    const t = this.tileAt(coords[0], coords[1]);
	    if (t == null)
		continue;
	    if (!first && t.r == cp[0] && t.c == cp[1])
		continue;
	    if (t.lines_at.some((s) => this.areAdjacentConnectionPoints(t.r, t.c, s, ...cp))) {
		tileCount += 1;
		if (tileCount == 1) {
		    tile = t;
		}
	    }
	}
	if (tileCount == 1) {
	    const spoke = this.isAdjacentAt(cp[0], cp[1], cp[2], tile.r, tile.c);
	    var nextSpoke = spoke == tile.lines_at[0] ? tile.lines_at[1] : tile.lines_at[0];
	    const nextCp = [tile.r, tile.c, nextSpoke];
	    return nextCp;
	}
	return null;
    }


    graphToCanvas(coords) {
	var c = boardLeft + coords[0] * innerCellWidth;
	var r = boardTop + (height - coords[1]) * innerCellHeight;
	return [c,r];
    }

    colorPaths() {
	if (document.getElementById("paths") == null)
	    return;

	var n = 1;
	if (highlightPaths) {
	    for (var cpPath of this.paths) {
		const startCp = cpPath.cp;
		const pathTiles = cpPath.path;
		var xy = centerCoords(startCp[0], startCp[1]);
		this.ctx.lineWidth = 0;
		this.ctx.strokeStyle = cpPath.color; 
		this.ctx.fillStyle = cpPath.color; 
		this.arc(xy[0] + endpointCoords[startCp[2]][0], xy[1] + endpointCoords[startCp[2]][1], 8, 0, 2 * Math.PI,true);
		this.ctx.lineWidth = 3;
		var atx = 0;
		var aty = 0;
		for (var tile of pathTiles) {
		    [atx, aty] = centerCoords(tile.r, tile.c);
		    for (var i = 0; i < tile.lines_at.length; i++) {
			cv.line(atx, aty, atx + endpointCoords[tile.lines_at[i]][0], aty + endpointCoords[tile.lines_at[i]][1])
		    }
		}
	    }

	    for (var data of this.paths) {
		const swatch = document.getElementById("pathswatch" + n);
		swatch.style.visibility = "visible";
		swatch.style.backgroundColor = data.color;
		document.getElementById("edges" + n).innerHTML = `${this.computePathEdges(data)}`;
		document.getElementById("pathtiles" + n).innerHTML = `${data.path.length}`;
		document.getElementById("length" + n).innerHTML = `${Math.sumPrecise(data.path.map((t) => t.spokeLength / 2))}`;
		n += 1;
	    }
	}
	while (n <= 8) {
	    document.getElementById("pathswatch" + n).style.visibility = "hidden";
	    document.getElementById("edges" + n).innerHTML = '';
	    document.getElementById("pathtiles" + n).innerHTML = '';
	    document.getElementById("length" + n).innerHTML = '';
	    n += 1;
	}

    }

    computePathEdges(path) {
	var edges = 0;
	var cp = path.cp[2];
	var tile = this.tileAt(path.cp[0], path.cp[1])
	if (tile != path.path[0]) {
	    cp = this.isAdjacentAt(path.cp[0], path.cp[1], path.cp[2], path.path[0].r, path.path[0].c);
	}
	
	var lastTile = null;
	var lastCp = -1;
	for (var tile of path.path) {
	    if (lastTile == null) {
		edges = Math.abs(tile.lines_at[0] - tile.lines_at[1]) == 4 ? 1 : 2;
		lastTile = tile;
		lastCp = cp == tile.lines_at[0] ? tile.lines_at[1] : tile.lines_at[0];
		continue;
	    }
	    const c2 = this.isAdjacentAt(lastTile.r, lastTile.c, lastCp, tile.r, tile.c);

	    if (Math.abs(lastCp - c2) != 4) {
		edges += 1;
	    }
	    edges += Math.abs(tile.lines_at[0] - tile.lines_at[1]) == 4 ? 0 : 1;
	    lastTile = tile;
	    lastCp = c2 == tile.lines_at[0] ? tile.lines_at[1] : tile.lines_at[0];
	}
	return edges;
    }

    findPath(startCp) {
	if (this.paths.some((p) => this.areAdjacentConnectionPoints(p.cp[0], p.cp[1], p.cp[2], ...startCp)))
	    return null;
	const pathTiles = [];
	var lastCp = null;
	for (var nextCp = this.pathTileAt(startCp, true); nextCp != null; nextCp = this.pathTileAt(nextCp)) {
	    const tile = this.tileAt(nextCp[0], nextCp[1]);
	    console. assert(!pathTiles.includes(tile))
	    if (pathTiles.includes(tile))
		break;
	    pathTiles.push(tile);
	    lastCp = nextCp;
	}
	if (lastCp != null && this.paths.some((p) => this.areAdjacentConnectionPoints(p.cp[0], p.cp[1], p.cp[2], ...lastCp)))
	    return null;
	
	return  pathTiles.length > 1 ? pathTiles : null;
    }

    updatePaths() {
	var path;
	this.paths = [];
	var n = 0;
	for (var r = 1; r <= height; r++) {
	    for (var c = 1; c <= width; c++) {
		if (r == 1) {
		    for (var s of [7, 0, 1]) {
			path = this.findPath([r, c, s]);
			if (path != null) {
			    this.paths.push({cp: [r, c, s], path: path, color: pathColors[n]});
			    n += 1;
			}
		    }
		}
		if (c == 1) {
		    if (r != 1) {
			path = this.findPath([r, c, 7]);
			if (path != null) {
			    this.paths.push({cp: [r, c, 7], path: path, color: pathColors[n]});
			    n += 1;
			}
		    }
		    for (var s of [6, 5]) {
			path = this.findPath([r, c, s]);
			if (path != null) {
			    this.paths.push({cp: [r, c, s], path: path, color: pathColors[n]});
			    n += 1;
			}
		    }
		}
		for (var s of [2, 3, 4]) {
		    path = this.findPath([r, c, s]);
		    if (path != null) {
			this.paths.push({cp: [r, c, s], path: path, color: pathColors[n]});
			n += 1;
		    }
		}
	    }
	}
    }

    colorPolygons() {
	if (document.getElementById("rectigons") == null)
	    return;

	var n = 1;
	if (highlightRectigons) {
	    for (var p of this.polygons) {
		const data = this.polygonData[n - 1];
		var points = p.map((graphCoord) => this.graphToCanvas(graphCoord));
		cv.ctx.strokeStyle = data.color;
		cv.ctx.lineWidth = 6;
		cv.poly(points);

		const swatch = document.getElementById("swatch" + n);
		swatch.style.visibility = "visible";
		swatch.style.backgroundColor = data.color;
		document.getElementById("sides" + n).innerHTML = `${data.sides}`;
		document.getElementById("tiles" + n).innerHTML = `${data.tiles}`;
		document.getElementById("perim" + n).innerHTML = `${data.perim}`;
		document.getElementById("area" + n).innerHTML = `${data.area}`;
		n += 1;
	    }
	}
	while (n <= 5) {
	    document.getElementById("swatch" + n).style.visibility = "hidden";
	    document.getElementById("sides" + n).innerHTML = '';
	    document.getElementById("tiles" + n).innerHTML = '';
	    document.getElementById("perim" + n).innerHTML = '';
	    document.getElementById("area" + n).innerHTML = '';
	    n += 1;
	}
    }

    updatePolygons() {
	const tiles = this.toGraphFormat();
	this.polygons = findPolygons(tiles);
	this.polygonData = [];
	var c = 0;
	for (var poly of this.polygons) {
	    const polyData = {sides: poly.length};
	    var perim = 0;
	    var tileCount = 0;
	    poly.forEach((coords,v) => {
		const x = coords[0];
		const y = coords[1];
		const xNext = poly[(v + 1) % poly.length][0];
		const yNext = poly[(v + 1) % poly.length][1];
		if (x == xNext) {
		    perim += Math.abs(y - yNext) * spokeLength[0];
		    tileCount += Math.abs(y - yNext) > 1 ? 2 : 1;
		} else if (y == yNext) {
		    perim += Math.abs(x - xNext) * spokeLength[2];
		    tileCount += Math.abs(x - xNext) > 1 ? 2 : 1;
		} else {
		    // diagonal edge
		    perim += Math.abs(x - xNext) * spokeLength[1];
		    if (!Number.isInteger(x) && !Number.isInteger(y)) {
			tileCount +=1;
		    } else if (Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(xNext) && Number.isInteger(yNext)) {
			tileCount += 1;
		    }
		}
	    });
	    polyData.perim = perim;
	    polyData.area = polygonArea(poly) * 12;
	    polyData.tiles = tileCount;
	    polyData.color = polygonColors[c];
	    c++;
	    this.polygonData.push(polyData);
	}
	this.path = longestPath(tiles);
    }

    lineRel(x1, y1, dx, dy) {
	this.line(x1, y1, x1 + dx, y1 + dy);
    }

    line(x1, y1, x2, y2) {
	const ctx = this.ctx;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.closePath();
	ctx.stroke();
    }

    arc(x, y, r, from = 0, to = 2 * Math.PI, fill = false) {
	const ctx = this.ctx;
	ctx.beginPath();
	ctx.arc(x, y, r, from, to, false);
	ctx.closePath();
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
	ctx.stroke();
    }

    fillPoly() {
	this.poly(arguments);
	this.ctx.fill();
    }

    drawPoly() {
	this.poly(arguments);
	this.ctx.stroke();
    }

    inTile(pos) {
	var r, c;
	[r,c] = pointToRowCol(pos);
	if (r < 0 || c < 0)
	    return [null, null];
	for (var t of this.tiles) {
	    if (t.r == r && t.c == c) {
		return [t, [r,c]];
	    }
	}
	return [null, [r, c]];
    }
}



function shutdownHandlers(cv) {
    canvas = cv.canvas;

    canvas.removeEventListener('pointerdown', onPointerDown, {passive: false});
    canvas.removeEventListener('touchdown', touchHandler, {passive: false});

    canvas.removeEventListener('pointerup', onPointerUp, {passive: false});

    canvas.removeEventListener('pointermove', onPointerMove, {passive: false});
    canvas.removeEventListener('touchmove', touchHandler, {passive: false});

    canvas.removeEventListener('pointerleave', onPointerLeave, {passive: false});
    canvas.removeEventListener('touchleave', touchHandler, {passive: false});

    document.removeEventListener("keydown", onKeydown);

    inFrameOnlyCheckbox = document.getElementById("inframeonly");
    if (inFrameOnlyCheckbox != null)
	inFrameOnlyCheckbox.removeEventListener("change", onInFrameOnlyChanged);
}

function initializeHandlers(cv) {
    canvas = cv.canvas;

    canvas.addEventListener('pointerdown', onPointerDown, {passive: false});
    canvas.addEventListener('touchdown', touchHandler, {passive: false});

    canvas.addEventListener('pointerup', onPointerUp, {passive: false});

    canvas.addEventListener('pointermove', onPointerMove, {passive: false});
    canvas.addEventListener('touchmove', touchHandler, {passive: false});

    canvas.addEventListener('pointerleave', onPointerLeave, {passive: false});
    canvas.addEventListener('touchleave', touchHandler, {passive: false});

    document.addEventListener("keydown", onKeydown);

    inFrameOnlyCheckbox = document.getElementById("inframeonly");
    if (inFrameOnlyCheckbox != null) {
	inFrameOnlyCheckbox.addEventListener("change", onInFrameOnlyChanged);
    }
}

function update(cv) {
    updateTilingCode(cv);
    cv.updatePolygons();
    cv.updatePaths();
}
    
function rotateTile(tile, no_hist = false) {
    tile.rotate();
    if (!no_hist)
	moveHistory.push({type: 'rot', tile: tile});
    update(tile.cv);
}

function swapTile( tile, swapTile, no_hist = false) {
    var r = tile.r;
    var c = tile.c;
    tile.r = swapTile.r;
    tile.c = swapTile.c;
    swapTile.r = r;
    swapTile.c = c;

    if (!no_hist)
	moveHistory.push({type: 'swap', tile: tile, swap: swapTile});
    update(tile.cv);
}

function moveTile( tile, rc, no_hist = false) {
    if (!no_hist)
	moveHistory.push({type: 'move', tile: tile, from: [tile.r, tile.c]});
    tile.r = rc[0];
    tile.c = rc[1];
    update(tile.cv);
}

function undo() {
    if (moveHistory.length < 1)
	return;
    move = moveHistory.pop();
    switch (move.type) {
    case 'swap':
	swapTile(move.tile, move.swap, true);
	break;
    case 'move':
	moveTile(move.tile, move.from, true);
	break;
    case 'rot':
	rotateTile(move.tile, true);
	break;
    }
    drawBoard(move.tile.cv);
}

function load() {
    var code = prompt("Enter code");

    while (code != null && !isValidStringCode(code)) {
	code = prompt(`${code} is not valid. Enter a valid code`);
    }
    if (code == null)
	return;
    cv.fromStringCode(code);
    drawBoard(cv);
    updateTilingCode(cv);
}

function onInFrameOnlyChanged(event) {
    updateTilingCode(cv);
}

function calculateTilingCode(cv) {
    const inFrameOnlyCheckbox = document.getElementById("inframeonly");
    return toStringCode(cv.tiles, inFrameOnlyCheckbox != null ? inFrameOnlyCheckbox.checked : !cv.tiles.every((t) => 0 < t.r && t.r <= width  && 0 < t.c && t.c <=height));
}

function updateTilingCode(cv) {
    const text = document.getElementById("tilingcode");
    if (text != null)
	text.innerHTML = calculateTilingCode(cv);
}

function onPointerDown(event) {
    event.preventDefault();
    const cv = Canvas2d.fromCanvas(event.target);
    var pos = cv.posFromEvent(event);
    const [tile, rc] = cv.inTile(pos);
    if (tile == null || rc == null || rotating !== null) {
	cv.canvas.style.cursor = "default";
        return;
    }
    cv.canvas.style.cursor = "pointer";
    pos.tile = tile;
    pos.rc = rc;
    pos.ts = new Date().getTime();
    pos.dx = 0;
    pos.dy = 0;
    pos.moved = false;
    moving = pos;
}

function onPointerUp(event) {
    event.preventDefault(); 
    if (moving === null || rotating !== null) {
	return;
    }
    const cv = Canvas2d.fromCanvas(event.target);
    const pos = cv.posFromEvent(event);
    const [tile, rc] = cv.inTile(pos);
    cv.canvas.style.cursor = tile === null ? "default" : "pointer";
    if ( rc === null) {
	cv.canvas.style.cursor = "default";
    } else if (!moving.moved) {
	const t = new Date().getTime();
        if (t - moving.ts < 300) {
	    rotating = {tile: tile, cv: cv, angle: 0, timer: setInterval(animateRotate, 50)};
	    moving = null;
	    return;
        }
    } else if ( tile !== null) {
	swapTile(moving.tile, tile);
	cv.canvas.style.cursor = "pointer";
    } else if (moving.tile != null) {
	moveTile(moving.tile, rc);
	cv.canvas.style.cursor = "pointer";
    }
    moving = null;
    drawBoard(cv);
}

function onPointerMove(event) {
    event.preventDefault(); 
    const cv = Canvas2d.fromCanvas(event.target);
    const pos = cv.posFromEvent(event);
    const [tile, rc] = cv.inTile(pos);
    if (tile == null || rc == null) 
	cv.canvas.style.cursor = "default";
    else
	cv.canvas.style.cursor = "pointer";
    if (moving === null) {
	return;
    }

    moving.dx = pos.x - moving.x;
    moving.dy = pos.y - moving.y;
    moving.moved = moving.dx != 0 || moving.dy != 0;
    if (moving.moved)
	drawBoard(cv);
}

function onPointerLeave(event) {
    event.preventDefault(); 
    const cv = Canvas2d.fromCanvas(event.target);
    if (moving === null) {
        return;
    }
    cv.canvas.style.cursor = "default";
    moving = null;
    drawBoard(cv);
}

function touchHandler(e) {
    e.preventDefault();
}

function onKeydown(event) {
    if (event.key == 'z' && (event.ctrlKey || event.metaKey) && document.getElementById("undo") !== null) {
	event.preventDefault();
	undo();
	return;
    }
}

function onInFrameOnlyChanged(event) {
    updateTilingCode(cv);
}

function showRectigons() {
    highlightRectigons = !highlightRectigons;
    document.getElementById("showrectigons").value = highlightRectigons ? "Hide" : "Show";
    drawBoard(cv);
}

function showPaths() {
    highlightPaths = !highlightPaths;
    document.getElementById("showpaths").value = highlightPaths ? "Hide" : "Show";
    drawBoard(cv);
}

function animateRotate() {
    if (rotating === null) {
        return;
    }
    const cv = rotating.cv;
    rotating.angle += 0.2;
    if (rotating.angle <= -0.9999 || rotating.angle >= 0.9999) {
        rotateTile(rotating.tile);
	clearInterval(rotating.timer);
        rotating = null;
    }
    drawBoard(cv);
}


function toStringCode(tiles, inFrameOnly = true) {
    code = '';
    if (!inFrameOnly)
	inFrameOnly = tiles.every((t) => 0 < t.r && t.r <= height && 0 < t.c && t.c <= width);
    for (var r = inFrameOnly ? 1 : 0; r < (inFrameOnly ? 1 : 2) + height; r++) {
	for (var c = inFrameOnly ? 1 : 0; c < (inFrameOnly ? 1 : 2) + width; c++) {
	    var t = tiles.filter((t) => t.r == r && t.c == c);
	    if (t.length == 0) {
		code += 'z';
		continue;
	    }
	    t = t[0]
	    for (var i = 0; i < endpoints.length; i++) {
		if (endpoints[i][0] == t.lines_at[0] && endpoints[i][1] == t.lines_at[1]) {
		    code += String.fromCharCode(0x41 + i);
		    break;
		}
		if ((endpoints[i][0] + 4) % 8 == t.lines_at[0] && (endpoints[i][1] + 4) % 8 == t.lines_at[1]) {
		    code += String.fromCharCode(0x61 + i);
		    break;
		}
	    }
	}
    }
    return code;
}

function isValidStringCode(code) {
    if (![width * height, (width + 2) * (height + 2)].includes(code.length))
	return false;
    const tiles = { };
    const letters = "abcdefghijklmnop";
    for ( var c of letters) {
	tiles[c] = 0;
    }
    for (var c of code) {
	if (c == 'z')
	    continue;
	const lower = c.toLowerCase();
	if (!letters.includes(lower))
	    return false;
	if (tiles[lower] != 0)
	    return false;
	tiles[lower] += 1;
    }
    return true;
}

function run(canvasId, tilingCode = null, includeHandlers = true, sizes = [75, 100, 1, 6, 3], colors = ['black', 'lightyellow', 'white', 'blue', 'silver']) {
    resize(...sizes);
    recolor(...colors);

    cv = new Canvas2d(document.getElementById(canvasId), makeTiles(), canvasWidth, canvasHeight, canvasColor);
    
    if (tilingCode === null)
	tilingCode = tilingFromQueryString();
    if (tilingCode != null && isValidStringCode(tilingCode)) {
	cv.fromStringCode(tilingCode);
	inFrameOnlyCheckbox = document.getElementById("inframeonly");
	if (inFrameOnlyCheckbox != null) {
	    inFrameOnlyCheckbox.checked = tilingCode.length == width * height;
	}
    } else {
	cv.updatePolygons();
	cv.updatePaths();
	drawBoard(cv);
    }
    updateTilingCode(cv);
    if (includeHandlers) {
	initializeHandlers(cv);
    }
}

function quit() {
    shutdownHandlers(cv);
}

function onCopy() {
    navigator.clipboard.writeText(calculateTilingCode(cv))
	.then()
	.catch(err => {
	    console.error('Failed to copy text: ', err);
	});
}

function tilingFromQueryString() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}

