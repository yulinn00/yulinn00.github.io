class MacMahonTiles extends Object {
    constructor() {
	super();

	for (const descriptor of ['24', '20', '16', '15', '9']) {
	    const tiles = new MacMahonSquares(descriptor);
	    renderTiles('board' + descriptor, tiles.sort());
	}

	renderTiles('squaretype', ["0000"]);
	renderTiles('pentagontype', ["1000", "2000"]);
	renderTiles('triangletype', ["1100", "1200", "2100", "2200"], 1);
	renderTiles('hourglasstype', ["0101", "0102", "0202"]);

	renderTiles('rectangle111', ["0000", "1120", "1111", "0202", "2202", "1212"], 2);
	renderTiles('rectangle12', ["2000", "2220", "1121", "0101", "1102", "1212"], 2);

	renderPuzzle('variety111', "0111210020", 2, 3, C111, '');
	renderPuzzle('variety12', "2211210010", 2, 3,  C12, '');

	renderPuzzle('puzzlevariety', "00000000000000000000", 4, 6, C111, '');

	renderPuzzle('puzzle46-21', "00000000000000000000", 4, 6, C21, '');
	renderPuzzle('puzzle38-111', "00000000000000000000", 3, 8, C111, '');
	renderPuzzle('puzzle212-12', "00000000000000000000", 2, 12, C12, '');
	renderPuzzle('puzzle46-12', "00000000000000000000", 4, 6, C12, '');

	// hKQH1XUjrN;&D(S6+W%enu0@k
	renderPuzzle('puzzle38-111-2', "0000111122200001111222", 3,8, C111, '');

	// lM8JHadRe+&*yF{r;fLoE0As#
	renderPuzzle('puzzle212-21-3', "0000111122220100001111222201", 2, 12, C21, '');

	renderTiles('horizontalsymmetry', ["0122", "1101", "0221", "2001", "0000", "2100"], 2);
	renderTiles('rotationalsym15', ["0111", "0221", "0012", "1121", "2211", "1222", "2100", "1201", "2202"], 3);

	renderPuzzle('varietyrot', "000022000011", 3, 3, C111, 'r12');

	renderTiles('mirrorsym6', ["0200", "0111", "0122", "0100", "2202", "1201"], 2);

	renderPuzzle('varietymirror', "0001200000", 2, 3, C12, 'v12');
    }
}
