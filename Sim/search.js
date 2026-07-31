FIRST_PLAYER = 0;
SECOND_PLAYER = 1;

FIRST_PLAYER_COLOR = 'red';
SECOND_PLAYER_COLOR = 'blue';
NONE = '';

// Tree search algorithm Values:
FIRST_WIN = 2;
FIRST_NOT_ENOUGH_PLIES = 1;
TIE = 0;
SECOND_NOT_ENOUGH_PLIES = -1;
SECOND_WIN = -2;

NOT_ENOUGH_PLIES = 1;

SecondMove = {ADJACENT: 0, DISJOINT: 1, ADJACENT_MATCHING: 4, ADJACENT_OPPOSITE: 4, DISJOINT_MATCHING: 5, DISJOINT_MATCHING: 6, DISJOINT_OPPOSITE: 7, RANDOM: 8, SEARCH: 9};


class Edge {
    constructor(v1, v2, color = NONE, triangle_on = []) {
        this.vertices = v1 < v2 ? [v1, v2] : [v2, v1];
        this.triangle_on = triangle_on;
        this.clear(color);
    }

    clear(color = NONE) {
        this.color = color;
    }
}

MAX_SIM_PLYS = 19;
class SimGame {

    calculateWinningMoves() {
	const allMoves = [...this.edge_iter];
	const numPlayed = this.num_edges - allMoves.filter(e => e.color === NONE).length;
	var move;
	var value;

	if (numPlayed === 0) {
            const moves = [];
	    allMoves.forEach((e) => { moves.push([e, NONE]);});
	    this.winningLosingMoves = {winning: [], losing: moves};
	    return;
	}

	/***
	if (numPlayed == 1) {
            const moves = [];
	    allMoves.forEach((e) => { if (e.color == NONE) moves.push([e, NONE]);});
	    this.winningLosingMoves = {winning: moves, losing: []};
	    return;
	}
	***/

	var wins = [];
	var losses = [];
	var player = numPlayed % 2 == 0 ? FIRST_PLAYER : SECOND_PLAYER;
	var color = player == FIRST_PLAYER ? FIRST_PLAYER_COLOR : SECOND_PLAYER_COLOR;
	var playerMoves = allMoves.filter((e) => e.color == NONE);
	for (var e of playerMoves) {
	    var m, v;
	    if (e.triangle_on.some((side) => side[0].color == color && side[1].color == color)) {
		losses.push([e, NONE]);
		continue;
	    }
	    e.color = color;
	    [m, v] = this.searchTreeAlgorithm(playerMoves.length, true);
	    e.color = NONE;
	    if (player == FIRST_PLAYER) {
		if (v == FIRST_WIN)
		    wins.push([e, NONE]);
		else if (v == SECOND_WIN)
		    losses.push([e, NONE]);
	    } if (player == SECOND_PLAYER) {
		if (v == FIRST_WIN)
		    losses.push([e, NONE]);
		else if (v == SECOND_WIN)
		    wins.push([e, NONE]);
	    }
	}
	this.winningLosingMoves = {winning: wins, losing: losses};
	return;
    }

    
    constructor(num_vertices) {
	this.num_vertices = num_vertices;
	this.edges = [];
	this.search_edges = [];
	this.num_edges = this.num_vertices * (this.num_vertices - 1) / 2;
	for (var i = 0; i < this.num_vertices; i++) {
	    this.edges.push([]);
	    this.search_edges.push([]);
	    for (var j = 0; j < this.num_vertices; j++ ) {
		this.edges[i].push(i<j ? new Edge(i,j) : null);
		this.search_edges[i].push(i<j ? new Edge(i,j) : null);
	    }
	}

	this.edge_iter = this.edges.flat().filter((e) =>e !== null);
	this.search_edge_iter = this.search_edges.flat().filter((e) =>e !== null);


	for (var i = 0; i < this.num_vertices; i++) {
	    for (var j = 0; j < i; j++ ) {
		this.edges[i][j] = this.edges[j][i];
		this.search_edges[i][j] = this.search_edges[j][i];
	    }
	}

	this.triangles = [];
	this.search_triangles = [];
	for (var i = 0; i < this.num_vertices; i++) {
	    for (var j = i + 1; j < this.num_vertices; j++ ) {
		for (var k = j + 1; k < this.num_vertices; k++ ) {
		    this.triangles.push([this.edges[i][j], this.edges[j][k], this.edges[i][k]]);
		    this.search_triangles.push([this.search_edges[i][j], this.search_edges[j][k], this.search_edges[i][k]]);
		}
	    }
	}
	for (var t of this.triangles) {
	    t[0].triangle_on.push([t[1], t[2]]);
	    t[1].triangle_on.push([t[0], t[2]]);
	    t[2].triangle_on.push([t[0], t[1]]);
	}
	for (var t of this.search_triangles) {
	    t[0].triangle_on.push([t[1], t[2]]);
	    t[1].triangle_on.push([t[0], t[2]]);
	    t[2].triangle_on.push([t[0], t[1]]);
	}

	this.clear();
    }

    edgeFromSearchEdge(se) {
	return this.edges[se.vertices[0]][se.vertices[1]];
    }

    getWinner() {
	if ( this.losingTriangle.length == 0)
	    return this.remainingEdges() == 0 ? TIE  : 'game not over';
	return this.losingTriangle[0].color == SECOND_PLAYER_COLOR ? FIRST_WIN : SECOND_WIN;
    }

    gameOver() {
	return this.losingTriangle.length || this.remainingEdges() == 0;
    }


    findLosingTriangle() {
	for (var t of this.triangles) {
	    if (t[0].color == t[1].color && t[1].color == t[2].color && t[0].color != NONE)
		return t;
	}
	return [];
    }

    remainingEdges() {
	return this.num_edges - this.move_history.length;
    }
    
    clear() {
	for (var e of this.edge_iter) {
	    e.clear();
	}
	this.move_history = [];
	this.playerToMove = FIRST_PLAYER;
	this.losingTriangle = [];
	this.calculateWinningMoves();
    }

