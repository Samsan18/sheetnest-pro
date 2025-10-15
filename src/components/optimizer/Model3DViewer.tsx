import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera } from "@react-three/drei";
import { Card } from "@/components/ui/card";
import * as THREE from "three";

interface Model3DViewerProps {
  modelData: any;
  fileName: string;
}

const Model3DViewer = ({ modelData, fileName }: Model3DViewerProps) => {
  const renderModel = () => {
    if (!modelData || !modelData.meshes) return null;

    return modelData.meshes.map((mesh: any, index: number) => {
      const geometry = new THREE.BufferGeometry();
      
      // Set vertices
      if (mesh.attributes?.position) {
        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(mesh.attributes.position, 3)
        );
      }
      
      // Set normals
      if (mesh.attributes?.normal) {
        geometry.setAttribute(
          'normal',
          new THREE.Float32BufferAttribute(mesh.attributes.normal, 3)
        );
      }
      
      // Set indices if available
      if (mesh.index) {
        geometry.setIndex(mesh.index);
      }

      return (
        <mesh key={index} geometry={geometry}>
          <meshStandardMaterial 
            color="#3b82f6" 
            side={THREE.DoubleSide}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      );
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">3D Model Preview</h3>
        <p className="text-sm text-muted-foreground">{fileName}</p>
      </div>
      
      <div className="w-full h-[500px] bg-background rounded-lg border border-border overflow-hidden">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          
          {/* Grid */}
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#3b82f6"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
          />
          
          {/* 3D Model */}
          {renderModel()}
          
          {/* Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={50}
          />
        </Canvas>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>• Click and drag to rotate</p>
        <p>• Scroll to zoom in/out</p>
        <p>• Right-click and drag to pan</p>
      </div>
    </Card>
  );
};

export default Model3DViewer;
