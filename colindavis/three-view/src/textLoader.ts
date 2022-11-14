import * as THREE from 'three'
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import textData from './text-data.json'

export class TextLoader {
    scene: THREE.Scene
    oldMeshes: Array<THREE.Mesh>
    font: Font
    textData: string[]
    constructor (scene: THREE.Scene) {
        this.scene = scene
        this.oldMeshes = (() => {
            const a: Array<THREE.Mesh> = []

            this.scene.children.forEach((child: THREE.Mesh) => {
                if (child.name.toUpperCase() === 'RING') {
                    a.push(child)
                }
            })

            return a
        })()
        this.font = null
        // @ts-expect-error textData is being read in as a string somehow and the linter can't tell that
        this.textData = JSON.parse(textData).textData
    }

    load() {
        const material = new THREE.MeshStandardMaterial({ flatShading: true })
        const loader = new FontLoader()
        const path = window.location.hostname.includes('net') ? './droid_sans_mono_regular.typeface.json' : '../node_modules/three/examples/fonts/droid/droid_sans_mono_regular.typeface.json'
        loader.load(path, (res) => {
            console.log(res)
            this.font = res
            
            this.textData.forEach((text: string, index: number) => {
                console.log(`this.font at forEach: ${this.font}`)
                const g = new TextGeometry(text, {
                    font: this.font,
                    size: 1,
                    height: 0.5
                })
                const m = new THREE.Mesh(g, material)
                m.rotation.copy(this.oldMeshes[index].rotation)
                m.position.copy(this.oldMeshes[index].position)
                // Correct text position(will need changed once we move away from placeholder text)
                m.position.z -= m.rotation.y < 0 ? 5 : -5
                
                this.scene.children.find(c => c.uuid === this.oldMeshes[index].uuid).remove()
                this.scene.add(m)
            })
        })
    }
}