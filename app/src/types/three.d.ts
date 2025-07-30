import type { ReactThreeFiber } from '@react-three/fiber';
import type { ShaderMaterial } from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      audioShaderMaterial: ReactThreeFiber.Object3DNode<
        AudioShaderMaterial,
        typeof AudioShaderMaterial
      >;
    }
  }
}

export interface AudioShaderMaterialUniforms {
  time: { value: number };
  resolution: { value: THREE.Vector2 };
  audioData: { value: Float32Array };
  bass: { value: number };
  mid: { value: number };
  treble: { value: number };
  volume: { value: number };
  color1: { value: THREE.Color };
  color2: { value: THREE.Color };
  color3: { value: THREE.Color };
}

export class AudioShaderMaterial extends ShaderMaterial {
  uniforms: AudioShaderMaterialUniforms;
}
