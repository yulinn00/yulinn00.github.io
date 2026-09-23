var pathCv = null;

class PuzzleCanvas extends Canvas2d {
    constructor(canvas, sizes) {
	super(canvas, makeTiles(), canvasColor, sizes);
	this.start_cp = null;
	this.end_cp = null;
	this.longestPath = [];
	this.solved = false;
	this.movesToSolve = 0;
	this.highScore = 0;
	this.currentScore = 0;
	this.hintUsed = false;
    }

    cn_to_cp(cn) {
	var r, c, s;
	if (cn < 2 * width + 1) {
	    r = 0;
	    c = cn == 0 ? 0 : Math.floor((cn - 1) / 2);
	    s = cn == 0 ? 7 : (cn - 1) % 2;
	} else {
	    const row_start = cn - 2 *  width - 1;
	    r = Math.floor(row_start / (width + 1 + 2 * width + 1));
	    var col_start = row_start % (width + 1 + 2 * width + 1);
	    if (col_start < 1 + width) {
		c = col_start == 0 ? 0 : Math.floor( col_start / 2);
		s = col_start == 0 ? 6 : 2;
	    } else {
		col_start -= 1 + width;
		c = col_start == 0 ? 0 : Math.floor((col_start - 1) / 2);
		s = col_start == 0 ? 5 : 3 + col_start % 2;
	    }
	}
	return [r + 1,c + 1,s];
    }
    

    fromStringCode(code) {
	const m = code.match(/(?<code>.[^.]*)[.](?<frozen>[0123456789abcdefABCDEF]*)/);

	const frozen = parseInt(m.groups.frozen,16);

	super.fromStringCode(m.groups.code);
	this.solutionCode = toStringCode(this.tiles); // use toStringCode to normalize code
	
	for (var tile of this.tiles) {
	    if (tile == null || tile.r < 1 || tile.r > height || tile.c < 1 || tile.c > width) continue;
	    var cps = [];
	    this.tiles_in_path = [tile];
	    for (var s0 of tile.lines_at) {
		var cp0;
		var next_cp = [tile.r, tile.c, s0];
		while (next_cp != null) {
		    cp0 = next_cp;
		    next_cp = null;
		    for (var t of this.tiles) {
			if (t.r == cp0[0] && t.c == cp0[1]) continue;
			if (t.r < 1 || t.r > height || t.c < 1 || t.c > width) continue;
			const s = this.isAdjacentAt(cp0[0], cp0[1], cp0[2], t.r, t.c);
			if (t.lines_at[0] == s) {
			    next_cp = [t.r, t.c, t.lines_at[1]];
			    this.tiles_in_path.push(t);
			    break;
			} else if (t.lines_at[1] == s) {
			    next_cp = [t.r, t.c, t.lines_at[0]];
			    this.tiles_in_path.push(t);
			    break;
			}
		    }
		}
		cps.push(cp0);
	    }
	    break;
	}
	[this.start_cp, this.end_cp] = cps;

	this.maxScore = 0;
	this.puzzleCode = '';
	var f = 1;
	for (var ch of this.solutionCode) {
	    this.maxScore += ch == 'z' ? 0 : (frozen & f) ? 4 : 1;
	    //this.puzzleCode += ch == 'z' ? 'Z' : (frozen & f) ? ch : 'z';
	    this.puzzleCode += (ch == 'z' || ch == 'Z') ? ch : ((frozen & f) ? ch : 'z');
	    f <<= 1;
	}
	super.fromStringCode(this.puzzleCode);
	
	this.tiles.forEach((t) => {
	    if (1 <= t.r && t.r <= height && 1 <= t.c && t.c <= width) t.frozen = true;
	});
	this.updatePaths();
	this.drawBoard();
    }

    drawBoard() {
	const showMoves = true;
	super.drawBoard();

	const moves_after_hint = this.hintUsed ? this.calculateMoves(true) : 0;
	document.getElementById("moves").innerHTML = showMoves ? (`Moves: ${this.solved ? this.movesToSolve : this.calculateMoves()}` + (moves_after_hint > 0 ? ` (${moves_after_hint} after hint)` : '')) : '';
	//document.getElementById("currentscore").innerHTML = this.solved ? '' : `Current Score: ${this.currentScore}` + (showMoves ? `,  Moves: ${moveHistory.length}` : '');
	if (pathCv != null) pathCv.drawBoard();
    }

