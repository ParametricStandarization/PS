/* global THREE, OpenPlus */

LowerFrontConnector = function (
        protoLegConnector, protoWallConnector, rib, nut) {

    var legCon = protoLegConnector.clone();
    legCon.buildBottom(true);

    var sideCon = protoWallConnector.clone();
    sideCon.buildBottomHolder(true);

    var frontCon = protoWallConnector.clone();
    frontCon.buildBottomHolder(false);

    var transVecA = sideCon.center.slice();
    var transVecB = legCon.centerA.slice();

    var geomA = sideCon.geom;
    geomA.translate(-transVecA[0], -transVecA[1], -transVecA[2]);
    geomA.rotateX(Math.PI / 2);
    geomA.translate(transVecB[0], transVecB[1], transVecB[2]);
    geomA.translate(0, 0, -(rib.x + nut.width) / 2);
    geomA.scale(1, -1, 1);

    var geomB = frontCon.geom;
    geomB.translate(-transVecA[0], -transVecA[1], -transVecA[2]);
    geomB.rotateX(Math.PI / 2);
    geomB.translate(transVecB[0], transVecB[1], transVecB[2]);
    geomB.translate(0, 0, -(rib.x + nut.width) / 2);
    geomB.rotateZ(Math.PI / 2);

    OpenPlus.flipMaterialIndices(geomA);
    this.compGeom = OpenPlus.mergeGeoms([legCon.geom, geomA, geomB]);

    this.center = legCon.center;
};

LowerFrontConnector.prototype.mesh = function (translation, rotation, scale, flip) {

    var materialFront = new THREE.MeshLambertMaterial({
        color: 0x99ff66
        , side: THREE.FrontSide
    });

    var materialBack = new THREE.MeshLambertMaterial({
        color: 0x99ff66
        , side: THREE.BackSide
    });

    var materials = [materialFront, materialBack];

    var tempGeom = this.compGeom.clone();

    if (rotation) {
        tempGeom.rotateX(rotation[0]);
        tempGeom.rotateY(rotation[1]);
        tempGeom.rotateZ(rotation[2]);
    }

    if (scale)
        tempGeom.scale(scale[0], scale[1], scale[2]);
    
    if (flip) OpenPlus.flipMaterialIndices(tempGeom);

    tempGeom.translate(translation[0], translation[1], translation[2]);


    return new THREE.Mesh(tempGeom, new THREE.MeshFaceMaterial(materials));

};