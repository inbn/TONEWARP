//set up camera, scene, renderer
var thirdPersonCamera, scene, renderer;
var geometry, material, mesh, light;
//geometry variables
var drumGeometry, cutoffGeometry, envelopeGeometry, noteDensityGeometry;
var planeGeometry1, planeGeometry2, planeGeometry3;
//stats object
var render_stats;
var chunksRendered = 0;
var lane = 0;
var delta;
var clock = new THREE.Clock();
var score = 0;
var scoreThisLevel = 0;
var maxScoreThisLevel = 0;
var scorePercentage;
var parametersVisible = false;
var antialiasing = false;
var showText = true;
var noteArrayPosition = 0;
var shipColour = [0xE80C76, 0x4400FF, 0x00A8E8, 0x00FF3D, 0xFF6700];
var backgroundColour = [0x331400, 0x1C010F, 0x0D0033, 0x00141C, 0x00330C];
var zoneNo = 0;
var numberOfZones = 10;
var statsDisplay = 0;

//text materials
var materialFront = new THREE.MeshBasicMaterial( { color: 0x00A8E8 } );
var materialSide = new THREE.MeshBasicMaterial( { color: 0xE80C76 } );
var materialArray = [ materialFront, materialSide ];
var textMaterial = new THREE.MeshFaceMaterial(materialArray);

//meshes
var ship;
var textMesh;
var pitchMesh;
var drumMesh;
var cutoffMesh;
var attackMesh;
var noteDensityMesh;
var chordMesh = [];
var leftPlaneMesh = [];
var rightPlaneMesh = [];
var groundMesh = [];

var leftPressed = false, upPressed = false, rightPressed = false, downPressed = false;

var shapes = []; //new array to be filled with Icosahedrons
var shapesArrayPosition = 0, chordsArrayPosition = 0;

//check for key down events
document.onkeydown = function() {
	switch (window.event.keyCode) {
		case 37: //left arrow
			leftPressed = true;
			break;
		case 38: //up arrow
			upPressed = true;
			break;
		case 39: //right arrow
			rightPressed = true;
			break;
		case 40: //down arrow
			downPressed = true;
			break;
		case 65: //A
			if (noteDensity < 15) {
				noteDensity++;
			}
			else {
				noteDensity = 0;
			}
	}
};

//check for key up events
document.onkeyup = function() {
	switch (window.event.keyCode) {
		case 37:
			leftPressed = false;
			break;
		case 38:
			upPressed = false;
			break;
		case 39:
			rightPressed = false;
			break;
		case 40:
			downPressed = false;
			break;
	}
};

//called when screen is pressed
function screenPressed(direction) {
	console.log("press detected");
	switch (direction) {
		case "Left": //left arrow
			leftPressed = true;
			break;
		case "Up": //up arrow
			upPressed = true;
			break;
		case "Right": //right arrow
			rightPressed = true;
			break;
		case "Down": //down arrow
			downPressed = true;
			break;
	}
}

function screenReleased(direction) {
	console.log("release detected");
	switch (direction) {
		case "Left": //left arrow
			leftPressed = false;
			break;
		case "Up": //up arrow
			upPressed = false;
			break;
		case "Right": //right arrow
			rightPressed = false;
			break;
		case "Down": //down arrow
			downPressed = false;
			break;
	}
}

