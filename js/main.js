let app;

var crewmatenotes = {
};

window.onload = function () {
    app = new PIXI.Application({width: window.innerWidth, height: window.innerHeight});
    document.getElementById("bg").appendChild(app.view);

    document.addEventListener("DOMContentLoaded", resize, false);
    window.onresize = resize;
    resize(); resize(); //oh god

    loadAssets();
}

function loadAssets() {
    let files = [];

    files.push('assets/star.png');

    PIXI.Loader.shared
        .add(files)
        .on("progress", loadProgressHandler)
        .load(assetsLoaded);
}

function loadProgressHandler(loader, resource) {
    document.getElementById('loading-info').innerText = `Loading... ${resource.url} (${Math.round(loader.progress)}%)`
}

function assetsLoaded() {
    document.getElementById('loading').style.display = 'none';
    addInCrewmates();
    startStarBGAnim();
}

function startStarBGAnim() {
    // Get the texture for rope.
    const starTexture = PIXI.Loader.shared.resources['assets/star.png'].texture;

    const starAmount = 900;
    let cameraZ = 0;
    const fov = 20;
    const baseSpeed = 0.025;
    let speed = 0;
    let warpSpeed = 0;
    const starStretch = 5;
    const starBaseSize = 0.05;


    // Create the stars
    const stars = [];
    for (let i = 0; i < starAmount; i++) {
        const star = {
            sprite: new PIXI.Sprite(starTexture),
            z: 0,
            x: 0,
            y: 0,
        };
        star.sprite.anchor.x = 0.5;
        star.sprite.anchor.y = 0.7;
        randomizeStar(star, true);
        app.stage.addChild(star.sprite);
        stars.push(star);
    }

    function randomizeStar(star, initial) {
        star.z = initial ? Math.random() * 2000 : cameraZ + Math.random() * 1000 + 2000;

        // Calculate star positions with radial random coordinate so no star hits the camera.
        const deg = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 1;
        star.x = Math.cos(deg) * distance;
        star.y = Math.sin(deg) * distance;
    }

    // Listen for animate update
    app.ticker.add((delta) => {
        // Simple easing. This should be changed to proper easing function when used for real.
        speed += (warpSpeed - speed) / 20;
        cameraZ += delta * 10 * (speed + baseSpeed);
        for (let i = 0; i < starAmount; i++) {
            const star = stars[i];
            if (star.z < cameraZ) randomizeStar(star);

            // Map star 3d position to 2d with really simple projection
            const z = star.z - cameraZ;
            star.sprite.x = star.x * (fov / z) * app.renderer.screen.width + app.renderer.screen.width / 2;
            star.sprite.y = star.y * (fov / z) * app.renderer.screen.width + app.renderer.screen.height / 2;

            // Calculate star scale & rotation.
            const dxCenter = star.sprite.x - app.renderer.screen.width / 2;
            const dyCenter = star.sprite.y - app.renderer.screen.height / 2;
            const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter + dyCenter);
            const distanceScale = Math.max(0, (2000 - z) / 2000);
            star.sprite.scale.x = distanceScale * starBaseSize;
            // Star is looking towards center so that y axis is towards center.
            // Scale the star depending on how fast we are moving, what the stretchfactor is and depending on how far away it is from the center.
            star.sprite.scale.y = distanceScale * starBaseSize + distanceScale * speed * starStretch * distanceCenter / app.renderer.screen.width;
            star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;
        }
    });
}

function addInCrewmates() {
    let crewmates = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'white', 'black']

    var cards = document.getElementById('crewmate-cards')

    crewmates.forEach(cr => {
        let color = cr === 'white' ? 'black' : 'white';
        let classinsert = cr === 'pink' ? 'offset-s2 ' : '';

        let html = `
        <div class="col s2 ${classinsert}${color}-text crewmate-display ${cr} darken-3 flow-text">
            <a onclick="select('${cr}')"><img src="assets/crew/${cr}.png" class="responsive-img circle"  id="${cr}-picture"></a><br> <b>${normalCaps(cr)}</b><br>
            <label>
                <input type="checkbox" class="filled-in" id="alive-${cr}" onclick="aliveChanged('${cr}')" checked="checked" />
                <span style="color: ${color} !important">Alive</span>
            </label>
        </div>
        `

        var div = document.createElement('div');
        div.innerHTML = html;
        while (div.children.length > 0) {
            cards.appendChild(div.children[0]);
        }
        //thanks https://stackoverflow.com/a/10309703/9900077 for this solution
    })
}

function select(color) {
    let textcolor = ['white', 'yellow'].includes(color) ? 'black' : 'white';
    if(!crewmatenotes[color]) crewmatenotes[color] = {}

    document.getElementById('crewmate-notes').innerHTML = `
    <div class="z-depth-3 col s4 offset-s4 crewmate-display ${color} ${textcolor}-text" id="crewmate-notes-inner"><br>
        <p2>${normalCaps(color)}</p2><br>

        <label class="range-field">
        <span style="color: ${textcolor} !important">Trust</span>
        <input type="range" id="${color}-trust" min="-10" max="10" oninput="updateVal('${color}', 'trust')"/><br>

        <div class="input-field">
            <textarea id="${color}-notes" class="materialize-textarea" style="color: ${textcolor} !important" oninput="updateVal('${color}', 'notes')" placeholder="Notes"></textarea>
        </div>
    </div>
    `

    function insert(ch) {
        console.log(ch.id)
        if(Object.keys(crewmatenotes[color]).includes(ch.id)) {
            ch.value = crewmatenotes[color][ch.id];
        } else {
            if(ch.children) {
                Array.from(ch.children).forEach(insert)
            }
        }
    }

    Array.from(document.getElementById('crewmate-notes-inner').children).forEach(insert)
    //i do this complicated mess to get the children of children aswell
}

function aliveChanged(color) {
    let checked = document.getElementById('alive-'+color).checked

    document.getElementById(color+'-picture').style.filter = checked ? 'grayscale(0%)' : 'grayscale(100%)'
}

function clearBoard() {
    crewmatenotes = {};

    M.toast({html: 'Cleared!'})
    document.getElementById('crewmate-notes').innerHTML = `
    <div class="z-depth-3 col s4 offset-s4 crewmate-display black white-text"><br>
        <h5>Select a color!</h5><br>
        Click on a crewmember's picture to select them.<br>
    </div>
    `
}

function updateVal(color, id) {
    crewmatenotes[color][color+'-'+id] = document.getElementById(color+'-'+id).value
}

function normalCaps(s) {
    return s[0].toUpperCase()+s.slice(1,s.length);
}

function resize() {
    setTimeout(() => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    }, 15) //im so sorry for this i couldnt fix it any other way
}