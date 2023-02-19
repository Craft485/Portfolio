import * as THREE from 'three'
import { levelLoader } from './loader'
import { Controller } from './controller'
import { TextLoader } from './textLoader'
import './styles.css'
import './scene.json'

class App {
	collisionGeometryNames: Array<string>
	blocker: HTMLElement
	camera: THREE.Camera
	scene: THREE.Scene
	controller: Controller
	previousRAF: number
	renderer: THREE.WebGLRenderer
	textLoader: TextLoader
	constructor (blocker: HTMLElement) {
		this.collisionGeometryNames = ['CylinderGeometry', 'PlaneGeometry', 'BoxGeometry']
		this.blocker = blocker
		this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 2000)
		this.scene = null
		this.textLoader = null
		this.controller = new Controller(this.camera, document.body, this.blocker)
		this.previousRAF = null
		this.renderer = new THREE.WebGLRenderer( { antialias: true } )
		this.init()
	}

	async init() {
		this.scene = await levelLoader('scene')

		// @ts-ignore Adding specific type def onto capsule
		const capsule: THREE.Mesh<THREE.CapsuleGeometry, THREE.Material> = this.scene.children.find(child => child.name.toLowerCase().includes('capsule'))
		this.camera.position.copy(capsule.position)
		capsule.geometry.dispose()
		capsule.material.dispose()
		capsule.removeFromParent()

		this.textLoader = new TextLoader(this.scene)
		this.textLoader.load()

		this.renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(this.renderer.domElement)

		// This whitelist array should be defined globally later
		for (const object of this.scene.children) {
			// @ts-ignore THREE.Object3D<THREE.Event> doesn't include geometry
			if (this.collisionGeometryNames.includes(object?.geometry?.type)) {
				console.log('controller objects')
				this.controller.objects.push(object as any)
			}
		}

		console.log(this.controller.objects)

		this.blocker.onclick = () => { this.controller.controls.lock() }
		this.RAF()
	}

	RAF() {
		requestAnimationFrame((t) => {
			if (this.previousRAF === null) this.previousRAF = t
	
			this.controller.update()
			this.renderer.render(this.scene, this.camera)
			this.previousRAF = t
			this.RAF()
		})
	}
}

var __APP__: App = null

window.onload = () => {
	__APP__ = new App(document.getElementById('blocker'))
}