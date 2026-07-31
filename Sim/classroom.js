function drawGraphs() {
    const gd = document.getElementById("graphsdiv");
    const canvas = document.getElementById("graphs");
    const container = gd;
    if (gd != null) {
	canvas.width = gd.clientWidth;
	canvas.height = gd.clientHeight;
    } else {
	canvas.width = 360;
	canvas.height = 360;
    }

    const cv = new Canvas2d(canvas, 360, 320, "#c0c0c0");
    K3 = new CompleteGraph(cv, 3, {x: 80, y: 45}, 40, 4);
    K4 = new CompleteGraph(cv, 4, {x: 240, y: 45}, 40, 4);
    K5 = new CompleteGraph(cv, 5, {x: 80, y: 150}, 50, 4);
    K6 = new CompleteGraph(cv, 6, {x: 240, y: 150}, 50, 4);
    
    for (var g of [K3, K4, K5, K6]) {
	for (var i = 0; i < g.num_vertices; i++) {
	    for (var j = i + 1; j < g.num_vertices; j++) {
		g.addEdge( i, j);
	    }
	}
	g.render();
    }

    K51 = new CompleteGraph(cv, 5, {x: 80, y: 300}, 50, 4, 75);
    K51.addEdge(0, 1, 'blue');
    K51.addEdge(1, 3, 'blue');
    K51.addEdge(3, 4, 'blue');
    K51.addEdge(2, 4, 'blue');
    K51.addEdge(0, 2, 'blue');
    K51.addEdge(0, 3, 'red');
    K51.addEdge(0, 4, 'red');
    K51.addEdge(1, 2, 'red');
    K51.addEdge(1, 4, 'red');
    K51.addEdge(2, 3, 'red');
    K51.render();
    
    K61 = new CompleteGraph(cv, 6, {x: 240, y: 300}, 50, 4, 75);
    for (var i = 0; i < K61.num_vertices; i++) {
	for (var j = i + 1; j < K61.num_vertices; j++) {
	    K61.addEdge(i, j, randomChoice(['red', 'blue']));
	}
    }
    K61.render();

}

function drawRamsey() {
    const gd = document.getElementById("ramseydiv");
    const canvas = document.getElementById("ramsey");
    const container = gd;
    if (gd != null) {
	canvas.width = gd.clientWidth;
	canvas.height = gd.clientHeight;
    } else {
	canvas.width = 360;
	canvas.height = 240;
    }

    const cv = new Canvas2d(canvas, 360, 240, "#c0c0c0");

    K62 = new CompleteGraph(cv, 6, {x: 100, y: 80}, 50, 4, 70);
    K62.renderEdge({vertices: [0, 3], color: 'red'});
    K62.renderEdge({vertices: [2, 3], color: 'red'});
    K62.renderEdge({vertices: [3, 5], color: 'red'});
    K62.renderEdge({vertices: [0, 2], color: 'black'}, true);
    K62.renderEdge({vertices: [0, 5], color: 'black'}, true);
    K62.renderEdge({vertices: [2, 5], color: 'black'}, true);
    for (var v of [3, 0, 2, 5]) {
	K62.renderVertex(v);
    }

    K62.cv.ctx.fillStyle = 'black';
    K62.cv.ctx.font = "16px Times";
    K62.cv.ctx.fillText('A', K62.label_coords[3].x, K62.label_coords[3].y);

    K63 = new CompleteGraph(cv, 6, {x: 280, y: 80}, 50, 4, 70);
    K63.renderEdge({vertices: [0, 2], color: 'black'}, true);
    K63.renderEdge({vertices: [1, 2], color: 'black'}, true);
    K63.renderEdge({vertices: [2, 3], color: 'black'}, true);
    K63.renderEdge({vertices: [2, 4], color: 'black'}, true);
    K63.renderEdge({vertices: [2, 5], color: 'black'}, true);
    K63.render();

    K63.cv.ctx.fillStyle = 'black';
    K63.cv.ctx.font = "16px Times";
    K63.cv.ctx.fillText('B', K63.label_coords[2].x, K63.label_coords[2].y);


}

function onPlaySim() {
    sim.play();
}

function onPlayTag() {
    tag.play();
}

var sim;
var tag;

function initializeClassroom() {
    const simGame = new SimGame(6);
    sim = new SimEngine("simboard", "simstatus");
    sim.setGame(simGame);
    sim.setPlayers(['human','beginner']);

    const tagGame = new TagGame(6);
    tag = new TagEngine("tagboard", "tagstatus");
    tag.setGame(tagGame);
    tag.setPlayers(['human','intermediate']);

    drawGraphs();
    drawRamsey();

    const labGame = new TagGame(6);
    const lab = new TagEngine("labboard", "labstatus", "labundo", "labshowwinning");
    lab.setGame(labGame);
    lab.setPlayers(['human','human']);

    for (var v of [
	[0,1,COLOR1],
	[1,2,COLOR1],
	[2,3,COLOR2],
	[3,5,COLOR1],
	[4,5,COLOR2],
	[1,4,COLOR2]]) {
	const e = labGame.edges[v[0]][v[1]];
	e.color = v[2];
	labGame.move_history.push(e);
    }
    
    lab.setDemo(labGame);

}
