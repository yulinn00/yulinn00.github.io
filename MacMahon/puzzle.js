class MacMahonPuzzle extends MacMahonGame {
    constructor(opts = null) {
	super(opts);

	this.scale = 2;
	this.solveInterval = null;
    }

    run(goal = null) {
	this.initializePuzzle();
	this.newPuzzle(goal);
    }

    newPuzzle(goal) {
	if (typeof(goal) != 'string') {
	    this.goal = goal;
	} else {
	    this.goal = new GoalConfiguration(goal);
	}
	this.setSolved(false);
	this.notified = false;
	this.resetHistory();
	this.configurePuzzle();
	this.animateLoad();
    }

    initializePuzzle() {
	super.initializePuzzle();

	this.gch = new Canvas2d(document.getElementById('goal'), this.width * this.size, this.height * this.size, this.colors['goal'], this.scale);

	this.cch = new Canvas2d(document.getElementById('contact-goal'), 3.5 * this.size, this.size, this.colors['contact'], this.scale);

	const sc = document.getElementById("set-color");
	if (sc !== null) {
	    sc.style.position = "absolute";
	    sc.style.left = "240px";
	    sc.style.top = "170px";
	}

	this.vch.scale = this.scale;

    }

    shuffle() {
	if (this.goal.code == '') {
	    super.shuffle();
	    return;
	}
	var sq = [...this.goal.tiles];
	for (var i = 0; i < this.goal.tiles.length; i++) {
	    const ix = this.goal.code.charCodeAt(i+1) % (this.goal.tiles.length - i);
	    const rot = this.goal.code.charCodeAt(i+1) % 4;
	    const t = sq[i];
	    if (!this.frozen.includes(i)) {
		if (!this.frozen.includes(ix)) {
		    sq[i] = sq[ix];
		    sq[ix] = t;
		    sq[i] = sq[i].slice(rot, 4) + sq[i].slice(0, rot);
		} else {
		    sq[i] = sq[i].slice(rot, 4) + sq[i].slice(0, rot);
		}
	    }
	}
	this.resetHistory();
	this.setSolved(false);
	this.tiles = sq;
    }

    resetHistory() {
	this.history = [];
    }

    configurePuzzle() {

	this.configureTiles();
	this.configureDimensions();
	this.configureBoards();

	this.configureContact();
	this.configureColorButtons();

	this.configureBoundaryGoal();
    }

    configureTiles() {
	this.frozen = this.goal.frozen;
	this.hints = [];
	super.configureTiles(this.goal.tileSet,this.goal.tiles);

	const ts = document.getElementById('tileSet');
	if (ts !== null) {
	    ts.textContent = `${this.tiles.length} tiles - ${TilesDescription[this.setType]}`;
	}
    }

    configureDimensions() {
	var dims = this.goal.dims.split('x');
	this.width = parseInt(dims[1]);
	this.height = parseInt(dims[0]);
    }

    configureBoards() {
	super.configureBoards();

	var goalCanvas = document.getElementById('goal');
	goalCanvas.width = this.size * this.width / this.gch.scale;
	goalCanvas.height = this.size * this.height / this.gch.scale;
	this.gch.width = this.size * this.width;
	this.gch.height = this.size * this.height;

	var contactCanvas = document.getElementById('contact-goal');
	contactCanvas.width = this.size * 3.5 / this.cch.scale;
	contactCanvas.height = this.size / this.cch.scale;

    }

    clearBoards() {
	super.clearBoards();
	this.gch.clear();
	if (this.goal.variety !== null) {
	    this.renderProgress(this.gch, this.goal.variety);
	}
    }

    update(doRender = true) {
	super.update(false);

	const undo = document.getElementById("undo");
	undo.disabled = this.isSolved || this.history.length==0;
	undo.style.cursor = undo.disabled ? "default" : "pointer";
	this.varietyMade = [...this.variety].filter((x,i) => x == this.goal.variety[i]).length;

	if (doRender)
	    this.render();
    }

    render() {
	super.render();

	this.renderVariety(this.gch, this.goal.variety);

	renderContact("contact-goal", this.contact, this.colors, 0);
    }

    isSolution() {
	const solved = this.contactsMade == this.numContacts &&
	      this.goal.symmetry == this.symmetry &&
	      (this.goal.variety === null || this.goal.variety == this.variety) &&
	      (this.goal.boundaryType === null || this.goal.boundaryType.every((x, i) => x == this.boundaryType[i]));
	if (solved != this.isSolved)
	    this.setSolved(solved);
	return this.isSolved
    }

    animateSolve() {
	this.solveInterval = setInterval(this.solveMove.bind(this), 250);
	this.animating = true;
    }

    solveMove()  {
	var i = 0;
	while (this.tiles[i] == this.goal.tiles[i]) {
	    i++;
	    if (i == this.tiles.length) {
		clearInterval(this.solveInterval);
		this.solveInterval = null;
		this.animating = false;
		return;
	    }
	}
	const rots = (new Tile(this.goal.tiles[i])).rotations_of();
	if (rots.some((t) => t == this.tiles[i])) {
	    // Rotate
	    this.rotate(i);
	} else {
	    var j = i + 1;
	    while (rots.every((t) => t != this.tiles[j]))
		j++;
	    // Move
	    this.swap(i, j);
	}
	this.update();
    }

    onKeydown(event) {
	if (event.key == 's' && event.ctrlKey && event.metaKey) {
	    event.preventDefault();
	    this.animateSolve();
	    return;
	}
	super.onKeydown(event);
    }
}



