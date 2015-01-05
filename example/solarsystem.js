///////////////////////////////////////////////////////////////
// These are demo constants to simplify some expressions
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var DT = 1.0 / 3600.0;

///////////////////////////////////////////////////////////////
// Create a perspective camera and associated orbit controls;
// also create an ortographic camera used for after-effects
var camera = new THREE.PerspectiveCamera( 45, WIDTH/HEIGHT, 0.1, 20000 );

var controls = new THREE.OrbitControls( camera );
controls.minDistance = 10;
controls.maxDistance = 300;
controls.noPan = true;

var orthoCamera = new THREE.OrthographicCamera( WIDTH / - 2, WIDTH / 2, HEIGHT / 2, HEIGHT / - 2, -10000, 10000 );
orthoCamera.position.z = 100;

///////////////////////////////////////////////////////////////
// Create the Skybox scene, which should be rendered first
var skyboxScene = new THREE.Scene();
var materialArray = [];
materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'res/sky.png' ) }));
materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'res/sky.png' ) }));
materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'res/sky.png' ) }));
materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'res/sky.png' ) }));
materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'res/sky.png' ) }));
materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'res/sky.png' ) }));

for (var i = 0; i < 6; i++){
	materialArray[i].side = THREE.BackSide;
}
var skyboxMaterial = new THREE.MeshFaceMaterial( materialArray );
var skyboxGeom = new THREE.CubeGeometry( 10000, 10000, 10000, 1, 1, 1 );
var skybox = new THREE.Mesh( skyboxGeom, skyboxMaterial );
skyboxScene.add( skybox );

///////////////////////////////////////////////////////////////
// Create the main rendering scene, with textured planets and
// their orbits
var planetsScene = new THREE.Scene();

// create planets, from the sun to neptune, with varying diameters and radiuses;
// the information stored here is used for movement as well
var planets = [];
planets.push({ cx: 0, cz: 0, radius: 1,    theta: 16, omega: 2,    diameter: 1,     texture: 'res/sun.png',     has_light: 0 });
planets.push({ cx: 0, cz: 0, radius: 4.6,  theta: 47, omega: 1.9,  diameter: 0.25,  texture: 'res/mercury.png', has_light: 1 });
planets.push({ cx: 0, cz: 0, radius: 7.1,  theta: 22, omega: 1.75, diameter: 0.6,   texture: 'res/venus.png',   has_light: 1 });
planets.push({ cx: 0, cz: 0, radius: 9.8,  theta: 59, omega: 1.5,  diameter: 0.637, texture: 'res/earth.png',   has_light: 1 });
planets.push({ cx: 0, cz: 0, radius: 15.1, theta: 36, omega: 1.25, diameter: 0.38,  texture: 'res/mars.png',    has_light: 1 });
planets.push({ cx: 0, cz: 0, radius: 50,   theta: 65, omega: 0.85, diameter: 6.9,   texture: 'res/jupiter.png', has_light: 1 });
planets.push({ cx: 0, cz: 0, radius: 93,   theta: 19, omega: 0.85, diameter: 5.8,   texture: 'res/saturn.png',  has_light: 1 });
planets.push({ cx: 0, cz: 0, radius: 190,  theta: 81, omega: 0.85, diameter: 2.5,   texture: 'res/uranus.png',  has_light: 1 });
planets.push({ cx: 0, cz: 0, radius: 300,  theta: 8,  omega: 0.5,  diameter: 2.4,   texture: 'res/neptune.png', has_light: 1 });

// based on previous array, create an array of Three.js Meshes to add to the planets scene;
// also asign custom shader materials to render textures and light 
var meshes = [];
for (var i = 0; i < planets.length; i++){
	meshes.push(new THREE.Mesh(
		new THREE.SphereGeometry(planets[i].diameter, 32, 32),
		new THREE.ShaderMaterial({
			uniforms: { 
				texture1: { type:"t", value: THREE.ImageUtils.loadTexture(planets[i].texture) },
				has_light: { type: "i", value: planets[i].has_light }
			},
			vertexShader:  loadShader('shaders/planets.vertex'),
		    fragmentShader: loadShader('shaders/planets.fragment')
		})
	));
	planetsScene.add(meshes[i]);
}

