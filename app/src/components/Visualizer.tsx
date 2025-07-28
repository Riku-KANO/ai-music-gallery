import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { AudioData } from '../hooks/useAudioAnalyzer';
import type { VisualizerConfig } from '../types/visualizer';

// カスタムシェーダーマテリアル
const AudioShaderMaterial = shaderMaterial(
  {
    time: 0,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    audioData: new Float32Array(128),
    bass: 0,
    mid: 0,
    treble: 0,
    volume: 0,
    color1: new THREE.Color('#ff006e'),
    color2: new THREE.Color('#8338ec'),
    color3: new THREE.Color('#3a86ff'),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform vec2 resolution;
    uniform float audioData[128];
    uniform float bass;
    uniform float mid;
    uniform float treble;
    uniform float volume;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // ノイズ関数
    float noise(vec2 p) {
      return sin(p.x * 10.0) * sin(p.y * 10.0);
    }
    
    // フラクタルパターン
    float fractal(vec2 p) {
      float sum = 0.0;
      float freq = 1.0;
      float amp = 0.5;
      
      for(int i = 0; i < 5; i++) {
        sum += noise(p * freq) * amp;
        freq *= 2.0;
        amp *= 0.5;
      }
      
      return sum;
    }
    
    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(uv, center);
      
      // オーディオデータの影響を計算
      float audioInfluence = 0.0;
      for(int i = 0; i < 128; i++) {
        float fi = float(i) / 128.0;
        audioInfluence += audioData[i] * (1.0 - abs(fi - uv.x)) * 0.02;
      }
      
      // 時間とオーディオに基づくアニメーション
      float wave = sin(dist * 10.0 - time * 2.0 + bass * 5.0) * 0.5 + 0.5;
      float spiral = sin(atan(uv.y - 0.5, uv.x - 0.5) * 5.0 + time + mid * 3.0) * 0.5 + 0.5;
      float pulse = sin(time * 3.0 + dist * 20.0 * (1.0 + treble)) * volume;
      
      // フラクタルパターン
      vec2 fractalCoord = uv * 5.0 + vec2(time * 0.1, 0.0);
      float fractalPattern = fractal(fractalCoord + vec2(bass, mid));
      
      // リサージュ曲線
      float lissajous = sin(uv.x * 10.0 + time + bass * 5.0) * sin(uv.y * 8.0 + time * 1.3 + mid * 3.0);
      
      // 放射状のパターン
      float radial = sin(dist * 50.0 - time * 5.0 + audioInfluence * 10.0);
      
      // 色の混合
      vec3 color = mix(color1, color2, wave);
      color = mix(color, color3, spiral);
      color += vec3(fractalPattern * 0.2);
      color += audioInfluence * vec3(1.0, 0.5, 0.2);
      color += vec3(lissajous * 0.1 * treble);
      color += vec3(radial * 0.05 * volume);
      
      // 複数の円形レイヤー
      float ring1 = smoothstep(0.02, 0.0, abs(dist - 0.3 - bass * 0.1));
      float ring2 = smoothstep(0.01, 0.0, abs(dist - 0.2 - mid * 0.05));
      float ring3 = smoothstep(0.005, 0.0, abs(dist - 0.1 - treble * 0.02));
      
      color += vec3(ring1) * color1 * 2.0;
      color += vec3(ring2) * color2 * 1.5;
      color += vec3(ring3) * color3 * 1.0;
      
      // 円形のマスク
      float mask = smoothstep(0.5, 0.45, dist);
      
      // グロー効果
      float glow = exp(-dist * 3.0) * (0.5 + volume * 0.5);
      color += vec3(glow) * color * 0.5;
      
      // 最終出力
      float alpha = mask * (0.8 + pulse * 0.2) + (ring1 + ring2 + ring3) * 0.5;
      gl_FragColor = vec4(color, alpha);
    }
  `,
);

// TypeScriptのための型拡張
extend({ AudioShaderMaterial });

// Three.jsのJSX要素の型宣言
declare global {
  namespace JSX {
    interface IntrinsicElements {
      audioShaderMaterial: any;
    }
  }
}

interface VisualizerProps {
  getAudioData: () => AudioData;
  config: VisualizerConfig;
}

interface VisualizationProps {
  getAudioData: () => AudioData;
  config: VisualizerConfig;
}

const WaveVisualization: React.FC<VisualizationProps> = ({ getAudioData, config }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);

  useFrame(() => {
    if (!pointsRef.current || !pointsRef.current.geometry) return;

    timeRef.current += 0.01;
    const audioData = getAudioData();

    const positions = pointsRef.current.geometry.attributes.position;
    const colors = pointsRef.current.geometry.attributes.color;
    const posArray = positions.array as Float32Array;
    const colorArray = colors.array as Float32Array;
    const frequency = audioData.frequency;
    const waveform = audioData.waveform;
    const count = 128;

    // Create dynamic wave pattern
    for (let i = 0; i < count; i++) {
      const x = (i / count) * 8 - 4;
      const freqIndex = Math.floor((i / count) * frequency.length);
      const waveIndex = Math.floor((i / count) * waveform.length);

      const freqAmplitude = (frequency[freqIndex] || 0) / 255;
      const waveAmplitude = ((waveform[waveIndex] || 128) - 128) / 128;

      // Enhanced wave calculation with multiple frequencies
      const time = timeRef.current;
      const baseWave = Math.sin((i / count) * Math.PI * 6 + time * 2) * 0.2;
      const secondaryWave = Math.cos((i / count) * Math.PI * 12 + time * 3) * 0.1 * audioData.mid;
      const audioFreqWave = freqAmplitude * 4 * (1 + audioData.volume * 3);
      const audioWaveform = waveAmplitude * 2 * (1 + audioData.volume * 2);

      // Enhanced frequency response
      const bassResponse = i < count * 0.3 ? audioData.bass * 3 * Math.sin(time * 4) : 0;
      const midResponse = i >= count * 0.3 && i < count * 0.7 ? audioData.mid * 2 : 0;
      const trebleResponse = i >= count * 0.7 ? audioData.treble * 2.5 * Math.cos(time * 8) : 0;

      const y =
        baseWave +
        secondaryWave +
        audioFreqWave +
        audioWaveform +
        bassResponse +
        midResponse +
        trebleResponse;
      const z = Math.sin(time * 2 + i * 0.2) * 0.8 * (1 + audioData.volume);

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      // Dynamic color based on audio
      const hue = (i / count + audioData.volume * 0.5 + time * 0.1) % 1;
      const saturation = 0.7 + audioData.volume * 0.3;
      const lightness = 0.5 + freqAmplitude * 0.5;

      // Convert HSL to RGB
      const color = new THREE.Color();
      color.setHSL(hue, saturation, lightness);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;

    if (groupRef.current) {
      // Enhanced rotation with audio response
      groupRef.current.rotation.z += 0.003 + audioData.volume * 0.02;
      groupRef.current.rotation.y += audioData.bass * 0.03;
      groupRef.current.rotation.x = Math.sin(timeRef.current) * 0.1 * audioData.treble;

      // Dynamic scaling
      const scale = 1 + audioData.volume * 0.5 + Math.sin(timeRef.current * 2) * 0.1;
      groupRef.current.scale.set(scale, scale, scale);
    }

    // Animate frequency bars
    meshRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const freqIndex = Math.floor((i / meshRefs.current.length) * frequency.length);
        const amplitude = (frequency[freqIndex] || 0) / 255;
        mesh.scale.y = 0.1 + amplitude * 5;
        mesh.position.y = -1.5 + mesh.scale.y / 2;

        // Color based on amplitude
        const material = mesh.material as THREE.MeshBasicMaterial;
        const hue = (i / 64 + amplitude * 0.3) % 1;
        material.color.setHSL(hue, 0.8, 0.5 + amplitude * 0.5);
        material.opacity = 0.7 + amplitude * 0.3;
      }
    });
  });

  const waveGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 128;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Initialize positions and colors
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (i / count) * 8 - 4;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Initialize with gradient colors
      colors[i * 3] = 0.5;
      colors[i * 3 + 1] = 0.5;
      colors[i * 3 + 2] = 1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Main wave line as points with dynamic color */}
      <points ref={pointsRef} geometry={waveGeometry}>
        <pointsMaterial
          size={0.12}
          transparent
          opacity={0.9}
          vertexColors
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Enhanced background elements */}
      <mesh position={[0, 0, -3]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial
          color={config.colorScheme[0]}
          transparent
          opacity={0.05}
          emissive={config.colorScheme[1]}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Glowing orbs */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={`orb-${i}`} position={[Math.cos(angle) * 5, Math.sin(angle) * 3, -1]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color={config.colorScheme[i % config.colorScheme.length]}
              emissive={config.colorScheme[i % config.colorScheme.length]}
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        );
      })}

      {/* Enhanced frequency bars */}
      {Array.from({ length: 64 }, (_, i) => {
        const x = (i / 64) * 8 - 4;
        return (
          <mesh
            key={i}
            position={[x, -1.5, 1]}
            ref={(el) => {
              if (el) meshRefs.current[i] = el;
            }}
          >
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshBasicMaterial transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

const ParticleVisualization: React.FC<VisualizationProps> = ({ getAudioData, config }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const particles = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Create multiple particle systems
      const systemType = i % 3;

      if (systemType === 0) {
        // Spherical core
        const radius = Math.random() * 4 + 1;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
      } else if (systemType === 1) {
        // Orbital rings
        const angle = Math.random() * Math.PI * 2;
        const ringRadius = 5 + Math.random() * 3;
        const height = (Math.random() - 0.5) * 2;
        positions[i * 3] = Math.cos(angle) * ringRadius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * ringRadius;
      } else {
        // Outer cloud
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }

      // Enhanced velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

      // Initial colors from config
      const colorIndex = i % config.colorScheme.length;
      const baseColor = new THREE.Color(config.colorScheme[colorIndex]);
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;

      // Particle sizes
      sizes[i] = 0.02 + Math.random() * 0.08;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.userData = { velocities };

    return geometry;
  }, [config.colorScheme]);

  useFrame(() => {
    if (!particlesRef.current || !groupRef.current) return;

    timeRef.current += 0.01;
    const audioData = getAudioData();
    const time = timeRef.current;

    const positions = particlesRef.current.geometry.attributes.position;
    const colors = particlesRef.current.geometry.attributes.color;
    const sizes = particlesRef.current.geometry.attributes.size;
    const posArray = positions.array as Float32Array;
    const colorArray = colors.array as Float32Array;
    const sizeArray = sizes.array as Float32Array;
    const velocities = particlesRef.current.geometry.userData.velocities;

    // Enhanced particle animation
    for (let i = 0; i < posArray.length / 3; i++) {
      const i3 = i * 3;
      const systemType = i % 3;

      // Different behaviors for different particle systems
      if (systemType === 0) {
        // Core particles - strong bass response
        const bassForce = audioData.bass * 0.2;
        const angle = Math.atan2(posArray[i3 + 2], posArray[i3]);
        posArray[i3] += velocities[i3] + Math.cos(angle) * bassForce;
        posArray[i3 + 1] += velocities[i3 + 1] + Math.sin(time * 2 + i * 0.1) * audioData.mid * 0.1;
        posArray[i3 + 2] += velocities[i3 + 2] + Math.sin(angle) * bassForce;
      } else if (systemType === 1) {
        // Ring particles - circular motion
        const angle = Math.atan2(posArray[i3 + 2], posArray[i3]) + audioData.mid * 0.02;
        const radius = Math.sqrt(posArray[i3] ** 2 + posArray[i3 + 2] ** 2);
        posArray[i3] = Math.cos(angle) * radius;
        posArray[i3 + 1] += Math.sin(time * 3 + i * 0.05) * audioData.treble * 0.05;
        posArray[i3 + 2] = Math.sin(angle) * radius;
      } else {
        // Cloud particles - free movement
        posArray[i3] += velocities[i3] + audioData.bass * 0.05 * Math.sin(time + i);
        posArray[i3 + 1] += velocities[i3 + 1] + audioData.mid * 0.03 * Math.cos(time + i);
        posArray[i3 + 2] += velocities[i3 + 2] + audioData.treble * 0.02 * Math.sin(time * 2 + i);
      }

      // Boundary checking with smooth reset
      const distance = Math.sqrt(posArray[i3] ** 2 + posArray[i3 + 1] ** 2 + posArray[i3 + 2] ** 2);
      if (distance > 20) {
        const resetFactor = 0.1 + Math.random() * 0.2;
        posArray[i3] *= resetFactor;
        posArray[i3 + 1] *= resetFactor;
        posArray[i3 + 2] *= resetFactor;
      }

      // Enhanced color animation
      const freqIndex = Math.floor((i / (posArray.length / 3)) * audioData.frequency.length);
      const freqIntensity = (audioData.frequency[freqIndex] || 0) / 255;

      const hue = (time * 0.1 + i * 0.0001 + freqIntensity * 0.5) % 1;
      const saturation = 0.5 + audioData.volume * 0.5;
      const lightness = 0.4 + freqIntensity * 0.6;

      const color = new THREE.Color();
      color.setHSL(hue, saturation, lightness);
      colorArray[i3] = color.r;
      colorArray[i3 + 1] = color.g;
      colorArray[i3 + 2] = color.b;

      // Dynamic particle sizing
      sizeArray[i] = 0.02 + freqIntensity * 0.1 + Math.sin(time * 4 + i) * 0.01;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;

    // Enhanced global transformations
    groupRef.current.rotation.x += 0.002 + audioData.bass * 0.015;
    groupRef.current.rotation.y += 0.001 + audioData.mid * 0.008;
    groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.2 * audioData.treble;

    const scale = 1 + audioData.volume * 0.4 + Math.sin(time * 2) * 0.05;
    groupRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef}>
      <points ref={particlesRef} geometry={particles}>
        <pointsMaterial
          size={0.05}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Additional light effects */}
      <pointLight position={[0, 0, 0]} intensity={1} color={config.colorScheme[0]} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color={config.colorScheme[1]} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color={config.colorScheme[2]} />
    </group>
  );
};

const ShaderVisualization: React.FC<VisualizationProps> = ({ getAudioData, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const timeRef = useRef(0);

  useFrame(() => {
    if (!materialRef.current) return;

    timeRef.current += 0.01;
    const audioData = getAudioData();

    // シェーダーのユニフォームを更新
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.bass.value = audioData.bass;
    materialRef.current.uniforms.mid.value = audioData.mid;
    materialRef.current.uniforms.treble.value = audioData.treble;
    materialRef.current.uniforms.volume.value = audioData.volume;

    // オーディオデータを配列として渡す
    const frequencyData = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      frequencyData[i] = (audioData.frequency[i] || 0) / 255;
    }
    materialRef.current.uniforms.audioData.value = frequencyData;

    // カラースキームを更新
    materialRef.current.uniforms.color1.value = new THREE.Color(config.colorScheme[0]);
    materialRef.current.uniforms.color2.value = new THREE.Color(config.colorScheme[1]);
    materialRef.current.uniforms.color3.value = new THREE.Color(config.colorScheme[2]);

    // メッシュの回転
    if (meshRef.current) {
      meshRef.current.rotation.z += audioData.volume * 0.01;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <planeGeometry args={[20, 20, 128, 128]} />
        <audioShaderMaterial
          ref={materialRef}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 追加の3Dエフェクト */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[25, 25]} />
        <meshBasicMaterial color="#000033" opacity={0.8} transparent />
      </mesh>
    </group>
  );
};

const GeometricVisualization: React.FC<VisualizationProps> = ({ getAudioData, config }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const octahedronRef = useRef<THREE.Mesh>(null);
  const icosahedronRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame(() => {
    if (!groupRef.current) return;

    timeRef.current += 0.01;
    const audioData = getAudioData();
    const time = timeRef.current;

    // Enhanced main group rotation
    groupRef.current.rotation.x += 0.005 + audioData.mid * 0.025;
    groupRef.current.rotation.y += 0.003 + audioData.treble * 0.02;
    groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.3 + audioData.bass * 0.02;

    // Individual object animations
    if (cubeRef.current) {
      cubeRef.current.rotation.x += audioData.bass * 0.03;
      cubeRef.current.rotation.y += audioData.volume * 0.02;
      const cubeScale = 1 + audioData.bass * 0.5;
      cubeRef.current.scale.set(cubeScale, cubeScale, cubeScale);
    }

    if (octahedronRef.current) {
      octahedronRef.current.rotation.x -= audioData.mid * 0.025;
      octahedronRef.current.rotation.z += audioData.treble * 0.02;
      const octaScale = 1 + audioData.mid * 0.4;
      octahedronRef.current.scale.set(octaScale, octaScale, octaScale);
    }

    if (icosahedronRef.current) {
      icosahedronRef.current.rotation.y += audioData.treble * 0.04;
      icosahedronRef.current.rotation.z -= audioData.volume * 0.015;
      const icosaScale = 1 + audioData.treble * 0.3;
      icosahedronRef.current.scale.set(icosaScale, icosaScale, icosaScale);
    }

    // Animate rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const mesh = ring as THREE.Mesh;
        mesh.rotation.x += ((audioData.frequency[i * 32] || 0) / 255) * 0.1;
        mesh.rotation.y += audioData.volume * 0.01 * (i + 1);
      });
    }

    // Global scale based on overall volume
    const globalScale = 1 + audioData.volume * 0.2;
    groupRef.current.scale.set(globalScale, globalScale, globalScale);
  });

  return (
    <group ref={groupRef}>
      {/* Central cube - bass responsive */}
      <mesh ref={cubeRef} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={config.colorScheme[0]}
          emissive={config.colorScheme[0]}
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.8}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Octahedron - mid frequencies */}
      <mesh ref={octahedronRef} position={[0, 0, 0]}>
        <octahedronGeometry args={[2, 0]} />
        <meshStandardMaterial
          color={config.colorScheme[1]}
          emissive={config.colorScheme[1]}
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
          wireframe
          metalness={0.7}
          roughness={0.1}
        />
      </mesh>

      {/* Icosahedron - treble frequencies */}
      <mesh ref={icosahedronRef} position={[0, 0, 0]}>
        <icosahedronGeometry args={[2.5, 0]} />
        <meshStandardMaterial
          color={config.colorScheme[2]}
          emissive={config.colorScheme[2]}
          emissiveIntensity={0.4}
          transparent
          opacity={0.4}
          wireframe
          metalness={0.8}
          roughness={0.05}
        />
      </mesh>

      {/* Frequency rings */}
      <group ref={ringsRef}>
        {Array.from({ length: 8 }, (_, i) => {
          const radius = 3 + i * 0.5;

          return (
            <mesh key={i} position={[0, 0, 0]}>
              <torusGeometry args={[radius, 0.05, 8, 32]} />
              <meshBasicMaterial color={`hsl(${i * 45}, 70%, 50%)`} transparent opacity={0.5} />
            </mesh>
          );
        })}
      </group>

      {/* Additional geometric elements */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <mesh key={`spike-${i}`} position={[x, 0, z]}>
            <coneGeometry args={[0.1, 0.5, 4]} />
            <meshBasicMaterial color={`hsl(${i * 30}, 80%, 60%)`} />
          </mesh>
        );
      })}
    </group>
  );
};

const Visualization: React.FC<VisualizationProps> = ({ getAudioData, config }) => {
  switch (config.theme) {
    case 'waves':
      return <WaveVisualization getAudioData={getAudioData} config={config} />;
    case 'particles':
      return <ParticleVisualization getAudioData={getAudioData} config={config} />;
    case 'geometric':
      return <GeometricVisualization getAudioData={getAudioData} config={config} />;
    case 'shader':
      return <ShaderVisualization getAudioData={getAudioData} config={config} />;
    default:
      return <WaveVisualization getAudioData={getAudioData} config={config} />;
  }
};

export const Visualizer: React.FC<VisualizerProps> = ({ getAudioData, config }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />

        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          color={config.colorScheme[0]}
        />

        <Visualization getAudioData={getAudioData} config={config} />
      </Canvas>
    </div>
  );
};
