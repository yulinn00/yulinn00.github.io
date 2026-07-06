settings = {mode: "animate", overlap: true, speed: 5 };

var mbMarked = [];
var BMovePiles = null;
var CMovePiles = null;

function classroomWindow() {
    var partition = new Partition(5, 2, 2, 1);
    renderStaticPartition("Disksboard", Cards, partition);

    //renderStaticPartition("Moveboard", Disks, partition);

    partition = new Partition(5, 4, 3, 1, 1);
    renderStaticPartition("Ferrersboard", Ferrers, partition);
    renderStaticPartition("Youngboard", Young, partition);

    partition = new Partition(5, 2, 2, 1);
    const mb = document.getElementById("Moveboard");
    BMovePiles = makePiles( Disks, mb, partition);
    Disks.render(mb, BMovePiles, [], null);

    partition = new Partition(5, 2, 2, 1, 1);
    const cb = document.getElementById("Conjugateboard");
    CMovePiles = makePiles( Ferrers, cb, partition);
    Ferrers.render(cb, CMovePiles, [], null);
}

function pause(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function onMakeMove() {
    const mbMarked = [];
    const partition = new Partition(5, 2, 2, 1);
    const mb = document.getElementById("Moveboard");

    markBMoveTokens(BMovePiles, mbMarked, Disks.bottomNew);
    Disks.render(mb, BMovePiles, [], null);
    collectMoveTokens(BMovePiles, Disks.bottomNew, Disks.appendNew);
    await pause(1000);
    Disks.render(mb, BMovePiles, [], null);
    reorderPiles(BMovePiles);
    await pause(1000);
    Disks.render(mb, BMovePiles, [], null);
    await pause(1000);
    unmarkMoveTokens(mbMarked);
    Disks.render(mb, BMovePiles, [], null);
    await pause(3000);
    mb.innerHTML = "";

    await pause(1000);
    BMovePiles = makePiles(Disks, mb, partition);
    Disks.render(mb, BMovePiles, [], null);
}


async function onMakeConjugate() {
    const cbMarked = [];
    const partition = new Partition(5, 2, 2, 1, 1);
    const cb = document.getElementById("Conjugateboard");

    markCMoveTokens(CMovePiles, cbMarked);
    Ferrers.render(cb, CMovePiles, [], null);
    conjugate(CMovePiles);
    await pause(1000);
    Ferrers.render(cb, CMovePiles, [], null);
    await pause(1000);
    unmarkMoveTokens(cbMarked);
    Ferrers.render(cb, CMovePiles, [], null);
    await pause(3000);
    cb.innerHTML = "";

    await pause(1000);
    CMovePiles = makePiles(Ferrers, cb, partition);
    Ferrers.render(cb, CMovePiles, [], null);
}
