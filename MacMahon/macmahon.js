class MacMahonGame {
    constructor(opts) {
	this.colors = {...defaultColors};
	this.defaultColors = {0:'#D00000', 1: '#E0E000', 2: '#3030e0'};
	this.colorNames = {0: 'one', 1: 'two', 2: 'three'};
	this.dontcare = 'x';

	this.size = 80;
	this.moving = null;
	this.animating = false;
	this.rotating = null;
	this.flashInterval = null;
	this.loadInterval = null;
	this.flashTime = 150;
	this.flashRate = 20;

	this.frozen = [];
	this.hints = [];
	this.history = [];
	this.isSolved = false;
	this.notified = false;
	this.initialBoard = '';

	if (typeof(opts) == 'object') {
            for (var key in opts) {
		this[key] = opts[key];
            }
	}
    }

    run() {
	this.initializePuzzle();
	this.newPuzzle();
    }

    newPuzzle() {
	this.configureTiles('24');
	this.goal = new GoalConfiguration();
	this.goal.setAnyGoal( '24', '4x6', '0'.repeat(20));
	this.configureDimensions();
	this.contact = C111;
	this.configureBoards();

	this.configureContact();
	this.configureColorButtons();

	this.configureBoundaryGoal();
	this.update();
    }

    initializePuzzle() {
	const canvas = document.getElementById('board')
	this.ch = new Canvas2d(canvas, 0, 0, this.colors['board'], 1);

	const onPointerDown = this.onPointerDown.bind(this);
	canvas.addEventListener('pointerdown', function(e) {
	    e.preventDefault(); 
	    onPointerDown(e);
	}, {passive: false});
	canvas.addEventListener('touchdown', function(e) {
	    e.preventDefault(); 
	}, {passive: false});

	const onPointerUp = this.onPointerUp.bind(this);
	canvas.addEventListener('pointerup', function(e) {
	    e.preventDefault(); 
	    onPointerUp(e);
	});

	const onPointerMove = this.onPointerMove.bind(this);
	canvas.addEventListener('pointermove', function(e) {
	    e.preventDefault(); 
	    onPointerMove(e);
	}, {passive: false});
	canvas.addEventListener('touchmove', function(e) {
	    e.preventDefault(); 
	}, {passive: false});

	const onPointerLeave = this.onPointerLeave.bind(this);
	canvas.addEventListener('pointerleave', function(e) {
	    e.preventDefault(); 
	    onPointerLeave(e);
	}, {passive: false});
	canvas.addEventListener('touchleave', function(e) {
	    e.preventDefault();
	}, {passive: false});

	
	this.vch = new Canvas2d(document.getElementById('variety'), 0, 0, this.colors['variety'], 1);
	
	document.addEventListener("keydown", this.onKeydown.bind(this));

	const r = document.getElementById("reset");
	if (r !== null) {
	    r.style.cursor = "pointer"
	}

	const u = document.getElementById("undo");
	u.style.cursor = "default"
	
	for (var i = 0; i < 3; i++) {
	    const colorselector = document.querySelector(`#color${i}`);
	    colorselector.value = this.colors[i];
	    colorselector.addEventListener('change', this.onColorChanged.bind(this));
	    colorselector.style.cursor = "pointer"
	}
	
    }

    configureTiles(setType, squaresList = null) {
	this.setType = setType;
	if (squaresList === null) {
	    this.tiles = new MacMahonSquares(setType);
	} else {
	    this.tiles = squaresList;
	}

	this.tilesWithColor = [0, 0, 0];
	for (var t of this.tiles) {
	    ["0", "1", "2"].forEach( (c,i) => {if (t.indexOf(c) >= 0) this.tilesWithColor[i]++;})
	}

	var desc = document.getElementById("tiles-description");
	if (desc !== null) {
	    desc.innerText = TilesDescription[this.setType];
	}

	if (this.initialBoard == '') {
	    this.shuffle();
	}
    }

    findPossibleDimensions() {
	var h = 2;
	while ( this.tiles.length % h != 0) {
	    h++;
	}
	var w = this.tiles.length / h;
	var options = [];
	while (h <= w) {
	    options.push([h, w])
	    h++;
	    while ( this.tiles.length % h != 0) {
		h++;
	    }
	    w = this.tiles.length / h;
	}
	return options;
    }

    configureDimensions() {
	this.width = 6;
	this.height = 4;
    }

    configureContact() {
	this.contact = this.goal.contact;
    }

    configureBoundaryGoal() {
	if (this.goal.boundaryType === null && this.goal.variety !== null) {
	    var count=[0, 0, 0];
	    for ( var c of this.goal.variety) {
		count[parseInt(c)]++;
	    }
	    this.goal.boundaryType = count
	}
    }

    configureColorButtons() {
	for (var i = 0; i < 3; i++) {
	    const c = document.getElementById(`color${i}`);
	    if ( c !== null) {
		c.style.visibility = this.tilesWithColor[i] > 0 ? "" : "hidden";
		c.value = this.colors[i];
	    }
	    const cn = document.getElementById(`color-${this.colorNames[i]}`);
	    if (cn !== null)
		cn.style.color = this.colors[i];
	}
    }

    configureBoards() {
	this.numContacts = 2 * this.width * this.height - this.height - this.width;
	var canvas = document.getElementById('board');
	canvas.width = this.size * this.width / this.ch.scale;
	canvas.height = this.size * this.height / this.ch.scale;
	this.ch.width = this.size * this.width;
	this.ch.height = this.size * this.height;

	var canvas = document.getElementById('variety');
	canvas.width = this.size * this.width / this.vch.scale;
	canvas.height = this.size * this.height / this.vch.scale;
	this.vch.width = this.size * this.width;
	this.vch.height = this.size * this.height;
    }

    clearBoards() {
	this.ch.clear();
	this.vch.clear();
    }

    shuffle() {
	for (var i = 0; i < this.tiles.length; i++) {
            const j = Math.floor(Math.random() * (this.tiles.length - i));
            const t = this.tiles[i];
            this.tiles[i] = this.tiles[j];
            this.tiles[j] = t;

            const r = Math.floor(Math.random() * 4);
            for ( var k = 0; k < r; k++) {
		this.rotate(i);
            }
	}
	this.resetHistory();
	this.setSolved(false);
	this.notified = false;
    }

    onShuffle() {
	this.shuffle();
	this.update();
    }

    update(doRender = true) {
	this.boundaryType = this.calculateBoundary();
	this.variety = this.calculateVariety();
	this.contactsMade = this.calculateHorz() + this.calculateVert();
	this.symmetry = SquaresHaveSymmetry(this.tiles, this.width, this.height);

	if (this.isSolution()) {
	    if (!this.notified) {
		this.notified = true;
		this.onSolved();
	    }
	}
	if (doRender)
	    this.render();
    }

    isSolution() {
	const solved = this.contactsMade == this.numContacts && (this.boundaryType[0] + this.boundaryType[1] == 0 || this.boundaryType[0] + this.boundaryType[2] == 0 || this.boundaryType[1] + this.boundaryType[2] == 0);
	if (solved != this.isSolved) {
	    this.setSolved(solved);
	}
	return this.isSolved;
    }

    render() {
	this.renderBoard();
	if (this.moving !== null) {
	    return;
	}

	this.renderProgress(this.vch,this.variety);
    }

    renderBoard() {
	this.ch.clear();

	const skip = this.moving !== null ? this.moving.index : -1;
	for (var i = 0; i< this.tiles.length; i++) {
            if (i != skip) {
		this.drawSquare(this.ch, i);
		if (!this.isSolved && (this.frozen.includes(i) || this.hints.includes(i))) {
		    this.drawFrozen( this.ch, i);
		}
            }
	}

	if (this.moving !== null) {
            this.drawSquare(this.ch, this.moving.index, this.moving.dx, this.moving.dy);
	}
    }

    renderVariety(ch, variety) {
	ch.clear();

	const scale = this.size / ch.scale * 0.67;
	var s = 0;
	var coords;
	var ix = 0;
	for ( var i = 0; i < this.width; i++) {
	    coords = this.coordsByIndex(ch, ix);
	    ix++;
	    ch.drawTriangle(coords[0], coords[1], 0, scale, this.colors[variety[s]], null);
	    s++;
	}
	ix--;
	for ( var j = 0; j < this.height; j++) {
	    coords = this.coordsByIndex(ch, ix);
	    ix += this.width;
	    ch.drawTriangle(coords[0], coords[1], 1, scale, this.colors[variety[s]], null);
	    s++;
	}
	ix -= this.width;
	for ( var i = this.width - 1; i >= 0; i--) {
	    coords = this.coordsByIndex(ch, ix);
	    ix--;
	    ch.drawTriangle(coords[0], coords[1], 2, scale, this.colors[variety[s]], null);
	    s++;
	}
	ix++;
	for ( var j = this.height - 1; j >= 0; j--) {
	    coords = this.coordsByIndex(ch, ix);
	    ix -= this.width;	
	    ch.drawTriangle(coords[0], coords[1], 3, scale, this.colors[variety[s]], null);
	    s++;
	}

	for (var i = 0; i< this.tiles.length; i++) {
	    if (this.frozen.includes(i)) {
		this.drawSquare(ch, i);
            }
	}

	this.renderSymmetrySymbol(ch, this.goal.symmetry, this.width / 2 * this.size / ch.scale, this.height / 2 * this.size / ch.scale);

	if (this.isSolved) {
	    ch.ctx.font = "36px Arial";
	    ch.ctx.textAlign = "center";
	    ch.ctx.strokeStyle = "white";

	    ch.ctx.strokeText("Solved", ch.width / ch.scale / 2, ch.height / ch.scale/ 2 - 20);
	}
    }


    renderProgress(ch) {
	this.renderMap(ch);
    }

    renderMap(ch) {
	ch.clear();

	const scale = this.size / ch.scale * 0.67;
	var s = 0;
	var coords;
	var ix = 0;
	const color = this.colors["match"];

	for ( var i = 0; i < this.width; i++) {
	    coords = this.coordsByIndex(ch, ix);
	    ix++;
	    if (this.variety[s] == this.goal.variety[s] || this.goal.variety[s] == this.dontcare)
		ch.drawTriangle(coords[0], coords[1], 0, scale, color, null);
	    s++;
	}
	ix--;
	for ( var j = 0; j < this.height; j++) {
	    coords = this.coordsByIndex(ch, ix);
	    ix += this.width;
	    if (this.variety[s] == this.goal.variety[s] || this.goal.variety[s] == this.dontcare)
		ch.drawTriangle(coords[0], coords[1], 1, scale, color, null);
	    s++;
	}
	ix -= this.width;
	for ( var i = this.width - 1; i >= 0; i--) {
	    coords = this.coordsByIndex(ch, ix);
	    ix--;
	    if (this.variety[s] == this.goal.variety[s] || this.goal.variety[s] == this.dontcare)
		ch.drawTriangle(coords[0], coords[1], 2, scale, color, null);
	    s++;
	}
	ix++;
	for ( var j = this.height - 1; j >= 0; j--) {
	    coords = this.coordsByIndex(ch, ix);
	    ix -= this.width;	
	    if (this.variety[s] == this.goal.variety[s] || this.goal.variety[s] == this.dontcare)
		ch.drawTriangle(coords[0], coords[1], 3, scale, color, null);
	    s++;
	}

	for (var y = 1; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
		const pos = y * this.width + x;
		const c1 = this.tiles[pos - this.width][2], c2 = this.tiles[pos][0];
		if ((this.contact == C111 && c1 == c2) || (this.contact == C12 && ((c1 == '0' && c2 == '0') || (c1 == '1' && c2 == '2') || (c1 == '2' && c2 == '1'))) ||
		    (this.contact == C21 && ((c1 == '0' && c2 == '1') || (c1 == '1' && c2 == '0') || (c1 == '2' && c2 == '2'))) ||
		    (this.contact == C3 && ((c1 == '0' && c2 == '2') || (c1 == '1' && c2 == '1') || (c1 == '2' && c2 == '0')))) {
		    coords = this.coordsByIndex(ch, pos - this.width);
		    ch.drawTriangle(coords[0], coords[1], 2, scale, color, null);
		    coords = this.coordsByIndex(ch, pos);
		    ch.drawTriangle(coords[0], coords[1], 0, scale, color, null);

		}
            }
	}
	for (var x = 1; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
		const pos = y * this.width + x;
		const c1 = this.tiles[pos - 1][1], c2=this.tiles[pos][3];
		if ((this.contact == C111 && c1 == c2) || (this.contact == C12 && ((c1 == '0' && c2 == '0') || (c1 == '1' && c2 == '2') || (c1 == '2' && c2 == '1'))) ||
		    (this.contact == C21 && ((c1 == '0' && c2 == '1') || (c1 == '1' && c2 == '0') || (c1 == '2' && c2 == '2'))) ||
		    (this.contact == C3 && ((c1 == '0' && c2 == '2') || (c1 == '1' && c2 == '1') || (c1 == '2' && c2 == '0')))) {
		    coords = this.coordsByIndex(ch, pos - 1);
		    ch.drawTriangle(coords[0], coords[1], 1, scale, color, null);
		    coords = this.coordsByIndex(ch, pos);
		    ch.drawTriangle(coords[0], coords[1], 3, scale, color, null);
		}
            }
	}

	if (!this.isSolved) {
	    for (var i of this.frozen) {
		this.drawFrozen(ch, i);
	    }
	    for (var i of this.hints) {
		this.drawFrozen(ch, i);
	    }
	}

	const size = this.size / ch.scale;
	this.renderSymmetrySymbol(ch, this.symmetry, this.width / 2 * size, this.height / 2 * size, true);
    }

    renderSymmetrySymbol(ch, sym, x, y, matchColor = false) {
	var colors;
	if (matchColor) {
	    colors = this.colors['symmetry'];
	} else {
	    const color1 = parseInt(sym[1]);
	    const color2 = parseInt(sym[2]);
	    const color3 = 3 - color1 - color2;
	    colors = [this.colors[color1], this.colors[color2], this.colors[color3]];
	}
	ch.drawSymmetrySymbol(sym, colors, x, y, this.size); 
    }

    drawSquare(ch, index, dx = 0, dy = 0, da = 0) {
	const coords = this.coordsByIndex(ch, index);
	const sq = this.tiles[index];
	const edge = (dx != 0 || dy != 0 || da != 0);
	const scale = Math.floor(this.size * 0.67 / ch.scale);
	for (var i = 0; i < sq.length; i++) {
            ch.drawTriangle(coords[0] + dx, coords[1] + dy, i + da, scale, this.colors[sq[i]], edge ? this.colors["edge"] : null);
	}
    }

    drawFrozen(ch, index) {
	const size = this.size / ch.scale - 4 / ch.scale;
	ch.ctx.lineWidth = 6 / ch.scale / 2;
	ch.ctx.strokeStyle = this.colors['frozen'];
	var coords = this.coordsByIndex(ch, index);
	coords[0] -= size / 2;
	coords[1] -= size / 2;
	ch.drawPoly([coords[0], coords[1]],[coords[0] + size, coords[1]], [coords[0] + size, coords[1] + size], [coords[0], coords[1] + size], [coords[0], coords[1]]);
    }

    coordsByIndex(ch, index) {
	const size = this.size / ch.scale;
	return [Math.floor(index % this.width) * size + size / 2,
		Math.floor(index / this.width) * size + size / 2];
    }

    // direction True= clockwise, False=counter-clockwise
    rotate(index, direction = false) {
	const s = this.tiles[index];
	this.tiles[index] = direction ? s[3] + s.substring(0, 3) : s.substring(1) + s[0];
	this.history.push(new Move('rotate',[index,direction]));
    }

    swap( index, swapIndex) {
	const t = this.tiles[index];
	this.tiles[index] = this.tiles[swapIndex];
	this.tiles[swapIndex] = t;
	this.history.push(new Move('swap', [swapIndex, index]));
    }

    onUndo(untilMove = null) {
	if (this.history.length == 0) {
	    return;
	}
	if (untilMove === null) {
	    untilMove = this.history.length - 1;
	}
	while (this.history.length > untilMove) {
	    const move = this.history.pop();
	    switch (move.type) {
	    case 'rotate':
		const s = this.tiles[move.params[0]];
		this.tiles[move.params[0]] = move.params[1] ? s.substring(1) + s[0] : s[3] + s.substring(0, 3);
		break;
	    case 'swap':
		const t = this.tiles[move.params[0]];
		this.tiles[move.params[0]] = this.tiles[move.params[1]];
		this.tiles[move.params[1]] = t;
		break;
	    }
	}
	this.update();
    }

    boundaryColorStr(i,n) {
	return `<span style="color:${this.colors[i]}">${n}</span>`;
    }

    setSolved(solved) {
	this.isSolved = solved;
    }

    resetHistory() {
	this.history = [];
    }

    onSolved() {
	this.animateFlash();
    }

    calculateVert() {
	var sum = 0;
	for (var x = 1; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
		const pos = y * this.width + x;
		const c1 = this.tiles[pos - 1][1], c2=this.tiles[pos][3];
		if ((this.contact == C111 && c1 == c2) || (this.contact == C12 && ((c1 == '0' && c2 == '0') || (c1 == '1' && c2 == '2') || (c1 == '2' && c2 == '1'))) ||
		    (this.contact == C21 && ((c1 == '0' && c2 == '1') || (c1 == '1' && c2 == '0') || (c1 == '2' && c2 == '2'))) ||
		    (this.contact == C3 && ((c1 == '0' && c2 == '2') || (c1 == '1' && c2 == '1') || (c1 == '2' && c2 == '0')))) {
                    sum++;
		}
            }
	}
	return sum;
    }

    calculateHorz() {
	var sum = 0;
	for (var y = 1; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
		const pos = y * this.width + x;
		const c1 = this.tiles[pos - this.width][2], c2 = this.tiles[pos][0];
		if ((this.contact == C111 && c1 == c2) || (this.contact == C12 && ((c1 == '0' && c2 == '0') || (c1 == '1' && c2 == '2') || (c1 == '2' && c2 == '1'))) ||
		    (this.contact == C21 && ((c1 == '0' && c2 == '1') || (c1 == '1' && c2 == '0') || (c1 == '2' && c2 == '2'))) ||
		    (this.contact == C3 && ((c1 == '0' && c2 == '2') || (c1 == '1' && c2 == '1') || (c1 == '2' && c2 == '0')))) {
                    sum++;
		}
            }
	}
	return sum;
    }

    calculateBoundary() {
	var count = [0, 0, 0];
	for (var x = 0; x < this.width; x++) {
            count[parseInt(this.tiles[x][0])]++;
            count[parseInt(this.tiles[x + (this.height - 1) * this.width][2])]++;
	}
	for (var y = 0; y < this.height; y++) {
            count[parseInt(this.tiles[y * this.width][3])]++;
            count[parseInt(this.tiles[(y + 1) * this.width - 1][1])]++;
	}
	return count;
    }

    calculateVariety() {
	var v = '';
	for ( var i = 0; i < this.width; i++) {
	    v += this.tiles[i][0];
	}
	for ( var j = 0; j < this.height; j++) {
	    v += this.tiles[(j + 1) * this.width - 1][1];
	}
	for ( var i = 0; i > -this.width; i--) {
	    v += this.tiles[this.height * this.width + i - 1][2];
	}
	for ( var j = this.height; j > 0; j--) {
	    v += this.tiles[(j - 1) * this.width][3];
	}
	return v;
    }

    onPointerDown(event) {
	var pos = this.ch.posFromEvent(event);
	const sq = this.inSquare(this.ch, pos);
	if (sq < 0 || this.animating || this.isSolved ||
	    this.frozen.includes(sq) || this.hints.includes(sq)) {
	    this.ch.canvas.style.cursor = "default";
            return;
	}
	this.ch.canvas.style.cursor = "pointer";
	pos.index = sq;
	pos.ts = new Date().getTime();
	pos.dx = 0;
	pos.dy = 0;
	pos.moved = false;
	this.moving = pos;
    }

    onPointerUp(event) {
	if (this.moving === null || this.animating || this.isSolved) {
	    return;
	}
	const pos = this.ch.posFromEvent(event);
	const sq = this.inSquare(this.ch, pos);
	this.ch.canvas.style.cursor = sq == -1 ? "default" : "pointer";
	if ( sq < 0 || this.frozen.includes(sq) || this.hints.includes(sq)) {
	    this.ch.canvas.style.cursor = "default";
	} else if (!this.moving.moved) {
	    const t = new Date().getTime();
            if (t - this.moving.ts < 300) {
		this.rotating = {index: sq, direction: event.shiftKey || event.button == 2, angle: 0, timer: setInterval(this.animateRotate.bind(this), 50)};
		this.animating = true;
		this.moving = null;
		return;
            }
	    this.moving = null;
	    this.render();
	    return;
	} else {
	    this.swap(sq,this.moving.index);
	    this.ch.canvas.style.cursor = "pointer";
	}
	this.moving = null;
	this.update();
    }

    onPointerMove(event) {
	const pos = this.ch.posFromEvent(event);
	const sq = this.inSquare(this.ch, pos);
	if (sq == -2) {
	    this.ch.canvas.style.cursor = "default";
	    this.moving = null;
	    this.render();
	    return;
	}
	if (this.isSolved) {
	    this.ch.canvas.style.cursor = "default";
            return;
	}
	if (sq == -1 || this.frozen.includes(sq) || this.hints.includes(sq)) 
	    this.ch.canvas.style.cursor = "default";
	else
	    this.ch.canvas.style.cursor = "pointer";
	if (this.moving === null) {
	    return;
	}
	const moving = this.moving;
	moving.dx = pos.x - moving.x;
	moving.dy = pos.y - moving.y;
	moving.moved = moving.dx != 0 || moving.dy != 0;
	this.render();
    }

    onPointerLeave(event) {
	if (this.moving === null || this.isSolved) {
            return;
	}
	this.ch.canvas.style.cursor = "default";
	this.moving = null;
	this.render();
    }

    onKeydown(event) {
	if (event.key == 'z' && (event.ctrlKey || event.metaKey)) {
	    event.preventDefault();
	    this.onUndo(this.history.length-1);
	    return;
	}
    }

    onColorChanged(event) {
	const i = parseInt(event.target.id.match(/color(\d)/)[1])
	const c = event.target.value;
	if (this.colors[i] != c) {
	    this.colors[i] = c;
	    this.render();
	}
    }

    onResetColors() {
	for (var i = 0; i < 3; i++) {
	    this.colors[i] = this.defaultColors[i];
	}
	this.configureColorButtons();
	this.render();
    }

    shuffleColors() {
	for (var i = 0; i < 3; i++) {
	    const ix = i + Math.floor(Math.random() * (3 - i));
	    var t = this.colors[ix];
	    this.colors[ix] = this.colors[i];
	    this.colors[i] = t;
	    t = this.defaultColors[ix];
	    this.defaultColors[ix] = this.defaultColors[i];
	    this.defaultColors[i] = t;
	}
	this.configureColorButtons()
    }

    animateRotate() {
	if (this.rotating === null) {
            return;
	}
	this.rotating.angle += this.rotating.direction ? 0.33333333 : -0.33333333;
	if (this.rotating.angle <= -0.9999 || this.rotating.angle >= 0.9999) {
            this.rotate(this.rotating.index, this.rotating.direction);
	    clearInterval(this.rotating.timer);
            this.rotating = null;
	    this.animating = false;
	    this.update();
	} else {
	    this.ch.clear();
	    for (var i = 0; i < this.tiles.length; i++) {
		if (i != this.rotating.index) {
		    this.drawSquare(this.ch, i);
		    if (this.frozen.includes(i) || this.hints.includes(i)) {
			this.drawFrozen(this.ch, i);
		    }
		} else {
		    this.drawSquare(this.ch, i, 0, 0, this.rotating.angle);
		}
	    }
	}
    }

    inSquare(ch, pos) {
	const size = this.size / ch.scale;
	const edge = this.size * 0.05 / ch.scale;
	const x = Math.floor(pos.x / size);
	const y = Math.floor(pos.y / size);
	if (x < 0 || x >= this.width || y < 0 || y >= this.height)
	    return -2;
	if (edge <= pos.x - x * size && (x + 1) * size - pos.x < size - edge &&
	    edge <= pos.y - y * size && (y + 1) * size - pos.y < size - edge) {
	    return y * this.width + x;
	}
	return -1;
    }

    inBoundaryTriangle(ch, pos) {
	const inTriangle = function(coords, sizeby2, triangle) {
	    const sw_ne = coords[0] + coords[1];
	    const nw_se = coords[1] - coords[0];
	    switch (triangle) {
	    case 0:
		return (pos.y > coords[1] - sizeby2) && (pos.x + pos.y < sw_ne) && (pos.y - pos.x < nw_se);
	    case 1:
		return (pos.x < coords[0] + sizeby2) && (pos.x + pos.y >= sw_ne) && (pos.y - pos.x < nw_se);
	    case 2:
		return (pos.y < coords[1] + sizeby2) && (pos.x + pos.y >= sw_ne) && (pos.y - pos.x >= nw_se);
	    case 3:
		return (pos.x > coords[0] - sizeby2) && (pos.x + pos.y < sw_ne) && (pos.y - pos.x >= nw_se);
	    }
	}
	const sizeby2 = this.size / ch.scale / 2;
	var b = 0;
	for ( var i = 0; i < this.width; i++) {
	    if (inTriangle(this.coordsByIndex(ch, i), sizeby2, 0))
		return b;
	    b++;
	}
	for ( var i = this.width - 1; i < this.width * this.height; i += this.width) {
	    if (inTriangle(this.coordsByIndex(ch, i), sizeby2, 1))
		return b;
	    b++;
	}
	for ( var i = this.width * this.height - 1; i >= this.width * (this.height - 1); i--) {
	    if (inTriangle(this.coordsByIndex(ch, i), sizeby2, 2))
		return b;
	    b++;
	}
	for ( var i = this.width * (this.height-1); i >= 0; i -= this.width) {
	    if (inTriangle(this.coordsByIndex(ch, i), sizeby2, 3))
		return b;
	    b++;
	}
	return -1;
    }

    animateFlash() {
	this.flashInterval = setInterval(this.flashBoard.bind(this), 10);
	this.flashCount = 0;
	this.colorScheme = [this.colors[0], this.colors[1], this.colors[2]];
	this.animating = true;
    }

    flashBoard() {
	this.flashCount++;
	if (this.flashCount % this.flashRate != 0) {
	    return;
	}
	if (this.flashCount >= this.flashTime) {
	    clearInterval(this.flashInterval);
	    this.flashInterval = null;
	    this.animating = false;
	    for (var i = 0; i < 3; i++) {
		this.colors[i] = this.colorScheme[i];
	    }
	} else {
	    this.flashColors();
	}
	this.renderBoard();
    }

    flashColors() {
	const numColors = this.tilesWithColor[2] == 0 ? 2 : 3;
	const c0 = this.colors[0];
	this.colors[0] = this.colors[1];
	if (numColors == 2) {
	    this.colors[1] = c0;
	} else {
	    this.colors[1] = this.colors[2];
	    this.colors[2] = c0;
	}
    }

    animateLoad() {
	this.loadInterval = setInterval(this.loadBoard.bind(this), 80);
	this.ch.scale = 40;
	this.animating = true;
    }

    loadBoard() {
	this.ch.clear();
	this.ch.scale *= 0.75;
	if (this.ch.scale > 1) {
	    const x = this.size * (this.width - this.width / this.ch.scale) / 2; 
	    const y = this.size * (this.height - this.height / this.ch.scale) / 2; 
	    for (var i = 0; i < this.tiles.length; i++) {
		this.drawSquare(this.ch, i, x, y);
	    }
	    return;
	}
	this.ch.scale = 1;
	clearInterval(this.loadInterval);
	this.loadInterval = null;
	this.animating = false;
	this.update();
    }

    findPossibleGoals() {
	this.possible_boundaries = [];
	const perimeter = (this.width + this.height) * 2;
	switch (this.contact) {
	case 'C 1,1,1':
	    for ( var b0 = 0; b0 <= perimeter; b0++) {
		if (b0 - 4 > this.tilesWithColor[0] || (this.triangles[0] - b0) % 2 != 0)
		    continue;
		if (b0 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("0000"))
		    continue
		for (var b1 = 0; b1 <= perimeter - b0; b1++) {
		    if (b1 - 4 > this.tilesWithColor[1] || (this.triangles[1] - b1) % 2 != 0)
			continue;
		    if (b1 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("1111"))
			continue
		    if ((perimeter - b0 - b1) - 4 > this.tilesWithColor[2] || (this.triangles[2] - (perimeter - b0 - b1)) % 2 != 0)
			continue
		    if (perimeter - b0 - b1 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("2222"))
			continue
		    this.possible_boundaries.push([b0, b1, perimeter - b0 - b1]);
		}
	    }
	    break;
	case 'C 1,2':
	    for ( var b0 = 0; b0 <= perimeter; b0++) {
		if (b0 - 4 > this.tilesWithColor[0] || (this.triangles[0] - b0) % 2 != 0)
		    continue;
		if (b0 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("0000"))
		    continue
		for (var b1 = 0; b1 <= perimeter - b0; b1++) {
		    if (b1 - 4 > this.tilesWithColor[1] || perimeter - b1 > this.triangles[2])
			continue;
		    if (b1 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("1111"))
			continue
		    if (this.triangles[1] - b1 != this.triangles[2] - (perimeter - b0 - b1))
			continue
		    if (perimeter - b0 - b1 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("2222"))
			continue
		    if (perimeter - b0 - b1 - 4 > this.tilesWithColor[2])
			continue
		    this.possible_boundaries.push([b0, b1, perimeter - b0 - b1]);
		}
	    }
	    break;
	case 'C 2,1':
	    for ( var b0 = 0; b0 <= perimeter; b0++) {
		b1 = this.triangles[1] - (this.triangles[0] - b0);
		if (b0 - 4 > this.tilesWithColor[0] || b1 - 4 > this.triangles[1] || b1 < 0 || b0 + b1 > perimeter)
		    continue;
		if (b0 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("0000"))
		    continue
		if (perimeter - b0 - b1 - 4 > this.tilesWithColor[2] || (this.triangles[2] - (perimeter - b0 - b1)) % 2 != 0)
		    continue
		if (b1 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("1111"))
		    continue
		if (perimeter - b0 - b1 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("2222"))
		    continue
		this.possible_boundaries.push([b0, b1, perimeter - b0 - b1]);
	    }
    	    break;
	case 'C 3':
	    for ( var b0 = 0; b0 <= perimeter; b0++) {
		b2 = this.triangles[2] - (this.triangles[0] - b0);
		b1 = perimeter - b0 -b2
		if (b0 - 4 > this.tilesWithColor[0] || b2 - 4 > this.tilesWithColor[2] || b1 < 0 || b2 < 0)
		    continue;
		if (b0 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("0000"))
		    continue
		if (b1 - 4 > this.tilesWithColor[1] || (this.triangles[1] - b1) % 2 != 0)
		    continue
		if (b1 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("1111"))
		    continue
		if (b2 == 0 && (this.width == 2 || this.height == 2) && this.tiles.includes("2222"))
		    continue
		this.possible_boundaries.push([b0, b1, b2]);
	    }
	}

	this.possible_symmetries = [[]];
	var sym_list = [['0', '1'], ['0', '2'], ['1', '2']];
	if (this.contact == C12)
	    sym_list = [['1', '2']];
	if (this.contact == C21)
	    sym_list = [['0', '1']];
	if (this.contact == C3)
	    sym_list = [['0', '2']];
	var self_sym_count = this.width * this.height % 2 == 1 ? 1 : 0;
	for (var syms of sym_list) {
	    var self_syms = 0;
	    for (var s of this.tiles) {
		var s1 = s.replaceAll(syms[0], 'x');
		s1 = s1.replaceAll(syms[1], syms[0]);
		s1 = new Tile(s1.replaceAll('x', syms[1]));
		rots = s1.rotations_of();
		if (this.tiles.some((t) => rots.includes(t)))
		    self_syms += s1.is_half_turn(s) ? 1 : 0;
		else {
		    self_syms = -1;
		    break;
		}
	    }
	    const possible = self_syms != -1 && self_syms == self_sym_count;
	    if (possible)
		this.possible_symmetries.push(syms.map((x) => parseInt(x)));
	}
    }

    randomTiles() {
	return Object.keys(this.tilesDescription)[Math.floor(Math.random()*Object.keys(this.tilesDescription).length)];
    }

    randomDimensions() {
	const dims = this.findPossibleDimensions();
	return dims[Math.floor(Math.random()*dims.length)];
    }

    randomContact() {
	return ContactSystemList[Math.floor(Math.random()*ContactSystemList.length)];
    }

    randomBoundary(sym = []) {
	const possible_boundaries = sym.length == 0 ? this.possible_boundaries : this.possible_boundaries.filter((b) => b[sym[0]] == b[sym[1]]);
	return possible_boundaries.length == 0 ? null : possible_boundaries[Math.floor(Math.random()*possible_boundaries.length)];
    }

    randomVariety(boundary, symmetry, orderly = true) {
	if (symmetry === null)
	    symmetry = this.randomSymmetry();
	if (boundary === null)
	    boundary = this.randomBoundary(symmetry);

	var v = [];
	if (symmetry.length == 0) {
	    for (var i = 0; i < boundary.length; i++)
		for (var j = 0; j < boundary[i]; j++)
		    v.push(i);
	    if (!orderly) {
		for (var i = 0; i < v.length; i++) {
		    var j = i + Math.floor(Math.random() * (v.length - i));
		    const t = v[i];
		    v[i] = v[j];
		    v[j] = t;
		}
	    }
	} else {
	    if (boundary[symmetry[0]] != boundary[symmetry[1]]) {
		return null;
	    }
	    var half_boundary = [0, 0, 0];
	    if (!symmetry.includes(2)) {
		half_boundary = [boundary[0], 0, boundary[2] / 2];
	    }
	    if (!symmetry.includes(1)) {
		half_boundary = [boundary[0], boundary[1] / 2, 0];
	    }
	    if (!symmetry.includes(0)) {
		half_boundary = [boundary[0] / 2, boundary[1], 0];
	    }
	    for (var i = 0; i < 3; i++)
		for (var j = 0; j < half_boundary[i]; j++)
		    v.push(symmetry.includes(i) ? symmetry[Math.floor(Math.random() * 2)] : i);
	    if (!orderly) {
		for (var i = 0; i < v.length; i++) {
		    var j = i + Math.floor(Math.random() * (v.length - i));
		    const t = v[i];
		    v[i] = v[j];
		    v[j] = t;
		}
	    }
	    const len = v.length;
	    for (var i = 0; i < len; i++) {
		const c = v[i] == symmetry[0] ? symmetry[1] : (v[i] == symmetry[1] ? symmetry[0] : v[i]);
		v.push(c);
	    }
	}
	return v.join('');
    }

    randomSymmetry() {
	return this.possible_symmetries[Math.floor(Math.random()*this.possible_symmetries.length)];
    }

    toStringCode() {
	var code =`${String.fromCharCode('a'.charCodeAt(0)+this.width - 1)}` + this.tiles.map((t) => Tile.toStringCode(t)).join('');
	if (this.frozen.length > 0) {
	    code += '.';
	    for (var sq of this.frozen) {
		code += String.fromCharCode('a'.charCodeAt(0) + sq);
	    }

	}
	return code;
    }
}

class Move {
    constructor(type, params, score = 0) {
	this.type = type;
	this.params = params;
	this.score = score;
    }
}



