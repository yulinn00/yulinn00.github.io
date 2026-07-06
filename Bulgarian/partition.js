const DX = 28;
const UNSTACKED_DY = 28
const STACKED_DY = 10;

let piles = [];

const requiredSettingsFields = {mode: "animate", overlap: true, speed: 5 };
var settings = requiredSettingsFields;

class Configuration {
    constructor(name, cssClass, angle) {
	this.name = name;
	this.cssClass = cssClass;
	this.angle = angle;
	this.tokenAngle = 0;
	this.bottomNew = false;
	this.fall = false;
	this.DX = 28;
	this.UNSTACKED_DY = 28;
	this.STACKED_DY = this.UNSTACKED_DY;
	this.deltaX = 0; // for small tokens (Ferrers delta = (7,-7)
	this.deltaY = 0;
    }

    rotatePoint(x,y) {
	const c = Math.cos(this.angle*Math.PI/180);
	const s = Math.sin(this.angle*Math.PI/180);

	return {
            x: x*c + y*s,
            y: -x*s + y*c
	};
    }
 
   // board a div where partition will be drawn
    // piles the token array ofr partition
    // include lable div (class partNumber) array if labels for the part sizes are to be displayed
    render(board, piles, labels = [], size = null, displayAt = null) {
	let positions = [];
	const dx = this.DX;
	const dy = settings.overlap ? this.STACKED_DY : this.UNSTACKED_DY;

	piles.forEach((pile, col) => {
            pile.tokens.forEach((tok, row) => {

		let x = dx * col + this.deltaX;
		let y = -dy * row + this.deltaY;

		positions.push({
                    token: tok,
		    x: x,
		    y: y
		});
		tok.div.style.zIndex = `${row+1}`;
            });
	});

	labels.forEach((label, col) => {
	    if (col < piles.length) {
		label.innerHTML = piles[col].tokens.length.toString();
		label.left = dx * col;
		label.top = this.UNSTACKED_DY;
		label.style.visibility = "visible";
	    } else {
		label.style.visibility = "hidden";
	    }
	});

	// Center of picture
	let cx = dx * (size !== null ? size[0] : piles.length) / 2;
	//let cy = -dy * (size !== null ? size[1] : piles[0].tokens.length) / 2;
	let cy = (UNSTACKED_DY + dy * (size !== null ? size[1] : piles[0].tokens.length - 1)) / 2;

	let xShift = this.angle == -90 ? -2 * cy : (this.angle == 45 ? cx * 0.7 : 0)
	let yShift = this.angle == -90 ? 0 : (this.angle == 45 ? cy * 0.3 : cy)

	// Center of viewport
	let vx = displayAt !== null ? displayAt[0] : (board.clientWidth / 2);
	let vy = displayAt !== null ? displayAt[1] : (board.clientHeight / 2);

	var pr = undefined;
	var top = null;
	positions.forEach(p => {
	    pr = this.rotatePoint(p.x-cx, p.y-cy);
	    let screenX = vx + pr.x + xShift;
	    let screenY = vy + pr.y + yShift;
	    p.token.moveTo(screenX, screenY);
	});
	
	labels.forEach(label => {
	    if (label.style.visibility == "visible") {
		pr = this.rotatePoint(label.left-cx, label.top-cy);
		let screenX = vx + pr.x + xShift;
		let screenY = vy + pr.y + yShift;

		//let screenX = label.left;
		//let screenY = label.top;
		label.style.position = "absolute";
		label.style.left = screenX + "px";
		label.style.top = screenY + "px";
	    }
	});
    }
}

const Ferrers = new Configuration( "Ferrers", "ferrers", -90);
Ferrers.deltaX = 7;
Ferrers.deltaY = -7;
Ferrers.DX = 24;
Ferrers.UNSTACKED_DY = 24;
Ferrers.STACKED_DY = Ferrers.UNSTACKED_DY;

