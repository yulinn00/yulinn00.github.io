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

    drawSymmetrySymbol(sym, colors, x, y, size) {
	size = size / this.scale;
	const radius = size / 5;
	this.ctx.lineWidth = 3 / this.scale;
	if (typeof(colors) == "string") {
	    this.ctx.strokeStyle = colors;
	    this.ctx.lineWidth = 5 / this.scale;
	    if (sym[0] == 'r') {
		this.arc(x, y, 2 * radius, -Math.PI / 2, 3 * Math.PI / 2);
		this.arc(x, y - radius, radius, -Math.PI / 2, Math.PI / 2);
		this.arc(x, y + radius, radius, Math.PI / 2, -Math.PI / 2);
	    } else if (sym[0] == 'h') {
		this.arc(x, y, 2 * radius, -Math.PI / 2, Math.PI / 2);
		this.arc(x, y, 2 * radius, Math.PI / 2, -Math.PI / 2);
		this.arc(x, y, radius, -Math.PI / 2, 3 * Math.PI / 2);
	    } else if (sym[0] == 'v') {
		this.arc(x, y, 2 * radius, 0, Math.PI);
		this.arc(x, y, 2 * radius, -Math.PI, 0);
		this.arc(x, y, radius, 0, 2 * Math.PI);
	    }
	    return;
	}
	this.ctx.strokeStyle = "black";
	this.ctx.lineWidth = 3 / this.scale;
	if (sym[0] == 'r') {
	    this.ctx.fillStyle = colors[2];
	    this.arc(x, y, 2 * radius, -Math.PI / 2, 3 * Math.PI / 2, true);
	    this.ctx.fillStyle = colors[0];
	    this.arc(x, y - radius, radius, -Math.PI / 2, Math.PI / 2, true);
	    this.ctx.fillStyle = colors[1];
	    this.arc(x, y + radius, radius, Math.PI / 2, -Math.PI / 2, true);
	} else if (sym[0] == 'h') {
	    this.ctx.fillStyle = colors[0];
	    this.arc(x, y, 2 * radius, -Math.PI / 2, Math.PI / 2, true);
	    this.ctx.fillStyle = colors[1];
	    this.arc(x, y, 2 * radius, Math.PI / 2, -Math.PI / 2, true);
	    this.ctx.fillStyle = colors[2];
	    this.arc(x, y, radius, -Math.PI / 2, 3 * Math.PI / 2, true);
	} else if (sym[0] == 'v') {
	    this.ctx.fillStyle = colors[0];
	    this.arc(x, y, 2 * radius, 0, Math.PI, true);
	    this.ctx.fillStyle = colors[1];
	    this.arc(x, y, 2 * radius, -Math.PI, 0, true);
	    this.ctx.fillStyle = colors[2];
	    this.arc(x, y, radius, 0, 2 * Math.PI, true);
	}
    }
}
    
function CopyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
	.then()
	.catch(err => {
	    console.error('Failed to copy text: ', err);
	});
}

const TilesDescription = {
	'24': 'all MacMahon tiles',
	'20': 'no color one square, no pure two-three triangle or hourglass, no color one mixed hourglass tiles',
	'18x': 'tiles containing color one',
	'18y': '',
	'16': 'no color one square, no pure two-three triangle, no hourglass tiles',
	'16x': 'tiles containing color one except color one square and color one mixed hourglass',
	'16y': '',
	'15': 'no square or hourglass tiles',
	'12x': 'no square, hourglass, or pure triangle tiles',
	'12y': '',
	'9': 'only pentagon and pure triangle tiles',
    '6': 'only colors one and two'};

const C111 = 'C 1,1,1';
const C12 = 'C 1,2';
const C21 = 'C 2,1';
const C3 = 'C 3';
const ContactSystemList = [C111, C12, C21, C3];
const ContactMap = {'C111' : C111, 'C12' : C12, 'C21' : C21, 'C3': C3}

