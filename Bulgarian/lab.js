var moveState = 0;
var gameState = "stopped";

let timer = null;
var seq = 0;
var cycle_seq = 0;

const board = document.getElementById("board");
const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");
const status = document.getElementById("status");

var labels = [];

var partition0;
var game;

var hop = '';
var remainingMove = '';

var config = Disks;
var newConfig = config;

settings = {
    mode: "animate",
    overlap: false,
    speed: 5,
    appendNew: true,
    mark: true,
    continuous: true
};
const newSettings = {
    mode: settings.mode,
    overlap: settings.overlap,
    speed: settings.speed,
    appendNew: settings.appendNew,
    mark: settings.mark,
    continuous: settings.continuous
};

function animateDelay() {
    // speed=1 ⇒ 1900 ms
    // speed=10 ⇒ 1000 ms
    return 1 * transitionDelay(); // 2000 - 180 * settings.speed;
}

function stepDelay() {
    return 1070 - 70 * settings.speed;
}

function skipDelay() {
    return 150;
}

function partitionDelay(minDelay = 150)
{
    const delay = Math.max(minDelay + 250, 1500 - (1500 - (minDelay + 250)) / 9 * (settings.speed - 1));
    return delay;
}

class PartitionGame {
    constructor(partition, moveStr) {
	this.partition = partition;
	this.moveStr = moveStr;
	this.sequence = [this.partition];

	this.max_num_parts = this.partition.parts.length;
	this.max_part = Math.max(...this.partition.parts);

	var p = this.move(partition);
	while (this.sequence.every((cp) => !p.eq(cp))) {
	    this.sequence.push(p);
	    p = this.move(p);
	}
	for (var i = 0; i < this.sequence.length; i++) {
	    if (this.sequence[i].eq(p)) {
		this.cycle_start = i;
		this.cycle_length = this.sequence.length - i;
		break;
	    }
	}
    }

    move(partition) {
	for (var c of this.moveStr) {
	    switch (c) {
	    case "B":
	    case "b":
		partition = partition.Bmove()
		break;
	    case "C":
	    case "c":
		partition = partition.Cmove()
		break;
	    default:
		break;
	    }
	    this.max_num_parts = Math.max(this.max_num_parts, partition.parts.length);
	    this.max_part = Math.max(this.max_part, Math.max(...partition.parts));
	}
	return partition;
    }

    max_length() {
	return this.sequence.length;
    }
}

function layout(moveComplete = false) {
    for (var label of labels)
	label.style.fontWeight = moveComplete ? "bold" : "normal";
    config.render(board, piles, labels, [game.max_num_parts, game.max_part]);
    return;
}


function updateHistory() {
    seq += 1;
    if (seq == game.sequence.length) {
	seq = game.cycle_start;
    }
    cycle_seq += 1;

    var plist = "";
    for (var i = 0; i < game.sequence.length; i++) {
	if ( cycle_seq < i)
	    break;
	const bold = i == seq;
	const highlight = cycle_seq >= game.sequence.length && i>= game.cycle_start;
	plist += (i == 0 ? '' : '<br/>') +
	    '<span' +
	    ((bold || highlight) ? (' style="' +
				    (bold ? "font-weight: bold; " : "") +
				    (highlight ? "background-color:#f0f0f0;" : "") + '">') :
	     '>') +
	    game.sequence[i].parts.join(' ') + '</span>';
    }
    document.getElementById("plist").innerHTML = plist;
}

function renderBHop() {
    switch (settings.mode) {
    case "jump":
	collectMoveTokens(piles, config.bottomNew, settings.appendNew);
	reorderPiles(piles);
        return;

    case "skip":
	collectMoveTokens(piles, config.bottomNew, settings.appendNew);
	reorderPiles(piles);
        scheduleNextSkip(skipDelay());
        return;

    case "step":
	switch (moveState) {
	case 1:
	    if (settings.mark) {
		stepTokens = [];
		markBMoveTokens(piles, stepTokens, config.bottomNew);
		scheduleNextHop(stepDelay());
		return;
	    }
	    moveState += 1;
	case 2:
	    if (collectMoveTokens(piles, config.bottomNew, settings.appendNew))
		moveState += 1;
            scheduleNextHop(stepDelay());
	    return;
	case 3:
	    if (config.fall)
		slideOrderPiles(piles);
	    else
		reorderPiles(piles);
	    if (settings.mark) {
		scheduleNextHop(stepDelay());
	    } else {
		scheduleNextSkip(stepDelay());
	    }
            return;
	case 4:
	    unmarkMoveTokens(stepTokens);
            scheduleNextSkip(stepDelay());
            return;
	}
	
    case "animate":
	switch (moveState) {
	case 1:
	    if (settings.mark) {
		stepTokens = [];
		markBMoveTokens(piles, stepTokens, config.bottomNew);
		scheduleNextHop(stepDelay());
		return;
	    }
	    moveState += 1;
	case 2:
	    if (collectMoveTokens(piles, config.bottomNew, settings.appendNew))
		moveState += 1;
	    scheduleNextHop(animateDelay());
	    return;
	case 3:
	    if (config.fall)
		slideOrderPiles(piles);
	    else
		reorderPiles(piles);
	    if (settings.mark) {
		scheduleNextHop(stepDelay());
	    } else {
		scheduleNextSkip(animateDelay());
	    }
            return;
	case 4:
	    unmarkMoveTokens(stepTokens);
            scheduleNextSkip(stepDelay());
            return;
	}
    }
}