//initialise the scene. Add the cameras, lights and import ship model
var init = function () {

	//hide menu, display game
	document.getElementById('container').style.display='none';
	document.getElementById('full-width-image').style.display='none';
	document.getElementById('viewport').style.display='inline';
	document.getElementById('score').style.display='inline';
	document.getElementById('status').style.display='inline';
	document.getElementById('touchup').style.display='inline';
	document.getElementById('touchleft').style.display='inline';
	document.getElementById('touchright').style.display='inline';
	document.getElementById('touchdown').style.display='inline';
	document.getElementById("status").innerHTML ="Tempo: " + bPM;
//	document.getElementById('questionnaire').style.display='inline';

	document.getElementById('tonewarp-html').style.background="black";

	//create new WebGl renderer
	renderer = new THREE.WebGLRenderer({ antialias: antialiasing});
	renderer.setSize( window.innerWidth , window.innerHeight -40 );
	document.getElementById('viewport').appendChild(renderer.domElement);

	//display stats
	if (statsDisplay) {
		render_stats = new Stats();
		render_stats.setMode(0);
	    render_stats.domElement.style.position = 'absolute';
	    render_stats.domElement.style.top = '1px';
	    render_stats.domElement.style.right= '1px';
	    render_stats.domElement.style.zIndex = 100;
	    document.getElementById('viewport').appendChild(render_stats.domElement);
	}

    //create the camera, move slightly up and backward from origin. Rotate downwards
	thirdPersonCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight -40), 1, 10000 );
	thirdPersonCamera.position.y = 150;
	thirdPersonCamera.position.z = 100;
	thirdPersonCamera.rotation.x = -0.03 * Math.PI;

	scene = new THREE.Scene();

	//create the materials
	var material = new THREE.MeshLambertMaterial( { color: 0x00A8E8, wireframe: false, vertexColors: THREE.FaceColors, ambient: 0x00A8E8, emissive: 0x00A8E8, shading: THREE.FlatShading, transparent: true, opacity: 0.4} );
	var planeMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, wireframe: true});
	var groundMaterial = new THREE.MeshBasicMaterial( { color: 0xE80C76, wireframe: true});
	var shipMaterial = new THREE.MeshLambertMaterial({color: 0xFF6700, wireframe:false, emissive: 0xFF6700, shading: THREE.FlatShading});
	var chordMaterial = new THREE.MeshLambertMaterial({color: 0xFF0000, wireframe:false, emissive: 0xFF6700, shading: THREE.FlatShading, transparent: true, opacity: 0.3 });
	var drumMaterial = new THREE.MeshLambertMaterial({color: 0x4400FF, wireframe:false, emissive: 0x4400FF, shading: THREE.FlatShading, transparent: true, opacity: 0.8 });
	var cutoffMaterial = new THREE.MeshLambertMaterial({color: 0x4400FF, wireframe:false, emissive: 0x00FF3D, shading: THREE.FlatShading, transparent: true, opacity: 0.6 });
	var envelopeMaterial = new THREE.MeshLambertMaterial({color: 0xE80C76, wireframe:false, emissive: 0xE80C76, shading: THREE.FlatShading, transparent: true, opacity: 0.6 });

	//add lights to the scene
	var light = THREE.AmbientLight( 0xffffff );
	var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
	directionalLight.position.set( 0, 150, 0 );
	scene.add( light );
    scene.add( directionalLight );

	//ADD DRUM CHANGE OBJECT TO SCENE
	//as only one will ever be visible a time we only need to create one
	drumGeometry = new THREE.SphereGeometry( 150 );
	drumMesh = new THREE.Mesh(drumGeometry, drumMaterial);
	//move out of the way
	drumMesh.position.x = 10000;
	scene.add(drumMesh);

	//ADD CUTOFF CHANGE OBJECT TO SCENE
	cutoffGeometry = new THREE.SphereGeometry( 150 );
	cutoffMesh = new THREE.Mesh(cutoffGeometry, cutoffMaterial);
	//move out of the way
	cutoffMesh.position.x = 10000;
	scene.add(cutoffMesh);

	//ADD ENVELOPE CHANGE OBJECT TO SCENE
	envelopeGeometry = new THREE.SphereGeometry( 150 );
	envelopeMesh = new THREE.Mesh(envelopeGeometry, envelopeMaterial);
	//move out of the way
	envelopeMesh.position.x = 10000;
	scene.add(envelopeMesh);

	//ADD NOTE DENSITY CHANGE OBJECT TO SCENE
	noteDensityGeometry = new THREE.SphereGeometry( 150 );
	noteDensityMesh = new THREE.Mesh(noteDensityGeometry, material);
	//move out of the way
	noteDensityMesh.position.x = 10000;
	scene.add(noteDensityMesh);

	//CREATE NOTE OBJECTS
	for (var i = 0; i < 32; i++) {
		geometry = new THREE.IcosahedronGeometry( 100, 0);
		mesh = new THREE.Mesh( geometry, material );
		shapes[i] = mesh;
		scene.add(shapes[i]);
		shapes[i].position.x = 10000;
	}

	//CREATE CHORD OBJECTS
	for (var j = 0; j < 6; j ++) {
		geometry = new THREE.IcosahedronGeometry(50, 0);
		mesh = new THREE.Mesh(geometry, chordMaterial);
		chordMesh[j] = mesh;
		scene.add(chordMesh[j]);
		shapes[j].position.x = 10000;
	}

	//CREATE PLANES
	for (var k = 0; k < 2; k++) {
		planeGeometry1 = new THREE.PlaneGeometry( 8000 , 10000, 8, 8);
		leftPlaneMesh[k] = new THREE.Mesh( planeGeometry1, planeMaterial);
		scene.add(leftPlaneMesh[k]);
		leftPlaneMesh[k].rotation.y = 0.5 * Math.PI; //90 degrees
		leftPlaneMesh[k].position.x = -2000;

		planeGeometry2 = new THREE.PlaneGeometry( 8000 , 10000, 8, 8);
		rightPlaneMesh[k] = new THREE.Mesh( planeGeometry2, planeMaterial);
		scene.add(rightPlaneMesh[k]);
		rightPlaneMesh[k].rotation.y = 0.5 * Math.PI; //90 degrees
		rightPlaneMesh[k].position.x = 2000;

		planeGeometry3 = new THREE.PlaneGeometry( 8000, 4000, 16, 16);
		groundMesh[k] = new THREE.Mesh( planeGeometry3, groundMaterial);
		groundMesh[k].rotation.z = 0.5 * Math.PI;
		groundMesh[k].rotation.x = 0.5 * Math.PI;
		groundMesh[k].position.y = -1000;
	}

	//generate the first chunk
	newChunk(0);

	//create fog
	scene.fog = new THREE.FogExp2(0x000000, 0.00025);

	//Load in the ship mesh and add it to the scene.
	var loader = new THREE.JSONLoader();
	loader.load( "models/ship.js", function(geometry) {
		ship = new THREE.Mesh(geometry, shipMaterial);
		ship.position.z = 0;
		ship.position.y = 75;
		ship.scale.set(2, 2, 2);
		scene.add(ship);
		loader.onLoadComplete = function() {
			alert("Game loaded. Press OK to play.");
			animate();
		};
	});
};

