/* global verb, OpenPlus, THREE */

Plate = function (x, y, z, directionAxis) {
    this.x = x;
    this.y = y;
    this.z = z;

    this.direction = directionAxis;

    this.mesh;

    this.materialFront = new THREE.MeshLambertMaterial({
        color: 0xffff99
        , side: THREE.FrontSide
    });

    this.materialBack = new THREE.MeshLambertMaterial({
        color: 0xffff99
        , side: THREE.BackSide
    });

    this.build();
};

Plate.prototype.build = function () {
    var center = [0, 0, 0];


    var angle = verb.core.Vec.angleBetween([0, 0, 1], this.direction);

    var xAxis, yAxis;

    if (angle > 0.00001) {
        xAxis = verb.core.Vec.cross([0, 0, 1], this.direction);
        yAxis = verb.core.Vec.cross(this.direction, xAxis);
    } else {
        xAxis = [1, 0, 0];
        yAxis = [0, 1, 0];
    }

    var extrusionVec = verb.core.Vec.mul(this.z, this.direction);

    //create the bottom cap circle of the cylinder
    var rectangle = OpenPlus.Rectangle(center, xAxis, yAxis,
            this.x, this.y);

    var rectangleGeom = OpenPlus.PlanarSrf([rectangle])[0];

    //clone and translate circle to create top cap
    var topRectangle = new THREE.Geometry().copy(rectangleGeom);

    //cylinderMesh, is a open cylinder shape
    var boxNurb = new verb.geom.ExtrudedSurface(rectangle, extrusionVec);
    var boxGeom = boxNurb.toThreeGeometry();

    rectangleGeom.translate(-extrusionVec[0] / 2, -extrusionVec[1] / 2, -extrusionVec[2] / 2);
    topRectangle.translate(extrusionVec[0] / 2, extrusionVec[1] / 2, extrusionVec[2] / 2);
    boxGeom.translate(-extrusionVec[0] / 2, -extrusionVec[1] / 2, -extrusionVec[2] / 2);

    //add meshes to array to combine into one mesh
    var backGeoms = [rectangleGeom];
    var frontGeoms = [topRectangle, boxGeom];

    //combine the cylinder and the bottom and top meshes
    this.mesh = OpenPlus.combineMesh(frontGeoms, backGeoms,
            this.materialFront, this.materialBack);
};