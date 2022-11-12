import * as THREE from 'three'
import { levelLoader } from './loader'
import { Controller } from './controller'
import './styles.css'
import './scene.json'

// init
const blocker = document.getElementById('blocker')

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 2000)
camera.position.y = 3
// @ts-expect-error using top level await with es5 target
const scene: THREE.Scene = await levelLoader('scene')

const renderer = new THREE.WebGLRenderer( { antialias: true } )
renderer.setSize( window.innerWidth, window.innerHeight )
document.body.appendChild( renderer.domElement )

const controller = new Controller(camera, document.body, blocker)

let previousRAF: number | null = null

function raf() {
	requestAnimationFrame((t) => {
		if (previousRAF === null) previousRAF = t

		controller.update()
		renderer.render(scene, camera)
		previousRAF = t
		raf()
	})
}

window.onload = () => {
	raf()
	blocker.onclick = () => { controller.controls.lock() }
}