class MacMahonSquares extends Array {
    constructor(td = null) {
	super();
	if (td !== null) {
	    this.tilesFromDescriptor(td);
	}
    }
    // Colors 0,1,2 in NESW order
    tilesFromDescriptor(setType) {
	//one color (square)
	if (['24', '18x', '6'].includes(setType)) {
	    this.push( "0000");
	}
	if (['24', '20', '18y', '16', '6'].includes(setType)) {
	    this.push( "1111");
	}
	if (['24', '20', '18y', '16'].includes(setType)) {
	    this.push( "2222");
	}

	// two colors, 3-1 pattern (pentagon)
	if (['24', '20', '18x', '18y', '16', '16x', '16y', '15', '12x', '12y', '9', '6'].includes(setType)) {
	    this.push( "0001");
	    this.push( "1110");
	}
	if (['24', '20', '18x', '18y', '16', '16x', '16y', '15', '12x', '12y', '9', '8'].includes(setType)) {
	    this.push( "0002");
	    this.push( "2220");
	}
	if (['24', '20', '18y', '16', '16y', '15', '12x', '12y', '9'].includes(setType)) {
	    this.push( "1112");
	    this.push( "2221");
	}

	// two colors, (diagonal)
	if (['24', '20', '18x', '18y', '16', '16x', '16y', '15', '12y', '9', '6'].includes(setType)) {
	    this.push( "0011");
	}
	if (['24', '20', '18x', '18y', '16', '16x', '16y', '15', '12y', '9'].includes(setType)) {
	    this.push( "0022");
	}
	if (['24', '15', '9'].includes(setType)) {
	    this.push( "1122");
	}

	//two colors, (hourglass)
	if (['24', '20', '18x', '18y', '16x', '16y', '12y', '6'].includes(setType)) {
	    this.push( "0101");
	}
	if (['24', '20', '18x', '18y', '16x', '16y', '12y'].includes(setType)) {
	    this.push( "0202");
	}
	if (['24'].includes(setType)) {
	    this.push( "1212");
	}

	// three colors, (mixed diagonal)
	if (['24', '20', '18x', '16', '16x', '15', '12x', '9x'].includes(setType)) {
	    this.push( "0012");
	    this.push( "0021");
	}
	if (['24', '20', '18x', '18y', '16', '16x', '16y', '15', '12x', '9x', '8'].includes(setType)) {
	    this.push( "1102");
	    this.push( "1120");
	    this.push( "2201");
	    this.push( "2210");
	}

	// three colors, (mixed hourglass)
	if (['24', '18x', '9x'].includes(setType)) {
	    this.push( "0102");
	}
	if (['24', '20', '18x', '18y', '16x', '16y', '12y', '9x'].includes(setType)) {
	    this.push( "1012");
	    this.push( "2021");
	}
    }
}


function SquaresHaveSymmetry(squares, w, h) {
    var syms = ['r01', 'r02', 'r12', 'h01', 'h02', 'h12', 'v01', 'v02', 'v12'];
    const num_tiles = squares.length;

    for (var i = 0; i < num_tiles; i++) {
	if (syms.length == 0)
	    break;
	if (syms.includes('r01')) {
	    const t = squares[i].slice(2) + squares[i].slice(0, 2);
	    const ts = t.replaceAll('0', 'x').replaceAll('1', '0').replaceAll('x', '1');
	    if (squares[num_tiles - i - 1] != ts) {
		syms = syms.filter((r) => r != 'r01');
	    }
	}
	if (syms.includes('r02')) {
	    const t = squares[i].slice(2) + squares[i].slice(0,2);
	    const ts = t.replaceAll('0', 'x').replaceAll('2', '0').replaceAll('x', '2');
	    if (squares[num_tiles - i - 1] != ts) {
		syms = syms.filter((r) => r != 'r02');
	    }
	}
	if (syms.includes('r12')) {
	    const t = squares[i].slice(2) + squares[i].slice(0, 2);
	    const ts = t.replaceAll('1', 'x').replaceAll('2', '1').replaceAll('x', '2');
	    if (squares[num_tiles - i - 1] != ts) {
		syms = syms.filter((r) => r != 'r12');
	    }
	}
	var i0 = w * Math.floor(i / w);
	if (syms.includes('h01')) {
	    const t = squares[i][0]+squares[i][3]+squares[i][2]+squares[i][1];
	    const ts = t.replaceAll('0', 'x').replaceAll('1', '0').replaceAll('x', '1');
	    if (squares[i0 + w - i % w - 1] != ts) {
		syms = syms.filter((r) => r != 'h01');
	    }
	}
	if (syms.includes('h02')) {
	    const t = squares[i][0]+squares[i][3]+squares[i][2]+squares[i][1];
	    const ts = t.replaceAll('0', 'x').replaceAll('2', '0').replaceAll('x', '2');
	    if (squares[i0 + w - i % w - 1] != ts) {
		syms = syms.filter((r) => r != 'h02');
	    }
	}
	if (syms.includes('h12')) {
	    const t = squares[i][0]+squares[i][3]+squares[i][2]+squares[i][1];
	    const ts = t.replaceAll('1', 'x').replaceAll('2', '1').replaceAll('x', '2');
	    if (squares[i0 + w - i % w - 1] != ts) {
		syms = syms.filter((r) => r != 'h12');
	    }
	}

	if (syms.includes('v01')) {
	    const t = squares[i][2]+squares[i][1]+squares[i][0]+squares[i][3];
	    const ts = t.replaceAll('0', 'x').replaceAll('1', '0').replaceAll('x', '1');
	    if (squares[(h-1) * w - i0 + i % w] != ts) {
		syms = syms.filter((r) => r != 'v01');
	    }
	}
	if (syms.includes('v02')) {
	    const t = squares[i][2]+squares[i][1]+squares[i][0]+squares[i][3];
	    const ts = t.replaceAll('0', 'x').replaceAll('2', '0').replaceAll('x', '2');
	    if (squares[(h-1) * w - i0 + i % w] != ts) {
		syms = syms.filter((r) => r != 'v02');
	    }
	}
	if (syms.includes('v12')) {
	    const t = squares[i][2]+squares[i][1]+squares[i][0]+squares[i][3];
	    const ts = t.replaceAll('1', 'x').replaceAll('2', '1').replaceAll('x', '2');
	    if (squares[(h-1) * w - i0 + i % w] != ts) {
		syms = syms.filter((r) => r != 'v12');
	    }
	}
    }
    return syms.length == 0 ? '' : syms[0];
}

