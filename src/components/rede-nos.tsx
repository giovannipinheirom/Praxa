import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COR_NO = new THREE.Color("#00D382"); // Stone Green
const COR_LINHA = new THREE.Color("#14213D");

const QTD_NOS = 46;
const RAIO = 3.1;
const DIST_LIGACAO = 1.85;

type No = { pos: THREE.Vector3; vel: THREE.Vector3; escala: number };

function criarNos(): No[] {
  const nos: No[] = [];
  for (let i = 0; i < QTD_NOS; i++) {
    // distribuição esférica quase uniforme (fibonacci)
    const y = 1 - (i / (QTD_NOS - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.399963229728653;
    const jitter = 0.82 + Math.random() * 0.35;
    nos.push({
      pos: new THREE.Vector3(
        Math.cos(theta) * r * RAIO * jitter,
        y * RAIO * jitter,
        Math.sin(theta) * r * RAIO * jitter,
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.0016,
        (Math.random() - 0.5) * 0.0016,
        (Math.random() - 0.5) * 0.0016,
      ),
      escala: 1,
    });
  }
  return nos;
}

function Rede({ interativo = false }: { interativo?: boolean }) {
  const grupo = useRef<THREE.Group>(null);
  const instancias = useRef<THREE.InstancedMesh>(null);
  const linhas = useRef<THREE.LineSegments>(null);
  const ponteiro = useRef({ x: 0, y: 0 });

  const nos = useMemo(() => criarNos(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const raioLocal = useMemo(() => new THREE.Ray(), []);
  const inversa = useMemo(() => new THREE.Matrix4(), []);

  const maxSegmentos = QTD_NOS * QTD_NOS;
  const geoLinhas = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(maxSegmentos * 6), 3),
    );
    return g;
  }, [maxSegmentos]);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05) * 60;

    // deriva suave dos nós dentro da esfera
    for (const no of nos) {
      no.pos.addScaledVector(no.vel, d);
      if (no.pos.length() > RAIO) {
        no.pos.setLength(RAIO);
        no.vel.reflect(no.pos.clone().normalize()).multiplyScalar(0.9);
      }
    }

    // raio do cursor em espaço local do grupo — usado para "acender" os nós
    let temRaio = false;
    if (interativo && grupo.current) {
      state.raycaster.setFromCamera(state.pointer, state.camera);
      inversa.copy(grupo.current.matrixWorld).invert();
      raioLocal.copy(state.raycaster.ray).applyMatrix4(inversa);
      temRaio = true;
    }

    if (instancias.current) {
      nos.forEach((no, i) => {
        let alvo = 1;
        if (temRaio) {
          const dist = raioLocal.distanceToPoint(no.pos);
          alvo = dist < 1.4 ? 1 + (1.4 - dist) * 1.9 : 1;
        }
        no.escala += (alvo - no.escala) * Math.min(1, 0.12 * d);

        dummy.position.copy(no.pos);
        const base = 0.055 + (no.pos.z + RAIO) * 0.006;
        dummy.scale.setScalar(base * no.escala);
        dummy.updateMatrix();
        instancias.current!.setMatrixAt(i, dummy.matrix);
      });
      instancias.current.instanceMatrix.needsUpdate = true;
    }

    // recalcula as ligações próximas
    const atributo = geoLinhas.getAttribute("position") as THREE.BufferAttribute;
    const array = atributo.array as Float32Array;
    let cursor = 0;
    for (let i = 0; i < nos.length; i++) {
      for (let j = i + 1; j < nos.length; j++) {
        if (nos[i].pos.distanceTo(nos[j].pos) < DIST_LIGACAO) {
          array[cursor++] = nos[i].pos.x;
          array[cursor++] = nos[i].pos.y;
          array[cursor++] = nos[i].pos.z;
          array[cursor++] = nos[j].pos.x;
          array[cursor++] = nos[j].pos.y;
          array[cursor++] = nos[j].pos.z;
        }
      }
    }
    array.fill(0, cursor);
    atributo.needsUpdate = true;
    geoLinhas.setDrawRange(0, cursor / 3);

    if (grupo.current) {
      if (interativo) {
        // orientação conduzida pelo mouse, com retorno suave e giro lento contínuo
        grupo.current.rotation.y += 0.0016 * d;
        const alvoX = -ponteiro.current.y * 0.5;
        const alvoZ = ponteiro.current.x * 0.12;
        grupo.current.rotation.x += (alvoX - grupo.current.rotation.x) * 0.06;
        grupo.current.rotation.z += (alvoZ - grupo.current.rotation.z) * 0.06;
        grupo.current.rotation.y += (ponteiro.current.x * 0.6 - 0) * 0.004 * d;
      } else {
        grupo.current.rotation.y += 0.0009 * d;
        const alvoX = ponteiro.current.y * 0.18;
        grupo.current.rotation.x += (alvoX - grupo.current.rotation.x) * 0.04;
      }
    }

    ponteiro.current.x = state.pointer.x;
    ponteiro.current.y = state.pointer.y;
  });

  return (
    <group ref={grupo}>
      <instancedMesh ref={instancias} args={[undefined, undefined, QTD_NOS]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={COR_NO} transparent opacity={0.9} />
      </instancedMesh>
      <lineSegments ref={linhas} geometry={geoLinhas}>
        <lineBasicMaterial color={COR_LINHA} transparent opacity={0.32} />
      </lineSegments>
    </group>
  );
}

export default function RedeNos({ interativo = false }: { interativo?: boolean }) {
  return (
    <Canvas
      className={interativo ? undefined : "pointer-events-none"}
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 8.2], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Rede interativo={interativo} />
    </Canvas>
  );
}
