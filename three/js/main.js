;(function () {

    var scene, geometry, material, cube, light, camera, contorls, renderer;

    window.onload = function () {
        initialize();
        render();
    };

    var initialize = function () {
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild( renderer.domElement );

        geometry = new THREE.BoxGeometry( 1, 1, 1 );
        material = new THREE.MeshLambertMaterial();
        cube = new THREE.Mesh( geometry, material );
        cube.matrixAutoUpdate = false;
        scene.add( cube );

        light = new THREE.DirectionalLight( 'red', 1.0 );
        light.position.set( 5 , 4, 3 );
        scene.add( light );

        camera = new THREE.PerspectiveCamera( 40, window.innerWidth/window.innerHeight, 0.1, 1000 );
        camera.position.set(5, 5, 5);
        camera.lookAt( new THREE.Vector3(0, 0, 0) );

        controls = new THREE.OrbitControls(camera);
    }

    var render = function () {
        requestAnimationFrame( render );
        renderer.setClearColor( 'white', 1.0 );
        renderer.render(scene, camera);
        controls.update();
    };

}) ();
