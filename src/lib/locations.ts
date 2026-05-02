// Australian locations: State → City/Region → Suburbs
// Suburb names are stored as-is (e.g. "Fitzroy") — the UI handles state/city context.

export const LOCATIONS: Record<string, Record<string, string[]>> = {
  ACT: {
    Canberra: [
      "Barton", "Belconnen", "Braddon", "Bruce", "Civic", "Deakin", "Dickson",
      "Fyshwick", "Griffith", "Gungahlin", "Kingston", "Manuka", "Mitchell",
      "Tuggeranong", "Turner", "Weston Creek", "Yarralumla",
    ],
  },
  NSW: {
    Sydney: [
      "Balmain", "Bankstown", "Bondi", "Bondi Junction", "Burwood", "Campbelltown",
      "Castle Hill", "CBD", "Chatswood", "Coogee", "Cronulla", "Darlinghurst",
      "Glebe", "Hornsby", "Hurstville", "Lane Cove", "Liverpool", "Manly",
      "Marrickville", "Mosman", "Newtown", "Parramatta", "Penrith", "Pyrmont",
      "Randwick", "Redfern", "Ryde", "Strathfield", "Surry Hills",
      "Ultimo", "Waterloo",
    ],
    Newcastle: [
      "Broadmeadow", "Charlestown", "Cooks Hill", "Hamilton", "Islington",
      "Jesmond", "Mayfield", "Merewether", "Newcastle CBD", "The Hill", "Wickham",
    ],
    Wollongong: [
      "Bulli", "Corrimal", "Dapto", "Figtree", "Helensburgh", "Thirroul",
      "Warrawong", "Wollongong CBD",
    ],
    "Central Coast": [
      "Bateau Bay", "Erina", "Gosford", "Terrigal", "The Entrance", "Tuggerah", "Wyong",
    ],
  },
  VIC: {
    Melbourne: [
      "Albert Park", "Armadale", "Balaclava", "Box Hill", "Brighton", "Brunswick",
      "Camberwell", "Carlton", "CBD", "Cheltenham", "Clayton", "Collingwood",
      "Dandenong", "Doncaster", "Elsternwick", "Fitzroy", "Flemington", "Footscray",
      "Frankston", "Glen Waverley", "Hawthorn", "Kew", "Malvern", "Moonee Ponds",
      "Mordialloc", "Northcote", "Oakleigh", "Prahran", "Preston", "Richmond",
      "Ringwood", "South Yarra", "Southbank", "St Kilda", "Sunbury",
      "Sunshine", "Toorak", "Werribee", "Windsor",
    ],
    Geelong: [
      "Belmont", "Corio", "Geelong CBD", "Geelong West", "Hamlyn Heights",
      "Highton", "Newtown", "Norlane", "South Geelong",
    ],
    Ballarat: [
      "Alfredton", "Ballarat CBD", "Ballarat East", "Delacombe",
      "Sebastopol", "Wendouree",
    ],
    Bendigo: [
      "Bendigo CBD", "Flora Hill", "Golden Square", "Kangaroo Flat",
      "Long Gully", "Strathdale",
    ],
    Shepparton: ["Mooroopna", "Shepparton CBD", "Shepparton East", "Shepparton North"],
  },
  QLD: {
    Brisbane: [
      "Annerley", "Ashgrove", "Bowen Hills", "Carindale", "CBD", "Chermside",
      "East Brisbane", "Fortitude Valley", "Greenslopes", "Hamilton", "Holland Park",
      "Indooroopilly", "Kangaroo Point", "Kelvin Grove", "Logan", "Milton",
      "Mount Gravatt", "New Farm", "Newstead", "Nundah", "Paddington",
      "South Brisbane", "Spring Hill", "Sunnybank", "Tarragindi", "Toowong",
      "West End", "Windsor", "Woolloongabba",
    ],
    "Gold Coast": [
      "Broadbeach", "Burleigh Heads", "Coolangatta", "Coomera", "Helensvale",
      "Hope Island", "Labrador", "Mudgeeraba", "Nerang", "Robina",
      "Southport", "Surfers Paradise",
    ],
    "Sunshine Coast": [
      "Buderim", "Caloundra", "Coolum Beach", "Kawana Waters", "Maroochydore",
      "Mooloolaba", "Nambour", "Noosa Heads", "Tewantin",
    ],
    Townsville: [
      "Aitkenvale", "Castle Hill", "Hyde Park", "Kirwan",
      "Mundingburra", "North Ward", "Townsville CBD",
    ],
    Cairns: [
      "Bungalow", "Cairns CBD", "Cairns North", "Edge Hill",
      "Manunda", "Parramatta Park", "Westcourt",
    ],
  },
  SA: {
    Adelaide: [
      "Adelaide CBD", "Burnside", "Elizabeth", "Glenelg", "Goodwood",
      "Henley Beach", "Kensington", "Marden", "Marion", "Mitcham",
      "Modbury", "Norwood", "North Adelaide", "Parafield", "Payneham",
      "Port Adelaide", "Prospect", "Salisbury", "St Peters", "Tea Tree Gully",
      "Unley", "Victor Harbor",
    ],
    "Mount Gambier": ["Gambier", "Mount Gambier CBD", "Worrolong"],
  },
  WA: {
    Perth: [
      "Armadale", "Bassendean", "Bayswater", "Belmont", "CBD", "Claremont",
      "Cottesloe", "Fremantle", "Highgate", "Inglewood", "Joondalup",
      "Kalamunda", "Leederville", "Mandurah", "Midland", "Mosman Park",
      "Mount Lawley", "Nedlands", "Northbridge", "Rockingham", "Scarborough",
      "South Perth", "Subiaco", "Swan", "Victoria Park",
    ],
    Bunbury: ["Australind", "Bunbury CBD", "Carey Park", "East Bunbury", "Glen Iris"],
    Geraldton: ["Geraldton CBD", "Rangeway", "Spalding", "Wandina"],
  },
  TAS: {
    Hobart: [
      "Battery Point", "Bellerive", "CBD", "Clarence", "Glenorchy",
      "Hobart CBD", "Huonville", "Kingborough", "New Town",
      "North Hobart", "Sandy Bay", "South Hobart", "West Hobart",
    ],
    Launceston: [
      "Devonport", "Invermay", "Kings Meadows", "Launceston CBD",
      "Mowbray", "Newstead", "Prospect",
    ],
  },
  NT: {
    Darwin: [
      "Casuarina", "Darwin CBD", "Fannie Bay", "Howard Springs",
      "Malak", "Nightcliff", "Palmerston", "Parap", "Rapid Creek", "Stuart Park",
    ],
    "Alice Springs": [
      "Alice Springs CBD", "Braitling", "Gillen", "Larapinta", "Sadadeen",
    ],
  },
};

export const STATE_NAMES: Record<string, string> = {
  ACT: "Australian Capital Territory",
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  SA:  "South Australia",
  WA:  "Western Australia",
  TAS: "Tasmania",
  NT:  "Northern Territory",
};

export const STATES = Object.keys(LOCATIONS) as (keyof typeof LOCATIONS)[];