class GoalConfiguration {
    constructor(s = '') {
	if ( this.code == '') {
	    this.code = '';
	    this.tileSet = '';
	    this.dims = '';
	    this.tiles = [];
	    this.variety = '';
	    this.boundaryType = [0, 0, 0];
	    this.contact = undefined;
	    this.symmetry = '';
	    this.frozen = [];

	    return;
	}

	this.code = s;
	this.tileSet = null;
	const m = s.match(/([a-z])([^.]*).?([a-z]*)/);
	if (m === null || m.length < 3)
	    return;

	const w = m[1].charCodeAt(0)-'a'.charCodeAt(0)+1;
	const frozen = m.length == 4 ? m[3] : '';
	const tiles_str = m[2];
	const num_tiles = tiles_str.length;
	if (num_tiles % w != 0)
	    return;

	const h = num_tiles / w;

	this.dims = `${h}x${w}`;

	this.tiles = new MacMahonSquares;
	for (var c of tiles_str) {
	    this.tiles.push(Tile.fromStringCode(c));
	}

	this.frozen = [];
	for (var c of frozen) {
	    this.frozen.push(c.charCodeAt(0) - 'a'.charCodeAt(0));
	}

	for (var td of Object.keys(TilesDescription)) {
	    var mst = td.match(/^(\d+)([a-z]*)/);
	    if (num_tiles == parseInt(mst[0])) {
		var ts_list = new MacMahonSquares();
		ts_list.tilesFromDescriptor(td);
		if (this.tiles.every((s) => new Tile(s).rotations_of().some((r) => r == s))) {
		    this.tileSet = td;
		    break;
		}
	    }
	}
	if (this.tileSet === null) {
	    this.tileSet = `${num_tiles}*`;
	}
	
	this.variety = '';
	for (var i = 0; i < w; i++) {
	    this.variety += this.tiles[i][0];
	}
	for (var i = 0; i < h; i++) {
	    this.variety += this.tiles[w - 1 + i * w][1];
	}
	for (var i = 0; i < w; i++) {
	    this.variety += this.tiles[w * h - 1 - i][2];
	}
	for (var i = 0; i < h; i++) {
	    this.variety += this.tiles[w * (h - 1)- i * w][3];
	}

	this.boundaryType=[0,0,0];
	for (var c of this.variety) {
	    this.boundaryType[parseInt(c)]++;
	}
	
	var color_pattern = [-1, -1, -1];
	const check_color = function(color_pattern,c1,c2) {
	    if (color_pattern[parseInt(c1)] == -1)
		color_pattern[parseInt(c1)] = parseInt(c2);
	    else
		return color_pattern[parseInt(c1)] == parseInt(c2);
	    if (color_pattern[parseInt(c2)] == -1)
		color_pattern[parseInt(c2)] = parseInt(c1);
	    else
		return color_pattern[parseInt(c1)] == parseInt(c2);
	    return true;
	}
	var error = false;
	for (var i = 0; i < num_tiles; i++) {
	    if (i % w != w - 1 && !check_color(color_pattern,this.tiles[i][1],this.tiles[i + 1][3])) {
		error = true;
		break;
	    }
	    if (i < num_tiles - w && !check_color(color_pattern,this.tiles[i][2],this.tiles[i + w][0])) {
		error = true;
		break;
	    }
	}
	this.contact = undefined;
	if (!error) {
	    if (color_pattern.some((c) => c == -1)) {
		switch (color_pattern[0]) {
		case 0:
		    this.contact = C111;
		    break;
		case 1:
		    this.contact = C21;
		    break;
		case 2:
		    this.contact = C3;
		    break;
		case -1:
		    this.contact = color_pattern[1] == 1 ? C111 : C12;
		    break
		}
	    } else {
		this.contact = color_pattern.every((c,i) => color_pattern[i] == i) ? C111 : (color_pattern[0] == 0 ? C12 : (color_pattern[0] == 1 ? C21 : C3));
	    }
	}

	this.symmetry = SquaresHaveSymmetry(this.tiles, w, h);
    }