// aditionally add the sun's corona in the mix
var spriteMaterial = new THREE.SpriteMaterial( 
{ 
	map: new THREE.ImageUtils.loadTexture( 'res/glow.png' ), 
	color: 0xffff00, 
	transparent: false, 
	blending: THREE.AdditiveBlending
});
var sprite = new THREE.Sprite( spriteMaterial );
sprite.scale.set(3.25, 3.25, 1.0);
meshes[0].add(sprite); // this centers the glow at the sun mesh (the first mesh)

// and finally add the orbits
for (var i = 0; i < planets.length; i++){
	material = new THREE.LineBasicMaterial( { 
		color: 0xffffff,
		transparent: true,
		opacity: 0.15
	} ),
    geometry = new THREE.CircleGeometry( planets[i].radius, 128 );
    geometry.vertices.shift();
    var orbit = new THREE.Line(geometry, material);
    orbit.rotation.x = Math.PI/2.0;
	planetsScene.add(orbit);
}

///////////////////////////////////////////////////////////////
// Create the GlOW / Blur render scene
var glowScene = new THREE.Scene();

// add to the glowScene as many white meshes as there are
// planets in the solar system
var glowmeshes = [];
for (var i = 0; i < planets.length; i++){
	glowmeshes.push(new THREE.Mesh(
		new THREE.SphereGeometry(planets[i].diameter*1.05, 32, 32),
		new THREE.MeshBasicMaterial({ color: 0xffffff })
	));
	glowScene.add(glowmeshes[i]);
}

///////////////////////////////////////////////////////////////
// Prepare rendering passes

// create a renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize( WIDTH, HEIGHT );
renderer.autoClear = false;
document.body.appendChild( renderer.domElement );

// create an offscreen texture to render post-processing passes on
// instead of the screen
var offscreenTexture = new THREE.WebGLRenderTarget( 
	WIDTH, HEIGHT, 
	{ 	
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.NearestFilter, 
		format: THREE.RGBFormat 
	} 
);

// create a horizontal blur scene that will hold just one screen-sized
// quad and that will have an ortho camera
var hblurScene = new THREE.Scene();		
var quad = new THREE.Mesh(
	new THREE.PlaneBufferGeometry( WIDTH, HEIGHT ), 
	new THREE.ShaderMaterial( {
		uniforms: { tDiffuse: { type: "t", value: offscreenTexture } },
		vertexShader: loadShader('shaders/blur.vertex'),
		fragmentShader: loadShader('shaders/hblur.fragment'),
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		transparent: true
	})
);
quad.position.z = -100;
hblurScene.add(quad);

// create a vertical blur scene that will hold just one screen-sized
// quad and that will have an ortho camera
var vblurScene = new THREE.Scene();
var quad = new THREE.Mesh(
	new THREE.PlaneBufferGeometry(WIDTH, HEIGHT),
	new THREE.ShaderMaterial({
		uniforms: { tDiffuse: { type: "t", value: offscreenTexture } },
		vertexShader: loadShader('shaders/blur.vertex'),
		fragmentShader: loadShader('shaders/vblur.fragment'),
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		transparent: true
	})
);
quad.position.z = -100;
vblurScene.add(quad);

// the basic render loop function
var render = function () {
	requestAnimationFrame( render );
	controls.update();

	// perform simple integration to move the bodies forward
	for (var i = 1; i < planets.length; i++){
		var acc = (-1/planets[i].radius)*Math.sin(planets[i].theta);
		planets[i].omega += acc * DT;
		planets[i].theta += planets[i].omega * DT;
		meshes[i].position.x = planets[i].radius * Math.cos(planets[i].theta) + planets[i].cx;
		meshes[i].position.z = planets[i].cz - planets[i].radius * Math.sin(planets[i].theta);
		glowmeshes[i].position.x = meshes[i].position.x;
		glowmeshes[i].position.z = meshes[i].position.z;
	}

	// 1. clear the renderer and draw the skybox first
	renderer.clear();
	renderer.render(skyboxScene, camera);
	// 2. render the whitescene to offscreenTexture
	renderer.render(glowScene, camera, offscreenTexture, true);
	// 3. render the orthographic hblurScene on the screen
	// this scene will contain one quad with a blurred texture of the original glowscene
	renderer.render(hblurScene, orthoCamera);
	// 4. render the ortographic vblurScene on the screen
	// this scene will contain one quad with a blurred texture of the original glowscene
	renderer.render(vblurScene, orthoCamera);
	// 5. render the initial scene on top of it all
	renderer.render(planetsScene, camera);
};

render();