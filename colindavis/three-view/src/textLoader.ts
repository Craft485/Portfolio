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
            // Grab two pillars right next to each other to do some math later
            // const pillarIndex = this.scene.children.findIndex(mesh => mesh.name.toLowerCase() === 'p1')
            // @ts-ignore
            const p1: THREE.Mesh<THREE.CylinderGeometry, THREE.Material> = this.scene.children.find((mesh) => mesh.name.toUpperCase() === 'P1')
            // @ts-ignore
            const p2: THREE.Mesh<THREE.CylinderGeometry, THREE.Material> = this.scene.children.find((mesh) => mesh.name.toUpperCase() === 'P2')
            console.log(this.scene)
            console.log(p1)
            console.log(p2)
            const openSpaceBetweenPillars = Math.abs(Math.abs(p1.position.z) - Math.abs(p2.position.z)) - (2 * p1.geometry.parameters.radiusTop)
            console.log(openSpaceBetweenPillars)
            
            this.textData.forEach((text: string, index: number) => {
                console.log(`this.font at forEach: ${this.font}`)
                const g = new TextGeometry(text, {
                    font: this.font,
                    size: 0.5,
                    height: 0.1
                })
                const lineCount = text.trim().split('\n').length
                // @ts-ignore TextGeometry#parameters#options isn't defined on the type apparently
                const textGeoHeight = lineCount * g.parameters.options.size
                const mesh = new THREE.Mesh(g, material)
                mesh.rotation.copy(this.oldMeshes[index].rotation)
                mesh.position.copy(this.oldMeshes[index].position)
                if (mesh.position.y < 2 * textGeoHeight) mesh.position.y = 2 * textGeoHeight
                // Correct text position
                mesh.geometry.computeBoundingBox()
                const textGeoWidth = Math.abs(Math.abs(mesh.geometry.boundingBox.max.x) - Math.abs(mesh.geometry.boundingBox.min.x))
                const paddingBetweenTextAndPillar = Math.ceil((openSpaceBetweenPillars - textGeoWidth) / 2)

                const distanceToCenterOfNearbyPillar = p1.geometry.parameters.radiusBottom + (openSpaceBetweenPillars / 2)
                mesh.position.z -= mesh.rotation.y > 0 ? -distanceToCenterOfNearbyPillar : distanceToCenterOfNearbyPillar

                const offsetFromPillar = p1.geometry.parameters.radiusTop + paddingBetweenTextAndPillar
                mesh.position.z += mesh.rotation.y < 0 ? offsetFromPillar : -offsetFromPillar

                console.log(`Geo Width: ${textGeoWidth}`)
                console.log(`Padding: ${paddingBetweenTextAndPillar}`)
                
                this.scene.add(mesh)
                // @ts-ignore
                this.oldMeshes[index].material.dispose()
                this.oldMeshes[index].geometry.dispose()
                this.oldMeshes[index].removeFromParent()
            })
        })
    }
}