    make_move(e) {
	if (e.color == NONE)
	    e.color = this.playerColor(this.playerToMove);
	this.move_history.push(e);
	this.playerToMove = this.otherPlayer(this.playerToMove);
	this.losingTriangle = this.findLosingTriangle();
    }
    
    undo_move() {
	if (this.move_history.length == 0)
	    return;
	const e = this.move_history.pop();
	e.color = NONE;
	this.losingTriangle = this.findLosingTriangle();
	this.playerToMove = this.otherPlayer(this.playerToMove);
	return e;
    }
    
    otherPlayer(player) {
	return player == FIRST_PLAYER ? SECOND_PLAYER: FIRST_PLAYER;
    }


    playerColor(player) {
	return player == FIRST_PLAYER ? FIRST_PLAYER_COLOR : SECOND_PLAYER_COLOR;
    }

    oppositeColor(color) {
	return color == FIRST_PLAYER_COLOR ? SECOND_PLAYER_COLOR : FIRST_PLAYER_COLOR;
    }

    searchTreeAlgorithm(maxPlys, returnValue = false) {
	const search = (player, ply = 1) => {
            const color = this.playerColor(player);

            if (ply > Math.min(maxPlys, MAX_SIM_PLYS)) {
		if ( allMoves.filter((e) => e.color == NONE && !e.triangle_on.some(
                    toe => toe[0].color === color && toe[1].color === color)).length == 0)
                    return [
			null,
			player === FIRST_PLAYER ? SECOND_WIN : FIRST_WIN
                    ];

		return [
                    null,
                    player === FIRST_PLAYER
			? FIRST_NOT_ENOUGH_PLIES
			: SECOND_NOT_ENOUGH_PLIES
		];
            }

            let optimalMove = null;
            let optimalValue = player === FIRST_PLAYER ? SECOND_WIN : FIRST_WIN;

	    var moves = 0;
	    var bad_moves = 0;
            for (const m of allMoves) {
		if (m.color != NONE)
		    continue;
		if (m.triangle_on.some(toe => toe[0].color === color && toe[1].color === color)) {
		    bad_moves += 1;
		    continue;
		}
		moves += 1;
		m.color = color;
		const [, value] = search(
                    this.otherPlayer(player),
                    ply + 1
		);
		m.color = NONE;

		if (player === FIRST_PLAYER) {

                    if (value === FIRST_WIN) {
			return [m, FIRST_WIN];
                    }

                    if (value > optimalValue) {
			optimalMove = m;
			optimalValue = value;
                    }

		} else {

                    if (value === SECOND_WIN) {
			return [m, SECOND_WIN];
                    }

                    if (value < optimalValue) {
			optimalMove = m;
			optimalValue = value;
                    }
		}
            }
            if (moves == 0) {
		if (bad_moves > 0)
		    optimalValue = player === FIRST_PLAYER ? SECOND_WIN : FIRST_WIN;
		else {
		    return [null, TIE];
		}
            }

            return [optimalMove, optimalValue];
	}

	for (var i = 0; i < this.num_vertices; i++) {
	    for (var j = 0; j < i; j++ ) {
		this.search_edges[i][j].color = this.edges[i][j].color;
	    }
	}
	const allMoves = [...this.search_edge_iter];

	const numPlayed = this.num_edges - allMoves.filter(e => e.color === NONE).length;
	var move;
	var value;
	const playerToMove = numPlayed % 2 == 0 ? FIRST_PLAYER : SECOND_PLAYER;

	if (numPlayed === 0) {
            const move = randomChoice(
		[...this.edge_iter].filter(e => e.color == NONE));
		
            return returnValue ? [move, 0] : move;
	}

	// 7 vertices: Optimal player two move: DISJOINT, ADJACENT
	if (this.num_vertices == 7 && numPlayed === 1) {
	    const secondMove = SecondMove.RANDOM;

            const m = randomChoice(
		[...this.edge_iter].filter(e => e.color !== NONE)
            );

            const vs = [];
            for (let v = 0; v < this.num_vertices; v++) {
		if (!m.vertices.includes(v)) {
                    vs.push(v);
		}
            }

            const adjacentEdge =
		  this.edges[randomChoice(m.vertices)][randomChoice(vs)];

            const shuffled = randomSample(vs, 2);
            const disjointEdge =
		  this.edges[shuffled[0]][shuffled[1]];

            if (secondMove === SecondMove.RANDOM) {

		move = Math.random() < 0.5
                    ? adjacentEdge
                    : disjointEdge;

		return returnValue ? [move, 0] : move;
            }

            move = secondMove === SecondMove.ADJACENT
                ? adjacentEdge
                : disjointEdge;

            return returnValue ? [move, 0] : move;
	}



	if (numPlayed + Math.min(maxPlys, MAX_SIM_PLYS) < this.num_edges) {
            const color = this.playerColor(playerToMove);
            const safeMoves = this.edge_iter.filter((e) =>
		e.color == NONE &&
		!e.triangle_on.some(
                    toe => toe[0].color === color && toe[1].color === color
		)
            );

            move = randomChoice(
		safeMoves.length > 0 ?
		    safeMoves :
		    allMoves.filter((e) => e.color == NONE)
            );
            return returnValue ? [move, NOT_ENOUGH_PLIES] : move;
	}

	// search runs on allMoves. It must not disturb edges in this.edges/edge_iter as they may be being used to update UI
	// the return move is an edge from allMoves which has a pointer back to original edge.
	[move, value] = search(
            playerToMove,
            1
	);

	if (move === null) {
            const color = this.playerColor(playerToMove);
            const safeMoves = allMoves.filter((e) =>
		e.color == NONE &&
		!e.triangle_on.some(
                    toe => toe[0].color === color && toe[1].color === color
		)
            );

            move = randomChoice(
		safeMoves.length > 0 ?
		    safeMoves :
		    allMoves.filter((e) => e.color == NONE)
            );
	}

	return returnValue ? [this.edgeFromSearchEdge(move), value] : this.edgeFromSearchEdge(move);
    }