    calculateMoves(afterHint = false) {
	var moves = 0;
	for (var m of moveHistory) {
	    if (m.type == 'noundo') continue;
	    if (m.type == 'hint') {
		if (afterHint) moves = 0;
	    } else if (m.type != 'rot') {
		moves += 1;
	    } 
	}
	return moves;
    }

    pathScore(path) {
	const points = path.map((t) => t.frozen ? 4 : 1);
	var score = 0;
	for (var p of points) {
	    score += p;
	}
	return score;
    }


    update() {
	super.update();

	const code = toStringCode(this.tiles);
	
	if (!this.solved && [...this.solutionCode].every((c,i) => c == 'z' || c == code.charAt(i))) {
	    this.tiles.forEach((t) => {
		if (1 <= t.r && t.r <= height && 1<= t.c && t.c <= width && this.solutionCode.charAt(t.c - 1 + (t.r - 1) * width) != 'z') t.frozen = true;
	    });
	    this.movesToSolve = this.calculateMoves();
	    moveHistory.push({type: 'noundo'});
	    this.tiles = this.tiles_in_path;
	    this.solved = true;
	}
    }

    colorPaths() {
	this.ctx.lineWidth = this.solved ? 6 : 3;
	this.ctx.strokeStyle = this.solved ? 'LimeGreen' : 'ForestGreen';
	this.ctx.lineCap = 'round';
	for (var cpPath of this.paths) {
	    var atx = 0;
	    var aty = 0;
	    for (var tile of cpPath.path) {
		[atx, aty] = centerCoords(tile.r, tile.c);
		for (var i = 0; i < tile.lines_at.length; i++) {
		    this.line(atx, aty, atx + endpointCoords[tile.lines_at[i]][0], aty + endpointCoords[tile.lines_at[i]][1]);
		}
	    }
	}

	if (this.start_cp == null)
	    return;

	var startCp = this.start_cp;;
	var xy = centerCoords(startCp[0], startCp[1]);
	this.ctx.lineWidth = 0;
	this.ctx.fillStyle = this.solved ? 'LimeGreen' : 'Green';
	this.arc(xy[0] + endpointCoords[startCp[2]][0], xy[1] + endpointCoords[startCp[2]][1], nodeRadius, 0, 2 * Math.PI,true);

	startCp = this.end_cp;;
	xy = centerCoords(startCp[0], startCp[1]);
	this.arc(xy[0] + endpointCoords[startCp[2]][0], xy[1] + endpointCoords[startCp[2]][1], nodeRadius, 0, 2 * Math.PI,true);

    }


    endOfPath(start, path) {
	var end_cp;
	if (this.areAdjacentConnectionPoints(start[0], start[1], start[2],
					     path[0].r, path[0].c, path[0].lines_at[0])) {
	    end_cp = [path[0].r, path[0].c, path[0].lines_at[1]];
	}
	else if (this.areAdjacentConnectionPoints(start[0], start[1], start[2],
						  path[0].r, path[0].c, path[0].lines_at[1])) {
	    end_cp = [path[0].r, path[0].c, path[0].lines_at[0]];
	} else {
	    return null;
	}
	return path.length == 1 ?  end_cp : this.endOfPath(end_cp, path.slice(1));
    }


    findLongestCpPath(startCp, previousPath = []) {
	const nextCpList = this.nextCpAtCp(startCp, true);
	var longest = [];
	const stop = startCp == this.start_cp ? this.end_cp : this.start_cp;
	for (var nextCp of nextCpList) {
	    if (previousPath.some((cp) => this.areAdjacentConnectionPoints(...cp, ...nextCp))) continue;

	    const path = previousPath.length == 0 ? [startCp] : [...previousPath];
	    path.push(nextCp)
	    const nextPath = this.areAdjacentConnectionPoints(...stop, ...nextCp) ? path : this.findLongestCpPath(nextCp, path);
	    if (nextPath.length >= longest.length) longest = nextPath;
	}
	return longest.length == 0 ? previousPath : longest;
    }

    cpPathToTiles(cpPath) {
	const tiles = [];
	for ( var cp of cpPath.slice(1)) {
	    tiles.push(this.tileAt( cp[0], cp[1]));
	}
	return tiles;
    }



