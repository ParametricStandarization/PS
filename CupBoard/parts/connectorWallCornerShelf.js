/* global OpenPlus, verb */

ConnectorWallCornerShelf = function (leg, topPlate, wallPlate, wallRib, nut, plateOffset) {
    //margin and offset
    this.margin = 0.3;
    this.offset = 2;
    
    this.plateOffset = plateOffset;

    this.geom;

    this.center;

    this.centerA;
    this.centerB;

    this.srfLines = [];
    this.backGeoms = [];
    this.frontGeoms = [];

    if (topPlate) {
        this.x = wallRib.x + (this.margin * 2);
        this.y = wallRib.y + (this.margin * 2);

        this.z = topPlate.z + (this.margin * 2);
        this.wallHeight = wallPlate.z + (this.margin * 2);

        this.radius = (leg.diameter) / 2 + this.margin;

        //dependend on the diameter of the nut
        this.nutM = nut.m;
        this.nutHeight = nut.height + this.margin;
        this.nutRadius = (nut.diameter / 2) + this.margin;
        this.nutWidth = 2 * Math.sqrt((this.nutRadius * this.nutRadius) -
                ((this.nutRadius / 2) * (this.nutRadius / 2)));

        this.screwRadius = (nut.m / 2) + this.margin;
        this.build();
    }
};

ConnectorWallCornerShelf.prototype.build = function () {
    //concept: make 2D drawing, extrude / planarsrf all that is
    //needed in a second part

    //variable to generate points:
    var a = this.margin;
    var b = a + this.offset;
    var c = b + this.x;
    var d = c + this.offset;

    var diameter = this.nutRadius * 2;

    var e = Math.sqrt((diameter * diameter) * 2);
    var f = b + (this.x / 2);

    var heightA = this.offset + this.nutHeight;
    var heightB = this.y;
    var heightC = this.plateOffset;
    var height = heightA + heightB + heightC;

    //define axes
    var xAxis = [1, 0, 0];
    var yAxis = [0, 1, 0];

    //setPoints to create first line
    var p1 = [b, b, 0];
    var p2 = [c, c, 0];
    var p3 = [c, d, 0];
    var p4 = [c + e, d, 0];
    var p5 = [c + e, c, 0];
    var p6 = [b + e, b, 0];

    var p9 = [-b, -(b + e), 0];
    var p10 = [-c, -(c + e), 0];
    var p11 = [-d, -(c + e), 0];
    var p12 = [-d, -c, 0];
    var p13 = [-c, -c, 0];
    var p14 = [-b, -b, 0];

    var p16 = [f + (e / 2), f, 0];
    var p17 = [-f, -(f + (e / 2)), 0];

    //set the center points for the wood
    this.centerA = [f + (e / 2), f, heightA + (heightB / 2)];
    this.centerB = [-f, -(f + (e / 2)), heightA + (heightB / 2)];

    this.center = [-f, f, heightA + (heightB / 2)];

    //now to create the objects
    var outLineCrv = OpenPlus.PolyLine(
            [p2, p3, p4, p5, p10, p11, p12, p13, p2]);

    this.srfLines.push(outLineCrv);

    var circleA = new verb.geom.Circle(p16, xAxis, yAxis, this.screwRadius);
    var circleB = new verb.geom.Circle(p17, xAxis, yAxis, this.screwRadius);

    var outerPillerCrvA = OpenPlus.PolyLine([p2, p3, p4, p5, p2]);
    var outerPillerCrvB = OpenPlus.PolyLine([p10, p11, p12, p13, p10]);

    var innerCrvB = OpenPlus.PolyLine([p1, p2, p5, p6]);
    var innerCrvC = OpenPlus.PolyLine([p9, p10, p13, p14]);

    var nutPolyA = OpenPlus.Polygon(p16, xAxis, yAxis, 6, this.nutRadius);
    var nutPolyB = OpenPlus.Polygon(p17, yAxis, xAxis, 6, this.nutRadius);

    //create geoms and meshes
    var bottomFace = OpenPlus.PlanarSrf([outLineCrv, circleA, circleB])[0];

    this.backGeoms.push(bottomFace);

    var bottomSide = new verb.geom.ExtrudedSurface(outLineCrv, [0, 0, heightA]);

    this.frontGeoms.push(bottomSide.toThreeGeometry());

    var topSide = new verb.geom.ExtrudedSurface(outLineCrv, [0, 0, -heightC]);
    topSide = topSide.toThreeGeometry();
    topSide.translate(0, 0, height);

    this.backGeoms.push(topSide);

    var pillarA = new verb.geom.ExtrudedSurface(outerPillerCrvA, [0, 0, heightB]);
    pillarA = pillarA.toThreeGeometry();
    pillarA.translate(0, 0, heightA);

    var pillarB = new verb.geom.ExtrudedSurface(outerPillerCrvB, [0, 0, heightB]);
    pillarB = pillarB.toThreeGeometry();
    pillarB.translate(0, 0, heightA);

    this.frontGeoms.push(pillarA);
    this.frontGeoms.push(pillarB);

    var tempSrfA = OpenPlus.PlanarSrf([innerCrvB])[0];
    tempSrfA.translate(0, 0, heightA + heightB);

    var tempSrfB = OpenPlus.PlanarSrf([innerCrvC])[0];
    tempSrfB.translate(0, 0, heightA + heightB);

    this.backGeoms.push(tempSrfA);
    this.backGeoms.push(tempSrfB);

    var tempCrvs = [[circleA, nutPolyA.reverse()], [circleB, nutPolyB.reverse()]];

    for (var i = 0; i < tempCrvs.length; i++) {
        var tempCrv = tempCrvs[i];

        var tempSrf = OpenPlus.PlanarSrf(tempCrv)[0];
        tempSrf.translate(0, 0, this.offset);

        var tempExtrA = new verb.geom.ExtrudedSurface(
                tempCrv[0], [0, 0, this.offset]);

        var tempExtrB = new verb.geom.ExtrudedSurface(
                tempCrv[1], [0, 0, this.nutHeight]);
        var tempExtrSrfB = tempExtrB.toThreeGeometry();
        tempExtrSrfB.translate(0, 0, this.offset);

        this.frontGeoms.push(tempSrf);
        this.frontGeoms.push(tempExtrA.toThreeGeometry());
        this.backGeoms.push(tempExtrSrfB);
    }

    var tempSrfC = OpenPlus.PlanarSrf([innerCrvB, nutPolyA])[0];
    tempSrfC.translate(0, 0, heightA);
    
    var tempSrfD = OpenPlus.PlanarSrf([innerCrvC, nutPolyB])[0];
    tempSrfD.translate(0, 0, heightA);

    this.frontGeoms.push(tempSrfC);
    this.frontGeoms.push(tempSrfD);
};

