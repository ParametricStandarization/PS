/* global THREE */

// Some helper methods for the examples
var scene, camera, renderer, controls;

function threeSetup() {

    scene = new THREE.Scene();
    
    var width = window.innerWidth;
    var height = window.innerHeight;

    //die we gebruiken bij de JUG
//    camera = new THREE.PerspectiveCamera(
//            75, width / height, 0.1, 1000);
//    camera.position.y = height / 20;
//    camera.position.z = 20;
//    camera.up.set(0, 0, 1);
    
    camera = new THREE.PerspectiveCamera(
            75, width / height, 0.1, 300000);
//    camera.position.y = height / 20;
    camera.position.z = 1700;
    camera.up.set(0, 0, 1);
    
    

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff, 0);

    //document.body.appendChild(renderer.domElement);
    
    var container = document.getElementById( 'objectContainer' );
//    document.body.appendChild( container );
    
    container.appendChild( renderer.domElement );

    var ambientLight = new THREE.AmbientLight(0xbbbbbb);
    scene.add(ambientLight);

    var lights = [];
    lights[0] = new THREE.PointLight(0xececec, 0.25, 0);
    lights[1] = new THREE.PointLight(0xececec, 0.25, 0);
    lights[2] = new THREE.PointLight(0xececec, 0.25, 0);

    lights[0].position.set(0, 100, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set(-100, -200, -100);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    controls.minPolarAngle = Math.PI * (8 / 20); // radians
    controls.maxPolarAngle = Math.PI * (8 / 20); // radians
    controls.noPan = true;
    controls.noZoom = true;
    
    //die we gebruiken bij de JUG
//    controls.target = new THREE.Vector3( 0, 0, 5 );
    controls.target = new THREE.Vector3( 0, 0, 500 );

    controls.update();
}

function threeRender() {

    function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
    
    render();
}

function addCurveToScene(geom, material) {
    material = material || new THREE.LineBasicMaterial({
        linewidth: 2, color: 0xdcdcdc});

    object = new THREE.Line(geom, material);

    scene.add(object);

    return object;
}

function addLineToScene(pts, mat) {
    addCurveToScene(asGeometry(asVector3(pts)), mat);
}

function addMeshToScene(mesh, material, wireframe) {
    material = material || new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide, 
        wireframe: false, 
        transparent: true, 
        opacity: 0.4})

    object = new THREE.Mesh(mesh, material);
    scene.add(object);

    if (wireframe) {
        var material2 = new THREE.MeshBasicMaterial({
            color: 0x000000, 
            side: THREE.DoubleSide, 
            wireframe: true});
        var mesh2 = new THREE.Mesh(mesh, material2);
        scene.add(mesh2);
    }

    return object;
}

function asVector3(pts) {
    return pts.map(function (x) {
        return new THREE.Vector3(x[0], x[1], x[2]);
    });
}

function asGeometry(threePts) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push.apply(geometry.vertices, threePts);
    return geometry;
}

function benchmark(func, runs) {
    var d1 = Date.now();
    for (var i = 0; i < runs; i++)
        res = func();
    var d2 = Date.now();
    return {result: res, elapsed: d2 - d1, each: (d2 - d1) / runs};
}

function pointsAsGeometry(pts) {
    return asGeometry(asVector3(pts));
}

function addPointsToScene(pts) {

    var geom = asGeometry(asVector3(pts));
    var cloudMat2 = new THREE.PointCloudMaterial({
        size: 6.5, sizeAttenuation: false, color: 0xffffff});
    var cloud2 = new THREE.PointCloud(geom, cloudMat2);

    scene.add(cloud2);
}

function removeFromScene(obj) {
    scene.remove(obj);
}
