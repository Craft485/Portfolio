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
            const pillarIndex = this.scene.children.findIndex(mesh => mesh.name.toLowerCase() === 'cylinder')
            // @ts-ignore
            const p1: THREE.Mesh<THREE.CylinderGeometry> = this.scene.children[pillarIndex]
            // Hoping pillarIndex is consistent
            // @ts-ignore
            const p2: THREE.Mesh<THREE.CylinderGeometry> = this.scene.children[pillarIndex + 2]
            const openSpaceBetweenPillars = Math.abs(Math.abs(p1.position.z) - Math.abs(p2.position.z)) - (2 * p1.geometry.parameters.radiusTop)
            console.log(this.scene)
            console.log(pillarIndex)
            console.log(p1)
            console.log(p2)
            console.log(openSpaceBetweenPillars)

            this.textData.forEach((text: string, index: number) => {
                console.log(`this.font at forEach: ${this.font}`)
                const g = new TextGeometry(text, {
                    font: this.font,
                    size: 0.5,
                    height: 0.5
                })
                const lineCount = text.trim().split('\n').length
                // @ts-ignore TextGeometry#parameters#options isn't defined on the type apparently
                const textGeoHeight = lineCount * g.parameters.options.size
                const m = new THREE.Mesh(g, material)
                m.rotation.copy(this.oldMeshes[index].rotation)
                m.position.copy(this.oldMeshes[index].position)
                if (m.position.y < 2 * textGeoHeight) m.position.y = 2 * textGeoHeight
                // Correct text position(will need changed once we move away from placeholder text)
                const textLinesSortedByLength = text.trim().split('\n').sort().reverse()
                const longestLine = textLinesSortedByLength[0]
                // @ts-ignore
                const paddingBetweenTextAndPillar = (openSpaceBetweenPillars - (longestLine.length * g.parameters.options.size)) / 2
                // const pillar: THREE.Mesh | any = this.scene.children.find(child => child.name.toLowerCase() === 'cylinder')
                // const pillarGeometry: THREE.CylinderGeometry = pillar.geometry
                m.position.z -= m.rotation.y < 0 ? paddingBetweenTextAndPillar : -0.5 * paddingBetweenTextAndPillar
                console.log(`p: ${paddingBetweenTextAndPillar}`)
                
                this.scene.add(m)
            })
        })
    }
}