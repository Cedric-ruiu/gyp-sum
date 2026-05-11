// Conversion utilitaire — isolée pour préparer le système d'unités impérial.
export function cm3ToLiters(cm3: number): number {
  return cm3 / 1000;
}

export function boxVolume(
  length: number,
  width: number,
  height: number,
): number {
  return cm3ToLiters(length * width * height);
}

export function cylinderVolume(diameter: number, height: number): number {
  return cm3ToLiters((Math.PI / 4) * diameter ** 2 * height);
}

export function sphereVolume(diameter: number): number {
  return cm3ToLiters((Math.PI / 6) * diameter ** 3);
}

export function halfSphereVolume(diameter: number): number {
  return cm3ToLiters((Math.PI / 12) * diameter ** 3);
}
