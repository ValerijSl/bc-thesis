let width = window.innerWidth
         let height = window.innerHeight
         const gui = new dat.GUI()
         // scene
         const scene = new THREE.Scene()
         scene.background = new THREE.Color(0x262626)
         // lights
         const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
         scene.add(ambientLight)
         const light = new THREE.PointLight(0xffffff, 0.5)
         light.position.set(-10, 10, -10)
         // for shadow
         light.castShadow = true
         light.shadow.mapSize.width = 1024
         light.shadow.mapSize.height = 1024
         light.shadow.camera.near = 0.1
         light.shadow.camera.far = 1000
         scene.add(light)
         // camera
         const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
         camera.position.set(0, 10, 40)
         camera.lookAt(0, 0, 0)
         gui.add(camera.position, 'z', 10, 200, 1).name('camera-z')
         // plane
         const planeGeometry = new THREE.PlaneGeometry(100, 100)
         const plane = new THREE.Mesh(
            planeGeometry,
            new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide })
         )
         plane.rotateX(Math.PI / 2)
         plane.position.y = -1.75
         plane.receiveShadow = true
         scene.add(plane)
         // scene.add
         function addCube() {
            const cubeSize = Math.ceil(Math.random() * 3)
            const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
            const cubeMaterial = new THREE.MeshLambertMaterial({
               color: Math.random() * 0xffffff
            })
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
            cube.castShadow = true
            cube.name = 'cube-' + scene.children.length
            cube.position.x = -30 + Math.round(Math.random() * 50)
            cube.position.y = Math.round(Math.random() * 5)
            cube.position.z = -20 + Math.round(Math.random() * 50)
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            scene.add(cube)
         }
         const add = document.querySelector('.add')
         add.addEventListener('click', () => {
            addCube()
            console.log('cube added')
         })
         // scene.remove
         function removeCube() {
            const allChildren = scene.children
            const lastObject = allChildren[allChildren.length - 1]
            if (lastObject.name) {
               scene.remove(lastObject)
            }
         }
         const remove = document.querySelector('.rem')
         remove.addEventListener('click', () => {
            removeCube()
            console.log('cube removed')
         })

         // renderer
         const renderer = new THREE.WebGL1Renderer()
         renderer.setSize(width, height)
         renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
         // animation
         function animate() {
            requestAnimationFrame(animate)
            renderer.render(scene, camera)
         }
         // rendering the scene
         const container = document.querySelector('#threejs-container')
         container.append(renderer.domElement)
         renderer.render(scene, camera)
         animate()