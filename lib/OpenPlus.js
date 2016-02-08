OpenPlus = {
    CircleLineIntersect: function (pointA, pointB, circle) {
        //find out a and b in the linefunction mx + c = y
        var p = circle.center[0];
        var q = circle.center[1];
        var r = circle.radius;

        //slope m
        var m = (pointA[1] - pointB[1]) / (pointA[0] - pointB[0]);
        var c = -(m * pointA[0]) + pointA[1];

        //fill out the Ax^2 + Bx + C = 0 function
        var A = (m * m) + 1;
        var B = 2 * ((m * c) - (m * q) - p);
        var C = ((q * q) - (r * r) + (p * p) - (2 * c * q) + (c * c));

        //get discriminator
        var disc = (B * B) - 4 * A * C;

        if (disc < 0)
            return null;

        var x = ((-B + Math.sqrt(disc)) / (2 * A));
        var y = m * x + c;

        if (disc === 0)
            return [[x, y]];
        else {
            var x2 = ((-B - Math.sqrt(disc)) / (2 * A));
            var y2 = m * x2 + c;

            if (x < x2)
                return [[x, y], [x2, y2]];
            else
                return  [[x2, y2], [x, y]];
        }
    },
    AnglePtOnCircle: function (point, radius) {
        return Math.asin(point[1] / radius);
    },
    QatFromaxisangle: function (axis, angle) {
        var s = Math.sin(angle / 2);
        var x = axis[0] * s;
        var y = axis[1] * s;
        var z = axis[2] * s;
        var w = Math.cos(angle / 2);

        return {s: s, x: x, y: y, z: z, w: w};
    },
    QuatToMatrix: function (q) {
        var sqw = q.w * q.w;
        var sqx = q.x * q.x;
        var sqy = q.y * q.y;
        var sqz = q.z * q.z;

        // invs (inverse square length) is only required if quaternion is not already normalised
        var invs = 1 / (sqx + sqy + sqz + sqw)
        var m00 = (sqx - sqy - sqz + sqw) * invs; // since sqw + sqx + sqy + sqz =1/invs*invs
        var m11 = (-sqx + sqy - sqz + sqw) * invs;
        var m22 = (-sqx - sqy + sqz + sqw) * invs;

        var tmp1 = q.x * q.y;
        var tmp2 = q.z * q.w;
        var m10 = 2.0 * (tmp1 + tmp2) * invs;
        var m01 = 2.0 * (tmp1 - tmp2) * invs;

        tmp1 = q.x * q.z;
        tmp2 = q.y * q.w;
        var m20 = 2.0 * (tmp1 - tmp2) * invs;
        var m02 = 2.0 * (tmp1 + tmp2) * invs;
        tmp1 = q.y * q.z;
        tmp2 = q.x * q.w;
        var m21 = 2.0 * (tmp1 + tmp2) * invs;
        var m12 = 2.0 * (tmp1 - tmp2) * invs;

        return [[m00, m01, m02],
            [m10, m11, m12],
            [m20, m21, m22]];
    },
    Rectangle: function (center, xAxis, yAxis, width, length) {
        var halfWidth = width / 2;
        var halfLength = length / 2;

        var widthV = verb.core.Vec.normalized(xAxis);
        widthV = verb.core.Vec.mul(halfWidth, widthV);

        var heightV = verb.core.Vec.normalized(yAxis);
        heightV = verb.core.Vec.mul(halfLength, heightV);

        var p1 = verb.core.Vec.add(center, verb.core.Vec.add(widthV, heightV));
        var p2 = verb.core.Vec.add(center, verb.core.Vec.sub(widthV, heightV));
        var p3 = verb.core.Vec.sub(center, verb.core.Vec.add(widthV, heightV));
        var p4 = verb.core.Vec.sub(center, verb.core.Vec.sub(widthV, heightV));

        var points = [p1, p2, p3, p4, p1];

        var data = verb.eval.Make.polyline(points);

        return new verb.geom.NurbsCurve(data);

    },
    EqualPoints: function (pointA, pointB) {
        if ((Math.abs(pointA[0] - pointB[0]) < 1e-6) &&
            (Math.abs(pointA[1] - pointB[1]) < 1e-6) &&
            (Math.abs(pointA[2] - pointB[2]) < 1e-6))
            return true;
        return false;
    },
    JoinCurves: function (tempCurves) {
        var curves = tempCurves.slice(0);

        var CurveLine = function (curve) {
            this.start = curve.point(0);
            this.end = curve.point(1);
            this.curves = [curve];
            
            this.closed = OpenPlus.EqualPoints(this.start, this.end);
        };

        CurveLine.prototype.push = function (newCurve) {
            this.end = newCurve.point(1);
            this.curves.push(newCurve);
            this.closed = OpenPlus.EqualPoints(this.start, this.end);
        };

        CurveLine.prototype.unshift = function (newCurve) {
            this.start = newCurve.point(0);
            this.curves.unshift(newCurve);
            this.closed = OpenPlus.EqualPoints(this.start, this.end);
        };

        var curveLine = new CurveLine(curves.splice(0, 1)[0]);
        var connectedCurves = [curveLine];

        //sure this algorithm is horrible, but should work for now
        if (curves.length !== 0) {

            for (var i = 0; i < connectedCurves.length; i++) {

                var tempLine = connectedCurves[i];

                if (!tempLine.closed) {

                    for (var j = 0; j < curves.length; j++) {

                        var curve = curves[j];

                        var curveStart = curve.point(0);
                        var curveEnd = curve.point(1);

                        if (OpenPlus.EqualPoints(curveStart, tempLine.end)) {
                            tempLine.push(curve);
                        } else if (OpenPlus.EqualPoints(curveEnd, tempLine.start)) {
                            tempLine.unshift(curve);
                        } else if (OpenPlus.EqualPoints(curveStart, tempLine.start)) {
                            tempLine.unshift(curve.reverse());
                        } else if (OpenPlus.EqualPoints(curveEnd, tempLine.end)) {
                            tempLine.push(curve.reverse());
                        } else {
                            continue;
                        }

                        curves.splice(j, 1);
                        j = -1;

                        if (tempLine.closed)
                            break;
                    }
                }

                if (curves.length === 0)
                    break;
                else
                    connectedCurves.push(new CurveLine(curves.splice(0, 1)[0]));

            }
        }

        var returnArray = [];
        for (var i = 0; i < connectedCurves.length; i++) {
            returnArray[i] = connectedCurves[i].curves;
        }

        return returnArray;
    },
    PlanarSrf: function (curves, willFlip) {
        var flipped = willFlip || false;

        //first need to check if all are curves

        //create joined lines, should check if these are inside each other or not
        //this will define if an object with or without hole will be made
        var curveLines = OpenPlus.JoinCurves(curves);

        //now I need to check if the curves are planar
        //http://verbnurbs.com/docs/core/Trig/#ispointinplane
        //http://threejs.org/docs/#Reference/Math/Plane

        //then check if curves intersect or are inside each other
        //those that are inside a different path need to create their own geometry

        var path = new THREE.Path;
        path.autoClose = false;

        for (var i = 0; i < curveLines.length; i++) {
            var tempCurves = curveLines[i];
            
            var startPoint = tempCurves[0].start === 'function'?
                tempCurves[0].start() : tempCurves[0].point(0);
            var vertices = [new THREE.Vector2(startPoint[0], startPoint[1])];

            for (var j = 0; j < tempCurves.length; j++) {
                var curve = tempCurves[j].toThreeGeometry();

                var verticeClone = curve.vertices.slice(1);

                vertices = vertices.concat(verticeClone);
            }

            path.fromPoints(vertices);
        }

        var shape = path.toShapes(flipped, false)[0];

        var geometry = new THREE.ShapeGeometry(shape, {curveSegments: 100});

        return geometry;
    },
    //combine meshes into a single mesh
    combineMesh: function (meshesFront, meshesBack,
            materialFront, materialBack) {

        var mergedGeom = new THREE.Geometry();

        for (var i = 0; i < meshesFront.length; i++) {
            var tempMesh = meshesFront[i];

            tempMesh.updateMatrix();
            mergedGeom.merge(tempMesh.geometry, tempMesh.matrix, 0);
        }

        for (var i = 0; i < meshesBack.length; i++) {
            var tempMesh = meshesBack[i];

            tempMesh.updateMatrix();
            mergedGeom.merge(tempMesh.geometry, tempMesh.matrix, 1);
        }

        var materials = [materialFront, materialBack];
        var resultMesh = new THREE.Mesh(mergedGeom, new THREE.MeshFaceMaterial(materials));

        return resultMesh;
    },
    //function to mirror and combine meshes and make them into a complete mesh
    mirrorCombineMesh: function (meshesFront, meshesBack,
            materialFront, materialBack) {

        var mS = (new THREE.Matrix4()).identity();
        mS.elements[5] = -1;

        var mergedGeom = new THREE.Geometry();

        for (var i = 0; i < meshesFront.length; i++) {
            var tempMesh = meshesFront[i];

            tempMesh.updateMatrix();
            mergedGeom.merge(tempMesh.geometry, tempMesh.matrix, 0);

            var tempMeshClone = tempMesh.clone();

            tempMeshClone.applyMatrix(mS);
            tempMeshClone.updateMatrix();

            mergedGeom.merge(tempMeshClone.geometry, tempMeshClone.matrix, 1);
        }

        for (var i = 0; i < meshesBack.length; i++) {
            var tempMesh = meshesBack[i];

            tempMesh.updateMatrix();
            mergedGeom.merge(tempMesh.geometry, tempMesh.matrix, 1);

            var tempMeshClone = tempMesh.clone();

            tempMeshClone.applyMatrix(mS);
            tempMeshClone.updateMatrix();

            mergedGeom.merge(tempMeshClone.geometry, tempMeshClone.matrix, 0);
        }

        var materials = [materialFront, materialBack];
        var resultMesh = new THREE.Mesh(mergedGeom, new THREE.MeshFaceMaterial(materials));

        return resultMesh;
    }
};