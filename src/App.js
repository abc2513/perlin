import { useEffect, useRef } from 'react';
import './App.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import gsap from 'gsap';
import * as dat from 'dat.gui';
import { GUI } from 'lil-gui';
import * as CANNON from 'cannon';
import { Perlin } from './utils/perlin';
const sizes = {
  width: 1200,
  height: 800
}
const createSphere = (radius, position) => {

};
function App() {
  const appRef = useRef();
  const canvasRef = useRef();
  useEffect(() => {
    //scane camera renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
    camera.position.z = 0.5;
    camera.position.y = 0.4;
    scene.add(camera);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(sizes.width, sizes.height);
    renderer.shadowMap.enabled = true;//开启阴影
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    const clock = new THREE.Clock();
    let oldElapsedTime = 0;
    const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    const perlin = new Perlin();
    const geometry = new THREE.PlaneGeometry(2, 2, 72, 72);//平面
    const count = geometry.attributes.position.count;

    const randoms = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      randoms[i] = perlin.cal3d(geometry.attributes.position.getX(i) * 5, geometry.attributes.position.getY(i) * 5, 0);
    }
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));//设置点的属性，参数是数据和每个点的属性数量


    const material = new THREE.RawShaderMaterial({
      vertexShader: /*glsl*/`
        //uniform
        uniform mat4 projectionMatrix;//投影矩阵
        uniform mat4 viewMatrix;//视图矩阵
        uniform mat4 modelMatrix;//模型矩阵

        uniform float zScale;//z轴缩放
        uniform vec3 fromColor;//起始颜色
        uniform vec3 toColor;//结束颜色
        //attribute,用于获取点的属性
        attribute vec3 position;
        attribute float aRandom;
        //varying,用于传递数据给片元着色器
        varying float vRandom;
        varying vec3 vFromColor;
        varying vec3 vToColor;

        void main(){
          vFromColor=fromColor;
          vToColor=toColor;

          // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0);
          vec4 modelPosition=modelMatrix*vec4(position,1.0);//模型坐标
          modelPosition.y+=aRandom*zScale;//z轴偏移
          vRandom=aRandom;//传递给片元着色器
          vec4 viewPosition=viewMatrix*modelPosition;//视图坐标
          vec4 projectionPosition=projectionMatrix*viewPosition;//投影坐标
          gl_Position=projectionPosition;//裁剪坐标
        }
      `,
      fragmentShader: /*glsl*/`
        precision mediump float;
        varying float vRandom;
        varying vec3 vFromColor;
        varying vec3 vToColor;
        void main(){
          vec3 color=mix(vFromColor,vToColor,vRandom);
          gl_FragColor=vec4(color,1.0);
        }
      `,
      wireframe: true,
      // transparent: true,
      uniforms: {//传递uniform，材料的全局变量
        zScale: { value: 0.2 },
        toColor: { value: new THREE.Color('#e0c3fc') },
        fromColor: { value: new THREE.Color('#8ec5fc') },
      },
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI * 0.5;
    scene.add(plane);
    const fbm = {
      octaves: 3,//倍频，叠加次数
      lacunarity: 0.8,//频率变化率
      gain: 0.8,//振幅变化率
      frequency: 1,//初始频率
      amplitude: 3,//初始振幅
    };
    const gui = new GUI();
    //样式文件夹
    const materialFolder = gui.addFolder('material');
    materialFolder.add(material, 'wireframe');
    materialFolder.add(material.uniforms.zScale, 'value').min(0).max(1).step(0.01).name('zScale');
    materialFolder.addColor(material.uniforms.toColor, 'value').name('toColor');
    materialFolder.addColor(material.uniforms.fromColor, 'value').name('fromColor');
    //geometry文件夹
    const geometryFolder = gui.addFolder('geometry');
    //大小

    //camera文件夹
    const cameraFolder = gui.addFolder('camera');
    cameraFolder.add(camera.position, 'x').min(-5).max(5).step(0.01).name('x');
    cameraFolder.add(camera.position, 'y').min(-5).max(5).step(0.01).name('y');
    cameraFolder.add(camera.position, 'z').min(-5).max(5).step(0.01).name('z');
    //fbm文件夹
    const fbmFolder = gui.addFolder('fbm');
    fbmFolder.add(fbm, 'octaves').min(1).max(10).step(1).name('octaves');
    fbmFolder.add(fbm, 'lacunarity').min(0.1).max(2).step(0.01).name('lacunarity');
    fbmFolder.add(fbm, 'gain').min(0.1).max(2).step(0.01).name('gain');
    fbmFolder.add(fbm, 'frequency').min(0.2).max(2).step(0.01).name('frequency');
    fbmFolder.add(fbm, 'amplitude').min(0).max(10).step(0.01).name('amplitude');



    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - oldElapsedTime;
      oldElapsedTime = elapsedTime;
      const randoms = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        randoms[i] = (perlin.fbm3d(geometry.attributes.position.getX(i) * 5, geometry.attributes.position.getY(i) * 5, elapsedTime / 3, fbm.octaves, fbm.lacunarity, fbm.gain, fbm.frequency, fbm.amplitude) + 1) / 2;
      }
      geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));//设置点的属性，参数是数据和每个点的属性数量

      renderer.render(scene, camera);
      window.requestAnimationFrame(tick);
    }
    tick();

  }, []);
  return (
    <div className="App" ref={appRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default App;