    solve() {
        const plys = this.num_edges;
        const all_moves = [...this.edge_iter].filter((e) => e.color == NONE);
        const move1 = randomChoice(all_moves);
        move1.color = this.playerColor(FIRST_PLAYER);

        const vs = Array(length = this.num_vertices).fill(0).map((_, i) => i).filter((v) => !move1.vertices.includes(v));
        const adjacent_edge = this.edges[randomChoice(move1.vertices)][randomChoice(vs)];

        adjacent_edge.color = this.playerColor(SECOND_PLAYER);
        const [m2, adjacent_value] = this.searchTreeAlgorithm(plys, SecondMove.RANDOM, true);
        if (adjacent_value == SECOND_WIN) {
            return adjacent_value;
	}
        adjacent_edge.color = NONE;

        const [v0, v1] = randomSample(vs, 2);
        const disjoint_edge = this.edges[v0][v1];
        disjoint_edge.color = this.playerColor(SECOND_PLAYER);
        const [move2, disjoint_value] = this.searchTreeAlgorithm(plys, SecondMove.RANDOM, true);

        value = disjoint_value < adjacent_value ? disjoint_value : adjacent_value;
        return value;
    }

}

const MAX_TAG_PLYS = 20;
class TagGame extends SimGame {
    //
    // edge, COLOR1 COLOR2 each three bits, stored in a byte COLOR1 in high order nibble, COLOR2 in low order nibble, 0x01 = win, 0x02 = tie, 0x04 = loss
    //
    calculateWinningMoves() {
	const allMoves = [...this.edge_iter];
	const numPlayed = this.num_edges - allMoves.filter(e => e.color === NONE).length;
	var move;
	var value;

	if (numPlayed === 0) {
            const moves = [];
	    allMoves.forEach((e) => {
		moves.push([e, 0x11]);
		    });
	    this.winningLosingMoves = {winning: moves, losing: []};
	    return;
	}

	if (numPlayed == 1) {
            const moves = [];
	    allMoves.forEach((e) => {
		if (e.color == NONE) {
		    moves.push([e, 0x44]);
		}
	    });
	    this.winningLosingMoves = {winning: moves, losing: [] };
	    return;
	}

	if (numPlayed == 2) {
            const win_moves = [];
            const loss_moves = [];
	    const makes_triangle_edges = this.edge_iter.filter((e) => e.triangle_on.some((t) => this.move_history.every((e) =>t.includes(e))));
	    if (this.move_history[0].color == this.move_history[1].color) {
		allMoves.forEach((e) => {
		    if (e.color == NONE) {
			if (e.triangle_on.some((t) => this.move_history.every((e) => t.includes(e)))) {
			    // e on triangle with first two moves
			    win_moves.push([e, this.move_history[0].color == COLOR1 ? 0x41 : 0x14])
			    loss_moves.push([e, this.move_history[0].color == COLOR1 ? 0x41 : 0x14])
			} else {
			    win_moves.push([e, 0x11]);
			}
		    }
		});
	    } else {
		allMoves.forEach((e) => {
		    if (e.color == NONE) {
			win_moves.push([e, 0x11]);
		    }
		});
	    }
	    this.winningLosingMoves = {winning: win_moves, losing: loss_moves };
	    return;
	}

	var wins = [];
	var losses = [];
	var player = numPlayed % 2 == 0 ? FIRST_PLAYER : SECOND_PLAYER;
	var playerMoves = allMoves.filter((e) => e.color == NONE);
	for (var e of playerMoves) {
	    var m, v;
	    var move_color = 0x22;
	    for (var color of [COLOR1, COLOR2]) {
		if (e.triangle_on.some((side) => side[0].color == color && side[1].color == color)) {
		    move_color |= color == COLOR1 ? 0x40 : 0x04;
		    move_color &= color == COLOR1 ? 0x57 : 0x75;
		    continue;
		}
		e.color = color;
		[m, v] = this.searchTreeAlgorithm(playerMoves.length, true);
		e.color = NONE;
		if (player == FIRST_PLAYER) {
		    if (v == FIRST_WIN) {
			move_color |= color == COLOR1 ? 0x10 : 0x01;
			move_color &= color == COLOR1 ? 0x57 : 0x75;
		    } else if (v == SECOND_WIN) {
			move_color |= color == COLOR1 ? 0x40 : 0x04;
			move_color &= color == COLOR1 ? 0x57 : 0x75;
		    }
		} else {
		    if (v == FIRST_WIN) {
			move_color |= color == COLOR1 ? 0x40 : 0x04;
			move_color &= color == COLOR1 ? 0x57 : 0x75;
		    } else if (v == SECOND_WIN) {
			move_color |= color == COLOR1 ? 0x10 : 0x01;
			move_color &= color == COLOR1 ? 0x57 : 0x75;
		    }
		}
	    }
	    if ((move_color & 0x11) != 0)
		wins.push([e, move_color]);
	    if ((move_color & 0x44) != 0)
		losses.push([e, move_color]);
	}
	this.winningLosingMoves = {winning: wins, losing: losses};
	return;
    }

    
    constructor(num_vertices) {
	super(num_vertices);
    }

    getWinner() {
	if ( this.losingTriangle.length == 0)
	    return this.remainingEdges() == 0 ? TIE  : 'game not over';
	return [FIRST_WIN, SECOND_WIN][this.move_history.length % 2];
    }