    updatePaths(longestOnly = false) {
	this.paths = [];
	var startPath = this.start_cp != null ? this.cpPathToTiles(this.findLongestCpPath(this.start_cp)) : [];
	var endPath = this.end_cp != null ? this.cpPathToTiles(this.findLongestCpPath(this.end_cp)) : [];
	if (longestOnly) {
	    var path = startPath.length == 0 ? endPath : (endPath.length == 0 ? startPath : (startPath.length >= endPath.length ? startPath : endPath));
	    if (path.length != 0) {
		this.paths.push({cp: this.start_cp, end_cp: this.endOfPath(this.start_cp, path), path: path, color: 'Green'});
	    }
	    this.currentScore = this.pathScore(path);
	    if ( this.currentScore > this.highScore) {
		this.longestPath = path.map((t) => t.copy());
		this.highScore = this.currentScore;
		this.movesToSolve = moveHistory.length;
	    }
	    return;
	}
	if (startPath.length != 0) {
	    this.paths.push({cp: this.start_cp, end_cp: this.endOfPath(this.start_cp, startPath), path: startPath, color: 'Green'});
	    if  (this.paths[0].end_cp.every((x, i) => x == this.end_cp[i]))
		return;
	}
	if (endPath.length != 0) {
	    this.paths.push({cp: this.end_cp, end_cp: this.endOfPath(this.end_cp, endPath), path: endPath, color: 'Red'});
	}
    }


    onHint() {
	this.tiles = this.tiles_in_path;
	moveHistory.push({type: 'hint'});
	this.hintUsed = true;
	this.drawBoard();
	document.getElementById("hint").disabled = true;
    }

    colorPolygons() {
    }

    updatePolygons() {
    }

}

class PathCanvas extends PuzzleCanvas {
    constructor(canvas, sizes = [30, 40, 1, 3, 2, 4]) {
	super(canvas, sizes);
	this.start_cp = cv.start_cp;
	this.end_cp = cv.end_cp;
	this.tiles = [];
	cv.tiles.forEach((t) => {
	    if (t.frozen) this.tiles.push(t);
	    else this.tiles.push(null);
	});

	this.drawBoard();
    }

    drawBoard() {
	const oldSizes = resize(...this.sizes);
	this.clear();
	this.ctx.fillStyle = frameColor;
	this.ctx.strokeStyle = 'black'
	this.ctx.lineWidth = 0.5;
	this.fillPoly(
	    [centerCoords(0, 0)[0] + endpointCoords[3][0], centerCoords(0,0)[1] + endpointCoords[3][1]],
	    [centerCoords(0, width + 1)[0] + endpointCoords[5][0], centerCoords(0, width + 1)[1] + endpointCoords[5][1]],
	    [centerCoords(height + 1, width + 1)[0] + endpointCoords[7][0], centerCoords(height + 1, width + 1)[1] + endpointCoords[7][1]],
	    [centerCoords(height + 1, 0)[0] + endpointCoords[1][0], centerCoords(height + 1, 0)[1] + endpointCoords[1][1]]);
	this.ctx.fillStyle = boardColor;
	this.fillPoly(
	    [centerCoords(1, 1)[0] + endpointCoords[7][0], centerCoords(1,1)[1] + endpointCoords[7][1]],
	    [centerCoords(1, width)[0] + endpointCoords[1][0], centerCoords(1, width)[1] + endpointCoords[1][1]],
	    [centerCoords(height, width)[0] + endpointCoords[3][0], centerCoords(height, width)[1] + endpointCoords[3][1]],
	    [centerCoords(height, 1)[0] + endpointCoords[5][0], centerCoords(height, 1)[1] + endpointCoords[5][1]]);

	for (var t of this.tiles) {
	    if (t != null)
		drawTile(this, t);
	}

	this.ctx.lineWidth = cv.solved ? 4 : 2;
	this.ctx.strokeStyle = cv.solved ? 'LimeGreen' : 'Green';
	this.ctx.lineCap = 'round';
	var atx = 0;
	var aty = 0;
	for (var path of cv.paths) {
	    for (var tile of path.path) {
		[atx, aty] = centerCoords(tile.r, tile.c);
		for (var i = 0; i < tile.lines_at.length; i++) {
		    this.line(atx, aty, atx + endpointCoords[tile.lines_at[i]][0], aty + endpointCoords[tile.lines_at[i]][1]);
		}
	    }
	}

	var startCp = this.start_cp;;
	var xy = centerCoords(startCp[0], startCp[1]);
	this.ctx.lineWidth = 0;
	this.ctx.fillStyle = cv.solved ? 'LimeGreen' : 'Green';
	this.arc(xy[0] + endpointCoords[startCp[2]][0], xy[1] + endpointCoords[startCp[2]][1], nodeRadius, 0, 2 * Math.PI,true);

	startCp = this.end_cp;;
	xy = centerCoords(startCp[0], startCp[1]);
	this.arc(xy[0] + endpointCoords[startCp[2]][0], xy[1] + endpointCoords[startCp[2]][1], nodeRadius, 0, 2 * Math.PI,true);

	if (cv.solved) {
	    this.ctx.font = "40px Arial";
	    this.ctx.textAlign = "center";
	    this.ctx.fillStyle = "white";
	    this.ctx.strokeStyle = "black";
	    this.ctx.lineWidth = 1;

	    this.ctx.strokeText("Solved", canvasWidth / 2, canvasHeight - 8);
	}

	resize(...oldSizes);
    }
}


