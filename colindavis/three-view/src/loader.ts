import * as THREE from 'three'

/**
 * Load level data from json file
 * @param {string} levelName Name of the level(not the file) Ex: 'debug' will load level data from 'debug_leveldata.json'
 */
export async function levelLoader(levelName: string) {
    const d = await new Promise(async (resolve) => {
        const loader = new THREE.ObjectLoader()
        await loader.load(
            // Level data URL
            `./${levelName}.json`,
            
            // onLoad callback
            (sceneData) => {
                console.log(sceneData)
                resolve(sceneData)
            },
            
            // onProgress callback
            (xhr) => console.log( (xhr.loaded / xhr.total * 100) + '% loaded' ),
            
            // onError callback
            (err) => console.error( 'An error happened\n' + err )
        )
    })
    console.log(d)
    return d
}