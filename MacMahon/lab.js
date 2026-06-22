class Lab extends MacMahonGame {
    constructor(opts = null) {
	super(opts);

	this.size = 100;
	this.scale = 2;
    }

    run() {
	this.initializePuzzle();
	const tilesSelector = document.querySelector('#tiles');
	this.setType = tilesSelector.value;
	this.configureTiles(this.setType);
	this.configureDimensions();
	this.configureGoal();
	this.configureBoards();
	this.configureContact();
	this.update();
    }

    initializePuzzle() {
	super.initializePuzzle();

	var ordered_tiles = [];
	const cmp = function(x, y) {
	    var m = x.match(/^(\d+)([a-z]*)/);
	    const xv = parseInt(m[0]);
	    m = y.match(/^(\d+)([a-z]*)/);
	    const yv = parseInt(m[0]);
	    if (xv == yv) {
		return y - x;
	    } else {
		return yv - xv;
	    }
	}
	for ( var t in TilesDescription) {
	    ordered_tiles.push(t);
	}
	ordered_tiles.sort(cmp);
	const tilesSelector = document.querySelector('#tiles');
	for ( var t of ordered_tiles) {
	    const option = document.createElement('option');
	    option.text = t
	    tilesSelector.add(option);
	}

	tilesSelector.addEventListener('change', this.onTilesChanged.bind(this));

	const dimsSelector = document.querySelector('#dim');
	dimsSelector.addEventListener('change', this.onDimsChanged.bind(this));

	const goalCanvas = document.getElementById('goal');
	this.gch = new Canvas2d(goalCanvas, this.width * this.size, this.height * this.size, this.colors['goal'], this.scale);
	goalCanvas.onmousedown = this.onGoalMouseDown.bind(this);
	goalCanvas.onmouseup = this.onGoalMouseUp.bind(this);
	goalCanvas.onmousemove = this.onGoalMouseMove.bind(this);
	goalCanvas.onmouseleave = this.onGoalMouseLeave.bind(this);

	goalCanvas.ontouchstart = this.onGoalMouseDown.bind(this);
	goalCanvas.ontouchend = this.onGoalMouseUp.bind(this);
	goalCanvas.ontouchemove = this.onGoalMouseMove.bind(this);
	this.goalPos = [-1,-1];
	this.goalTriangle = -1;

	const contactCanvas = document.getElementById('contact-goal');
	this.cch = new Canvas2d(contactCanvas, 3.5 * this.size, this.size, this.colors['contact'], this.scale);
	contactCanvas.onmousedown = this.onContactMouseDown.bind(this);
	contactCanvas.onmouseup = this.onContactMouseUp.bind(this);
	contactCanvas.onmousemove = this.onContactMouseMove.bind(this);
	contactCanvas.onmouseleave = this.onContactMouseLeave.bind(this);

	contactCanvas.ontouchstart = this.onContactMouseDown.bind(this);
	contactCanvas.ontouchend = this.onContactMouseUp.bind(this);
	contactCanvas.ontouchemove = this.onContactMouseMove.bind(this);
	this.contactPos = [-1,-1];

	this.cch.canvas.style.cursor = "pointer";
	this.vch.scale = this.scale;

	this.ch.canvas.onmousedown = this.onMouseDown.bind(this)
	this.ch.canvas.ontouchstart = this.onMouseDown.bind(this)

	document.getElementById("toggle-freeze").cursor = "pointer";
	this.addRemoveFrozen = false;

	const u = document.getElementById("URI-safe");
	u.cursor = "pointer";
	u.checked = this.URIsafe;
    }

    configureTiles(setType) {

	super.configureTiles(setType);
	this.tiles.sort();

	const dimsSelector = document.querySelector('#dim');
	while (dimsSelector.length > 0) {
	    dimsSelector.remove(0);
	}

	const dims = this.findPossibleDimensions();
	for (var d of dims) {
	    const option = document.createElement('option');
	    option.text = `${d[0]}x${d[1]}`;
	    dimsSelector.add(option, 0);
	}

	this.twoColorTiles = this.tilesWithColor.some((n) => n == 0);
	document.getElementById("color2").style.display = this.twoColorTiles ? "none" : "inline";
    }

    configureDimensions() {
	const dimsSelector = document.querySelector('#dim');
	const dims = dimsSelector.value.split('x');
	this.width = parseInt(dims[1]);
	this.height = parseInt(dims[0]);

	this.resetHistory();
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

    configureGoal() {
	this.goal = new GoalConfiguration();
	this.goal.setAnyGoal( this.setType, this.dims, this.dontcare.repeat(2 * (this.width + this.height)))
	this.frozen = this.goal.frozen;
	this.addRemoveFrozen = false;
    }
    

    clearBoards() {
	super.clearBoards();
	this.gch.clear();

	if (this.goal.variety !== null) {
	    this.renderProgress(this.gch, this.goal.variety);
	}
    }

    isSolution() {
	return false;
    }

    getPuzzleCode() {
	if (!this.goalMet)
	    return '';
	return this.URIsafe ? encodeURIComponent(this.toStringCode()) : this.toStringCode();
    }

    isGoalAchieved() {
	return true;
    }

    update(render = true) {
	super.update(false)

	this.goalMet = this.contactsMade == this.numContacts;

	if (this.goalMet) {
	    for (var i = 0; i< this.goal.variety.length; i++) {
		const c = this.goal.variety.charAt(i);
		if (c != this.dontcare && c != this.variety.charAt(i)) {
		    this.goalMet = false;
		    break;;
		}
	    }
	}

	if (this.goalMet) {
	    const goalVarietyRE = new RegExp(this.goal.variety.replaceAll(this.dontcare, '.'));
	    this.goalMet = this.variety.match(goalVarietyRE);
	}

	const undo = document.getElementById("undo");
	undo.disabled = this.isSolved || this.history.length==0 || this.addRemoveFrozen;
	undo.style.cursor = undo.disabled ? "default" : "pointer";

	const t = document.getElementById("toggle-freeze");
	if (this.addRemoveFrozen) {
	    t.style.backgroundColor = "yellow";
	    t.style.borderRadius = "6px";
	    t.style.border = "1px solid #ccc";
	} else {
	    t.style.backgroundColor = "white";
	    t.style.borderRadius = "6px";
	    t.style.border = "1px solid #ccc";
	}

	if (render)
	    this.render();
    }

    render() {
	super.render();

	this.renderVariety(this.gch, this.goal.variety);

	renderContact("contact-goal", this.contact, this.colors, 0, this.twoColorTiles);

	document.getElementById("board-value").innerHTML = this.getPuzzleCode();
	document.getElementById("copy").disabled = !this.goalMet;
    }
    
    onTilesChanged(event) {
	const tilesSelector = document.querySelector('#tiles');

	this.setType = tilesSelector.value;
	this.configureTiles(this.setType);
	this.configureDimensions();
	this.configureGoal();
	this.configureBoards();
	this.configureContact();
	this.update();
    }

    onDimsChanged(event) {
	this.configureDimensions();
	this.configureGoal();
	this.configureBoards();
	this.configureContact()
	this.update();
    }

    onCopy = async function(event) {
	const textToCopy = this.getPuzzleCode();
	await CopyTextToClipboard(textToCopy);
    }

    onToggleFreeze(event) {
	this.addRemoveFrozen = !this.addRemoveFrozen;
	this.update( false);
    }

    onURIsafe(event) {
	this.URIsafe = document.getElementById("URI-safe").checked;
	this.render()
    }

    onMouseDown(event) {
	event.preventDefault();
	var pos = this.ch.posFromEvent(event);
	const sq = this.inSquare(this.ch, pos);
	if (!this.addRemoveFrozen) {
	    super.onMouseDown(event);
            return;
	}
	if (sq != -1) {
	    const i = this.frozen.indexOf(sq);
	    if (i == -1) {
		this.frozen.push(sq);
	    } else {
		this.frozen.splice(i,1);
	    }
	}
	this.addRemoveFrozen = false;
	this.update();
    }

    onGoalMouseDown(event) {
	event.preventDefault();
	const pos = this.gch.posFromEvent(event);
	const sq = this.inSquare(this.gch, pos);
	if (this.frozen.includes(sq))
	    return;
	this.goalTriangle = this.inBoundaryTriangle(this.gch, pos);
	this.goalPos = pos;
    }

    onGoalMouseUp(event) {
	event.preventDefault();
	const pos = this.gch.posFromEvent(event);
	var goalTriangle = this.inBoundaryTriangle(this.gch, pos);
	if (pos[0] != this.goalPos[0] || pos[1] != this.goalPos[1] || this.goalTriangle == -1) {
	    this.goalPos = [-1,-1];
	    this.goalTriangle = -1;
	    return;
	}
	const b = this.goalTriangle
	// cycle the color of goal variety boundary triangle
	switch (this.goal.variety.substring(b,b+1)) {
	case '0':
	    this.goal.variety = this.goal.variety.substring(0, b) + '1' + this.goal.variety.substring(b + 1);
	    break;
	case '1':
	    this.goal.variety = this.goal.variety.substring(0, b) + (this.twoColorTiles ? this.dontcare : '2') + this.goal.variety.substring(b + 1);
	    break;
	case '2':
	    this.goal.variety = this.goal.variety.substring(0, b) + this.dontcare + this.goal.variety.substring(b + 1);
	    break;
	case this.dontcare:
	    this.goal.variety = this.goal.variety.substring(0, b) + '0' + this.goal.variety.substring(b + 1);
	    break;
	}
	this.renderVariety(this.gch, this.goal.variety);
	this.update();

	this.goalPos = [-1,-1];
	this.goalTriangle = -1;
    }

    onGoalMouseMove(event) {
	event.preventDefault();
	const pos = this.gch.posFromEvent(event);
	if (pos != this.goalPos) {
	    this.goalPos = [-1,-1];
	    this.goalTriangle = -1;
	}
	this.gch.canvas.style.cursor = this.inBoundaryTriangle(this.gch, pos) == -1 ? "default" : "pointer";
    }

    onGoalMouseLeave(event) {
	event.preventDefault();
	this.goalPos = [-1,-1];
	this.goalTriangle = -1;
    }


    onContactMouseDown(event) {
	event.preventDefault();
	const pos = this.cch.posFromEvent(event);
	this.contactPos = pos;
    }

    onContactMouseUp(event) {
	event.preventDefault();
	const pos = this.cch.posFromEvent(event);
	if (pos[0] != this.contactPos[0] || pos[1] != this.contactPos[1] ) {
	    this.contactPos = [-1,-1];
	    return;
	}
	// cycle the contact system
	switch (this.goal.contact) {
	case C111:
	    this.goal.contact = this.twoColorTiles ? C21 : C12;
	    break;
	case C12:
	    this.goal.contact = C21;
	    break;
	case C21:
	    this.goal.contact = this.twoColorTiles ? C111 : C3;
	    break;
	case C3:
	    this.goal.contact = C111;
	    break;
	}
	this.configureContact();
	this.render();
	this.contactPos = [-1,-1];
    }

    onContactMouseMove(event) {
	event.preventDefault();
	this.goalPos = [-1,-1];
    }

    onContactMouseLeave(event) {
	event.preventDefault();
	this.contactPos = [-1,-1];
    }

}