    searchTreeAlgorithm(maxPlys, returnValue = false) {
	const search = (player, ply = 1) => {
            if (ply > Math.min(maxPlys, MAX_TAG_PLYS)) {
		if (allMoves.filter((m) => m.color == NONE && !(m.triangle_on.some(
                    toe => toe[0].color === COLOR1 && toe[1].color === COLOR1) && m.triangle_on.some(
			toe => toe[0].color === COLOR2 && toe[1].color === COLOR2))).length == 0)
                    return [
			null,
			player === FIRST_PLAYER ? SECOND_WIN : FIRST_WIN
                    ];

		return [
                    null,
                    player === FIRST_PLAYER
			? FIRST_NOT_ENOUGH_PLIES
			: SECOND_NOT_ENOUGH_PLIES
		];
            }

            let optimalMove = null;
            let optimalValue = player === FIRST_PLAYER ? SECOND_WIN : FIRST_WIN;

	    var moves = 0;
	    var bad_moves = 0;
            for (const m of allMoves) {
		if (m.color != NONE)
		    continue;
		var bad = 0;
		for (var color of [COLOR1, COLOR2]) {
		    if (m.triangle_on.some(toe => toe[0].color === color && toe[1].color === color)) {
			bad += 1;
			continue;
		    }
		    moves += 1;
		    m.color = color;
		    const [, value] = search(
			this.otherPlayer(player),
			ply + 1
		    );
		    m.color = NONE;
		    if (player === FIRST_PLAYER) {

			if (value === FIRST_WIN) {
			    return [[m,color], FIRST_WIN];
			}

			if (value > optimalValue) {
			    optimalMove = [m, color];
			    optimalValue = value;
			}

		    } else {

			if (value === SECOND_WIN) {
			    return [[m, color], SECOND_WIN];
			}

			if (value < optimalValue) {
			    optimalMove = [m, color];
			    optimalValue = value;
			}
		    }
		}
		if (bad == 2)
		    bad_moves += 1;
	    }
            if (moves == 0) {
		if (bad_moves == 0)
		    return [null, TIE];
            }

            return [optimalMove, optimalValue];
	}


	const allMoves = [...this.edge_iter];
	const numPlayed = this.num_edges - allMoves.filter(e => e.color === NONE).length;
	var move;
	var color = randomChoice([COLOR1, COLOR2]);
	var value;
	const playerToMove = numPlayed % 2 == 0 ? FIRST_PLAYER : SECOND_PLAYER;

	if (numPlayed === 0) {
            move = randomChoice(allMoves);
            return returnValue ? [[move, color], 0] : [move, color];
	}


	if (numPlayed + Math.min(maxPlys, MAX_TAG_PLYS) < this.num_edges) {
            const safeMoves = allMoves.filter((e) =>
		e.color == NONE &&
		    !(e.triangle_on.some(
			toe => toe[0].color === COLOR1 && toe[1].color === COLOR1) &&
		      e.triangle_on.some(
			  toe => toe[0].color === COLOR2 && toe[1].color === COLOR2)
		     )
            );
	    
            move = randomChoice(
		safeMoves.length > 0 ?
		    safeMoves :
		    allMoves.filter((e) => e.color == NONE)
            );
	    var colors = [COLOR1, COLOR2].filter((col) =>
		!move.triangle_on.some(
		    toe => toe[0].color === col && toe[1].color === col));
	    color = colors.length == 0 ? COLOR1 : randomChoice(colors);
            return returnValue ? [[move, color], NOT_ENOUGH_PLIES] : [move, color];
	}

	[move, value] = search(
            playerToMove,
            1
	);

	if (move === null) {
            const safeMoves = allMoves.filter((e) =>
		e.color == NONE &&
		!e.triangle_on.some(
                    toe => toe[0].color === color && toe[1].color === color
		)
            );

            const m = randomChoice(
		safeMoves.length > 0 ?
		    safeMoves :
		    allMoves.filter((e) => e.color == NONE)
            );

	    var colors = [COLOR1, COLOR2].filter((col) =>
		!m.triangle_on.some(
		    toe => toe[0].color === col && toe[1].color === col));

	    color = colors.length == 0 ? COLOR1 : randomChoice(colors);
	    move = [m, color];
	}

	return returnValue ? [move, value] : move;
    }
}

class SimEngine {
    constructor(canvas = "board", status = "status", undo = "undo", showwinning = "showwinning", game = null) {
	this.canvas = document.getElementById(canvas);
	this.initializeCanvas(this.canvas);
	this.status = document.getElementById(status);
	this.status.style.backgroundColor = BOARD_COLOR;

	this.showWinningHandler = this.onShowWinning.bind(this);
	this.showWinningCheckbox = document.querySelector('#' + showwinning);
	if (this.showWinningCheckbox != null) {
	    this.showWinningCheckbox.addEventListener('input', this.showWinningHandler);
	    this.showWinning = this.showWinningCheckbox.checked;
	} else
	    this.showWinning = false;

	this.undoHandler = this.undo.bind(this);
	this.undoButton = document.querySelector("#" + undo);
	if (this.undoButton != null) {
	    this.undoButton.addEventListener('click', this.undoHandler);
	    this.undoButton.disabled = true;
	}

	this.playAgainHandler = this.playAgain.bind(this);
	this.playAgainButton = document.querySelector("#playagain");
	if (this.playAgainButton != null)
	    this.playAgainButton.addEventListener('click', this.playAgainHandler);

	this.game = game;
	this.playerTypes = null;

	this.activeEdges = [];
	this.activeCount = 0;
	this.activeTimer = -1;
	this.moveTimer = -1;
	this.activeVertices = [null, null];

	this.setState(this.game == null ? 'waiting for game' : 'waiting for players');
    }

    clear() {
	this.activeEdges = [];

	this.activeCount = 0;
	if (this.activeTimer != -1)
	    clearInterval(this.activeTimer);
	this.activeTimer = -1;

	if (this.moveTimer != -1)
	    clearTimeout(this.moveTimer);
	this.moveTimer = -1;

	this.cv.clear();

	if (this.game != null)
	    this.game.clear();

	this.updateUndoButton();
    }

