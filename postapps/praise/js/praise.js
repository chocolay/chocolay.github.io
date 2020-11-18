setTimeout(function(){
    var scene = new THREE.Scene(),
        width = window.innerWidth,
        height = window.innerHeight,
        duration = 1000,
        camera = new THREE.PerspectiveCamera(40,width/height,1,1e4);

    camera.position.z = 3000;
    camera.setLens(30);

    var VIZ = {
        animate : function () {
            requestAnimationFrame(VIZ.animate);
            TWEEN.update();
            controls.update();
            return this;
        },
        initialize   : function (data) {
            VIZ.count = data.length;
            var margin = {top: 17, right: 0, bottom: 16, left: 20},
                width  = 225 - margin.left - margin.right,
                height = 140 - margin.top - margin.bottom;

            createElements(data);

            d3.select("#spiralcontainer").insert("div","div")
                .attr("id", "detail")
                .style({
                    "position"   : "absolute",
                    "top"        : "100px",
                    "visibility" : "hidden"
                }).on("mousedown",destroyDetail);

            //functions for creation & behavior of the visualization

            function createElements(data) {
                var color = d3.scale.ordinal()
                    .range([
                        'rgb(166,206,227)',
                        'rgb(31,120,180)',
                        'rgb(178,223,138)',
                        'rgb(51,160,44)',
                        'rgb(251,154,153)',
                        'rgb(227,26,28)',
                        'rgb(253,191,111)',
                        'rgb(255,127,0)'
                    ]);

                var elements = d3.selectAll('.element')
                    .data(data).enter()
                    .append('div')
                    .attr('class', 'element card')
                    .on("click", showDetail);

                elements.append('div')
                    .attr('class', 'ccrd-body text-center')
                    .append("p")
                    .classed("card-text",1)
                .text(function (d) {return d;});

                elements.each(setElementPosition);
                elements.each(objectify);
            }//createElements

            function destroyDetail() {
                d3.select("#detail").selectAll(".element").remove();
                d3.select("#spiralcontainer #renderDiv")
                    .style({
                        "visibility" : "visible",
                        "transform"  : "scale(1e-6)"
                    });
                d3.select("#spiralcontainer #renderDiv")
                    .transition().duration(duration)
                    .style("transform","scale(1)");

                d3.select("#detail").style("visibility","hidden");
            }//destroyDetail

            function objectify(d) {
                var object = new THREE.CSS3DObject(this);
                object.position = d.random.position;
                scene.add(object);
            }//objectify
            function setElementPosition(d,i) {
                var random = new THREE.Object3D(),
                    sphere = new THREE.Object3D(),
                    helix  = new THREE.Object3D(),
                    grid   = new THREE.Object3D(),
                    vector = new THREE.Vector3();

                random.position.x = Math.random() * 4000 - 2000;
                random.position.y = Math.random() * 4000 - 2000;
                random.position.z = Math.random() * 4000 - 2000;
                d.random = random;

                var a = Math.acos(-1+(2*i)/(VIZ.count - 1)),
                    b = Math.sqrt((VIZ.count-1)*Math.PI)*a;
                sphere.position.x = 800 * Math.cos(b)*Math.sin(a);
                sphere.position.y = 800 * Math.sin(b)*Math.sin(a);
                sphere.position.z = 800 * Math.cos(a);
                vector.copy(sphere.position).multiplyScalar(2);
                sphere.lookAt(vector);
                d.sphere = sphere;

                a = (i + 12) * 0.250 + Math.PI;
                helix.position.x = 1000 * Math.sin(a);
                helix.position.y = -(i * 8) + 500;
                helix.position.z = 1000 * Math.cos(a);
                vector.x = helix.position.x * 2;
                vector.y = helix.position.y;
                vector.z = helix.position.z * 2;
                helix.lookAt(vector);
                d.helix = helix;

                grid.position.x = ((i % 5 ) * 400) - 800;
                grid.position.y = (-( Math.floor(i / 5) % 5) * 400) + 800;
                grid.position.z = (Math.floor(i / 25)) * 1000 - 2000;
                d.grid = grid;
                d3.select(this).datum(d);
            }//setElementPosition
            function showDetail() {
                d3.select("#detail")
                    .transition().delay(duration)
                    .style("visibility","visible");

                d3.select("#renderDiv")
                    .transition().duration(duration)
                    .style("transform","scale(1e-6)");

                d3.select("#renderDiv")
                    .transition().delay(duration)
                    .style("visibility","hidden");

                var dupNode = d3.select(this).node().cloneNode(true);
                d3.select("#detail").node().appendChild(dupNode);
                d3.select(dupNode)
                    .style({
                        "-webkit-transform" : "",
                        "transform" : "",
                        "width":"75%",
                        "margin" : "0 auto",
                        "position" : "fixed"
                    });

            }//showDetail

            return this;
        },
        onWindowResize : function () {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            VIZ.render();
            return this;
        },//onWindowResize
        render         : function () {
            S = scene; C = camera;
            renderer.render(scene, camera);
            return this;
        },//render
        transform      : function (layout) {
            //this gets called to change layout: spiral, sphere, grid
            TWEEN.removeAll();
            scene.children.forEach(function (object) {
                var newPos = object.element.__data__[layout].position;
                var coords = new TWEEN.Tween(object.position)
                    .to({x: newPos.x, y: newPos.y, z: newPos.z}, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();
                var newRot = object.element.__data__[layout].rotation;
                var rotate = new TWEEN.Tween(object.rotation)
                    .to({x: newRot.x, y: newRot.y, z: newRot.z}, duration)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();
            });
            var update = new TWEEN.Tween(this)
                .to({}, duration)
                .onUpdate(VIZ.render)
                .start();
            return this;
        }//transform
    };

    var renderer = new THREE.CSS3DRenderer();
    renderer.setSize(width, height);
    d3.select("#spiralcontainer").node().appendChild(renderer.domElement);

    d3.select(renderer.domElement)
        .attr("id","renderDiv")
        .style("position","absolute");

    var controls = new THREE.TrackballControls(camera,d3.select("#renderDiv").node());
    controls.rotateSpeed = 0.5;
    controls.minDistance = 100;
    controls.maxDistance = 6000;

    //this gets called on spin
    controls.addEventListener('change', VIZ.render);

    data =  ["Elise is incredible", "I can't say enough good things about her and look forward to working with her again!", "Excellent communication, fantastic skills and does ultra fast quality work", "extremely talented", "her attitude to my small scale project was professional.", "Elise was very flexible and responsive to additional changes I requested.", "I would work with her again any day!", "Thank you for your excellent d3 work for us on the XYZ project.", "You are a pleasure to work with and I will definitely for any additional projects with similar tasks.", "I appreciate your efficient work and the superb results we had from your programming!", "Elise is very talented and does great work.", "Awesome job Elise", "Elise was fantastic for a custom D3.js visualization that we needed coded", "Very quick turnaround and very pleasant and communicative. A++","Elise has very strong skills and the quality of her work was excellent", "When we needed additional work, or found opportuni…date enhancements and changes into her schedule.", "Elise did an amazing job.", "She is very easy to work with and came up with excellent solutions to the challenges of the project.", "A great collaborator!", "Excellent skills and input to develop new ideas.", "Elise was fantastic.", "She made a very complete graphing visualization  a…remely communicative, and very easy to work with.", "I'm scrambling to find more projects to offer her and would recommend her 110%", "Stellar", "Elise has done fantastic work", "Exceptional knowledge and work completed to a very high quality", "Elise provides outstanding quality and adheres to the deadline.", "High technical and writing skills and very good communication. The result exceeded my expectation", "The result exceeded my expectation!", "Great to work with", "Top-notch, smart, cooperative.", "She has completed all the tasks that i have required in a very short time.", "She has definitely a deep coding knowledge.", "I really appreciated the optimal communication during the job and i hope to work again with her.", "Elise has done for me a great job", "Thank you once again for your expert services.", "I would easily recomment you to anyone.", "I highly recommend Elise", "Elise was wonderful to work with, very knowledgeable and delivered exactly what I was looking for", "Elise is incredible with D3.js!", "She has a great eye for design, writes beautiful code, and is a pleasure to work with.", "If you have any D3 work then she's a perfect fit -…ut her and look forward to working with her again", "excellent experience. very fast results of excellent quality", "Elise did a great job in short time and we were very impressed.", "Another great work with Elise", "Elise provided continues support during our product development. Thanks again.", "Great work once again Elise - Many Thanks. W", "It's always a pleasure to work with Elise", "Very knowledgeable, great positive attitude and superb work.", "Elise is now my go-to contact for all my D3 related development - enough said.", "great job - met specifications exactly - would work with again", "she knows what she talking about", "Excellent and quality work.", "The project was completed on time and exactly what we were looking for.", "Very good communication and dedication.", "A great pleasure working with Elise.", " We found her to be insightful, punctual, prepared, and highly informative. ", "She was able to point us in the right direction very quickly", "we are sure we will come back to her", "Excellent job - very fast - would definitely work with again", "A true d3 wizard!"];
    data = data.map(function(d) {
        var temp = d; 
        return {text:d};
    })
    VIZ.initialize(data)
        .transform('helix').render().animate();
    d3.select(window).on("resize",VIZ.onWindowResize);

},500);
