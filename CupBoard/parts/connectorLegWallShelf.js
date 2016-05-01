/* global OpenPlus, verb, THREE */

ConnectorLegWallShelf = function (leg, wallRib, nut, plateOffset) {
    //margin and offset
    this.margin = 0.3;
    this.offset = 2;

    //depended on connected objects
    this.geom;
    this.srfLines = [];

    this.frontGeoms = [];
    this.backGeoms = [];

    this.centerA;
    this.centerB;

    if (leg) {
        this.radius = (leg.diameter) / 2 + this.margin;
        this.x = wallRib.x + (this.margin * 2);
        this.y = wallRib.y + (this.margin * 2);

        this.plateOffset = plateOffset;

        //dependend on the diameter of the nut
        this.nutM = nut.m;
        this.nutHeight = nut.height + this.margin;
        this.nutRadius = (nut.diameter / 2) + this.margin;
        this.nutWidth = 2 * Math.sqrt((this.nutRadius * this.nutRadius) -
                ((this.nutRadius / 2) * (this.nutRadius / 2)));

        this.center = [0, 0, this.nutWidth / 2];
        this.buildProto();
    }
};

ConnectorLegWallShelf.prototype.buildProto = function () {
    var center = [0, 0, 0];

    var xAxis = [1, 0, 0], yAxis = [0, 1, 0];

    var rad = this.radius;
    var offset = this.offset;
    var plOffset = this.plateOffset;
    var margin = this.margin;
    var x = this.x;
    var y = this.y;

    var b = rad + offset;
    var d = b + y + offset;
    var e = (x / 2) + margin + plOffset;

    var innerAngleNutLow = Math.asin((this.nutRadius / 2) / rad);
    var innerAngleNutMid = Math.asin(this.nutRadius / rad);

    var f = Math.cos(innerAngleNutLow + (Math.PI / 4)) * rad;
    var g = Math.sin(innerAngleNutLow + (Math.PI / 4)) * rad;

    var h = Math.sqrt(((this.nutHeight + rad) * (this.nutHeight + rad)) / 2);

    var i = Math.cos(innerAngleNutMid + (Math.PI / 4)) * rad;
    var j = Math.sin(innerAngleNutMid + (Math.PI / 4)) * rad;

    var k = Math.sqrt(((this.nutRadius / 2) * (this.nutRadius / 2)) / 2);

    var p2 = [d, e, 0];
    var p3 = [e, d, 0];

    var p6 = [f, g, 0];
    var p7 = [g, f, 0];
    var p8 = [h + k, h - k, 0];
    var p9 = [h - k, h + k, 0];

    var p10 = [i, j, this.nutWidth / 2];
    var p11 = [j, i, this.nutWidth / 2];
    var p12 = [h + (k * 2), h - (k * 2), this.nutWidth / 2];
    var p13 = [h - (k * 2), h + (k * 2), this.nutWidth / 2];

    var p16 = [h, h, this.nutWidth / 2];
    var p17 = [(p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2, this.nutWidth / 2];

    //create edges of shapes
    var innerArc = new verb.geom.Arc(center, xAxis, yAxis, rad,
            innerAngleNutMid + (Math.PI / 4), (Math.PI * 2.25) - innerAngleNutMid);

    var nutEdgeArcA = new verb.geom.Arc(center, xAxis, yAxis, rad,
            innerAngleNutLow + (Math.PI / 4), innerAngleNutMid + (Math.PI / 4));

    var nutEdgeArcB = new verb.geom.Arc(center, xAxis, yAxis, rad,
            -innerAngleNutMid + (Math.PI / 4), -innerAngleNutLow + (Math.PI / 4));

    var vecA = verb.core.Vec.sub(p13, p9);
    var vecB = verb.core.Vec.sub(p13, p10);

    var planeOrigin = p13;
    var planeNormal = verb.core.Vec.cross(vecA, vecB);

    var segmentPtA = nutEdgeArcA.point(0.5);
    var segmentPtB = [segmentPtA[0], segmentPtA[1], this.nutWidth];

    var intersectPtLoc = verb.eval.Intersect.segmentAndPlane(
            segmentPtA, segmentPtB, planeOrigin, planeNormal);

    var segment = new verb.geom.Line(segmentPtA, segmentPtB);

    var intersectPtA = segment.point(intersectPtLoc.p);

    var intersectPtB = nutEdgeArcB.point(0.5);
    intersectPtB[2] = intersectPtA[2];

    var innerConNutRidgeA = verb.geom.NurbsCurve.byKnotsControlPointsWeights(
            2, [0, 0, 0, 1, 1, 1], [p6, intersectPtA, p10], [1, 1, 1]);
    var innerConNutRidgeB = verb.geom.NurbsCurve.byKnotsControlPointsWeights(
            2, [0, 0, 0, 1, 1, 1], [p11, intersectPtB, p7], [1, 1, 1]);

    var lineNutHoleEdgeA = OpenPlus.PolyLine([p6, p9, p13, p10]);
    var lineNutHoleEdgeB = OpenPlus.PolyLine([p7, p8, p12, p11]);

    var outerScrewLine = new verb.geom.Line(p2, p3);

    //extrusions for the edge of the nut
    var loftUVLength = innerConNutRidgeA.controlPoints().length;

    var innerToNutLoftA = verb.geom.NurbsSurface.byLoftingCurves(
            [nutEdgeArcA, innerConNutRidgeA], loftUVLength);

    innerToNutLoftA._data.controlPoints[0][0] = nutEdgeArcA._data.controlPoints[0];
    innerToNutLoftA._data.controlPoints[0][1] = innerConNutRidgeA._data.controlPoints[0];

    var innerToNutLoftB = verb.geom.NurbsSurface.byLoftingCurves(
            [nutEdgeArcB, innerConNutRidgeB], loftUVLength);

    innerToNutLoftB._data.controlPoints[2][0] = nutEdgeArcB._data.controlPoints[2];
    innerToNutLoftB._data.controlPoints[2][1] = innerConNutRidgeB._data.controlPoints[2];

    var nutSidePlanarA = OpenPlus.PlanarSrf([lineNutHoleEdgeA, innerConNutRidgeA])[0];
    var nutSidePlanarB = OpenPlus.PlanarSrf([lineNutHoleEdgeB, innerConNutRidgeB])[0];

    //need to change this to add fronts and backs
    var mergedNutBottom = OpenPlus.mergeGeoms([innerToNutLoftA.toThreeGeometry(), innerToNutLoftB.toThreeGeometry(),
        nutSidePlanarA, nutSidePlanarB]);

    var mergedNutTop = mergedNutBottom.clone();
    
    var rotateMat = OpenPlus.MatrixRotationOverLine(p16, p17, Math.PI);
    rotateMat = OpenPlus.VerbMatrix4ToThreeMatrix4(rotateMat);
    mergedNutTop.applyMatrix(rotateMat);

    //extrusions for the screw entrance and exit
    var nutPoly = OpenPlus.Polygon(p16, [-1, 1, 0], [0, 0, 1], 6, this.nutRadius);
    var screwExit = new verb.geom.Circle(p16, [-1, 1, 0], [0, 0, -1],
            (this.nutM / 2) + this.margin);

    var nutSrf = OpenPlus.PlanarSrf([nutPoly, screwExit])[0];

    var rectFront = OpenPlus.Rectangle(p17, [1, -1, 0], [0, 0, -1],
            outerScrewLine.length(), this.nutWidth);
    var screwEntrance = new verb.geom.Circle(p17, [-1, 1, 0], [0, 0, 1],
            (this.nutM / 2) + this.margin);

    var front = OpenPlus.PlanarSrf([rectFront, screwEntrance])[0];
    
    var extrudeVec = verb.core.Vec.sub(p17, p16);

    var screwExtrusion = new verb.geom.ExtrudedSurface(screwExit.reverse(), extrudeVec);

    //add Lines for future planes
    var innerArcSrf = new verb.geom.ExtrudedSurface(innerArc, [0, 0, this.nutWidth]);
    var bottomNutSlot = OpenPlus.PolyLine([p7, p8, p9, p6]);

    this.srfLines = [innerArc, nutEdgeArcA, nutEdgeArcB, bottomNutSlot];

    //add geoms for future mesh
    this.geom = OpenPlus.mergeGeoms([innerArcSrf.toThreeGeometry(),
        screwExtrusion.toThreeGeometry(), front, nutSrf, mergedNutBottom,
        mergedNutTop]);
};

ConnectorLegWallShelf.prototype.buildShelfRest = function () {
    var center = [0, 0, 0];

    var rad = this.radius;
    var offset = this.offset;
    var plOffset = this.plateOffset;
    var margin = this.margin;
    var x = this.x;
    var y = this.y;

    var a = (x / 2);
    var b = rad + offset;
    var c = Math.sqrt((b * b) - (a * a));
    var d = b + y + offset;
    var e = (x / 2) + margin + plOffset;

    var p0 = [c, a, 0];
    var p1 = [d, a, 0];
    var p2 = [d, e, 0];
    var p3 = [e, d, 0];
    var p4 = [a, d, 0];
    var p5 = [a, c, 0];

    var p6 = [c, e, 0];
    var p7 = [e, c, 0];

    var outerAngle = Math.asin(a / b);

    //create lines
//    var outerArc = new verb.geom.Arc(center, [1, 0, 0], [0, 1, 0], b,
//            (Math.PI / 2) - outerAngle, (Math.PI * 2) + outerAngle);
    var outerArc = new verb.geom.Arc(center, [1, 0, 0], [0, -1, 0], b,
            -outerAngle, (Math.PI * 1.5) + outerAngle);

    var bottomOuterCloseLine = OpenPlus.PolyLine([p5, p4, p3, p2, p1, p0]);
    var topOuterCloseLine = OpenPlus.PolyLine([p5, p7, p3, p2, p6, p0]);

    var edgeBlockALine = OpenPlus.PolyLine([p0, p6, p2, p1, p0]);
    var edgeBlockBLine = OpenPlus.PolyLine([p3, p7, p5, p4, p3]);

    //create planes
    var bottomLines = this.srfLines.slice();
    var topLines = this.srfLines.slice();

    bottomLines.unshift(bottomOuterCloseLine);
    bottomLines.unshift(outerArc);

    topLines.unshift(topOuterCloseLine);
    topLines.unshift(outerArc);

    var bottomSrf = OpenPlus.PlanarSrf(bottomLines)[0];
    
    var rotateMat = OpenPlus.MatrixRotationOverLine([0,0,0], [1,1,0], Math.PI);
    rotateMat = OpenPlus.VerbMatrix4ToThreeMatrix4(rotateMat);
    bottomSrf.applyMatrix(rotateMat);
    
    var topSrf = OpenPlus.PlanarSrf(topLines)[0];
    topSrf.translate(0, 0, this.nutWidth);
    
    var edgeBlockASrf = OpenPlus.PlanarSrf([edgeBlockALine])[0];
    var edgeBlockBSrf = OpenPlus.PlanarSrf([edgeBlockBLine])[0];
    
    edgeBlockASrf.translate(0,0,this.nutWidth + this.offset);
    edgeBlockBSrf.translate(0,0,this.nutWidth + this.offset);

    //create extrusions
    var extrudeouterArc = new verb.geom.ExtrudedSurface(
            outerArc, [0, 0, this.nutWidth]).toThreeGeometry();
    var extrudeouterEdgeA = new verb.geom.ExtrudedSurface(
            OpenPlus.PolyLine([p2, p1, p0]), [0, 0, this.nutWidth]).toThreeGeometry();
    var extrudeouterEdgeB = new verb.geom.ExtrudedSurface(
            OpenPlus.PolyLine([p5, p4, p3]), [0, 0, this.nutWidth]).toThreeGeometry();

    var edgeBlockAExt = new verb.geom.ExtrudedSurface(
            edgeBlockALine, [0, 0, offset]).toThreeGeometry();
    var edgeBlockBExt = new verb.geom.ExtrudedSurface(
            edgeBlockBLine, [0, 0, offset]).toThreeGeometry();

    edgeBlockAExt.translate(0, 0, this.nutWidth);
    edgeBlockBExt.translate(0, 0, this.nutWidth);

    this.geom = OpenPlus.mergeGeoms([this.geom, extrudeouterArc,
        extrudeouterEdgeA, extrudeouterEdgeB, edgeBlockAExt, edgeBlockBExt,
        bottomSrf, topSrf, edgeBlockASrf, edgeBlockBSrf]);
};

ConnectorLegWallShelf.prototype.buildBottom = function () {
    var center = [0, 0, 0];

    var rad = this.radius;
    var offset = this.offset;
    var plOffset = this.plateOffset;
    var margin = this.margin;
    var x = this.x;
    var y = this.y;

    var a = (x / 2) + offset;
    var b = rad + offset;
    var c = Math.sqrt((b * b) - (a * a));
    var d = b + y + offset;
    var e = (x / 2) + margin + plOffset;

    var m = (y / 2) + b;

    var p0 = [c, -a, 0];
    var p1 = [d, -a, 0];
    var p2 = [d, e, 0];
    var p3 = [e, d, 0];
    var p4 = [-a, d, 0];
    var p5 = [-a, c, 0];

    var p14 = [m, 0, 0];
    var p15 = [0, m, 0];

    var outerAngle = Math.asin(a / b);
    
    this.centerA = [m, 0, this.nutWidth / 2];
    this.centerB = [0,m, this.nutWidth / 2];

    //create lines
    var outerArc = new verb.geom.Arc(center, [1, 0, 0], [0, -1, 0], b,
            outerAngle, (Math.PI * 1.5) - outerAngle);

    var outerCloseLine = OpenPlus.PolyLine([p5, p4, p3, p2, p1, p0]);

    var rectA = OpenPlus.Rectangle(p14, [1, 0, 0], [0, -1, 0], x, y);
    var rectB = OpenPlus.Rectangle(p15, [0, 1, 0], [1, 0, 0], x, y);

    //create planes
    this.srfLines.unshift(outerCloseLine);
    this.srfLines.unshift(outerArc);
    this.srfLines.push(rectA);
    this.srfLines.push(rectB);

    var bottomSrf = OpenPlus.PlanarSrf(this.srfLines)[0];
    var topSrf = bottomSrf.clone();
    topSrf.translate(0, 0, this.nutWidth);
    
    var rotateMat = OpenPlus.MatrixRotationOverLine([0,0,0], [1,1,0], Math.PI);
    rotateMat = OpenPlus.VerbMatrix4ToThreeMatrix4(rotateMat);
    bottomSrf.applyMatrix(rotateMat);

    //create extrusions
    var extrudeRectA = new verb.geom.ExtrudedSurface(rectA, [0, 0, this.nutWidth]);
    var extrudeRectB = new verb.geom.ExtrudedSurface(rectB, [0, 0, this.nutWidth]);

    var extrudeouterArc = new verb.geom.ExtrudedSurface(outerArc, [0, 0, this.nutWidth]);
    var extrudeouterEdgeA = new verb.geom.ExtrudedSurface(
            OpenPlus.PolyLine([p2, p1, p0]), [0, 0, this.nutWidth]);
    var extrudeouterEdgeB = new verb.geom.ExtrudedSurface(
            OpenPlus.PolyLine([p5, p4, p3]), [0, 0, this.nutWidth]);

    this.geom = OpenPlus.mergeGeoms([this.geom, extrudeRectA.toThreeGeometry(),
        extrudeRectB.toThreeGeometry(), extrudeouterArc.toThreeGeometry(),
        extrudeouterEdgeA.toThreeGeometry(), extrudeouterEdgeB.toThreeGeometry(),
        bottomSrf, topSrf]);
};

ConnectorLegWallShelf.prototype.copy = function (original) {
    //margin and offset
    this.margin = original.margin;
    this.offset = original.offset;

    this.plateOffset = original.plateOffset;

    //depended on connected objects
    this.radius = original.radius;

    this.x = original.x;
    this.y = original.y;

    //dependend on the diameter of the nut
    this.nutM = original.nutM;
    this.nutHeight = original.nutHeight;
    this.nutWidth = original.nutWidth;
    this.nutRadius = original.nutRadius;

    this.geom = original.geom;

    this.materialFront = original.materialFront;
    this.materialBack = original.materialBack;

    this.srfLines = original.srfLines.slice();

    this.frontGeoms = original.frontGeoms.slice();
    this.backGeoms = original.backGeoms.slice();

    this.center = original.center;
    this.centerA = original.centerA;
    this.centerB = original.centerB;
};

ConnectorLegWallShelf.prototype.clone = function () {
    var clone = new this.constructor();
    clone.copy(this);
    return clone;
};