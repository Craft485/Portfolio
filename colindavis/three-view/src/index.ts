import * as THREE from 'three'
import { levelLoader } from './loader'
import { Controller } from './controller'
import { TextLoader } from './textLoader'
import './styles.css'
import './scene.json'

class App {
	blocker: HTMLElement
	camera: THREE.Camera
	scene: THREE.Scene | any
	controller: Controller
	previousRAF: number
	renderer: THREE.WebGLRenderer
	textLoader: TextLoader
	constructor (blocker: HTMLElement) {
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
		// Fix camera pos
		this.camera.position.y = 3

		this.scene = await levelLoader('scene')

		this.textLoader = new TextLoader(this.scene)
		this.textLoader.load()

		this.renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(this.renderer.domElement)

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