    shutdown() {
	const canvas = this.canvas;
	canvas.removeEventListener('pointerdown', this.onPointerDownHandler);
	canvas.removeEventListener('touchdown', this.touchHandler);

	canvas.removeEventListener('pointerup', this.onPointerUpHandler);


	canvas.removeEventListener('pointermove', this.onPointerMoveHandler);
	canvas.removeEventListener('touchmove', this.touchHandler);

	canvas.removeEventListener('pointerleave', this.onPointerLeaveHandler);
	canvas.removeEventListener('touchleave', this.touchHandler);

	if (this.showwwinningCheckbox != null)
	    this.showwwinningCheckbox.removeEventListener('input', this.showWinningHandler);

	if (this.undoButton != null)
	    this.undoButton.removeEventListener('click', this.undoHandler);

	if (this.playAgainButton != null)
	    this.playAgainButton.removeEventListener('click', this.playAgainHandler);
    }
    
    setGame(game) {
	this.game = game;

	this.vertex_coords = vertexCoords({x: this.cv.width / 2, y: this.cv.height / 2}, this.game.num_vertices, POLYGON_RADIUS);
	this.label_coords = labelCoords({x: this.cv.width / 2, y: this.cv.height / 2}, this.game.num_vertices, LABEL_RADIUS);
	this.render();
	this.setState(this.playerTypes == null ? 'waiting for players' : 'ready');
    }

    setDemo(game, playerTypes = ['human', 'human'], demoStatus ='') {
	this.game = game;
	this.playerTypes = playerTypes;
	this.demoStatus = demoStatus;
	
	this.vertex_coords = vertexCoords({x: this.cv.width / 2, y: this.cv.height / 2}, this.game.num_vertices, POLYGON_RADIUS);
	this.label_coords = labelCoords({x: this.cv.width / 2, y: this.cv.height / 2}, this.game.num_vertices, LABEL_RADIUS);
	this.setState('demo');
	this.render();
    }

    play() {
	this.clear();
	this.setState('ready');
    }
    
    // 
    // HUMAN='human'
    // EXPERT='expert' full depth search
    // INTERMEDIATE='intermediate' 2/3 depth search
    // BEGINNER='beginner' 1/3 depth search
    setPlayers(playerTypes) {
	this.playerTypes = playerTypes;
	this.render();
	this.setState(this.game == null ? 'waiting for game' : 'ready');
    }

    onShowWinning(e) {
	this.showWinning = e.target.checked;
	this.render();
    }

    moveColor() {
	return this.game.playerColor(this.game.playerToMove);
    }

    setState(newState) {
	this.state = newState;
	switch(this.state) {
	case 'waiting for game':
	    break;
	case 'waiting for players':
	    break;
	case 'ready':
	    this.state = 'thinking';
	    // fall through//
	case 'thinking':
	    if (this.playerTypes[this.game.playerToMove] != 'human')
		newState = 'searching';
	    const callback = this.findMove.bind(this);
		this.moveTimer = setTimeout(callback, 10);
	    break;
	case 'searching':
	    break;
	case 'moving':
	    this.move.color = this.moveColor();
	    this.activateEdge(this.move);
	    break;
	case 'moved':
	    this.game.make_move(this.move);
	    this.move = null;
	    this.updateUndoButton();
	    if (this.game.gameOver()) {
		if (this.game.losingTriangle.length != 0) {
		    this.activateTriangle(this.game.losingTriangle);
		    this.state = 'ending';
		    break;
		}
		this.state = 'done';
		break;
	    }
	    this.setState('thinking');
	    break;
	case 'ending':
	    break;
	case 'done':
	    break;
	case 'demo':
	    break;
	}
	this.updateStatus(this.state);
    }

    playerStr(player, capitalize = true) {
	return `<span style="color: ${this.game.playerColor(player)}">${player == FIRST_PLAYER ? (capitalize ? "First" : "first") : (capitalize ? "Second" : "second")} player</span>`;
    }

    updateStatus(state) {
	switch(state) {
	case 'waiting for game':
	    this.status.innerHTML = `Waiting for game`;
	    break;
	case 'waiting for players':
	    this.status.innerHTML = `Waiting for players`;
	    break;
	case 'thinking':
	case 'searching':
	    if (this.playerTypes[this.game.playerToMove] == 'human')
		this.status.innerHTML = `${this.playerStr(this.game.playerToMove)}: make your move`;
	    else
		this.status.innerHTML = `${this.playerStr(this.game.playerToMove)} is thinking`;
	    break;
	case 'moving':
	    this.status.innerHTML = `${this.playerStr(this.game.playerToMove)} is moving`;
	    break;
	case 'moved':
	    break;
	case 'ending':
	    this.status.innerHTML = `${this.playerStr(this.game.getWinner() == FIRST_WIN ? SECOND_PLAYER : FIRST_PLAYER)} loses`;
	    break;
	case 'done':
	    if (this.game.getWinner() == FIRST_WIN) {
		if (this.playerTypes[0] == 'human')
		    this.status.innerHTML = `Congratulations ${this.playerStr(FIRST_PLAYER, false)}!`;
		else
		    this.status.innerHTML = `${this.playerStr(FIRST_PLAYER)} wins`;
	    } else if (this.game.getWinner() == SECOND_WIN) {
		if (this.playerTypes[1] == 'human')
		    this.status.innerHTML = `Congratulations ${this.playerStr(SECOND_PLAYER, false)}!`;
		else
		    this.status.innerHTML = `${this.playerStr(SECOND_PLAYER)} wins`;
	    } else {
		this.status.innerHTML = 'The game is a tie';
	    }
	    break;
	case 'demo':
	    this.status.innerHTML = this.demoStatus;
	    break;
	}
    }

