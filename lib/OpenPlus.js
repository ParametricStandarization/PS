OpenPlus = {
    //--------GEOMETRIES
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
    Polygon: function (center, xAxis, yAxis, sides, radius) {
        var angle = (Math.PI * 2) / sides;
        var tempAngle = 0;

        var points = [];
        for (var i = 0; i < sides; i++) {
            tempAngle = tempAngle + angle;

            var x = Math.cos(tempAngle) * radius;
            var y = Math.sin(tempAngle) * radius;

            points[i] = [x, y, 0];
        }

        points[sides] = points[0];

        var data = verb.eval.Make.polyline(points);

        var returnCurve = new verb.geom.NurbsCurve(data);

        //now rotate these points, then translate them
        var tempAxis = verb.core.Vec.normalized(xAxis);
        var normAxis = [1, 0, 0];

        var rotAxis = verb.core.Vec.cross(tempAxis, normAxis);
        var angle = verb.core.Vec.angleBetween(tempAxis, normAxis);
        var rotQuat = this.QuatFromAxisAngle(rotAxis, angle);

        var rotMat = this.MatrixFromQuat(rotQuat);
        var transMat = this.MatrixTranslation(center);

        returnCurve = returnCurve.transform(rotMat);
        returnCurve = returnCurve.transform(transMat);

        return returnCurve;
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
    PolyLine: function (points) {
        var data = verb.eval.Make.polyline(points);

        return new verb.geom.NurbsCurve(data);
    },
    PlanarSrf: function (curves, willFlip) {
        var flipped = willFlip || false;

        //first need to check if all are curves

        //create joined lines, should check if these are inside each other or not
        //this will define if an object with or without hole will be made
        var curveLines = OpenPlus.JoinCurves(curves);

        var path = new THREE.Path;
        path.autoClose = false;
        
        var pathsVertices = [];
        
//        console.log(curveLines);

        for (var i = 0; i < curveLines.length; i++) {
            var tempCurves = curveLines[i];

            var startPoint = tempCurves[0].start === 'function' ?
                    tempCurves[0].start() : tempCurves[0].point(0);
            var vertices = [new THREE.Vector3(
                        startPoint[0], startPoint[1], startPoint[2])];

            for (var j = 0; j < tempCurves.length; j++) {
                var curve = tempCurves[j].toThreeGeometry();

                var verticeClone = curve.vertices.slice(1);

                vertices = vertices.concat(verticeClone);
            }
            
            //now I need to check if the curves are planar
            
            var planar = this.TestPlanar(vertices);
            
//            console.log(planar);
            
            if(planar.isPlanar){
                var inPlane = false;
                
                for(var j = 0; j < pathsVertices.length; j++){
                    
                    if(this.TestAlign(planar.plane.normal, pathsVertices[j].plane.normal)
                        && verb.core.Trig.isPointInPlane(planar.plane.origin, pathsVertices[j].plane, 1e-6)){
                        pathsVertices[j].verts.push(vertices);
                        inPlane = true;
                    }
                    
                    //also test if object is inside or outside other objects,
                    //or if they intersect
                    
                }
        
                if(!inPlane) pathsVertices.push( {
                    plane: planar.plane,
                    verts: [vertices]
                } );
            }
        }
        
//        console.log(pathsVertices);
            
        var geoms = [];
        
        for(var i = 0; i < pathsVertices.length; i++){
            var pathVertices = pathsVertices[i];
            var tempPath = new THREE.Path();
            
            var normal = pathVertices.plane.normal;
            var origin = pathVertices.plane.origin;
            
            if(this.TestAlign(normal, [0,0,1])){
            
                for(var j = 0; j < pathVertices.verts.length; j++){
                    tempPath.fromPoints(pathVertices.verts[j]);
                }
                
                var tempShape = tempPath.toShapes(false, false)[0];
                var geometry = new THREE.ShapeGeometry(tempShape, {curveSegments: 100});
                
                if(origin[2] > 1e-6){
                    geometry.translate(0,0,origin[2]);
                }
                
                geoms.push(geometry);
            } else {
                var axisDir = verb.core.Vec.cross(normal, [0,0,1]);
                var angle = Math.PI + verb.core.Vec.angleBetween(normal, [0,0,1]);
                
                var p2 = verb.core.Vec.add(origin, axisDir);
                
                var mat4 = this.MatrixRotationOverLine(origin, p2, angle);
                var mat4THREE = this.ToThreeMatrix(mat4);
                
                for(var j = 0; j < pathVertices.verts.length; j++){
                    var tempVerts = [];
                    
                    for(var k = 0; k < pathVertices.verts[j].length; k++){
                        var tempVert = pathVertices.verts[j][k].clone();
                        tempVert.applyMatrix4(mat4THREE);
                        
                        tempVerts.push(tempVert);
                        
                    }
                    
                    tempPath.fromPoints(tempVerts);
                }
                
                var tempShape = tempPath.toShapes(false, false)[0];
                var geometry = new THREE.ShapeGeometry(tempShape, {curveSegments: 100});
                
                if(origin[2] > 1e-6){
                    geometry.translate(0,0,origin[2]);
                }
                
                //now rotate back
                mat4 = this.MatrixRotationOverLine(origin, p2, -angle);
                mat4THREE = this.ToThreeMatrix(mat4);
                
                geometry.applyMatrix(mat4THREE);
                
                geoms.push(geometry);
            }
        }

        return geoms;
    },
    //--------MATRIXESS

    QuatFromAxisAngle: function (axis, angle) {
        var s = Math.sin(angle / 2);
        var x = axis[0] * s;
        var y = axis[1] * s;
        var z = axis[2] * s;
        var w = Math.cos(angle / 2);

        return {s: s, x: x, y: y, z: z, w: w};
    },
    MatrixTranslation: function (transVec) {
        return [[1, 0, 0, transVec[0]],
            [0, 1, 0, transVec[1]],
            [0, 0, 1, transVec[2]],
            [0, 0, 0, 1]];
    },
    MatrixFromQuat: function (q) {
        var sqw = q.w * q.w;
        var sqx = q.x * q.x;
        var sqy = q.y * q.y;
        var sqz = q.z * q.z;

        // invs (inverse square length) is only required if quaternion is not already normalised
        var invs = 1 / (sqx + sqy + sqz + sqw);
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
    MatrixRotationOverLine: function(p0, p1, angle) {
        var a = p0[0];
        var b = p0[1];
        var c = p0[2];
        
        var lineVec = [p1[0] - a, p1[1] - b, p1[2] - c];
        lineVec = verb.core.Vec.normalized(lineVec);
        
        var u = lineVec[0];
        var v = lineVec[1];
        var w = lineVec[2];
        
        var uu = u*u;
        var vv = v*v;
        var ww = w*w;
        
        var cosA = Math.cos(angle);
        var sinA = Math.sin(angle);
        
        var m00 = uu + (vv+ww)*cosA;
        var m01 = u*v*(1-cosA) - w*sinA;
        var m02 = u*w*(1-cosA) + v*sinA;
        var m03 = (a*(vv+ww) - u*(b*v + c*w)) * (1 - cosA) + (b*w - c*v)*sinA;
        
        var m10 = u*v*(1-cosA) + w*sinA;
        var m11 = vv + (uu+ww)*cosA;
        var m12 = v*w*(1-cosA) - u*sinA;
        var m13 = (b*(uu+ww) - v*(a*u + c*w)) * (1 - cosA) + (c*u - a*w)*sinA;
        
        var m20 = u*w*(1-cosA) - v*sinA;
        var m21 = v*w*(1-cosA) + u*sinA;
        var m22 = ww + (uu+vv)*cosA;
        var m23 = (c*(uu+vv) - w*(a*u + b*v)) * (1 - cosA) + (a*v - b*u)*sinA;
        
        return [[m00, m01, m02, m03],
            [m10, m11, m12, m13],
            [m20, m21, m22, m23],
            [0, 0, 0, 1]];
    },
    //--------MATH

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
    EqualPoints: function (pointA, pointB) {
        if ((Math.abs(pointA[0] - pointB[0]) < 1e-6) &&
                (Math.abs(pointA[1] - pointB[1]) < 1e-6) &&
                (Math.abs(pointA[2] - pointB[2]) < 1e-6))
            return true;
        return false;
    },
    TestAlign: function (vecA, vecB){
        angle = verb.core.Vec.angleBetween(vecA, vecB);
        
        return angle < 1e-6 || (Math.PI - angle) < 1e-6;
    },
    TestPlanar: function (points){
        
        var p = [];
        for(var i = 0; i<points.length; i++) {
            p[i] = [points[i].x, points[i].y, points[i].z];
        };
        
        var vecA = verb.core.Vec.sub(p[1], p[0]);
        var vecB = verb.core.Vec.sub(p[2], p[0]);
        
        var normal = verb.core.Vec.cross(vecA, vecB);
        
        var plane = new verb.core.Plane(p[0], normal);
        
        for(var i = 3; i<points.length - 1; i++){
            if( !verb.core.Trig.isPointInPlane(p[i], plane, 1e-6) ){
                return {isPlanar: false};
            }
        }
        
        return {isPlanar: true, plane: plane};
    },
    //--------THREE_ADDONS

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
    },
    ToThreeMatrix: function(matrix){
        var m = matrix;
        
        var returnMatrix = new THREE.Matrix4();
        
        returnMatrix.set(m[0][0], m[0][1], m[0][2], m[0][3],
                        m[1][0], m[1][1], m[1][2], m[1][3],
                        m[2][0], m[2][1], m[2][2], m[2][3],
                        m[3][0], m[3][1], m[3][2], m[3][3]);
        
        return returnMatrix; 
    }
};