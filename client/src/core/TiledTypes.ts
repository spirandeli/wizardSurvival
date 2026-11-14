export interface TiledProperty {
  name: string;
  type: 'string' | 'int' | 'float' | 'bool';
  value: string | number | boolean;
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: TiledProperty[];
}

export interface TiledTileLayer {
  id: number;
  name: string;
  type: 'tilelayer';
  width: number;
  height: number;
  data: number[];
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
}

export interface TiledObjectLayer {
  id: number;
  name: string;
  type: 'objectgroup';
  objects: TiledObject[];
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
}

export interface TiledTilesetRef {
  firstgid: number;
  name: string;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
  image: string;
  imagewidth: number;
  imageheight: number;
  margin: number;
  spacing: number;
}

export interface TiledMapJson {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: (TiledTileLayer | TiledObjectLayer)[];
  nextlayerid: number;
  nextobjectid: number;
  orientation: 'orthogonal';
  renderorder: 'right-down';
  tiledversion: string;
  tileheight: number;
  tilesets: TiledTilesetRef[];
  tilewidth: number;
  type: 'map';
  version: string;
  width: number;
}

export interface PortalTrigger {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMap: string;
  targetTileX: number;
  targetTileY: number;
  label: string;
}

export function getTiledProperty<T extends string | number | boolean>(
  properties: TiledProperty[] | undefined,
  name: string
): T | undefined {
  const found = properties?.find((p) => p.name === name);
  return found ? (found.value as T) : undefined;
}