function newChunk(chunkNo) {
	if (chunkNo > 1) {
		playRhythm(context.currentTime);
	}

	//calculate movement per frame based on tempo
	movementPerFrame = 8000/(noteLength * 16);

	//move planes
	leftPlaneMesh[chunkNo%2].position.z = (-8000 * chunkNo) -4000;
	rightPlaneMesh[chunkNo%2].position.z = (-8000 * chunkNo) -4000;
	groundMesh[chunkNo%2].position.z = (-8000 * chunkNo) -4000;

	//randomise the location of the vertices for the groundMesh
	for(var i = 0; i < groundMesh[chunkNo%2].geometry.vertices.length; i++) {
		if (groundMesh[chunkNo%2].geometry.vertices[i].y < 2000 && groundMesh[chunkNo%2].geometry.vertices[i].y > -2000 ) {
			groundMesh[chunkNo%2].geometry.vertices[i].z += Math.floor((Math.random() * 400) - 200);
		}
	}

	scene.add(groundMesh[chunkNo%2]);

	//called when generating the first chunk in a zone
	if (chunkNo % 10 == 2 && chunkNo < (numberOfZones * 10 + 2)) {
		setNotesArray();
		generateMelody();
		zoneNo++;
		//add text displaying zone number
		if (showText === true) {
			var textGeom = new THREE.TextGeometry( "ZONE " + zoneNo + "/ " + numberOfZones,
			{
				size: 300, height: 4, curveSegments: 3,
				font: "roboto slab", weight: "normal", style: "normal",
				material: 0, extrudeMaterial: 1
			});
			//use bounding box to find width
			textGeom.computeBoundingBox();
			var textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

			textMesh = new THREE.Mesh(textGeom, textMaterial );
			//centre the text
			textMesh.position.set( -0.5 * textWidth, 0, chunkNo * -8000);
			scene.add(textMesh);
		}
		setTimeout(function(){
			generateBassLine();
		}, 200);
	}

	//when entering new zone, change colours of ship, renderer background and fog
	if (chunkNo % 10 == 3 && (numberOfZones * 10 + 4)) {
		ship.material.emissive.setHex(shipColour[zoneNo%5]);
		renderer.setClearColor(backgroundColour[zoneNo%5], 1 );
		scene.fog.color.setHex(backgroundColour[zoneNo%5]);
	}

	//reset to the beginning of the note array every 4 bars
	if (chunkNo % 10 == 2 || chunkNo % 10 == 6) {
		noteArrayPosition = 0;
		console.log("array reset");
	}

	generateNoteObjectPattern();

	//create note and chord objects only in the first 8 bars of the level
	if (chunkNo % 10 > 1 && chunkNo < (numberOfZones * 10 + 2)) {
		//CREATE CHORD OBJECTS
		var chordRoot = noteArray[noteArrayPosition];
		var major = 0;
		var minor = 0;
		if (chordRoot > 1000) {
			chordRoot = chordRoot * 0.5;
		}

		for (var i = 0; i < 3; i++) {
			chordMesh[chordsArrayPosition + i].scale.x = 5;
			chordMesh[chordsArrayPosition + i].scale.y = 5;
			chordMesh[chordsArrayPosition + i].scale.z = 5;
			chordMesh[chordsArrayPosition + i].position.z = (-8000 * chunkNo) - 50;
		}
		chordMesh[chordsArrayPosition].position.y = 0.5 * chordRoot;
		chordMesh[chordsArrayPosition].position.x = -800;

		for (i = 0; i < secondOrderArray.length - 1; i++) {
			//count if major third is in secondOrderArray
			if (secondOrderArray[i][0] < chordRoot * 1.2599 + 1 && secondOrderArray[i][0] > chordRoot * 1.2599 - 1) {
				major++;
			}
			//count if minor third is in secondOrderArray
			else if (secondOrderArray[i][0] < chordRoot * 1.189 + 1 && secondOrderArray[i][0] > chordRoot * 1.189 - 1) {
				minor++;
			}

		}
		if (major > minor) {
			chordMesh[chordsArrayPosition+1].position.y = 0.5 * (chordRoot * 1.2599);
		}
		else if (minor > major) {
			chordMesh[chordsArrayPosition+1].position.y = 0.5 * (chordRoot * 1.189);
		}

		chordMesh[chordsArrayPosition+1].position.x = 0;
		chordMesh[chordsArrayPosition+2].position.y = 0.5 * (chordRoot * 1.5);
		chordMesh[chordsArrayPosition+2].position.x = 800;

		if (chordsArrayPosition == 3) {
			chordsArrayPosition = 0;
		}
		else {
			chordsArrayPosition = 3;
		}
		//CREATE NOTE OBJECTS
		var randomLane = Math.floor(Math.random()*3 - 1);
		for (var i = 0; i < 16; ++i) {
			if (noteObjectPattern[i] > 0 && chunkNo > 1) {
				shapes[shapesArrayPosition].scale.x = 1 + (0.25 * noteObjectPattern[i]);
				shapes[shapesArrayPosition].scale.y = 1 + (0.25 * noteObjectPattern[i]);
				shapes[shapesArrayPosition].scale.z = 1 + (0.25 * noteObjectPattern[i]);
				shapes[shapesArrayPosition].position.z = (-500 * i) - (8000*chunkNo) -100;

				shapes[shapesArrayPosition].position.y = 0.5 * noteArray[noteArrayPosition];
				shapes[shapesArrayPosition].position.x = randomLane * 800;
				noteArrayPosition++;
				maxScoreThisLevel += (noteObjectPattern[i]) * 100;

				if (shapesArrayPosition < 31) {
					shapesArrayPosition++;
				}
				else {
					shapesArrayPosition = 0;
				}
			}
		}
	}

	//CALCULATE SCORE, SET LOCATIONS OF PARAMETER CHANGE OBJECTS
	if (chunkNo % 10 == 1 && chunkNo > 1) {
		scorePercentage = (scoreThisLevel / maxScoreThisLevel) * 100;
		console.log("score percentage=" + scorePercentage);
		scoreThisLevel = 0;
		maxScoreThisLevel = 0;
		//place drumMesh
		drumMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
		drumMesh.position.y = (Math.random() * 1000) - 500;
		drumMesh.position.z = chunkNo * -8000 + (Math.random() * 8000) - 8000;
		//place cutoffMesh
		cutoffMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
		cutoffMesh.position.y = (Math.random() * 1000) + 200;
		cutoffMesh.position.z = chunkNo * -8000 + (Math.random() * 8000) - 8000;
		//place envelopeMesh
		envelopeMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
		envelopeMesh.position.y = (Math.random() * 1000) + 200;
		envelopeMesh.position.z = chunkNo * -8000 + (Math.random() * 8000) - 8000;
		//place noteDensityMesh
		noteDensityMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
		noteDensityMesh.position.y = (Math.random() * 1000) + 200;
		noteDensityMesh.position.z = chunkNo * -8000 + (Math.random() * 8000) - 8000;
		//change tempo based on score this zone
		if (scorePercentage > 85 && bPM < 130) {
			bPM += 2;
			noteLength = 15/bPM;
			document.getElementById("status").innerHTML = "Boosting Tempo";
			document.getElementById("status").style.color = '#00FF3D';
			setTimeout(function(){
				document.getElementById("status").innerHTML ="Tempo: " + bPM;
				document.getElementById("status").style.color = "white";
			},3000);
		}
		else if (scorePercentage < 40 && bPM > 70) {
			bPM -= 2;
			noteLength = 15/bPM;
			document.getElementById("status").innerHTML = "Tempo Dropping";
			document.getElementById("status").style.color = "#4400FF";
			setTimeout(function(){
				document.getElementById("status").innerHTML ="Tempo: " + bPM;
				document.getElementById("status").style.color = "white";
			},3000);
		}
	}

	chunksRendered++;
	console.log("chunks rendered: " + chunksRendered);
}