    findMove() {
	if (this.moveTimer != -1)
	    clearTimeout(this.moveTimer);
	this.moveTimer = -1;
	var plys;
	switch (this.playerTypes[this.game.playerToMove]) {
	case 'human':
	    this.game.calculateWinningMoves();
	    this.render();
	    return;
	case 'expert':
	    plys = this.game.num_edges;
	    break;
	case 'intermediate':
	    plys = Math.floor(this.game.num_edges * 2 / 3);
	    break;
	case 'beginner':
	    plys = Math.floor(this.game.num_edges / 3);
	    break;
	}
	this.setState('searching');
	this.move = this.game.searchTreeAlgorithm(plys);
	this.setState('moving');
    }

    render() {
	this.cv.ctx.fillStyle = this.cv.background;;
	this.cv.ctx.fillRect(0, 0, this.cv.width, this.cv.height);

	if (this.game == null)
	    return;

	for (var e of this.game.move_history) {
	    if (this.activeEdges.includes(e))
		continue;
	    this.render_edge(e, this.game.losingTriangle.includes(e));
	}

	if (this.activeCount % 2 == 1)
	    for (var e of this.activeEdges)
		this.render_edge(e, true);

	if (this.showWinning && this.playerTypes != null) {
	    if (this.playerTypes[this.game.playerToMove] == 'human' && (this.state == 'thinking' || this.state == 'demo') && this.game.winningLosingMoves != null)
		this.renderWinningLosing();
	}

	if (this.activeVertices[0] != null)
	    this.renderMovingEdge();

	this.renderVertices();
    }

    renderActive() {
	this.activeCount -= 1;
	if (this.activeCount == 0) {
	    this.deactivateEdges();
	} else {
	    this.render();
	}

	if (this.activeCount != 0)
	    return;

	if (this.state == 'moving'){
	    this.setState('moved');
	    return;
	}
	if (this.state == 'ending'){
	    this.setState('done');
	    return;
	}
    }

    render_edge(e, active = false) {
	if (e.color == NONE)
	    return;
	this.cv.ctx.lineWidth = active ? ACTIVE_WIDTH : EDGE_WIDTH;
	this.cv.ctx.strokeStyle = e.color;
	this.cv.line(this.vertex_coords[e.vertices[0]].x, this.vertex_coords[e.vertices[0]].y, this.vertex_coords[e.vertices[1]].x, this.vertex_coords[e.vertices[1]].y);
    }