function isValidPathStringCode(code) {
    const m = code.match(/(?<code>.[^.]*)[.](?<frozen>[0123456789abcdefABCDEF]*)/);

    return m != null && isValidStringCode(m.groups.code) && m.groups.frozen.length == 4;
}


function runDates(puzzleList = null) {
    this.puzzleList = puzzleList;
    var tilingCode = ''
    var daily = false;
    const date = new Date();
    const today = String(date.getFullYear()) + String(date.getMonth()+1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
    if (typeof(this.puzzleList[0]) == 'string') {
	tilingCode = this.puzzleList.shift();
	daily = false;
    } else {
	for (var p of this.puzzleList) {
	    if (p[0] == today) {
		tilingCode = p[1];
		break;
	    }
	}
	daily = true;
    }

    if (tilingCode == null || tilingCode == '' || !isValidPathStringCode(tilingCode)) {
	window.alert(tilingCode == null ? 'No new puzzle list' : 'Bad tiling code')
	tilingCode = "GPNijzhFMCOeALkB.2000";
    }
    else
    if (daily) {
	document.getElementById("title-heading").innerHTML = "Tangle of the Day<br\>"+
	    today.substring(4,6)+"/"+today.substring(6,8)+"/"+today.substring(0,4);
    }

    runPath("board", tilingCode, true);
}


function runPath(canvasId, tilingCode = null, includeHandlers = true) {
    colors = ['black', 'lightyellow', 'white', 'blue', 'silver'];
    recolor(...colors);
    sizes = [75, 100, 1, 6, 4, 10];
    resize(...sizes);

    if (tilingCode === null || !isValidPathStringCode(tilingCode)) {
	window.alert(tilingCode == null ? 'No new puzzle list' : 'Bad tiling code')
	tilingCode = "GPNijzhFMCOeALkB.2000";
    }

    cv = new PuzzleCanvas(document.getElementById(canvasId), sizes);
    cv.fromStringCode(tilingCode);
    pathCv = new PathCanvas(document.getElementById("puzzle"));
    if (includeHandlers) {
	initializeHandlers(cv);
    }
}

function showPath(canvasId, tilingCode = null, includeHandlers = false) {
    colors = ['black', 'lightyellow', 'white', 'blue', 'silver'];
    recolor(...colors);
    sizes = [30, 40, 1, 2, 1, 3];
    resize(...sizes);

    if (tilingCode === null || !isValidPathStringCode(tilingCode)) {
	window.alert(tilingCode == null ? 'No new puzzle list' : 'Bad tiling code')
	tilingCode = "GPNijzhFMCOeALkB.2000";
    }

    cv = new PuzzleCanvas(document.getElementById(canvasId), sizes);
    cv.fromStringCode(tilingCode);
    pathCv = new PathCanvas(document.getElementById("puzzle"), [12, 15, 0.5, 1, 0.5, 2]);
    if (includeHandlers) {
	initializeHandlers(cv);
    }
}