    setAnyGoal( descriptorOrTiles, dims, variety, contactSystem = C111, symmetry = '', frozen = []) {
	this.code = '';
	if (typeof descriptorOrTiles == 'string') {
	    this.tileSet = descriptorOrTiles;
	    this.tiles = new MacMahonSquares(descriptorOrTiles);
	} else {
	    this.tileSet = 'custom';
	    this.tiles = this.descriptorOrTiles;
	}
	this.dims = dims;
	this.variety = variety;
	this.boundaryType=[0,0,0];
	for (var c of this.variety) {
	    this.boundaryType[parseInt(c)]++;
	}
	this.contact = contactSystem;
	this.symmetry = symmetry;
	this.frozen = frozen;
    }
}


class Tile extends String {
    constructor(fourColors) {
	super(fourColors);
    }

    is_rotated(tile) {
	for (var i = 0; i < 4; i++) {
	    if (this == tile.substring(i,tile.length) + tile.substring(0, i)) {
		return true;
	    }
	}
	return false;
    }
    is_half_turn(tile) {
	return this == tile.substring(2,tile.length) + tile.substring(0, 2);
    }
    rotations_of() {
	return [0,1,2,3].map((i) => this.substring(i)+this.substring(0,i));
    }

    static codeMap = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-=_+[]{};";

    static toStringCode(t) {
	var n = 0;
	for (var c of t) {
	    n = 3 * n + parseInt(c);
	}
	return Tile.codeMap[n];
    }

    static fromStringCode(tileChar) {
	var n = Tile.codeMap.indexOf(tileChar);
	var sq = ''
	for (var i = 3; i >= 0; i--) {
	    sq = `${n % 3}` + sq;
	    n = Math.floor(n / 3);
	}
	return sq;
    }
}

defaultColors =  {0:'#D00000', 1: '#E0E000', 2: '#3030e0', board: '#000000', variety: '#000000', goal: '#000000', contact: '#c0c0c0', edge: '#000000', frozen: '#FFFFFF', match: "#10d010", symmetry: 'DarkOrange', x: "#c0c0c0"};

function renderTiles(element, tiles, h = 0, colors = defaultColors) {
    const canvas = document.getElementById(element);
    ch = new Canvas2d(canvas, canvas.width, canvas.height, 'black', 1);

    var n = tiles.length;
    if ( h == 0) {
	h = Math.floor(Math.sqrt(n));
	while (h > 1) {
	    if (n % h == 0)
		break;
	}
    }
    var w = n/h;
    const factor = 1.5;
    var scale = ch.width / w * 2 / 3;
    
    n = 0;
    var y = scale * 1.5 * 0.5 + (ch.height - h * scale * factor) / 2;
    for (var i = 0; i < h; i++) {
	var x = scale * 1.5 * 0.5 + (ch.width - w * scale * factor) / 2;
	for (var j = 0; j < w; j++) {
	    for (var k = 0; k < tiles[n].length; k++) {
		ch.drawTriangle(x, y, k, scale, colors[tiles[n][k]], null);
	    }
	    n += 1;
	    x += scale * 1.5
	}
	y += scale * 1.5
    }
}