ConnectorWallCornerShelf.prototype.withWall = function () {
    

    var heightA = this.offset + this.nutHeight;
    var heightB = this.y;
    var heightC = heightB - this.wallHeight;
//    var heightD = heightA + heightB - this.wallHeight;
    
    //variable to generate points:
    var a = this.margin;
    var b = a + this.offset;

    var diameter = this.nutRadius * 2;

    var e = Math.sqrt((diameter * diameter) * 2);

    var p0 = [a, a, 0];
    var p1 = [b, b, 0];
    var p6 = [b + e, b, 0];
    var p7 = [a + e, a, 0];

    var p8 = [-a, -(a + e), 0];
    var p9 = [-b, -(b + e), 0];
    var p14 = [-b, -b, 0];
    var p15 = [-a, -a, 0];

    var innerPillerCrvA = OpenPlus.PolyLine([p0, p1, p6, p7, p0]);
    var innerPillerCrvB = OpenPlus.PolyLine([p8, p9, p14, p15, p8]);
    
    var pillarA = new verb.geom.ExtrudedSurface(innerPillerCrvA, [0, 0, this.wallHeight]);
    pillarA = pillarA.toThreeGeometry();
    pillarA.translate(0, 0, heightA);
    
    var pillarB = new verb.geom.ExtrudedSurface(innerPillerCrvB, [0, 0, this.wallHeight]);
    pillarB = pillarB.toThreeGeometry();
    pillarB.translate(0, 0, heightA);

    this.frontGeoms.push(pillarA);
    this.frontGeoms.push(pillarB);

    var innerPillar = OpenPlus.PolyLine([p1, p6, p9, p14, p1]);
    
    var pillar = new verb.geom.ExtrudedSurface(innerPillar, [0, 0, heightC]);
    pillar = pillar.toThreeGeometry();
    pillar.translate(0, 0, heightA + this.wallHeight);

    this.frontGeoms.push(pillar);
    
    
    var tempSrfA = OpenPlus.PlanarSrf([innerPillar])[0];
    var tempSrfB = tempSrfA.clone();
    
    tempSrfA.translate(0, 0, heightA);
    tempSrfB.translate(0, 0, heightA + this.wallHeight);
    
    this.frontGeoms.push(tempSrfA);
    this.backGeoms.push(tempSrfB);


};

ConnectorWallCornerShelf.prototype.noWall = function () {
    //variable to generate points:
    var a = this.margin;
    var b = a + this.offset;

    var diameter = this.nutRadius * 2;

    var e = Math.sqrt((diameter * diameter) * 2);

    var heightA = this.offset + this.nutHeight;
    var heightB = this.y;

    var p1 = [b, b, 0];
    var p6 = [b + e, b, 0];
    var p9 = [-b, -(b + e), 0];
    var p14 = [-b, -b, 0];

    var innerPillar = OpenPlus.PolyLine([p1, p6, p9, p14, p1]);
    
    var pillar = new verb.geom.ExtrudedSurface(innerPillar, [0, 0, heightB]);
    pillar = pillar.toThreeGeometry();
    pillar.translate(0, 0, heightA);

    this.frontGeoms.push(pillar);
};

