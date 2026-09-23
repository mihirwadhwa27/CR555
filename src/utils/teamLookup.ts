/**
 * Global FRC Team Number and Name Directory
 * Team 1002 CircuitRunners
 */

export interface TeamMetadata {
  name: string;
  city?: string;
  state?: string;
}

export const FRC_TEAM_DIRECTORY: Record<number, TeamMetadata> = {
  1002: { name: 'CircuitRunners', city: 'Marietta', state: 'GA' },
  1771: { name: 'North Gwinnett Robotics', city: 'Suwanee', state: 'GA' },
  1833: { name: 'Screaming Eagles', city: 'Atlanta', state: 'GA' },
  4509: { name: 'Mechanical Bulls', city: 'Suwanee', state: 'GA' },
  4188: { name: 'Columbus Space Program', city: 'Columbus', state: 'GA' },
  1261: { name: 'Robo Lions', city: 'Suwanee', state: 'GA' },
  8080: { name: 'Double Zero', city: 'Roswell', state: 'GA' },
  6705: { name: 'Wildcat Robotics', city: 'Dunwoody', state: 'GA' },
  6829: { name: 'VIPER', city: 'Marietta', state: 'GA' },
  3344: { name: 'Oak Mountain Robotics', city: 'Birmingham', state: 'AL' },
  6919: { name: 'The Commodores', city: 'Albany', state: 'GA' },
  3635: { name: 'Flying Decibels', city: 'Atlanta', state: 'GA' },
  1648: { name: 'G3 Robotics', city: 'Atlanta', state: 'GA' },
  4026: { name: 'Decatur Robotics', city: 'Decatur', state: 'GA' },
  1414: { name: 'IHOT (Intelligent Heavy Objects Tracking)', city: 'Atlanta', state: 'GA' },
  4189: { name: 'Charger Robotics', city: 'Columbus', state: 'GA' },
  2974: { name: 'Walton Robotics', city: 'Marietta', state: 'GA' },
  8736: { name: 'G-Force', city: 'Gwinnett', state: 'GA' },
  9477: { name: 'Robotic Rebellion', city: 'Alpharetta', state: 'GA' },
  8866: { name: 'Phoenix', city: 'Duluth', state: 'GA' },
  1746: { name: 'OTTO', city: 'Norcross', state: 'GA' },
  6023: { name: 'Discontinuous Innovation', city: 'Atlanta', state: 'GA' },
  1683: { name: 'Techno Titans', city: 'Johns Creek', state: 'GA' },
  5109: { name: 'Tech-Dawgs', city: 'Canton', state: 'GA' },
  4910: { name: 'East Cobb Robotics', city: 'Marietta', state: 'GA' },
  1102: { name: 'M’Aiken Magic', city: 'Aiken', state: 'SC' },
  832:  { name: 'OSCAR', city: 'Roswell', state: 'GA' },
  1748: { name: 'ElectroEagles', city: 'Norcross', state: 'GA' },
  281:  { name: 'EnTech GreenVillains', city: 'Greenville', state: 'SC' },
  342:  { name: 'Burning Magnetos', city: 'North Charleston', state: 'SC' },
  4451: { name: 'ROBOTZ Garage', city: 'Graniteville', state: 'SC' },
  254:  { name: 'The Cheesy Poofs', city: 'San Jose', state: 'CA' },
  1678: { name: 'Citrus Circuits', city: 'Davis', state: 'CA' },
  1323: { name: 'MadTown Robotics', city: 'Madera', state: 'CA' },
  2056: { name: 'OP Robotics', city: 'Stoney Creek', state: 'ON' },
  118:  { name: 'The Robonauts', city: 'Houston', state: 'TX' },
  1114: { name: 'Simbotics', city: 'St. Catharines', state: 'ON' },
  2910: { name: 'Jack in the Bot', city: 'Mill Creek', state: 'WA' },
  27:   { name: 'Team RUSH', city: 'Clarkston', state: 'MI' },
  33:   { name: 'Killer Bees', city: 'Auburn Hills', state: 'MI' },
  67:   { name: 'The HOT Team', city: 'Highland', state: 'MI' },
  148:  { name: 'Robowranglers', city: 'Greenville', state: 'TX' },
};

export function getTeamName(teamNumber: number): string {
  if (FRC_TEAM_DIRECTORY[teamNumber]) {
    return FRC_TEAM_DIRECTORY[teamNumber].name;
  }
  return `Team ${teamNumber}`;
}

export function getTeamFullInfo(teamNumber: number): string {
  const info = FRC_TEAM_DIRECTORY[teamNumber];
  if (info) {
    const loc = info.city && info.state ? ` (${info.city}, ${info.state})` : '';
    return `${teamNumber} - ${info.name}${loc}`;
  }
  return `Team ${teamNumber}`;
}