    renderWinningLosing() {
	this.cv.ctx.lineWidth = WINNING_LOSING_WIDTH;
	this.cv.ctx.strokeStyle = this.game.playerColor(this.game.playerToMove);
	for (var ec of this.game.winningLosingMoves.winning) {
	    this.cv.ctx.setLineDash([]);
	    this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, this.vertex_coords[ec[0].vertices[1]].x, this.vertex_coords[ec[0].vertices[1]].y);
	}
	for (var ec of this.game.winningLosingMoves.losing) {
	    this.cv.ctx.setLineDash([10, 10]);
	    this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, this.vertex_coords[ec[0].vertices[1]].x, this.vertex_coords[ec[0].vertices[1]].y);
	}
	this.cv.ctx.setLineDash([]);
    }

    renderMovingEdge() {
	this.cv.ctx.lineWidth = MOVING_WIDTH;
	this.cv.ctx.strokeStyle = this.moveColor();

	const v0 = this.activeVertices[0][0];
	const v1 = this.activeVertices[1][0];
	this.cv.line(v0.x, v0.y, v1.x, v1.y);
    }

    renderVertices(color = 'black') {
	this.cv.ctx.strokeStyle = 'black';
	this.cv.ctx.fillStyle = color;
	this.cv.ctx.lineWidth = '2';
	for (var xy of this.vertex_coords) {
	    this.cv.arc(xy.x, xy.y, VERTEX_RADIUS, 0, 2 * Math.PI, true);
	}
	var i = 0;
	for (var xy of this.label_coords) {
	    this.cv.ctx.fillStyle = 'black';
	    this.cv.ctx.font = "16px Times";
	    this.cv.ctx.fillText(`${i}`, xy.x, xy.y);
	    i++;
	}
	if (this.activeVertices[0] != null) {
	    this.cv.ctx.fillStyle = this.moveColor();
	    this.cv.arc(this.vertex_coords[this.activeVertices[0][1]].x, this.vertex_coords[this.activeVertices[0][1]].y, VERTEX_RADIUS, 0, 2 * Math.PI, true);
	}
	if (this.activeVertices[1] != null && this.activeVertices[1][1] != -1) {
	    this.cv.ctx.fillStyle = this.moveColor();
	    this.cv.arc(this.vertex_coords[this.activeVertices[1][1]].x, this.vertex_coords[this.activeVertices[1][1]].y, VERTEX_RADIUS, 0, 2 * Math.PI, true);
	}
    }

    renderVertex(i, color = 'black') {
	this.cv.ctx.strokeStyle = 'black';
	this.cv.ctx.fillStyle = color;
	this.cv.ctx.lineWidth = '2';
	this.cv.arc(this.vertex_coords[i].x, this.vertex_coords[i].y, VERTEX_RADIUS, 0, 2 * Math.PI, true);
    }

    activateEdge(e) {
	this.activeEdges.push(e);
	this.activeCount = ACTIVE_COUNT
	if (this.activeTimer == -1) {
	    const callback = this.renderActive.bind(this);
	    this.activeTimer = setInterval(callback, 200);
	}
    }

    activateTriangle(t) {
	for (var e of t) {
	    this.activeEdges.push(e);
	}
	this.activeCount = ACTIVE_COUNT
	if (this.activeTimer == -1) {
	    const callback = this.renderActive.bind(this);
	    this.activeTimer = setInterval(this.renderActive.bind(this), 200);
	}
    }

    deactivateEdges() {
	this.activeCount = 0;
	while (this.activeEdges.length > 0)
	    this.activeEdges.pop();
	if (this.activeTimer != -1)
	    clearInterval(this.activeTimer);
	this.activeTimer = -1;
    }

    touch(e) {
	e.preventDefault();
    }

    initializeCanvas(canvas) {
	const container = document.getElementById("boardcontainer");
	if (container != null) {
	    canvas.width = container.clientWidth;
	    canvas.height = container.clientHeight;
	} else {
	    canvas.width = 360;
	    canvas.height = 360;
	}
	this.cv = new Canvas2d(canvas, canvas.width, canvas.height, BOARD_COLOR, 1);

	this.onPointerDownHandler = this.onPointerDown.bind(this);
	canvas.addEventListener('pointerdown', this.onPointerDownHandler, {passive: false});
	this.touchHandler = this.touch.bind(this);
	canvas.addEventListener('touchdown', this.touchHandler, {passive: false});

	this.onPointerUpHandler = this.onPointerUp.bind(this);
	canvas.addEventListener('pointerup', this.onPointerUpHandler, {passive: false});


	this.onPointerMoveHandler = this.onPointerMove.bind(this);
	canvas.addEventListener('pointermove', this.onPointerMoveHandler, {passive: false});
	this.touchHandler = this.touch.bind(this);
	canvas.addEventListener('touchmove', this.touchHandler, {passive: false});

	this.onPointerLeaveHandler = this.onPointerLeave.bind(this);
	canvas.addEventListener('pointerleave', this.onPointerLeaveHandler, {passive: false});
	this.touchHandler = this.touch.bind(this);
	canvas.addEventListener('touchleave', this.touchHandler, {passive: false});

	this.cv.clear();
    }

    isHumanMove() {
	return this.state == 'thinking' && this.playerTypes[this.game.playerToMove] == 'human';
    }

    onPointerDown(e) {
	if (!this.isHumanMove())
	    return;
	e.preventDefault();
	var xy = this.cv.posFromEvent(e);
	this.activeVertices = [null, null];
	for (var i = 0; i < this.vertex_coords.length; i++) {
	    if (dist(this.vertex_coords[i], xy) < VERTEX_RADIUS) {
		this.activeVertices[0] = [xy, i]
		break;
	    }
	}
	if (this.activeVertices[0] != null) {
	    this.activeVertices[1] = this.activeVertices[0];
	    this.render();
	}
    }

    onPointerUp(e) {
	if (!this.isHumanMove())
	    return;
	if (this.activeVertices[0] == null) {
	    return;
	}
	e.preventDefault();
	var xy = this.cv.posFromEvent(e);
	var now_in = -1;
	for (var i = 0; i < this.vertex_coords.length; i++) {
	    if (dist(this.vertex_coords[i], xy) < VERTEX_RADIUS) {
		now_in = i;
		break;
	    }
	}
	if (now_in == -1 || this.activeVertices[0][1] == now_in) {
	    this.activeVertices = [null, null];
	    this.render();
	    return;
	}
	const edge = this.game.edges[this.activeVertices[0][1]][now_in];
	if (edge.color != NONE) {
	    this.activeVertices = [null, null];
	    this.render();
	    return;
	}
	// Make this move
	this.move = edge;
	this.activeVertices = [null, null];
	this.render();
	this.setState('moving');
    }

    onPointerMove(e) {
	if (!this.isHumanMove())
	    return;
	if (this.activeVertices[0] == null)
	    return;
	e.preventDefault();
	var xy = this.cv.posFromEvent(e);
	var now_in = -1;
	for (var i = 0; i < this.vertex_coords.length; i++) {
	    if (dist(this.vertex_coords[i], xy) < VERTEX_RADIUS) {
		now_in = i;
		break;
	    }
	}
	this.activeVertices[1] = [xy, now_in];
	this.render();
    }

    onPointerLeave(e) {
	e.preventDefault();
	const refresh = this.activeVertices[0] != null || this.activeVertices[1] != null;
	this.activeVertices = [null, null];
	if (refresh)
	    this.render();
    }

    playAgain(e) {
	this.play();
    }

    undo(e) {
	if (this.game.move_history.length == 0 || !this.playerTypes.some((p) => p == "human"))
	    return;

	if (this.game.move_history.length == 1 && this.playerTypes[0] != "human")
	    return;

	this.deactivateEdges();
	if (this.moveTimer != -1)
	    clearTimeout(this.moveTimer);
	this.moveTimer = -1;

	do {
	    this.game.undo_move();
	} while (this.playerTypes[this.game.playerToMove] != "human");

	this.updateUndoButton();
	this.render();
	this.setState('thinking');
    }

    updateUndoButton() {
	if (this.undoButton != null)
	    this.undoButton.disabled = this.game.move_history.length == 0 || (this.game.move_history.length == 1 && this.playerTypes[0] != 'human') || this.playerTypes.every((p) => p != 'human');
    }

}


const COLOR1 = FIRST_PLAYER_COLOR;
const COLOR2 = SECOND_PLAYER_COLOR;

const PICKER_X = 20;
const PICKER_Y = 20;
const PICKER_RADIUS = 12;
	
class TagEngine extends SimEngine {
    constructor(canvas = "board", status = "status", undo = "undo", showwinning = "showwinning", game = null) {
	super(canvas, status, undo, showwinning, game);
    }

    playerStr(player) {
	return `${player == FIRST_PLAYER ? "First" : "Second"} player`;
    }

    moveColor() {
	return this.movePickerColor;
    }

    findMove() {
	if (this.moveTimer != -1)
	    clearTimeout(this.moveTimer);
	this.moveTimer = -1;

	var plys;
	switch (this.playerTypes[this.game.playerToMove]) {
	case 'human':
	    this.game.calculateWinningMoves();
	    this.render();
	    return;
	case 'expert':
	    plys = this.game.num_edges
	    break;
	case 'intermediate':
	    plys = Math.floor(this.game.num_edges * 2 / 3);
	    break;
	case 'beginner':
	    plys = Math.floor(this.game.num_edges / 3);
	    break;
	}

	const move = this.game.searchTreeAlgorithm(plys);
	this.move = move[0];
	this.movePickerColor = move[1];
	this.setState('moving');
    }

    render() {
	super.render();
	this.renderPicker();
    }

