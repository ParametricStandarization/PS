Leg = function (diameter, height) {
    this.diameter = diameter;
    this.height = height;
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

Leg.prototype.build = function () {
    var radius = this.diameter / 2;
    var height = this.height;

    var center = [0, 0, 0];
    var xAxis = [1, 0, 0];
    var yAxis = [0, 1, 0];
    var zAxis = [0, 0, 1];

    //create the bottom cap circle of the cylinder
    var circle = new verb.geom.Circle(
            center, xAxis, yAxis, radius);

    var circleGeom = OpenPlus.PlanarSrf([circle])[0];

    //clone and translate circle to create top cap
    var topCircle = new THREE.Geometry().copy(circleGeom);
    topCircle.translate(0, 0, height);

    //cylinderMesh, is a open cylinder shape
    var cylinderNurb = new verb.geom.CylindricalSurface(
            zAxis, xAxis, center, height, radius);

    var cylinderGeom = cylinderNurb.toThreeGeometry();

    //add meshes to array to combine into one mesh
    var frontGeoms = [topCircle];
    var backGeoms = [circleGeom, cylinderGeom];

    //combine the cylinder and the bottom and top meshes
    this.mesh = OpenPlus.combineMesh(frontGeoms, backGeoms,
            this.materialFront, this.materialBack);

};