ConnectorWallCornerShelf.prototype.buildBottomHolder = function (containsWall) {
    if (containsWall) this.withWall();
    else this.noWall();
    
    //dependend on the two parts set together
    //need to analyze this
    var height = (2 * this.offset) + this.y + this.nutHeight;

    var topFace = OpenPlus.PlanarSrf([this.srfLines[0]])[0];
    topFace.translate(0, 0, height);

    this.frontGeoms.push(topFace);

    //combine the cylinder and the bottom and top meshes
    this.geom = OpenPlus.combineGeom(this.frontGeoms, this.backGeoms);
};

ConnectorWallCornerShelf.prototype.buildTopHolder = function (containsWall) {
    if (containsWall) this.withWall();
    else this.noWall();
    
    var z = this.z;

    //variable to generate points:
    var a = this.margin + this.offset + this.x;
    var b = a + this.offset;
    var c = a - z;
    var d = c - this.offset;

    var diameter = this.nutRadius * 2;

    var e = Math.sqrt((diameter * diameter) * 2);

    //dependend on the two parts set together
    //need to analyze this
    var heightA = (this.y / 2) + this.offset;
    var heightB = (2 * heightA) + this.nutHeight;

    //setPoints to create first line
    var p0 = [c, c, heightB];
    var p1 = [a, a, heightB];
    var p2 = [a, b, heightB];
    var p3 = [a + e, b, heightB];
    var p4 = [a + e, a, heightB];
    var p5 = [c + e, c, heightB];

    var p6 = [d + e, d, heightB];
    var p7 = [-a, -(a + e), heightB];
    var p8 = [-b, -(a + e), heightB];
    var p9 = [-b, -a, heightB];
    var p10 = [-a, -a, heightB];
    var p11 = [d, d, heightB];

    var innerTopPlateHolderCrv = OpenPlus.PolyLine([p0, p1, p2, p3, p4, p5]);
    var outerTopPlateHolderCrv = OpenPlus.PolyLine([p6, p7, p8, p9, p10, p11]);

    var innerTopPlateHolderSrf = OpenPlus.PlanarSrf([innerTopPlateHolderCrv])[0];
    var outerTopPlateHolderSrf = OpenPlus.PlanarSrf([outerTopPlateHolderCrv])[0];

    this.frontGeoms.push(innerTopPlateHolderSrf);
    this.frontGeoms.push(outerTopPlateHolderSrf);

    //creating the offset to hold the plate
    var lengthA = (this.radius + this.offset + a + c) - heightA - this.margin;
    var lengthB = (this.radius + this.offset + a + d) - heightA - this.margin;

    var p12 = [d, d, heightB + lengthB];
    var p13 = [c, c, heightB + lengthA];
    var p14 = [c + e, c, heightB + lengthA + e];
    var p15 = [d + e, d, heightB + lengthB + e];

    var platHolderA = OpenPlus.PolyLine([p0, p11, p12, p13]);
    var platHolderB = OpenPlus.PolyLine([p5, p6, p15, p14]);
    var platHolderC = OpenPlus.PolyLine([p6, p11, p12, p15]);
    var platHolderD = OpenPlus.PolyLine([p5, p0, p13, p14]);
    var platHolderE = OpenPlus.PolyLine([p12, p13, p14, p15]);

    var platHolderASrf = OpenPlus.PlanarSrf([platHolderA])[0];
    var platHolderBSrf = OpenPlus.PlanarSrf([platHolderB])[0];
    var platHolderCSrf = OpenPlus.PlanarSrf([platHolderC])[0];
    var platHolderDSrf = OpenPlus.PlanarSrf([platHolderD])[0];
    var platHolderESrf = OpenPlus.PlanarSrf([platHolderE])[0];

    this.backGeoms.push(platHolderASrf);
    this.frontGeoms.push(platHolderBSrf);
    this.frontGeoms.push(platHolderCSrf);
    this.backGeoms.push(platHolderDSrf);
    this.frontGeoms.push(platHolderESrf);

    //combine the cylinder and the bottom and top meshes
    this.geom = OpenPlus.combineGeom(this.frontGeoms, this.backGeoms);
};

ConnectorWallCornerShelf.prototype.copy = function (original) {
    //margin and offset
    this.margin = original.margin;
    this.offset = original.offset;
    
    this.plateOffset = original.plateOffset;

    //depended on connected objects
    this.radius = original.radius;

    this.x = original.x;
    this.y = original.y;
    this.z = original.z;
    this.wallHeight = original.wallHeight;

    //dependend on the diameter of the nut
    this.nutM = original.nutM;
    this.nutHeight = original.nutHeight;
    this.nutWidth = original.nutWidth;
    this.nutRadius = original.nutRadius;

    this.materialFront = original.materialFront;
    this.materialBack = original.materialBack;

    this.srfLines = original.srfLines.slice();

    this.frontGeoms = original.frontGeoms.slice();
    this.backGeoms = original.backGeoms.slice();

    this.center = original.center;

    this.centerA = original.centerA;
    this.centerB = original.centerB;
};

ConnectorWallCornerShelf.prototype.clone = function () {
    var clone = new this.constructor();
    clone.copy(this);
    return clone;
};