class Percy extends MacMahonPuzzle {
    constructor(opts = null) {
	super(opts);

	this.size = 100;
	this.colors.symmetry = "#e0e0e0";
	this.colors.hint = "#ffffff";
	this.hintMoves = [];
	this.MAX_HINTS = 1;
	this.daily = false;

	this.pointsPerContact = 1;
	this.pointsPerBoundary = 2;
	this.pointsPerSymmetry = 3;


        const queryString = window.location.search;
	if ( queryString == '' ) {
	    this.puzzleParameter = null;
	    return;
	}

        const urlParams = new URLSearchParams(queryString);
        
        this.puzzleParameter = urlParams.get('puzzle');
    }

    run(puzzleCodeListOrString = null) {
	this.initializePuzzle();
	if (typeof(puzzleCodeListOrString) == 'string') {
	    this.puzzleList = [puzzleCodeListOrString];
	} else if (this.puzzleParameter !== null) {
	    this.puzzleList = [this.puzzleParameter];
	} else {
	    this.puzzleList = puzzleCodeListOrString;
	}
	if (this.puzzleList.length == 0)
	    return;

	var code = ''
	const date = new Date();
	const today = String(date.getFullYear()) + String(date.getMonth()+1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
	if (typeof(this.puzzleList[0]) == 'string') {
	    code = this.puzzleList.shift();
	    this.daily = false;
	} else {
	    for (var p of this.puzzleList) {
		if (p[0] == today) {
		    code = p[1];
		    break;
		}
	    }
	    this.daily = true;
	}
	if (code != '') {
	    if (this.daily) {
		document.getElementById("title-heading").innerHTML = "Percy's Puzzle of the Day<br\>"+
		    today.substring(4,6)+"/"+today.substring(6,8)+"/"+today.substring(0,4);
	    }
	    this.newPuzzle(code);
	}
    }

    initializePuzzle() {
	super.initializePuzzle();

	const nd = document.getElementById("nextdiv");
	nd.style.position = "absolute";
	const left = window.innerWidth - 60;
	nd.style.left = `${left}px`;
	nd.style.top = "32px";

	const v = document.getElementById('variety');
	v.onclick = this.onVarietyMouseClick.bind(this);
	v.style.cursor = "pointer";

	const n = document.getElementById("next");
	n.style.cursor = "pointer"
	n.style.visibility = 'hidden';

	const b = document.getElementById("hint");
	b.style.cursor = "default"

	if (this.puzzleParameter === null)
	    document.getElementById("solve-button").remove()
	else {
	    document.getElementById("solve").style.cursor = "pointer"
	}
    }

    newPuzzle( goal = null) {
	super.newPuzzle(goal);

	this.contactDisplay = 'map';
	this.score = 0;
	this.highScore = 0;
	this.hintMoves = [];
	this.shuffleColors();
	this.configureContact();

	document.getElementById("next").style.visibility = 'hidden';
    }
	
    configurePuzzle() {
	super.configurePuzzle();

	this.goal.maxScore = this.numContacts * this.pointsPerContact
	    + 2 * (this.width + this.height) * this.pointsPerBoundary
	    + (this.goal.symmetry != '' ? this.pointsPerSymmetry : 0);
    }

    update(doRender = true) {
	super.update(false);

	var v_score = 0;
	for (var i = 0; i < this.variety.length; i++) {
	    v_score += this.variety[i] == this.goal.variety[i] ? 1 : 0;
	}
	this.score = this.contactsMade * this.pointsPerContact + v_score * this.pointsPerBoundary + (this.symmetry != '' ? this.pointsPerSymmetry : 0);

	if (this.history.length > 0)
	    this.history[this.history.length - 1].score = this.score;
	else
	    this.initialScore = this.score;

	if (this.score > this.highScore) {
	    this.highScore = this.score;
	}

	// Hint is available if score has been at least half of highScore
	const hint = document.getElementById("hint");
	hint.disabled = this.hintMoves.length == this.MAX_HINTS || this.highScore * 2 < this.goal.maxScore || this.isSolved || this.animating;
	hint.style.cursor = hint.disabled ? "default" : "pointer";

	const undo = document.getElementById("undo");
	undo.disabled = this.history.length == 0 || this.hintMoves.some((m) => m == this.history.length) || this.isSolved || this.animating;
	undo.style.cursor = undo.disabled ? "default" : "pointer";

	const solve = document.getElementById("solve");
	if (solve !== null) {
	    solve.disabled = this.isSolved || this.animating;
	    solve.style.cursor = solve.disabled ? "default" : "pointer";
	}

	if (doRender)
	    this.render();
    }

    renderProgress(ch) {
	this.contactDisplay == 'graph' ? this.renderGraph(ch) : this.renderMap(ch);
    }

    renderGraph(ch) {
	ch.clear();

	const size = this.size / ch.scale;
	const maxX = this.history.length;
	const minY = Math.min(Math.min(...this.history.map((y) => y.score)), this.initialScore);
	const maxY = this.goal.maxScore - minY;
	const zeroX = 5;
	const zeroY = this.height * size - 5;
	const yLength = this.height * size - 10
	const xLength = this.width * size - 2 * zeroX;

        ch.ctx.lineWidth = 3;
        ch.ctx.strokeStyle = "#ffffff";
	ch.line(zeroX, zeroY, zeroX, zeroY - 2 - yLength);
	ch.line(zeroX, zeroY, zeroX + xLength, zeroY);

        ch.ctx.lineWidth = 1;
        ch.ctx.strokeStyle = this.colors['match'];
	ch.line(zeroX, zeroY - 2 - yLength, zeroX + 2 + xLength, zeroY - 2 - yLength);

	ch.ctx.lineWidth = 2;
        ch.ctx.strokeStyle = this.colors['match'];
	ch.ctx.moveTo(zeroX - 1, zeroY - 2 - (this.initialScore - minY) * yLength / maxY);
	ch.ctx.lineTo(zeroX + 2, zeroY - 2 - (this.initialScore - minY) * yLength / maxY);

	const bound = this.flashInterval !== null ? Math.min(this.flashCount / this.flashTime, 1) * this.history.length : this.history.length;
	for (var x = 0; x < bound; x++) {
	    const s = zeroY - 2 - (this.history[x].score - minY) * yLength / maxY;
	    if (this.history.length < 10) {
		ch.ctx.lineTo(zeroX + 2 + (x + 1) * xLength / 10, s);
	    } else {
		ch.ctx.lineTo(zeroX + 2 + (x + 1)  * xLength / this.history.length, s);
	    }
	}
	ch.ctx.font = "16px sans-serif";
	ch.ctx.stroke();

	ch.ctx.fillStyle = "#ffffff";
	ch.ctx.textAlign = "right";
	ch.ctx.fillText(`${this.history.length}`, zeroX + xLength, zeroY - 5);
	ch.ctx.textAlign = "left";
	ch.ctx.fillText(`${this.score}/${this.goal.maxScore}`, zeroX + 5, zeroY - yLength + 15);

	ch.ctx.lineWidth = Math.max(Math.min(1, Math.floor(xLength/Math.max(this.history.length, 1))),3);
	ch.ctx.strokeStyle = this.colors['hint'];
	for (var m of this.hintMoves) {
	    if (m <= bound) {
		var x;
		if (this.history.length < 10) {
		    x = zeroX + 2 + m * xLength / 10;
		    ch.line(x, zeroY, x, zeroY - 2 - (this.history[m-1].score - minY) * yLength / maxY);
		} else {
		    x = zeroX + 2 + m * xLength / this.history.length;
		    ch.line(x, zeroY, x, zeroY - 2 - (this.history[m-1].score - minY) * yLength / maxY);
		}
	    }
	}
    }

    setSolved(solved) {
	super.setSolved(solved);
	if (solved == true && this.puzzleList !== null && this.puzzleList.length > 0) {
	    document.getElementById("next").style.visibility = this.daily ? "hidden" : 'visible';
	}
    }

    flashBoard() {
	super.flashBoard();
	this.contactDisplay = 'graph';
	this.renderGraph(this.vch);
    }

    flashColors() {
	if (this.symmetry == '') {
	    super.flashColors();
	    return;
	}

	const i0 = parseInt(this.symmetry[1]);
	const i1 = parseInt(this.symmetry[2]);
	const i2 = 3 - i0  -i1;
	const c0 = this.colors[i0];
	this.colors[i0] = this.colors[i1];
	this.colors[i1] = c0;
	var h = parseInt(this.colors[i2].substring(1),16);
	var hs = (0xffffff - h).toString(16);
	while (hs.length < 6) {
	    hs = '0' + hs;
	}
	this.colors[i2] = '#' + hs;
    }

    onVarietyMouseClick(e) {
	this.contactDisplay = this.contactDisplay == 'map' ? 'graph' : 'map';
	this.contactDisplay == 'map' ? this.renderMap(this.vch) : this.renderGraph(this.vch);
    }

    onUndo( untilMove = null) {
	if (this.hintMoves.some((m) => m > (untilMove == null ? this.history.length - 1 : untilMove))) {
	    return;
	}
	super.onUndo(untilMove);
    }

    onHint() {
	if (this.animating) {
	    return;
	}
	if (this.hintMoves.length == this.MAX_HINTS)
	    return;

	// Add correct tiles to hints
	// decrease the number of incorrect tiles by 25%
	//
	var unfrozen = [];
	this.hintMoves.push(this.history.length);
	for (var i = 0; i < this.tiles.length; i++) {
	    if (this.frozen.includes(i)) {
		continue;
	    }
	    if (this.tiles[i] == this.goal.tiles[i]) {
		this.hints.push(i);
		continue;
	    }
	    unfrozen.push(i);
	}

	var toFreeze = Math.min(Math.floor((this.tiles.length - this.frozen.length) / 4), this.tiles.length - this.frozen.length -this.hints.length - 3);
	while (toFreeze > 0) {
	    const unfrozenIndex = Math.floor(Math.random() * unfrozen.length);
	    const correctTileIndex = unfrozen[unfrozenIndex];
	    unfrozen[correctTileIndex] = unfrozen[unfrozen.length - 1];
	    unfrozen.pop();

	    var replacementIndex = -1;
	    for (var i = 0; i < this.tiles.length; i++) {
		if (new Tile(this.tiles[i]).rotations_of().includes(this.goal.tiles[correctTileIndex])) {
		    replacementIndex = i;
		    break;
		}
	    }
	    // if the same, then tile can be overwritten with correctTile
	    // Otherwise swap
	    if ( correctTileIndex == replacementIndex) {
		this.tiles[correctTileIndex] = this.goal.tiles[correctTileIndex];
	    } else {
		this.tiles[replacementIndex] = this.tiles[correctTileIndex];
		this.tiles[correctTileIndex] = this.goal.tiles[correctTileIndex];
	    }
	    this.hints.push(correctTileIndex);
	    toFreeze--;
	}
	
	this.update();
    }

    onSolve() {
	const confirmSolve = confirm("Solve the puzzle? (loses current partial solution)");
	if (confirmSolve)
	    this.animateSolve();
    }

    onNext() {
	if (this.daily || this.animating)
	    return;
	if (this.puzzleList !== null && this.puzzleList.length > 0) {
	    this.newPuzzle(this.puzzleList.shift());
	}
    }

    onKeydown(event) {
	if (event.key == 'n' && event.ctrlKey) {
	    event.preventDefault();
	    this.onNext();
	    return;
	}
	super.onKeydown(event);
    }
}

class MacMahonParamsPuzzle extends MacMahonPuzzle {
    constructor(opts = null) {
	super(opts);

	this.solveInterval = null;

        const queryString = window.location.search;
	var goal = new GoalConfiguration('');
	if ( queryString == '' ) {
	    goal.setAnyGoal( '24', '4x6', '00000000000000000000', C111, '');
	    document.getElementById('puzzlename').innerHTML="The Classic MacMahon Squares Puzzle";
	} else {
            const urlParams = new URLSearchParams(queryString);
            
            const tiles = urlParams.get('tiles');
            const dims = urlParams.get('dims');
	    const variety = urlParams.get('variety');
	    const contact = urlParams.get('contact')
	    const symmetry = urlParams.get('symmetry');

	    goal.setAnyGoal( tiles, dims, variety, ContactMap[contact], symmetry == null ? '' : symmetry);
	}
	this.run( goal);
    }
}
