// Some helper methods for the examples

var scene, camera, renderer, controls;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

raycaster.lineprecision = 0.00001;
raycaster.precision = 0.001;

var intersectObjects = [];
var intersectObject;
var intersect = false;

function onMouseMove(event) {


    var posX = event.clientX - renderer.domElement.offsetLeft;
    var posY = event.clientY - renderer.domElement.offsetTop;

    mouse.x = (( posX / renderer.domElement.width ) * 2) - 1;
    mouse.y = - (( posY / renderer.domElement.height ) * 2) + 1;
    
    intersectObjects.forEach(function(obj){obj.guideLine.visible = false;});
    
    raycaster.setFromCamera(mouse, camera);
    
    var intersects = raycaster.intersectObjects(intersectObjects);
    for (var i = 0; i < intersects.length; i++) {
        var intersectObj = intersects[i].object;
        intersectObj.guideLine.visible = true;
    }
    
    if(intersect){
        var closestPts = verb.eval.Intersect.rays(
                intersectObject.rayObject.origin,
                intersectObject.rayObject.direction,
                raycaster.ray.origin.toArray(),
                raycaster.ray.direction.toArray()
        );

        if(closestPts.u0 > 1 || closestPts.u0 < 0) return;

        var closestPt = closestPts.point0;

        intersectObject.position.set(
                closestPt[0], closestPt[1], closestPt[2]);
        intersectObject.listenerObject[intersectObject.runFunction](closestPt);
        
        intersectObject.sprite.position.set(
                closestPt[0], closestPt[1], closestPt[2]);
        
        intersectObject.guideLine.visible = true;
    }

}

function onMouseDown(event) {

    if (intersectObjects.length > 0) {

        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(intersectObjects);
        for (var i = 0; i < intersects.length; i++) {
            controls.noRotate = true;
            intersectObject = intersects[i].object;
            intersect = true;
        }
    }
}

function onMouseUp(event) {
    intersectObject = null;
    if(intersect) intersect = false;
    if(controls.noRotate) controls.noRotate = false;

}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mouseup', onMouseUp, false);

function addIntersectObject(position, listener, func, ray) {
    var intersectObj = new THREE.Mesh(
        new THREE.SphereGeometry(2, 16, 16)
,
        new THREE.MeshLambertMaterial(
                {
                    color: 0xFFFFFF,
                    shading: THREE.FlatShading,
                    transparent: true,
                    opacity: 1,
                    visible: false
                })
        );

    intersectObj.geometry.computeFaceNormals();
    intersectObj.position.set(position[0], position[1], position[2]);
    
    intersectObj.listenerObject = listener;
    intersectObj.runFunction = func;
    intersectObj.rayObject = ray;
    
    scene.add(intersectObj);
    
    function generateTexture() {
        var PI2 = Math.PI * 2;
        var width = 1024;
        var height = 1024;

        var canvas = document.createElement( 'canvas' );
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext( '2d' );

        context.beginPath();
        context.arc( width*0.5, height*0.5, width * 0.4, 0, PI2, true );

        context.lineWidth = 1000 / 20;
        context.strokeStyle = "rgba(255, 255, 255, 0.5)";
        context.fillStyle = "rgba(255, 255, 255, 0.2)";
        context.stroke();
        context.fill();

        return canvas;
    }

    var texture = new THREE.Texture( generateTexture() );
    texture.needsUpdate = true; // important!

    var material = new THREE.SpriteMaterial( { map: texture } );
    material.depthTest = false;

    var sprite = new THREE.Sprite( material );
    sprite.scale.set(5,5);
//    sprite.visible = false;
    sprite.position.set(position[0], position[1], position[2]);
    
    intersectObj.sprite = sprite;
    scene.add( sprite);
    
    var pA = ray.origin;
    var pB = ray.direction;
       
    var lineGeom = new THREE.Geometry();
    lineGeom.vertices.push(
            new THREE.Vector3( pA[0], pA[1], pA[2] ),
            new THREE.Vector3( pA[0]+pB[0], pA[1]+pB[1], pA[2]+pB[2] )
    );
    
    lineGeom.computeLineDistances();
    
    var lineMesh = new THREE.Line( lineGeom, 
        new THREE.LineDashedMaterial( { 
            color: 0x7c7c7c, 
            dashSize: 1, 
            gapSize: 0.5,
            lineWidth: 20} ) );
    
    lineMesh.visible = false;
    
    lineMesh.geometry.dynamic = true;
    
    intersectObj.guideLine = lineMesh;
    scene.add( lineMesh );
    
    intersectObjects.push(intersectObj);
    
    var update = function(position, newRay){
        this.position.set(position[0], position[1], position[2]);
        this.sprite.position.set(position[0], position[1], position[2]);
        
        this.rayObject = newRay;

        var newPA = newRay.origin;
        var newPB = newRay.direction;

        this.guideLine.geometry.vertices[0].set(newPA[0], newPA[1], newPA[2]);
        this.guideLine.geometry.vertices[1].set(newPA[0]+newPB[0], newPA[1]+newPB[1], newPA[2]+newPB[2]);
        
        this.guideLine.geometry.verticesNeedUpdate = true;
        this.guideLine.geometry.computeLineDistances();
    };
    
    intersectObj.updateHandler = update;
    
        
    return intersectObj;
}

function threeSetup() {

    scene = new THREE.Scene();
    
    var width = window.innerWidth;
    var height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(
            75, width / height, 0.1, 1000);
    camera.position.y = height / 15;
    camera.position.z = 20;
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
    
    controls.target = new THREE.Vector3( 0, 0, 5 );
    
    console.log(controls.target);

//    controls.target = new THREE.Vector3( 0, 1.5, 0);

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
