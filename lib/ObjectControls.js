/* global renderer */

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

window.addEventListener("touchstart", touchStart, false);
window.addEventListener("touchend", touchEnd, false);
window.addEventListener("touchcancel", touchEnd, false);
window.addEventListener("touchmove", touchMove, false);





function touchStart(event) {
    var posX = event.targetTouches[0].clientX - renderer.domElement.offsetLeft;
    var posY = event.targetTouches[0].clientY - renderer.domElement.offsetTop;

    mouse.x = (( posX / renderer.domElement.width ) * 2) - 1;
    mouse.y = - (( posY / renderer.domElement.height ) * 2) + 1;
    
    intersectObjects.forEach(function(obj){obj.guideLine.visible = false;});
    
    raycaster.setFromCamera(mouse, camera);

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

function touchEnd(event) {
    intersectObject = null;
    if(intersect) intersect = false;
    if(controls.noRotate) controls.noRotate = false;
}

function touchMove(event) {
    
    var posX = event.targetTouches[0].clientX - renderer.domElement.offsetLeft;
    var posY = event.targetTouches[0].clientY - renderer.domElement.offsetTop;

    mouse.x = (( posX / renderer.domElement.width ) * 2) - 1;
    mouse.y = - (( posY / renderer.domElement.height ) * 2) + 1;
    
//    intersectObjects.forEach(function(obj){obj.guideLine.visible = false;});
    
    raycaster.setFromCamera(mouse, camera);
    
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



function addIntersectObject(position, listener, func, ray) {
    var intersectObj = new THREE.Mesh(
        new THREE.SphereGeometry(2, 16, 16)
,
        new THREE.MeshLambertMaterial(
                {
                    color: 0xFFFFFF,
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
            gapSize: 0.5} ) );
    
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