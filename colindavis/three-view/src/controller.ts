import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

export class Controller {
    camera: THREE.Camera
    domElement: HTMLElement
    controls: PointerLockControls
    blocker: HTMLElement
    instructions: HTMLElement
    directions: { moveForward: boolean, moveBackward: boolean, moveLeft: boolean, moveRight: boolean }
    prevTime: number
    velocity: THREE.Vector3
    direction: THREE.Vector3
    raycaster: THREE.Raycaster
    frontFacingRaycaster: THREE.Raycaster
    objects: Array<any>
    constructor(camera: THREE.Camera, domElement: HTMLElement, blocker: HTMLElement, instructions?: HTMLElement) {
        this.camera = camera
        this.domElement = domElement
        this.controls = new PointerLockControls(this.camera, this.domElement)
        this.blocker = blocker || null
        this.instructions = instructions || null
        this.directions = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false
        }
        this.prevTime = performance.now()
        this.velocity = new THREE.Vector3()
        this.direction = new THREE.Vector3()
        this.raycaster = new THREE.Raycaster()
        this.frontFacingRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 0.75)
        this.objects = []
        this.init()
    }

    init(): void {
        console.log(this.blocker, this.instructions)
        // NOTE: These callbacks and event listener functions must be arrow functions due to that fact they don't redefine their own scope of "this"
        this.controls.addEventListener('lock', () => {
            // console.log(this.blocker)
            // this.instructions.style.display = 'none'
            this.blocker.style.display = 'none'
        } )

        this.controls.addEventListener('unlock', () => {
            this.blocker.style.display = 'flex'
            // this.instructions.style.display = ''
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

    update(): void {
        const time = performance.now()

        if (this.controls.isLocked) {
            this.raycaster.ray.origin.copy(this.controls.getObject().position)

            this.frontFacingRaycaster.ray.origin.copy(this.controls.getObject().position)

            // Setup to be relative to the camera which looks down its own internal negative z-axis
            // https://stackoverflow.com/questions/15696963/three-js-set-and-read-camera-look-vector/15697227#15697227
            const cameraLookAtVector = new THREE.Vector3(0, 0, -1)
            cameraLookAtVector.applyQuaternion(this.controls.getObject().quaternion)
            this.frontFacingRaycaster.ray.direction.copy(cameraLookAtVector.normalize())

            // I don't think recasting is actually necessary, just set the far value when initializing the raycaster
            // this.frontFacingRaycaster.ray.recast(0.5)
            const frontalIntersections = this.frontFacingRaycaster.intersectObjects(this.objects, false)

            const walkingIntoObject = frontalIntersections.length > 0

            this.raycaster.ray.origin.y -= 3

            const intersections = this.raycaster.intersectObjects(this.objects, false)

            const onObject = intersections.length > 0

            const delta = (time - this.prevTime) / 1000

            this.velocity.x -= this.velocity.x * 10.0 * delta
            this.velocity.z -= this.velocity.z * 10.0 * delta

            // 100.0 = mass
            this.velocity.y -= 9.8 * 100.0 * delta

            this.direction.z = Number(this.directions.moveForward) - Number(this.directions.moveBackward)
            this.direction.x = Number(this.directions.moveRight) - Number(this.directions.moveLeft)
            // This ensures consistent movements in all directions
            this.direction.normalize()

            if (this.directions.moveForward || this.directions.moveBackward) this.velocity.z -= this.direction.z * 200.0 * delta
            if (this.directions.moveLeft || this.directions.moveRight) this.velocity.x -= this.direction.x * 200.0 * delta

            if (onObject) this.velocity.y = Math.max(0, this.velocity.y)

            if (walkingIntoObject) this.velocity = new THREE.Vector3(0, this.velocity.y, 0)

            this.controls.moveRight(-this.velocity.x * delta)
            this.controls.moveForward(-this.velocity.z * delta)

            this.controls.getObject().position.y += (this.velocity.y * delta)

            if (this.controls.getObject().position.y < 3) {
                this.velocity.y = 0
                this.controls.getObject().position.y = 3
            }
        }

        this.prevTime = time
    }
}