    renderWinningLosing() {
	var color = this.game.playerColor(this.game.playerToMove);
	this.cv.ctx.lineWidth = WINNING_LOSING_WIDTH;
	for (var ec of this.game.winningLosingMoves.winning) {
	    this.cv.ctx.setLineDash([]);
	    if ((ec[1] & 0x50) == 0x10 && (ec[1] & 0x05) == 0) {
		//full length solid line
		this.cv.ctx.strokeStyle = COLOR1;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, this.vertex_coords[ec[0].vertices[1]].x, this.vertex_coords[ec[0].vertices[1]].y);
	    } else
	    if ((ec[1] & 0x50) == 0 && (ec[1] & 0x05) == 0x01) {
		//full length solid line
		this.cv.ctx.strokeStyle = COLOR2;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, this.vertex_coords[ec[0].vertices[1]].x, this.vertex_coords[ec[0].vertices[1]].y);
	    } else
	    if ((ec[1] & 0x50) == 0x10 && (ec[1] & 0x05) == 0x01) {
		// half length two color solid line
		this.cv.ctx.strokeStyle = COLOR1;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, (this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2);
		this.cv.ctx.strokeStyle = COLOR2;
		this.cv.line((this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2, this.vertex_coords[ec[0].vertices[1]].x,  this.vertex_coords[ec[0].vertices[1]].y);
	    }
	    if ((ec[1] & 0x50) == 0x40 && (ec[1] & 0x05) == 0x01) {
		// half length, one dashed two color solid line
		this.cv.ctx.strokeStyle = COLOR2;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, (this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2);
		this.cv.ctx.strokeStyle = COLOR1;
		this.cv.ctx.setLineDash([10, 10]);
		this.cv.line((this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2, this.vertex_coords[ec[0].vertices[1]].x,  this.vertex_coords[ec[0].vertices[1]].y);
	    }
	    if ((ec[1] & 0x50) == 0x10 && (ec[1] & 0x05) == 0x04) {
		// half length, one dashed two color solid line
		this.cv.ctx.strokeStyle = COLOR1;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, (this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2);
		this.cv.ctx.setLineDash([10, 10]);
		this.cv.ctx.strokeStyle = COLOR2;
		this.cv.line((this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2, this.vertex_coords[ec[0].vertices[1]].x,  this.vertex_coords[ec[0].vertices[1]].y);
	    }
	    this.cv.ctx.setLineDash([10, 10]);
	    if ((ec[1] & 0x50) == 0x40 && (ec[1] & 0x05) == 0) {
		//full length dashed line
		this.cv.ctx.strokeStyle = COLOR1;
		this.cv.ctx.setLineDash([]);
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, this.vertex_coords[ec[0].vertices[1]].x, this.vertex_coords[ec[0].vertices[1]].y);
	    } else
	    if ((ec[1] & 0x50) == 0 && (ec[1] & 0x05) == 0x04) {
		//full length dashed line
		this.cv.ctx.strokeStyle = COLOR2;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, this.vertex_coords[ec[0].vertices[1]].x, this.vertex_coords[ec[0].vertices[1]].y);
	    } else
	    if ((ec[1] & 0x50) == 0x40 && (ec[1] & 0x05) == 0x04) {
		// half length two color dashed line
		this.cv.ctx.strokeStyle = COLOR2;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, (this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2);
		this.cv.ctx.strokeStyle = COLOR1;
		this.cv.line((this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2, this.vertex_coords[ec[0].vertices[1]].x,  this.vertex_coords[ec[0].vertices[1]].y);
	    }
	}

	for (var ec of this.game.winningLosingMoves.losing) {
	    this.cv.ctx.setLineDash([10, 10]);
	    if (ec[1] == 0x44) {
		// half length two color dashed line
		this.cv.ctx.strokeStyle = COLOR2;
		this.cv.line(this.vertex_coords[ec[0].vertices[0]].x, this.vertex_coords[ec[0].vertices[0]].y, (this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2);
		this.cv.ctx.strokeStyle = COLOR1;
		this.cv.line((this.vertex_coords[ec[0].vertices[0]].x + this.vertex_coords[ec[0].vertices[1]].x) / 2, (this.vertex_coords[ec[0].vertices[0]].y + this.vertex_coords[ec[0].vertices[1]].y) / 2, this.vertex_coords[ec[0].vertices[1]].x,  this.vertex_coords[ec[0].vertices[1]].y);
	    }
	}

	this.cv.ctx.setLineDash([]);
    }

    renderPicker() {
	this.cv.ctx.strokeStyle = 'black';
	this.cv.ctx.fillStyle = this.movePickerColor;
	this.cv.ctx.lineWidth = '1';
	this.cv.arc(PICKER_X, PICKER_Y, PICKER_RADIUS, 0, 2 * Math.PI, true);
	this.cv.ctx.fillStyle = 'black';
	this.cv.ctx.font = "14px Times";
	this.cv.ctx.fillText('Pen color (click to change)', PICKER_X + 1.5 * PICKER_RADIUS, PICKER_Y + 5);
    }

    initializeCanvas(canvas) {
	super.initializeCanvas(canvas);

	this.movePickerColor = FIRST_PLAYER_COLOR;

    }

    onPointerDown(e) {
	if (!this.isHumanMove())
	    return;
	var xy = this.cv.posFromEvent(e);
	this.activeVertices = [null, null];
	if (dist({x:PICKER_X, y:PICKER_Y}, xy) < PICKER_RADIUS + 1) {
	    this.movePickerColor = this.movePickerColor == COLOR1 ? COLOR2 : COLOR1;
	    this.render();
	} else {
	    super.onPointerDown(e);
	}
    }

    undo(e) {
	if (this.game.move_history.length == 0)
	    return;
	this.movePickerColor = this.game.move_history.length == 1 ? COLOR1 : this.game.move_history[this.game.move_history.length - 2].color;
	super.undo(e);
    }

}
