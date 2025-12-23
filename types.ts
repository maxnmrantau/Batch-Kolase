
export interface Photo {
  id: string;
  url: string;
  name: string;
  base64: string;
  width?: number;
  height?: number;
  description?: string;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
}

export interface CollageLayout {
  id: string;
  name: string;
  icon: string;
  config: string;
}

/**
 * Interface representing the AI-generated analysis of a photo collection.
 * This includes suggested metadata and visual themes.
 */
export interface AIAnalysis {
  title: string;
  theme: string;
  vibe: string;
  colorPalette: string[];
}
