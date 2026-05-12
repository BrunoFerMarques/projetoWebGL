import { aircraftState } from './aircraft.js';
import { sunPosition, mercuryPosition, venusPosition } from './planets.js';

function _dist(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

export function checkSunCollision()        { return _dist(aircraftState.position, sunPosition)     < 7;   }
export function checkVenusCollision()      { return _dist(aircraftState.position, venusPosition)   < 4;   }
export function checkMercuryCollision()    { return _dist(aircraftState.position, mercuryPosition) < 3;   }
export function checkBackgroundCollision() { return _dist([0,0,0], aircraftState.position)         > 100; }
