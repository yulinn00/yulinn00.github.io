var engine = null;
function onApply() {
    if (engine != null) {
	engine.clear();
	engine.shutdown();
	engine = null;
    }
    const num_vertices = document.querySelector('input[name="graph"]:checked').value == "k5" ? 5 : 6;
    const first = document.querySelector('input[name="first"]:checked').value;
    const second = document.querySelector('input[name="second"]:checked').value;
    const game = new SimGame(num_vertices);
    engine = new SimEngine("board", "status");
    engine.setGame(game);
    engine.setPlayers([first,second]);
    engine.play();
    document.getElementById("gametitle").innerHTML = `<h3>Sim on <i>K</sub>${num_vertices}</sub></i><br>${first == 'human' ? 'human' : 'bot'} vs. ${second == 'human' ? 'human' : 'bot'}</h3>`;
}

window.onload = function() {
    onApply();
}

function onPlayAgain() {
    engine.play();
}
