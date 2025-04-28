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
        imageUrl: 'https://tourismmelaka.com/wp-content/uploads/2017/11/58_Mahkota-Parade.jpg',
        category: 'Shopping'
    },
    {
        id: 'aeon bandaraya',
        lng: 102.24635890095817,
        lat: 2.214867083728227,
        name: 'Aeon Bandaraya',
        description: 'Shopping Center in Bandaraya Melaka',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Northeastern_side_of_Aeon_Bandaraya_Melaka.JPG/1024px-Northeastern_side_of_Aeon_Bandaraya_Melaka.JPG',
        category: 'Shopping'
    },
    {
        id: 'aeon ayer keroh',
        lng: 102.28238199634038,
        lat: 2.2342510391130403,
        name: 'Aeon Ayer Keroh',
        description: 'Shopping Center in Ayer Keroh',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjw7cgRC3IkdCrJKHqNMzImhk_0cAc12bHgw&s',
        category: 'Shopping'
    },
    {
        id: 'melaka premium outlet',
        lng: 102.20417570047923,
        lat: 2.4436710205321597,
        name: 'Melaka Premium Outlet',
        description: 'Shopping Center in Melaka',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMkrKXmIfP0EruQdW-VSkXmKVAVG9aqcEJmg&s',
        category: 'Shopping'
    },
    {
        id: 'melaka wonderland',
        lng: 102.29444496458495,
        lat: 2.2809107922639793,
        name: 'Melaka Wonderland',
        description: 'Water Theme Park in Ayer Keroh',
        imageUrl: 'https://images.t2u.io/upload/event/listing/0-35554-AWSS38ed7b4c9-681e-44cf-8c3f-55fc6b3351e5-nde3.jpg',
        category: 'Attraction'
    },
    {
        id: 'zoo melaka',
        lng: 102.29865525564288,
        lat: 2.2765622753900105,
        name: 'Zoo Melaka',
        description: 'Zoo in Ayer Keroh',
        imageUrl: 'https://www.zoomelaka.gov.my/_include/img/profile/kepper-talkbaru.jpg',
        category: 'Attraction'
    },
    {
        id: 'taman buaya & rekreasi melaka',
        lng: 102.29799942119904,
        lat: 2.27718336006831,
        name: 'Taman Buaya & Rekreasi Melaka (Melaka Crocodile & ​​Recreational Park)',
        description: 'Crocodile Park in Ayer Keroh',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCUbQfQ92Try7E9Wfgq8ZatSokcLAxJzQGYg&s',
        category: 'Attraction'
    },
    {
        id: 'a famosa water theme park',
        lng: 102.21270346749017,
        lat: 2.4270136340135995,
        name: 'A Famosa Water Theme Park (Water World)',
        description: 'Water Park in A Famosa',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa1cwLF_lXpCh8BUEWcNfnR23JvNwBvp-U9w&s',
        category: 'Attraction'
    },
    {
        id: 'menara-taming-sari',
        lng: 102.2489,
        lat: 2.1956,
        name: 'Menara Taming Sari',
        description: 'Revolving tower offering panoramic views of Melaka',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3MmfxlQi4_DbEL3Hhg_jv-kc5M993opAG3w&s',
        category: 'Attraction'
    },
    {
        id: 'melaka-river-cruise',
        lng: 102.2478,
        lat: 2.1958,
        name: 'Melaka River Cruise',
        description: 'Scenic boat ride along the Melaka River',
        imageUrl: 'https://image.kkday.com/v2/image/get/w_1900%2Cc_fit%2Cq_55/s1.kkday.com/product_103696/20210827105154_XA3rW/jpg',
        category: 'Attraction'
    },
    {
        id: 'cheng-hoon-teng-temple',
        lng: 102.2472,
        lat: 2.1966,
        name: 'Cheng Hoon Teng Temple',
        description: 'Oldest Chinese temple in Malaysia',
        imageUrl: 'https://gowhere.my/wp-content/uploads/2015/10/Cheng-Hoon-Teng-e1445227982909.jpg',
        category: 'Attraction'
    },
    {
        id: 'kampung-kling-mosque',
        lng: 102.2475,
        lat: 2.1968,
        name: 'Kampung Kling Mosque',
        description: 'One of the oldest mosques in Melaka',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLPkmN8xhkzVaCSoQPiQ6VzhwM_-j0SqWi-g&s',
        category: 'Attraction'
    },
    {
        id: 'st-francis-xavier-church',
        lng: 102.2492,
        lat: 2.1945,
        name: 'St. Francis Xavier Church',
        description: '19th-century Gothic-style church',
        imageUrl: 'https://res.klook.com/image/upload/fl_lossy.progressive,w_432,h_288,c_fill,q_85/activities/6bac3ac9-.jpg',
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
        imageUrl: 'https://live.staticflickr.com/3317/5817241491_d935dc0d9a_b.jpg',
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
    },
    {
        id: 'taman-buaya-&-rekreasi-melaka',
        lng: 102.29799942119904,
        lat: 2.27718336006831,
        name: 'Taman Buaya & Rekreasi Melaka',
        description: 'Taman Buaya & Rekreasi Melaka is a recreational park in Melaka',
        imageUrl: '/images/taman-buaya-rekreasi-melaka.jpg',
        category: 'Attraction'
    },
    {
        id: 'a-famosa-water-park',
        lng: 102.21270346749017,
        lat: 2.4270136340135995,
        name: 'A Famosa Water Park',
        description: 'A Famosa Water Park is a water park in Melaka',
        imageUrl: '/images/a-famosa-water-park.jpg',
        category: 'Attraction'
    },
    {
        id: 'pantai-pengkalan-balak',
        lng: 102.06972492126252,
        lat: 2.322167512168488,
        name: 'Pantai Pengkalan Balak',
        description: 'Pantai Pengkalan Balak is a beach in Melaka',
        imageUrl: '/images/pantai-pengkalan-balak.jpg',
        category: 'Attraction'
    },
    {
        id: 'pantai-puteri-melaka',
        lng: 102.137364978482,
        lat: 2.2485077872946335,
        name: 'Pantai Puteri Melaka',
        description: 'Pantai Puteri Melaka is a beach in Melaka',
        imageUrl: '/images/pantai-puteri-melaka.jpg',
        category: 'Attraction'
    },
    {
        id: 'universiti-teknologi-malaysia',
        lng: 102.3211164,
        lat: 2.313839880353972,
        name: 'Universiti Teknologi Malaysia (UTeM)',
        description: 'Universiti Teknologi Malaysia is a university in Melaka',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ84xIQDV6HplnQIi_ZaJ0bexbPdRBAxtU5CQ&s',
        category: 'University'
    },
    {
        id: 'universiti-teknologi-mara-jasin',
        lng: 102.45311550001307,
        lat: 2.221589373920741,
        name: 'Universiti Teknologi MARA (UiTM) Cawangan Jasin',
        description: 'Universiti Teknologi MARA Cawangan Jasin is a university in Melaka',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0s0JmJAYgQjTiC-o5J9hhkGB2OS7julpzbw&s',
        category: 'University'
    },
    {
        id: 'universiti-teknologi-mara-alor-gajah',
        lng: 102.17966728651591,
        lat: 2.3617861789269705,
        name: 'Universiti Teknologi MARA (UiTM) Cawangan Alor Gajah',
        description: 'Universiti Teknologi MARA Cawangan Alor Gajah is a university in Melaka',
        imageUrl: 'https://amiruruitmalorgajah.wordpress.com/wp-content/uploads/2018/07/uitm-melaka.jpg',
        category: 'University'
    },
    {
        id: 'universiti-teknologi-mara-bandaraya-melaka',
        lng: 102.24650639426702,
        lat: 2.2052611598851395,
        name: 'Universiti Teknologi MARA (UiTM) Cawangan Bandaraya Melaka',
        description: 'Universiti Teknologi MARA Cawangan Bandaraya Melaka is a university in Melaka',
        imageUrl: 'https://i.ytimg.com/vi/RzF4VVzwnV8/sddefault.jpg',
        category: 'University'
    },
    {
        id: 'dutch_square_melaka',
        lng: 102.24898609990218,
        lat: 2.194366299993775,
        name: 'Dutch Square (Red Square) Melaka',
        description: 'Dutch Square Melaka is a heritage site in Melaka',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Malacca_stadhuys1.jpg/960px-Malacca_stadhuys1.jpg',
        category: 'Heritage'
    },
    {
        id: 'a_famosa',
        lng: 102.25036511768734,
        lat: 2.1918068407366365,
        name: 'A Famosa',
        description: 'A Famosa is a heritage site in Melaka',
        imageUrl: 'https://onalulu.com/wp-content/uploads/2023/10/A-Famosa.jpg',
        category: 'Heritage'
    },
    {
        id: 'baba_nyonya_heritage_museum',
        lng: 102.24670717116419,
        lat: 2.1953489209612407,
        name: 'Baba & Nyonya Heritage Museum',
        description: 'Baba & Nyonya Heritage Museum is a heritage site in Melaka',
        imageUrl: 'https://www.babanyonyamuseum.com/wp-content/uploads/2024/07/home-facade-cropped.webp',
        category: 'Heritage'
    },
]

// Add this helper function to your data.tsx file
export const getCategoryEmoji = (category?: string): string => {
    switch (category?.toLowerCase()) {
      case 'shopping':
        return '🛍️';
      case 'attraction':
        return '🎡';
      case 'temple':
        return '🛕';
      case 'mosque':
        return '🕌';
      case 'church':
        return '⛪';
      case 'beach':
        return '🏖️';
      case 'theme park':
        return '🎢';
      case 'garden':
        return '🌿';
      case 'historical':
        return '🏛️';
      default:
        return '📍';
    }
  };