const Young = new Configuration("Young", "young", -90);
const Disks = new Configuration("Disks", "disk", 0);
Disks.STACKED_DY = 10;
Disks.DX = 30;
const Cards = new Configuration("Cards", "cards", 0);
Cards.STACKED_DY = 10;
Cards.UNSTACKED_DY = 30;
const Funnel = new Configuration("Funnel", "young", 45);
Funnel.tokenAngle = 45;
Funnel.bottomNew = true;
Funnel.fall = true;

class Partition {
    constructor(parts) {
	this.parts = [...arguments];
	this.parts.filter((x) => x>0)
	this.max_part = Math.max(...this.parts);
    }
    eq(p) {
	return this.parts.length == p.parts.length && this.parts.every((v,i) => v==p.parts[i]);
    }
	
    Cmove(normalize = true) {
	const count = Array.from({length: this.max_part}, (_, i) => i);
	const new_parts = count.map((c) => this.parts.filter((x) => x > c).length);
	const new_partition = new Partition(...new_parts)
	return normalize ? new_partition.normalize() : new_partition;
    }

    Bmove(normalize = true) {
	const new_parts = this.parts.map((x) => x-1).filter((x) => x>0);
	new_parts.push(this.parts.length);
	const new_partition = new Partition(...new_parts)
	return normalize ? new_partition.normalize() : new_partition;
    }

    // AMove is the garden of eden move (multples results possible)
    // it assumes parts are normalized and returns normalized parts
    Amove() {
	const new_partitions = [];
	for (var i = 0; i < this.parts.length && this.parts[i] >= this.parts.length - 1; i++) {
	    if (i > 0 && this.parts[i] == this.parts[i-1])
		continue;
	    old_part = this.parts[i];
	    const new_partition = this.parts.slice(0,i).concat(this.parts.slice(i+1));
	    new_partition.forEach(part => {
		part += 1;
		old_part -= 1;
	    });
	    for (var j = 0; j < old_part; j++) {
		new_partition.push(Array(1).fill(1));
	    }
	    new_partitions.push([i, new_partition]);
	}
	return new_partitions;
    }

    move( normalize = true) {
	return Bmove(normalize);
    }

    normalize() {
	this.parts.sort((a,b) => b-a);
	return this;
    }

    predecessors() {
	const preds = []
	for (var i = 0; i < this.parts.length; i++) {
	    if (p < this.parts.length - 1)
		continue;
	    const new_parts = this.parts.toSpliced(i, 1).map((x) => x+1);
	    for (var c = 0; c < p - this.parts.length + 1; c++)
		new_parts.push(1);
	    preds.push( new Partition(...new_parts));
	}
	return preds;
	    
    }

    isGardenOdEden() {
	return this.predecessors().length == 0;
    }
}

function pnk(n,k) {
    if (n == 1)
	return k == 1 ?  [[1]] :  [];
    if (k == 1)
	return [[n]];
    if (n == k) {
	return [new Array(n).fill(1)];
    }
    if (n < k)
	return [];
    const one = pnk(n-1, k-1);
    one.forEach((p) => p.push(1));
    const greater = pnk(n-k, k);
    greater.forEach((p) => p.forEach((v,i) => p[i]++));
    return [...one, ...greater];
}

function pn(n) {
    ps = []
    for (var k = 1; k <= n; k++) {
	ps = ps.concat(pnk(n,k));
    }
    return ps;
}

function transitionDelay() {
    // speed=1 ⇒ 950 ms
    // speed=10 ⇒ 500 ms
    return 1000 - 50 * settings.speed;
}

class Token {
    constructor(id, configuration, board) {
        this.id = id;
        this.div = document.createElement("div");
	this.updateConfig(configuration);
        board.appendChild(this.div);
    }

    updateConfig(config) {
        this.div.className = config.cssClass;
	if (config.tokenAngle != 0)
	    this.div.style.transform = `rotate(${config.tokenAngle}deg)`;
	else
	    this.div.style.transform = "";
    }

