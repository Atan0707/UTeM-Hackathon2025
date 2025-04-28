export interface LocationUI {
    id: string;
    lng: number;
    lat: number;
    name: string;
    description: string;
    imageUrl: string;
    category?: string;
}

export const locations: LocationUI[] = [
    {
        id: 'mahkota parade',
        lng: 102.2497642386984,
        lat: 2.1894375051968415,
        name: 'Mahkota Parade',
        description: 'Shopping Center near Klebang Beach',
        imageUrl: '/images/utem.jpg',
        category: 'Shopping'
    },
    {
        id: 'aeon bandaraya',
        lng: 102.24635890095817,
        lat: 2.214867083728227,
        name: 'Aeon Bandaraya',
        description: 'Shopping Center in Bandaraya Melaka',
        imageUrl: '/images/a-famosa.jpg',
        category: 'Shopping'
    },
    {
        id: 'aeon ayer keroh',
        lng: 102.28238199634038,
        lat: 2.2342510391130403,
        name: 'Aeon Ayer Keroh',
        description: 'Shopping Center in Ayer Keroh',
        imageUrl: '/images/st-pauls.jpg',
        category: 'Shopping'
    },
    {
        id: 'melaka premium outlet',
        lng: 102.20417570047923,
        lat: 2.4436710205321597,
        name: 'Melaka Premium Outlet',
        description: 'Shopping Center in Melaka',
        imageUrl: '/images/christ-church.jpg',
        category: 'Shopping'
    },
    {
        id: 'melaka wonderland',
        lng: 102.29444496458495,
        lat: 2.2809107922639793,
        name: 'Melaka Wonderland',
        description: 'Water Theme Park in Ayer Keroh',
        imageUrl: '/images/jonker-street.jpg',
        category: 'Attraction'
    },
    {
        id: 'zoo melaka',
        lng: 102.29865525564288,
        lat: 2.2765622753900105,
        name: 'Zoo Melaka',
        description: 'Zoo in Ayer Keroh',
        imageUrl: '/images/sultanate-palace.jpg',
        category: 'Attraction'
    },
    {
        id: 'taman buaya & rekreasi melaka',
        lng: 102.29799942119904,
        lat: 2.27718336006831,
        name: 'Taman Buaya & Rekreasi Melaka (Melaka Crocodile & ​​Recreational Park)',
        description: 'Crocodile Park in Ayer Keroh',
        imageUrl: '/images/maritime-museum.jpg',
        category: 'Attraction'
    },
    {
        id: 'a famosa water theme park',
        lng: 102.21270346749017,
        lat: 2.4270136340135995,
        name: 'A Famosa Water Theme Park (Water World)',
        description: 'Water Park in A Famosa',
        imageUrl: '/images/baba-nyonya.jpg',
        category: 'Attraction'
    },
    {
        id: 'menara-taming-sari',
        lng: 102.2489,
        lat: 2.1956,
        name: 'Menara Taming Sari',
        description: 'Revolving tower offering panoramic views of Melaka',
        imageUrl: '/images/taming-sari.jpg',
        category: 'Attraction'
    },
    {
        id: 'melaka-river-cruise',
        lng: 102.2478,
        lat: 2.1958,
        name: 'Melaka River Cruise',
        description: 'Scenic boat ride along the Melaka River',
        imageUrl: '/images/river-cruise.jpg',
        category: 'Attraction'
    },
    {
        id: 'cheng-hoon-teng-temple',
        lng: 102.2472,
        lat: 2.1966,
        name: 'Cheng Hoon Teng Temple',
        description: 'Oldest Chinese temple in Malaysia',
        imageUrl: '/images/cheng-hoon-teng.jpg',
        category: 'Attraction'
    },
    {
        id: 'kampung-kling-mosque',
        lng: 102.2475,
        lat: 2.1968,
        name: 'Kampung Kling Mosque',
        description: 'One of the oldest mosques in Melaka',
        imageUrl: '/images/kampung-kling.jpg',
        category: 'Attraction'
    },
    {
        id: 'st-francis-xavier-church',
        lng: 102.2492,
        lat: 2.1945,
        name: 'St. Francis Xavier Church',
        description: '19th-century Gothic-style church',
        imageUrl: '/images/st-francis.jpg',
        category: 'Attraction'
    },
    {
        id: 'melaka-zoo',
        lng: 102.3167,
        lat: 2.2667,
        name: 'Melaka Zoo',
        description: 'Second largest zoo in Malaysia',
        imageUrl: '/images/melaka-zoo.jpg',
        category: 'Attraction'
    },
    {
        id: 'klebang-beach',
        lng: 102.2000,
        lat: 2.2167,
        name: 'Klebang Beach',
        description: 'Popular beach with coconut shake stalls',
        imageUrl: '/images/klebang-beach.jpg',
        category: 'Attraction'
    },
    {
        id: 'melaka-bird-park',
        lng: 102.3000,
        lat: 2.2500,
        name: 'Melaka Bird Park',
        description: 'Home to various species of birds',
        imageUrl: '/images/bird-park.jpg',
        category: 'Attraction'
    },
    {
        id: 'melaka-wonderland',
        lng: 102.2833,
        lat: 2.2333,
        name: 'Melaka Wonderland',
        description: 'Water theme park in Ayer Keroh',
        imageUrl: '/images/wonderland.jpg',
        category: 'Attraction'
    },
    {
        id: 'melaka-botanical-garden',
        lng: 102.2833,
        lat: 2.2500,
        name: 'Melaka Botanical Garden',
        description: 'Beautiful garden with various plant species',
        imageUrl: '/images/botanical-garden.jpg',
        category: 'Attraction'
    }
]