function renderCHop() {
    switch (settings.mode) {
    case "jump":
	conjugate(piles);
        return;

    case "skip":
	conjugate(piles);
        scheduleNextSkip(skipDelay());
        return;

    case "step":
	switch (moveState) {
	case 1:
	    if (settings.mark) {
		stepTokens = [];
		markCMoveTokens(piles, stepTokens);
		scheduleNextHop(stepDelay());
		return;
	    }
	    moveState += 1;
	case 2:
	    conjugate(piles);
            scheduleNextHop(stepDelay());
	    return;
	case 3:
	    unmarkMoveTokens(stepTokens);
            scheduleNextSkip(stepDelay());
            return;
	}
	
    case "animate":
	switch (moveState) {
	case 1:
	    if (settings.mark) {
		stepTokens = [];
		markCMoveTokens(piles, stepTokens);
		scheduleNextHop(stepDelay());
		return;
	    }
	    moveState += 1;
	case 2:
	    conjugate(piles);
	    scheduleNextHop(animateDelay());
	    return;
	case 3:
	    unmarkMoveTokens(stepTokens);
            scheduleNextSkip(stepDelay());
            return;
	}
    }
}

function renderHop() {
    switch (hop) {
    case 'B':
    case 'b':
	renderBHop();
	return;
    case 'C':
    case 'c':
	renderCHop();
	return;
    }
}


function nextHop() {
    //console.log(`${document.getElementById("status").innerHTML}, ${gameState}, ${moveState}`);
    if (moveState == 0) {
	if (newConfig != config) {
	    updateConfig();
	}
    }

    if (gameState != "running" && moveState <= 0) {
	stop();
	return;
    } else if (moveState == 0)
	moveState = 1;

    renderHop();
    if (settings.mode != "jump")
	return;
    hop = getNextHop(false);
    while (hop != '') {
	renderHop();
	hop = getNextHop(false);
    }
    scheduleNextPartition(partitionDelay());
}

function scheduleNextHop(hopDelay) {
    layout();
    timer = setTimeout(renderHop, hopDelay);
    moveState += 1;
}

function scheduleNextSkip(minDelay) {
    hop = getNextHop(false);
    if (hop == '') {
	scheduleNextPartition(100);
	return;
    }
    layout();
    timer = setTimeout(nextHop, partitionDelay(minDelay));
    moveState = 1;
    updateAllSettings();
}

function scheduleNextPartition(minDelay) {
    layout(true);
    moveState = 0;
    updateHistory();
    updateAllSettings();
    if (!settings.continuous || gameState == "stopping") {
	gameState = "stopped";
	stop();
	return;
    }
    hop = getNextHop(true);
    timer = setTimeout(nextHop, partitionDelay(minDelay));
}

function updateConfig() {
    config = newConfig;
    piles.forEach((pile,col) => {
	pile.tokens.forEach((tok,row) => {
	    tok.updateConfig(newConfig);
	});
    });
    layout();
}

function updateAllSettings() {
    for (const [key,value] of Object.entries(newSettings)) {
	if (settings[key] != value)
	    settings[key] = value;
    }
}

function setPartition()
{
    const parts = partition.value.trim().split(/\s*(?:,|\s)\s*/).map(Number);

    if (!parts.every((x) => Number.isInteger(x) && x>0)) {
	alert( "The partition is incorrectly entered. It must be positive integers separated by spaces or a comma and spaces");
	return;
    }
    if (parts.length > 40) {
	alert( "The maximum number of parts is 40 (exceeded in entered partition).");
	return;
    }
    if (parts.some((x) => x > 40)) {
	alert("The maximum part is 40 (exceeded in the partition entered");
	return;
    }

    partition0 = new Partition(...parts);
    partition0.normalize();

    const move0 = move.value.trim();
    if (move0.match(/[BbCc]/g).length != move0.length) {
	alert( "The move is incorectly entered. It must be a string only of the characters B, b, C, or c");
	return;
    }
    game = new PartitionGame(partition0, move0);

    seq = 0;
    cycle_seq = 0;

    board.innerHTML = "";
    labels = [];

    piles = makePiles(config, board, partition0);

    createLabels(board, game.max_num_parts);

    const plist = '<span style="font-weight: bold;">' +
	    game.sequence[seq].parts.join(' ') +
	    "</span>\n";
    document.getElementById("plist").innerHTML = plist;
}

