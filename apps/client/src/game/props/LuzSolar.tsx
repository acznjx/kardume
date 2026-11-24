import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { local } from '../mundo';

/**
 * Luz direcional cuja "caixa de sombra" acompanha o peixe local: sombras nítidas perto
 * de quem joga sem precisar de um shadow map gigante para a sala inteira.
 */
export function LuzSolar({
  direcao = [12, 30, 14],
  cor = '#fff6dc',
  intensidade = 1.5,
  alcance = 38,
  mapa = 2048,
}: {
  direcao?: [number, number, number];
  cor?: string;
  intensidade?: number;
  alcance?: number;
  mapa?: number;
}) {
  const luz = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  const passo = (alcance * 2) / mapa; // tamanho de um texel: anda em passos inteiros para a sombra não "tremer"

  useEffect(() => {
    const l = luz.current;
    if (!l) return;
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);

  useFrame(() => {
    const l = luz.current;
    if (!l) return;
    const x = Math.round(local.pos.x / passo) * passo;
    const z = Math.round(local.pos.z / passo) * passo;
    l.target.position.set(x, 0, z);
    l.position.set(x + direcao[0], direcao[1], z + direcao[2]);
  });

  return (
    <directionalLight
      ref={luz}
      color={cor}
      intensity={intensidade}
      castShadow
      shadow-mapSize={[mapa, mapa]}
      shadow-camera-left={-alcance}
      shadow-camera-right={alcance}
      shadow-camera-top={alcance}
      shadow-camera-bottom={-alcance}
      shadow-camera-near={1}
      shadow-camera-far={120}
      shadow-bias={-0.0006}
      shadow-normalBias={0.04}
    />
  );
}
