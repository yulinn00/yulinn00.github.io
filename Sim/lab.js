var engine = null;
function onApply() {
    if (engine != null) {
	engine.clear();
	engine.shutdown();
	engine = null;
    }
    const simortag = document.querySelector('input[name="simortag"]:checked').value;
    const num_vertices = document.querySelector('input[name="graph"]:checked').value == "k5" ? 5 : 6;
    const first = document.getElementById("firstplayer").value;
    const second = document.getElementById("secondplayer").value;
    const game = simortag == "sim" ? new SimGame(num_vertices) : new TagGame(num_vertices);
    engine = simortag == "sim" ? new SimEngine("board", "status") : new TagEngine("board", "status");
    engine.setGame(game);
    engine.setPlayers([first,second]);
    engine.play();
    document.getElementById("gametitle").innerHTML = `<h3>${simortag == 'sim' ? 'Sim' : 'TAG'} on <i>K</sub>${num_vertices}</sub></i><br>${first} vs. ${second}</h3>`;
}

window.onload = function() {
    onApply();
}