function renderVariety(element, variety, h, w, colors = defaultColors) {
    const canvas = document.getElementById(element);
    ch = new Canvas2d(canvas, canvas.width, canvas.height, 'black', 1);
    ch.clear();

    //const scale = this.size / ch.scale * 0.67;
    const size = ch.width / w;
    const scale = ch.width / w * 2 / 3;


    var s = 0;
    var coords;

    for ( var i = 0; i < w; i++) {
	coords = [];
	ch.drawTriangle(i * size + size / 2, size/ 2, 0, scale, colors[variety[s]], false);
	s++;
    }

    for ( var j = 0; j < h; j++) {
	ch.drawTriangle(w * size - size / 2, j * size + size / 2, 1, scale, colors[variety[s]], false);
	s++;
    }

    for ( var i = w - 1; i >= 0; i--) {
	ch.drawTriangle(i * size + size / 2, h * size - size / 2, 2, scale, colors[variety[s]], false);
	s++;
    }

    for ( var j = h - 1; j >= 0; j--) {
	ch.drawTriangle(size / 2, j * size + size / 2, 3, scale, colors[variety[s]], false);
	s++;
    }
}

function renderContact(element, contact, colors = defaultColors, yOffset = 1, twoColor = false) {
    const canvas = document.getElementById(element);
    ch = new Canvas2d(canvas, canvas.width, canvas.height, 'black', 1);

    const size = ch.height / (yOffset+1);
    const x = size / 2 / ch.scale * 0.90;
    var coords = [0, 0];
    const scale = size / ch.scale * 0.60;
    const numColors = 3;

    ch.ctx.fillStyle = "#c0c0c0";;
    ch.ctx.fillRect(0, ch.height - 2 * x, ch.width, ch.height);

    if (twoColor) {
	if (contact == C111) {
	    coords = [ch.width / 2 - x, (2 * yOffset + 1) * size / 2 / ch.scale] ;
	    for (var c of ["0", "1"]) {
		ch.drawTriangle(coords[0] - x, coords[1], 1, scale, colors[c], null);
		ch.drawTriangle(coords[0] + x, coords[1], 3, scale, colors[c], null);
		
		coords[0] += x * 2;
	    }
	} else {
	    coords = [ch.width / 2, (2 * yOffset + 1) * size / 2 / ch.scale];
	    ch.drawTriangle(coords[0] - x, coords[1], 1, scale, colors["0"], null);
	    ch.drawTriangle(coords[0] + x, coords[1], 3, scale, colors["1"], null);
	}
	return;
    }
	
    if (contact == C111) {
	coords = [ch.width / 2 - x * 2, (2 * yOffset + 1) * size / 2 / ch.scale];
	for (var c of ["0", "1", "2"]) {
	    ch.drawTriangle(coords[0] - x, coords[1], 1, scale, colors[c], null);
	    ch.drawTriangle(coords[0] + x, coords[1], 3, scale, colors[c], null);

	    coords[0] += x * 2;
	}
    } else {
	coords = [ch.width / 2 - x, (2 * yOffset + 1) * size / 2 / ch.scale] ;

	const c = contact == C12 ? "0" : (contact == C3 ? "1" : "2");
	ch.drawTriangle(coords[0] - x, coords[1], 1, scale, colors[c], null);
	ch.drawTriangle(coords[0] + x, coords[1], 3, scale, colors[c], null);

	coords[0] += x * 2;

	const c1 = contact == C12 ? "1" : "0";
	const c2 = contact == C21 ? "1" : "2";
	ch.drawTriangle(coords[0] - x, coords[1], 1, scale, colors[c1], null);
	ch.drawTriangle(coords[0] + x, coords[1], 3, scale, colors[c2], null);
    }
}

function renderPuzzle(element, variety, h, w, contact, symmetry, colors = defaultColors) {
    renderVariety(element, variety, h, w, colors);
    canvas = document.getElementById(element);
    ctx = canvas.getContext('2d');
    ctx.fillStyle = "#c0c0c0";;
    ctx.fillRect(0, h * canvas.width / w, canvas.width, canvas.height);
    renderContact(element, contact, colors, h);
    if (symmetry == '')
	return;
    color1 = parseInt(symmetry[1]);
    color2 = parseInt(symmetry[2]);
    color3 = 3 - color1 - color2;
    const sym_colors = [colors[color1], colors[color2], colors[color3]];
    ch = new Canvas2d(canvas, 0, 0, '#c0c0c0', 1);
    ch.drawSymmetrySymbol(symmetry, sym_colors, canvas.width / 2, canvas.width / w * h / 2, 50);
}

function renderSymmetrySymbol(element, symmetry, colors = defaultColors) {
    ch = new Canvas2d(document.getElementById(element), 0, 0, '#c0c0c0', 1);
    color1 = parseInt(symmetry[1]);
    color2 = parseInt(symmetry[2]);
    color3 = 3 - color1 - color2;
    const sym_colors = [colors[color1], colors[color2], colors[color3]];
    ch.drawSymmetrySymbol(symmetry, sym_colors, canvas.width / 2, canvas.height / 2, 50);
}