var animate = function () {
	delta = clock.getDelta();

	requestAnimationFrame( animate );

	//move camera and ship
	thirdPersonCamera.position.z -= movementPerFrame * delta;
	ship.position.z -= movementPerFrame * delta;

	//check for collision with drum objects
	if( drumMesh.position.x - 150  < ship.position.x &&
		ship.position.x < drumMesh.position.x + 150  &&
		drumMesh.position.y - 150  < ship.position.y &&
		ship.position.y < drumMesh.position.y + 150 &&
		drumMesh.position.z - 150 < ship.position.z &&
		ship.position.z < drumMesh.position.z + 150)
	{
		if (rhythmPreset < 4) {
			rhythmPreset++;
		}
		else {
			rhythmPreset = 0;
		}
		//change drumRandomness
		drumRandomness += Math.floor(Math.random() * 5) -1;
		drumMesh.position.x = 10000;
	}

	drumMesh.rotation.x = Date.now() * 0.001;
	drumMesh.rotation.y = Date.now() * 0.001;

	//check for collision with cutoff objects
	if( cutoffMesh.position.x - 150  < ship.position.x &&
		ship.position.x < cutoffMesh.position.x + 150  &&
		cutoffMesh.position.y - 150  < ship.position.y &&
		ship.position.y < cutoffMesh.position.y + 150 &&
		cutoffMesh.position.z - 150 < ship.position.z &&
		ship.position.z < cutoffMesh.position.z + 150)
	{
		filterCutoff = cutoffMesh.position.y * 5;
		filterQ = Math.random()*10;
		cutoffMesh.position.x = 10000;
	}

	cutoffMesh.rotation.x = Date.now() * 0.001;
	cutoffMesh.rotation.y = Date.now() * 0.001;

	//check for collision with note density objects
	if( noteDensityMesh.position.x - 150  < ship.position.x &&
		ship.position.x < noteDensityMesh.position.x + 150  &&
		noteDensityMesh.position.y - 150  < ship.position.y &&
		ship.position.y < noteDensityMesh.position.y + 150 &&
		noteDensityMesh.position.z - 150 < ship.position.z &&
		ship.position.z < noteDensityMesh.position.z + 150)
	{
		noteDensityMesh.position.x = 10000;
		noteDensity++;
		//change noteRandomness
		noteRandomness += Math.floor(Math.random() * 5) -1;
	}

	noteDensityMesh.rotation.x = Date.now() * 0.001;
	noteDensityMesh.rotation.y = Date.now() * 0.001;

	//check for collision with envelope objects
	if( envelopeMesh.position.x - 150  < ship.position.x &&
		ship.position.x < envelopeMesh.position.x + 150  &&
		envelopeMesh.position.y - 150  < ship.position.y &&
		ship.position.y < envelopeMesh.position.y + 150 &&
		envelopeMesh.position.z - 150 < ship.position.z &&
		ship.position.z < envelopeMesh.position.z + 150)
	{
		//randomise values for filters
		filterAttack = Math.random() * 0.3;
		filterDecay = Math.random();
		filterSustain = Math.random();
		filterRelease = Math.random();
		ampAttack = Math.random() * 0.3;
		ampDecay = Math.random();
		ampSustain = Math.random();
		ampRelease = Math.random() * 0.3;
		chordFilterAttack = Math.random();
		chordFilterRelease = Math.random();
		chordFilterSustain = Math.random();
		chordFilterRelease = Math.random();
		chordAmpAttack = Math.random();
		chordAmpDecay = Math.random();
		chordAmpSustain = Math.random();
		chordAmpRelease = Math.random() * 0.5;
		envelopeMesh.position.x = 10000;
	}

	envelopeMesh.rotation.x = Date.now() * 0.001;
	envelopeMesh.rotation.y = Date.now() * 0.001;

	//check for collision with note objects
	for(var i = 0; i < 32; i++) {
		shapes[i].rotation.z = Date.now() * 0.0008;
		shapes[i].rotation.x = Date.now() * 0.0005;

		if( shapes[i].position.x - (100 * shapes[i].scale.x) < ship.position.x &&
			ship.position.x < shapes[i].position.x + (100 * shapes[i].scale.x) &&
			shapes[i].position.y - (100 * shapes[i].scale.y) < ship.position.y &&
			ship.position.y < shapes[i].position.y + (100 * shapes[i].scale.y) &&
			shapes[i].position.z - 100 < ship.position.z &&
			ship.position.z < shapes[i].position.z + 100)
		{
			//Play next note. Get duration from scale of object. Get pitch from y position
			playNextNote((shapes[i].scale.x -1) * 4, shapes[i].position.y * 2, 0);
			//move shape out of the way to prevent further collisions
			shapes[i].position.x = 10000;
			//set wall colour to random hex colour
			rightPlaneMesh[0].material.color.setHex('0x'+ Math.floor(Math.random()*16777215).toString(16));
			//increment score based on note scale
			score += (100 * (shapes[i].scale.x -1) * 4);
			scoreThisLevel += (100 * (shapes[i].scale.x -1) * 4);
			//update score display
			document.getElementById("score").innerHTML = "score:" + score;

			break;
		}
	}

	//check for collision with chord objects
	for(var i = 0; i < 6; i++) {
		chordMesh[i].rotation.z = Date.now() * -0.0008;
		chordMesh[i].rotation.x = Date.now() * -0.0005;

		if( chordMesh[i].position.x - (50 * chordMesh[i].scale.x) < ship.position.x &&
			ship.position.x < chordMesh[i].position.x + (50 * chordMesh[i].scale.x) &&
			chordMesh[i].position.y - (50 * chordMesh[i].scale.y) < ship.position.y &&
			ship.position.y < chordMesh[i].position.y + (50 * chordMesh[i].scale.y) &&
			chordMesh[i].position.z - 50 < ship.position.z &&
			ship.position.z < chordMesh[i].position.z + 50)
		{
			//Play next note. Get duration from scale of object. Get pitch from y position
			//move shape out of the way to prevent further collisions
			if (i < 3) {
				chordMesh[0].position.x = 10000;
				chordMesh[2].position.x = 10000;
				chordMesh[1].position.x = 10000;
				playNextNote((chordMesh[0].scale.x -1) * 4, chordMesh[0].position.y * 2, 1);
				playNextNote((chordMesh[1].scale.x -1) * 4, chordMesh[1].position.y * 2, 1);
				playNextNote((chordMesh[2].scale.x -1) * 4, chordMesh[2].position.y * 2, 1);

			}
			else if (i > 2) {
				chordMesh[3].position.x = 10000;
				chordMesh[4].position.x = 10000;
				chordMesh[5].position.x = 10000;
				playNextNote((chordMesh[3].scale.x -1) * 4, chordMesh[3].position.y * 2, 1);
				playNextNote((chordMesh[4].scale.x -1) * 4, chordMesh[4].position.y * 2, 1);
				playNextNote((chordMesh[5].scale.x -1) * 4, chordMesh[5].position.y * 2, 1);
			}

			break;
		}
	}

	if (ship.position.z < 8000 -8000 * chunksRendered) {
		newChunk(chunksRendered);
	}
	else if (chunksRendered == (numberOfZones * 10 + 3)) {
		document.getElementById('completion').style.display='block';
		document.getElementById('finalscore').innerHTML = "Final Score: " + score;
		document.getElementById('finaltempo').innerHTML = "Final Tempo: " + bPM;
	}

	//switch lanes when left and right are pressed
	if (leftPressed === true && ship.position.x > -800) {
		leftPressed = false;
		if (lane > -1) {
			lane -= 1;
		}
	}
	if (rightPressed === true && ship.position.x < 800) {
		rightPressed = false;
		if (lane < 1) {
			lane += 1;
		}
	}

	//move on y axis when up and down are pressed
	if (upPressed === true && ship.position.y < 1200) {
		thirdPersonCamera.position.y += 1800 * delta;
		ship.position.y += 1800 * delta;
		if (ship.rotation.x < 0.05) {
			ship.rotation.x += 0.002 * Math.PI;
		}
	}
	if (downPressed === true && ship.position.y > -500) {
		thirdPersonCamera.position.y -= 1800 * delta;
		ship.position.y -= 1800 * delta;
		if (ship.rotation.x > -0.05) {
			ship.rotation.x -= 0.002 * Math.PI;
		}
	}

	//move to lane -1 (left)
	if (lane == -1 && ship.position.x > -800) {
		thirdPersonCamera.position.x -= 8000 * delta;
		ship.position.x -= 8000 * delta;
		if (ship.position.x < -800) {
			thirdPersonCamera.position.x = -800;
			ship.position.x = -800;
		}
		if (ship.rotation.z < 0.05 * Math.PI) {
			ship.rotation.z += 0.002 * Math.PI;
		}
	}

	//move to lane 1 (right)
	if (lane == 1 && ship.position.x < 800) {
		thirdPersonCamera.position.x += 8000 * delta;
		ship.position.x += 8000 * delta;
		if (ship.position.x > 800) {
			thirdPersonCamera.position.x = 800;
			ship.position.x = 800;
		}
		if (ship.rotation.z > -0.05) {
			ship.rotation.z -= 0.002 * Math.PI;
		}
	}

	//move to lane 0 (centre)
	if (lane === 0) {
		if (ship.position.x > 0) {
			thirdPersonCamera.position.x -= 8000 * delta;
			ship.position.x -= 8000 * delta;
			if (ship.position.x < 0) {
				thirdPersonCamera.position.x = 0;
				ship.position.x = 0;
			}
			if (ship.rotation.z < 0.05 * Math.PI) {
				ship.rotation.z += 0.002 * Math.PI;
			}
		}
		else if (ship.position.x < 0) {
			thirdPersonCamera.position.x += 8000 * delta;
			ship.position.x += 8000 * delta;
			if (ship.position.x > 0) {
				thirdPersonCamera.position.x = 0;
				ship.position.x = 0;
			}
			if (ship.rotation.z > -0.05) {
				ship.rotation.z -= 0.002 * Math.PI;
			}
		}
	}

	if (statsDisplay == 1) {
		render_stats.update();
	}

	renderer.render( scene, thirdPersonCamera );
};

