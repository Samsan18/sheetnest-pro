// @ts-ignore - occt-import-js types not available
import occtimportjs from "occt-import-js";

export interface ParsedCADModel {
  meshes: Array<{
    attributes: {
      position: number[];
      normal?: number[];
    };
    index?: number[];
  }>;
  success: boolean;
  faceCount: number;
}

let occtInstance: any = null;

export const initializeOCCT = async () => {
  if (!occtInstance) {
    occtInstance = await occtimportjs();
  }
  return occtInstance;
};

export const parseSTEPFile = async (fileContent: ArrayBuffer): Promise<ParsedCADModel> => {
  try {
    const occt = await initializeOCCT();
    const result = occt.ReadStepFile(new Uint8Array(fileContent), null);
    
    if (!result.success) {
      throw new Error("Failed to parse STEP file");
    }

    return {
      meshes: result.meshes || [],
      success: result.success,
      faceCount: result.faceCount || 0,
    };
  } catch (error) {
    console.error("Error parsing STEP file:", error);
    throw error;
  }
};

export const parseIGESFile = async (fileContent: ArrayBuffer): Promise<ParsedCADModel> => {
  try {
    const occt = await initializeOCCT();
    const result = occt.ReadIgesFile(new Uint8Array(fileContent), null);
    
    if (!result.success) {
      throw new Error("Failed to parse IGES file");
    }

    return {
      meshes: result.meshes || [],
      success: result.success,
      faceCount: result.faceCount || 0,
    };
  } catch (error) {
    console.error("Error parsing IGES file:", error);
    throw error;
  }
};

export const parse3DFile = async (fileContent: ArrayBuffer, fileName: string): Promise<ParsedCADModel> => {
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.endsWith('.step') || lowerFileName.endsWith('.stp')) {
    return parseSTEPFile(fileContent);
  } else if (lowerFileName.endsWith('.iges') || lowerFileName.endsWith('.igs')) {
    return parseIGESFile(fileContent);
  } else {
    // Try STEP parser as fallback for other formats
    try {
      return await parseSTEPFile(fileContent);
    } catch {
      throw new Error(`Unsupported 3D CAD format: ${fileName}`);
    }
  }
};

export const calculateModelArea = (modelData: ParsedCADModel): number => {
  // Calculate approximate surface area from 3D model
  let totalArea = 0;
  
  modelData.meshes.forEach(mesh => {
    const positions = mesh.attributes.position;
    const indices = mesh.index;
    
    if (!positions) return;
    
    if (indices && indices.length >= 3) {
      // Calculate area using triangles
      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i] * 3;
        const i2 = indices[i + 1] * 3;
        const i3 = indices[i + 2] * 3;
        
        const v1 = [positions[i1], positions[i1 + 1], positions[i1 + 2]];
        const v2 = [positions[i2], positions[i2 + 1], positions[i2 + 2]];
        const v3 = [positions[i3], positions[i3 + 1], positions[i3 + 2]];
        
        // Calculate triangle area using cross product
        const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
        
        const cross = [
          edge1[1] * edge2[2] - edge1[2] * edge2[1],
          edge1[2] * edge2[0] - edge1[0] * edge2[2],
          edge1[0] * edge2[1] - edge1[1] * edge2[0]
        ];
        
        const area = 0.5 * Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2);
        totalArea += area;
      }
    }
  });
  
  return totalArea;
};

export const calculateModelBounds = (modelData: ParsedCADModel) => {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  modelData.meshes.forEach(mesh => {
    const positions = mesh.attributes.position;
    if (!positions) return;
    
    for (let i = 0; i < positions.length; i += 3) {
      minX = Math.min(minX, positions[i]);
      maxX = Math.max(maxX, positions[i]);
      minY = Math.min(minY, positions[i + 1]);
      maxY = Math.max(maxY, positions[i + 1]);
      minZ = Math.min(minZ, positions[i + 2]);
      maxZ = Math.max(maxZ, positions[i + 2]);
    }
  });
  
  return { minX, maxX, minY, maxY, minZ, maxZ };
};