    moveTo(x, y) {

        if (settings.mode === "animate") {
            let duration = transitionDelay()/2;

            this.div.style.transition =
                `left ${duration}ms linear,
                 top ${duration}ms linear`;
        } else {
            this.div.style.transition = "none";
        }

        this.div.style.left = x + "px";
        this.div.style.top = y + "px";
    }
    mark() {
	this.baseBackground = this.div.style.backgroundColor;
	this.div.style.backgroundColor = "yellow";
	return this;
    }
    unmark() {
	this.div.style.backgroundColor = this.baseBackground;
	return this;
    }

}

function makePiles(configuration, board, partition) {
    let id = 0;
    const piles = [];
    partition.parts.forEach(size => {

        let pile = {tokens: []};

        for (let i=0;i<size;i++)
	    pile.tokens.push(new Token(id++, configuration, board));

        piles.push(pile);
    });
    return piles;
}

function markBMoveTokens(piles, marked, bottomNew = false) {
    piles.forEach(pile => {
        bottomNew ? marked.push(pile.tokens[0].mark()) : marked.push(pile.tokens[pile.tokens.length-1].mark());
    });
}

function markCMoveTokens(piles, marked) {
    piles.forEach((pile,col) => {
        pile.tokens.forEach((tok,row) => {
	    if (row != col)
		marked.push(tok.mark());
	});
    });
}

function unmarkMoveTokens(marked) {
    while (marked.length > 0)
        marked.pop().unmark();
}

function collectMoveTokens(piles, bottomNew = false, appendNew = true) {

    let collected = [];

    piles.forEach(pile => {
        if (pile.tokens.length > 0)
            bottomNew ? collected.push(pile.tokens.shift()) : collected.push(pile.tokens.pop());
    });

    for (var i = piles.length - 1; i >= 0; i--) {
	if (piles[i].tokens.length == 0)
	    piles.splice(i, 1);
    }

    var sorted = piles.length == 0;
    if (appendNew) {
	sorted = sorted || collected.length <= piles[piles.length -1].tokens.length;
	piles.push({tokens: collected});
    } else {
	sorted = sorted || collected.length >= piles[0].tokens.length;
	piles.splice(0,0,{tokens:collected});
    }
    return sorted;
}

function reorderPiles(piles) {
    piles.sort((a,b)=>b.tokens.length-a.tokens.length);
}

function conjugate(piles) {
    var conjugatePiles = Array.from({ length: piles[0].tokens.length }, () => ({tokens:[]}));
    for (var col = 0; col < piles.length; col++) {
	for (var row = 0; row < piles[col].tokens.length; row++) {
            conjugatePiles[row].tokens.push(piles[col].tokens[row]);
	}
    }
    const n = piles.length;
    for (var pile of conjugatePiles) {
	piles.push(pile);
    }
    for (var i = 0; i < n; i++) {
	piles.shift();
    }
}


function slideOrderPiles(piles) {
    tokensToMove = [];
    
    for (last = piles.length-1; last>0; last--) {
	if (piles[last].tokens.length>piles[last - 1].tokens.length) {
	    var rest = last - 1;
	    const above_row = piles[last - 1].tokens.length;
	    while (rest < piles.length - 1) {
		const transfer = piles[rest + 1].tokens.splice(above_row);
		//piles[last - 1].tokens = piles[last - 1].tokens.concat(transfer);
		piles[rest].tokens.splice(piles[rest].tokens.length,0,...transfer);
		rest++;
	    }
	}
    }
 }


function createLabels(board, n) {
    labels = [];
    for ( var i = 0; i < n; i++) {
        label = document.createElement("div");
	label.id = "label" + i;
	label.className = "partnumber";
	label.visibility = "hidden";
	board.appendChild(label);
	labels.push(label);
    }
}

function renderStaticPartition( divName, form, partition) {
    const board = document.getElementById(divName);
    board.innerHTML = "";
    const piles = makePiles(form, board, partition);
    form.render(board, piles);
}