window.onload = function pageLoad() {
	if (bowser.chrome) {
   		document.getElementById("browsertext").innerHTML = "";
	} else {
  		document.getElementById("browsertext").innerHTML = "This game currently works best in Google Chrome. If you have it installed, please try opening this page in Google Chrome.";
	}

	//load drum samples
	loadSoundFile("samples/bas12.wav","kick");
	loadSoundFile("samples/808_SNARE.wav","snare");
	loadSoundFile("samples/808_HIHAT_C.wav","hihat");
	loadSoundFile("samples/808_CLAP.wav","clap");
	loadSoundFile("samples/808_RIMSHOT.wav","rimshot");
	loadSoundFile("samples/808_COWBELL.wav","cowbell");

	setNotesArray();
	createAudioComponents();
};

function showParameters() {
	if (parametersVisible === false) {
		document.getElementById('gameoptions').style.display='block';
		document.getElementById('showmore').innerHTML = "<span>Hide Options</span>";
		parametersVisible = true;
	}
	else {
		document.getElementById('gameoptions').style.display='none';
		document.getElementById('showmore').innerHTML = "<span>Show Options</span>";
		parametersVisible = false;
	}
}
/*
window.addEventListener("gamepadconnected", function(e) {
  var gp = navigator.getGamepads()[0];
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
  gp.index, gp.id,
  gp.buttons.length, gp.axes.length);
});
*/