makeSTLBlob = function(mesh){
        var vertices = mesh.geometry.vertices;
        var tris     = mesh.geometry.faces;
        
        var stringifyNormal = function(vec){
                return vec.x+" "+vec.y+" "+vec.z+" \r\n";
        };

        var stringifyVertex = function(vec){
                return "vertex "+vec.x+" "+vec.y+" "+vec.z+" \r\n";
        };

        var stl = "solid OBJECT \r\n";
        for(var i = 0; i<tris.length; i++){
                stl += ("  facet normal "+stringifyNormal( tris[i].normal ));
                stl += ("    outer loop \r\n");
                stl += ("      ") + stringifyVertex( vertices[ tris[i].a ]);
                stl += ("      ") + stringifyVertex( vertices[ tris[i].b ]);
                stl += ("      ") + stringifyVertex( vertices[ tris[i].c ]);
                stl += ("    endloop \r\n");
                stl += ("  endfacet \r\n");
        }

        stl += ("endsolid OBJECT");

        var blob = new Blob([stl], {type: "text/plain;charset=utf-8"});

        return blob;
};