function getNextHop(first) {
    if (first)
	remainingMove = game.moveStr;
    const nextHop = remainingMove.charAt(0);
    remainingMove = remainingMove.substring(1);
    if (nextHop != '') {
	updateStatus();
    }
    return nextHop;
}

function hopString() {
    var hs = '';
    for (var i = 0; i < game.moveStr.length; i++) {
	if (i == game.moveStr.length-remainingMove.length-1) {
	    hs += '<span style="color: yellow">';
	    hs += game.moveStr.charAt(i);
	    hs += '</span>'
	} else {
	    hs += game.moveStr.charAt(i);
	}
    }
    return hs;
}

function updateStatus() {
    switch(gameState) {
    case "running":
	status.innerHTML = `Running: move ${cycle_seq+1},&nbsp;${(settings.mode == "jump") ? game.moveStr : hopString()}`;
	break;
    case "stopped":
	const moveStr = (game.moveStr.length == 1 || cycle_seq == 1) ? game.moveStr : `(${game.moveStr})`;
	const expr = cycle_seq == 1 ? `executed ${moveStr}` : `executed ${moveStr}<sup>${cycle_seq}</sup>`;
	status.innerHTML = `Stopped: ${expr}`;
	break;
    case "stopping":
	status.innerHTML = `Finishing: move ${cycle_seq+1},&nbsp;${settings.mode != "jump" ? hopString() : game.moveStr}`;
	break;
    }
}

function start()
{
    updateAllSettings();
    updateConfig();

    gameState = "running";
    hop = getNextHop(true);
    moveState = 1;

    document.getElementById("start").disabled = true;
    document.getElementById("stopresume").textContent = "Stop"
    document.getElementById("stopresume").disabled = !settings.continuous;

    timer = setTimeout(nextHop, partitionDelay());
}

function stop() {
    gameState = "stopped";
    updateStatus();
    document.getElementById("stopresume").textContent = "Resume"
    document.getElementById("stopresume").disabled = false;
    document.getElementById("start").disabled = false;
}


function onStart() {
    if (gameState != "stopped")
	return;
    setPartition();
    start();
}

function onStopResume() {
    if (gameState == "stopping")
	return;
    if (gameState == "stopped")
    {
	start();
	return;
    }

    gameState = "stopping";
    updateStatus();
    document.getElementById("stopresume").disabled = true;
}

function onChangeConfig(config) {
    switch (config) {
    case "disks":
	newConfig = Disks;
	break;
    case "cards":
	newConfig = Cards;
	break;
    case "Ferrers":
	newConfig = Ferrers;
	break;
    case "Young":
	newConfig = Young;
	break;
    case "Funnel":
	newConfig = Funnel;
	break;
    }
}

function onChangeMode(mode) {
    newSettings.mode = mode;
}

function onChangeOverlap(overlap) {
    newSettings.overlap = overlap;
}

function onChangeAppendNew(appendNew) {
    newSettings.appendNew = appendNew;
}

function onChangeMark(mark) {
    newSettings.mark = mark;
}

function onChangeContinuous(continuous) {
    newSettings.continuous = continuous;
}

speedSlider.oninput = () => {
    speedValue.textContent = speedSlider.value;
    newSettings.speed = speedSlider.value;
};

onChangeConfig(document.querySelector('input[name="display"]:checked').value);
const displayForm = document.querySelector('#displayForm');
displayForm.addEventListener('change', function(event) {
    onChangeConfig(event.target.value);
});

newSettings.mode = document.querySelector('input[name="mode"]:checked').value;
const modeForm = document.querySelector('#modeForm');
modeForm.addEventListener('change', function(event) {
    onChangeMode(event.target.value);
});

const overlapCB = document.getElementById("overlap");
newSettings.overlap = overlapCB.checked;
overlapCB.addEventListener('change', (event) => {
    onChangeOverlap(event.target.checked);
});


const appendNewCB = document.getElementById("appendnew");
newSettings.appendNew = appendNewCB.checked;
appendNewCB.addEventListener('change', (event) => {
    onChangeAppendNew(event.target.checked);
});


const markCB = document.getElementById("mark");
newSettings.mark = markCB.checked;
markCB.addEventListener('change', (event) => {
    onChangeMark(event.target.checked);
});

const continuousCB = document.getElementById("continuous");
newSettings.continuous = continuousCB.checked;
continuousCB.addEventListener('change', (event) => {
    onChangeContinuous(event.target.checked);
});

document.getElementById("stopresume").textContent = "Stop";
document.getElementById("stopresume").disabled = true;

document.getElementById("partition").addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
	event.preventDefault(); 
	onStart();
    }
});

document.getElementById("move").addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
	event.preventDefault(); 
	onStart();
    }
});

