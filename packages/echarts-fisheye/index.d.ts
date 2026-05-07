import 'echarts';

export interface FisheyeComponentOption {
  mainType?: 'fisheye';
  type?: 'fisheye';
  show?: boolean;
  enabled?: boolean;
  radius?: number | string;
  scale?: number;
  magnification?: number;
  stroke?: string;
  borderColor?: string;
  strokeWidth?: number;
  borderWidth?: number;
  opacity?: number;
  preview?: boolean;
}

declare module 'echarts/types/dist/echarts' {
  export interface ECBasicOption {
    fisheye?: FisheyeComponentOption | FisheyeComponentOption[];
  }
}

declare module 'echarts-fisheye';
