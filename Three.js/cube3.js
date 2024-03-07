import * as THREE from 'three';

class MandelbrotState
{
    init() {
        const canvas = this.sceneWrapper.renderer.domElement;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { type: 'f', value: 0.0 },
                u_resolution: { type: '2fv', value: new THREE.Vector2(canvas.width, canvas.height) }
            },
            vertexShader: mandelbrotVs,
            fragmentShader: mandelbrotFs,
        });
        const geometry = new THREE.PlaneBufferGeometry(10 * (canvas.width / canvas.height), 10);

        this.planeMesh = new THREE.Mesh(geometry, material);
        this.planeMesh.position.set(0, 0, 0);
        this.planeMesh.shouldBeDeletedOnStateChange = true;
        this.sceneWrapper.scene.add(this.planeMesh);

        this.sceneWrapper.camera.position.set(0, 0, 4);
        this.sceneWrapper.controls.enabled = false;
    }

    update(delta) {
        this.planeMesh.material.uniforms.u_time.value = delta / 1000;
    }

    onResize(w, h) {
        this.planeMesh.material.uniforms.u_resolution.value = new THREE.Vector2(w, h);
    }
}

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);

      this.state = -1;
      this.stateList = [];

      this.state = null;

      // state of the animation (play/pause)
      this.running = false;
  
  /**
   * Main initialization of the scene
   */

      // Scene basic setup
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);
      this.renderer.shadowMap.enabled = true;
      
      this.controls.target.set(0, 0, 0);
      this.controls.update();

      document.body.appendChild(this.renderer.domElement);


      // Window resize event handler
      window.addEventListener('resize', () => {
          this.camera.aspect = window.innerWidth / window.innerHeight;
          this.camera.updateProjectionMatrix();
      
          this.renderer.setSize(window.innerWidth, window.innerHeight);
          this.renderer.setPixelRatio(window.devicePixelRatio || 1);

          this.stateList[this.state].onResize(this.renderer.domElement.width, this.renderer.domElement.height);
      });


      // Scene basic lights
      const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(ambLight);

      const dirLigth = new THREE.DirectionalLight(0xffffff, 0.3);
      this.scene.add(dirLigth);

      const spotLight = new THREE.SpotLight(0xffffff, 0.75);
      spotLight.position.set(100, 100, 50);
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      this.scene.add(spotLight);


      // Create all the available states
      this.stateList.push(new MandelbrotState(this));


      if (this.running) {
          this.controls.update(delta);
          this.stateList[this.state].update(delta);
      }

      this.renderer.render(this.scene, this.camera);
      
      requestAnimationFrame(this.run.bind(this));


  /**
   * Change the current state of the scene
   * @param {State} state An object that implements the State Class (init/update/onResize)
   */

  /**
   * Remove all children from a given object
   * @param {THREE.Object3D} obj
   */
      for(let i = obj.children.length - 1; i >= 0; i--) {
          if(obj.children[i].shouldBeDeletedOnStateChange === true) {
              this.removeItem(obj.children[i]);
              obj.remove(obj.children[i]);
          }
      }