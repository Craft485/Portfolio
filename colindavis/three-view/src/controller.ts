import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

export class Controller {
    camera: THREE.Camera
    domElement: HTMLElement
    controls: PointerLockControls
    blocker: HTMLElement
    directions: {
        moveForward: boolean,
        moveBackward: boolean,
        moveLeft: boolean,
        moveRight: boolean
    }
    prevTime: number
    velocity: THREE.Vector3
    direction: THREE.Vector3
    objects: Array<THREE.Mesh>
    collider: {
        [key: string]: {
            raycaster: THREE.Raycaster
            // Same as raycaster but angled towards the ground to detect short obstacles
            // NOTE: Do not init the raycasters position as the cameras position, it needs to be copied into an empty Vec3 to avoid passing object references
            angledRaycaster: THREE.Raycaster
            // originalDirection is for raycaster, NOT for angledRaycaster
            originalDirection: THREE.Vector3
            collision: boolean
        }
    }
    elevationRaycaster: THREE.Raycaster
    gravity: THREE.Raycaster
    constructor(camera: THREE.Camera, domElement: HTMLElement, blocker: HTMLElement, instructions?: HTMLElement) {
        this.camera = camera
        this.domElement = domElement
        this.controls = new PointerLockControls(this.camera, this.domElement)
        this.blocker = blocker || null
        this.directions = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false
        }
        this.prevTime = performance.now()
        this.velocity = new THREE.Vector3()
        this.direction = new THREE.Vector3()
        this.objects = []
        this.collider = {
            North: {
                raycaster: new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, 0, -1), 0, 1),
                angledRaycaster: new THREE.Raycaster(new THREE.Vector3().copy(this.camera.position), new THREE.Vector3(0, -1, -1), 0, 1),
                originalDirection: new THREE.Vector3(0, 0, -1),
                collision: false
            },
            East: {
                raycaster: new THREE.Raycaster(this.camera.position, new THREE.Vector3(1, 0, 0), 0, 1),
                angledRaycaster: new THREE.Raycaster(new THREE.Vector3().copy(this.camera.position), new THREE.Vector3(1, -1, 0), 0, 1),
                originalDirection: new THREE.Vector3(1, 0, 0),
                collision: false
            },
            South: {
                raycaster: new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, 0, 1), 0, 1),
                angledRaycaster: new THREE.Raycaster(new THREE.Vector3().copy(this.camera.position), new THREE.Vector3(0, -1, 1), 0, 1),
                originalDirection: new THREE.Vector3(0, 0, 1),
                collision: false
            },
            West: {
                raycaster: new THREE.Raycaster(this.camera.position, new THREE.Vector3(-1, 0, 0), 0, 1),
                angledRaycaster: new THREE.Raycaster(new THREE.Vector3().copy(this.camera.position), new THREE.Vector3(-1, -1, 0), 0, 1),
                originalDirection: new THREE.Vector3(-1, 0, 0),
                collision: false
            }
        }
        this.elevationRaycaster = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0), 0, 3)
        this.gravity = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0), 0)
        this.init()
    }

    init(): void {
        // NOTE: These callbacks and event listener functions must be arrow functions due to that fact they don't redefine their own scope of "this"
        this.controls.addEventListener('lock', () => {
            this.blocker.style.display = 'none'
        })

        this.controls.addEventListener('unlock', () => {
            this.blocker.style.display = 'flex'
        })

        const onKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.directions.moveForward = true
                    break
                case 'ArrowLeft':
                case 'KeyA':
                    this.directions.moveLeft = true
                    break
                case 'ArrowDown':
                case 'KeyS':
                    this.directions.moveBackward = true
                    break
                case 'ArrowRight':
                case 'KeyD':
                    this.directions.moveRight = true
                    break
                default:
                    break
            }
        }

        const onKeyUp = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.directions.moveForward = false
                    break
                case 'ArrowLeft':
                case 'KeyA':
                    this.directions.moveLeft = false
                    break
                case 'ArrowDown':
                case 'KeyS':
                    this.directions.moveBackward = false
                    break
                case 'ArrowRight':
                case 'KeyD':
                    this.directions.moveRight = false
                    break
                default:
                    break
            }
        }

        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('keyup', onKeyUp)
    }

    checkCollider(): void {
        const cameraLookAtDirection = this.controls.getDirection(new THREE.Vector3())

        for (const direction in this.collider) {
            const collider = this.collider[direction]
            // offsetScalar basically makes sure that straight ahead is seen as position 0 and the positive direction is to our left, negative is to our right
            const offsetScalar = new THREE.Vector3().copy(collider.originalDirection).negate().toArray().filter(Boolean)[0]

            const trueAngle = this.collider.North.originalDirection.angleTo(collider.originalDirection)
            const resultant = new THREE.Vector3().copy(cameraLookAtDirection).setY(0).applyAxisAngle(new THREE.Vector3(0, 1, 0), trueAngle).multiplyScalar(Math.abs(Math.floor(trueAngle)) === 1 ? offsetScalar : 1)

            collider.raycaster.ray.direction.copy(resultant)
            collider.raycaster.ray.origin.copy(this.controls.getObject().position)
            collider.angledRaycaster.ray.direction.setX(resultant.x)
            collider.angledRaycaster.ray.direction.setZ(resultant.z)
            collider.angledRaycaster.ray.origin.copy(this.controls.getObject().position)
            collider.angledRaycaster.ray.origin.setY(this.camera.position.y - 1)

            const intersections = collider.raycaster.intersectObjects(this.objects, false)
            const angledIntersections = collider.angledRaycaster.intersectObjects(this.objects, false)
            this.collider[direction].collision = intersections.length > 0 || angledIntersections.length > 0
        }
    }

    update(): void {
        const time = performance.now()

        if (this.controls.isLocked) {
            this.checkCollider()

            const delta = (time - this.prevTime) / 1000

            this.velocity.x -= this.velocity.x * 10.0 * delta
            this.velocity.z -= this.velocity.z * 10.0 * delta

            this.direction.z = Number(this.directions.moveForward) - Number(this.directions.moveBackward)
            this.direction.x = Number(this.directions.moveRight) - Number(this.directions.moveLeft)

            // This ensures consistent movements in all directions
            this.direction.normalize()

            if (this.directions.moveForward || this.directions.moveBackward) this.velocity.z -= this.direction.z * 200.0 * delta
            if (this.directions.moveLeft || this.directions.moveRight) this.velocity.x -= this.direction.x * 200.0 * delta

            // Forward: z
            // Backward: -z
            // Left: -x
            // Right: x
            if ((this.directions.moveForward && this.collider.North.collision) || 
            (this.directions.moveBackward && this.collider.South.collision)) {
                this.direction.z = 0
                this.velocity.z = 0
            }

            if ((this.directions.moveLeft && this.collider.West.collision) || 
            (this.directions.moveRight && this.collider.East.collision)) {
                this.direction.x = 0
                this.velocity.x = 0
            }
            
            this.controls.moveRight(-this.velocity.x * delta)
            this.controls.moveForward(-this.velocity.z * delta)

            this.elevationRaycaster.ray.origin.copy(this.controls.getObject().position)
            this.gravity.ray.origin.copy(this.controls.getObject().position)

            const intersectionsBelow = this.elevationRaycaster.intersectObjects(this.objects, false)
            const gravityIntersection = this.gravity.intersectObjects(this.objects, false)

            // TODO: Use acceleration due to gravity, clamp position based off this math of the line segments between the player and a lower surface?
            const onObject = intersectionsBelow.length > 0
            onObject && !intersectionsBelow[0].object.name.toLowerCase().includes('ground') ? this.camera.position.y += this.elevationRaycaster.far - intersectionsBelow[0].distance : this.camera.position.y -= gravityIntersection[0].distance - this.elevationRaycaster.far

            // Ensure we don't fall through the floor
            if (this.controls.getObject().position.y < 3) this.controls.getObject().position.y = 3
        }

        this.prevTime = time
    }
}