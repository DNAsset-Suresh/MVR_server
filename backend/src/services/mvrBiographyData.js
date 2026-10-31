/**
 * Official MVR (Madurai V. Ramakrishnan) Biography Knowledge Base.
 * Primary source for all MVR personal and professional profile inquiries.
 * Organized into 13 searchable categories preserving original Tamil wording,
 * dates, institutions, achievements, and awards.
 */

export const MVR_BIOGRAPHY_KNOWLEDGE = {
  person: {
    fullNameTamil: 'மதுரை வெ. இராமகிருஷ்ணன்',
    fullNameEnglish: 'Madurai V. Ramakrishnan',
    shortName: 'MVR',
    dateOfBirth: '29 ஜூலை 1987 (29 July 1987)',
    hometownTamil: 'மதுரை',
    hometownEnglish: 'Madurai, Tamil Nadu',
    rolesTamil: [
      'தன்னம்பிக்கைப் பேச்சாளர்',
      'ஊக்கமூட்டும் பேச்சாளர்',
      'வாழ்வியல் ஆலோசகர் (Life Counselor)',
      'எழுத்தாளர்',
      'தமிழ் ஆய்வாளர்',
      'திரைத்துறைப் பாடலாசிரியர்',
      'சமூகச் செயல்பாட்டாளர்'
    ],
    rolesEnglish: [
      'Motivational Speaker',
      'Life Counselor',
      'Author & Writer',
      'Tamil Researcher',
      'Film Lyricist',
      'Social Activist'
    ]
  },

  categories: {
    // 1. Personal Profile & Overview
    personal_profile: {
      id: 'personal_profile',
      titleTamil: 'சுயவிவரம்',
      titleEnglish: 'Personal Profile',
      summaryTamil: 'மதுரை வெ. இராமகிருஷ்ணன் (பிறப்பு: 29 ஜூலை 1987) மதுரையைச் சேர்ந்த முன்னணித் தன்னம்பிக்கை பேச்சாளர், ஊக்கமூட்டும் பேச்சாளர், வாழ்வியல் ஆலோசகர் (Life Counselor), எழுத்தாளர், தமிழ் ஆய்வாளர், திரைத்துறைப் பாடலாசிரியர் மற்றும் சமூகச் செயல்பாட்டாளர் ஆவார். மனிதர்களின் சிந்தனைகளை மேம்படுத்தும் நோக்கில் பன்முகத்தன்மையுடன் இயங்கி வருகிறார்.',
      summaryEnglish: 'Madurai V. Ramakrishnan (MVR, born 29 July 1987) from Madurai is a prominent motivational speaker, life counselor, author, Tamil researcher, film lyricist, and social activist working across multiple dimensions to empower human thinking and life perspective.'
    },

    // 2. Date of Birth and Hometown
    birth_and_hometown: {
      id: 'birth_and_hometown',
      titleTamil: 'பிறந்த தேதியும் சொந்த ஊரும்',
      titleEnglish: 'Date of Birth & Hometown',
      summaryTamil: 'மதுரை வெ. இராமகிருஷ்ணன் அவர்கள் 1987-ஆம் ஆண்டு ஜூலை 29 அன்று பிறந்தார். இவரது சொந்த ஊர் தமிழகத்தின் பண்பாட்டுத் தலைநகரான மதுரை ஆகும்.',
      summaryEnglish: 'Madurai V. Ramakrishnan was born on July 29, 1987. His hometown is Madurai, Tamil Nadu, India.',
      dateOfBirth: '29 ஜூலை 1987 (July 29, 1987)',
      hometown: 'மதுரை (Madurai)'
    },

    // 3. Educational Background
    education: {
      id: 'education',
      titleTamil: 'கல்விப் பின்னணி',
      titleEnglish: 'Educational Background',
      summaryTamil: 'பள்ளிப்படிப்பு: மதுரை, திருப்பரங்குன்றத்தில் உள்ள முத்து தேவர் முக்குலத்தோர் மேல்நிலைப்பள்ளி. கல்லூரிப்படிப்பு: மதுரை கல்லூரியில் கணினிப் பயன்பாட்டியல் துறையில் இளங்கலைப் பட்டம் (Bachelor of Computer Applications - BCA).',
      summaryEnglish: 'Schooling: Muthu Thevar Mukkulathor Higher Secondary School, Thirupparankundram, Madurai. College: Bachelor of Computer Applications (BCA) from The Madura College, Madurai.',
      schoolTamil: 'முத்து தேவர் முக்குலத்தோர் மேல்நிலைப்பள்ளி, திருப்பரங்குன்றம், மதுரை',
      schoolEnglish: 'Muthu Thevar Mukkulathor Higher Secondary School, Thirupparankundram, Madurai',
      collegeTamil: 'மதுரை கல்லூரி (The Madura College), கணினிப் பயன்பாட்டியல் துறை இளங்கலைப் பட்டம் (BCA)',
      collegeEnglish: 'The Madura College, Bachelor of Computer Applications (BCA)'
    },

    // 4. Professional Career & Objectives
    career: {
      id: 'career',
      titleTamil: 'பணி மற்றும் நோக்கங்கள்',
      titleEnglish: 'Professional Career & Objectives',
      summaryTamil: 'மாணவர்கள், இளைஞர்கள் மற்றும் பொதுமக்களின் ஆளுமை வளர்ச்சி, பேச்சுத்திறன் மேம்பாடு, அறநெறி விழிப்புணர்வு, வாசிப்புப் பழக்க வளர்ச்சி மற்றும் தமிழ்மொழி மேம்பாட்டிற்காகத் தொடர்ந்து அர்ப்பணிப்புடன் பணியாற்றி வருகிறார். பலரது வாழ்வியலில் நேர்மறை மாற்றங்களை உருவாக்கி, விழிப்புணர்வை ஏற்படுத்தி வருகிறார்.',
      summaryEnglish: 'He works with dedication towards personality development, public speaking enhancement, moral awareness, reading habit cultivation, and Tamil language enrichment for students, youth, and the general public, instilling positive life transformations.'
    },

    // 5. Motivational Speaking & Life Counselling
    speaking_and_counselling: {
      id: 'speaking_and_counselling',
      titleTamil: 'தன்னம்பிக்கைப் பேச்சும் வாழ்வியல் ஆலோசனையும்',
      titleEnglish: 'Motivational Speaking & Life Counselling',
      summaryTamil: 'முன்னணித் தன்னம்பிக்கை பேச்சாளராகவும், வாழ்வியல் ஆலோசகராகவும் (Life Counselor) விளங்கும் இவர், 500-க்கும் மேற்பட்ட தன்னம்பிக்கை மற்றும் ஊக்கமூட்டும் உரைகளை நிகழ்த்தியுள்ளார். 100-க்கும் மேற்பட்ட பட்டிமன்றங்களில் நடுவராகச் செயல்பட்டுள்ளார்.',
      summaryEnglish: 'As a premier motivational speaker and Life Counselor, he has delivered over 500 motivational and inspiring addresses, and presided over 100+ Pattimandram (debate shows) as moderator and judge.'
    },

    // 6. Television Appearances
    television: {
      id: 'television',
      titleTamil: 'தொலைக்காட்சிப் பயணம்',
      titleEnglish: 'Television Appearances',
      summaryTamil: 'விஜய் தொலைக்காட்சியின் பிரபலமான நகைச்சுவை நிகழ்ச்சியான ‘கலக்கப் போவது யாரு’ (சீசன் 2 - 2006) மூலம் சிறந்த போட்டியாளராக (Star Performer) வலம் வந்தார். சன் தொலைக்காட்சியின் ‘அசத்தப் போவது யாரு’ நிகழ்ச்சியிலும் பங்கேற்றுத் தனது நகைச்சுவை மற்றும் மேடைப் பேச்சுத் திறனை வெளிப்படுத்தினார். விஜய் டிவி மற்றும் சன் டிவியின் பல்வேறு சிறப்பு நிகழ்ச்சிகளில் பங்கேற்றுள்ளார். தற்போது சன் நெட்வொர்க்கில் முதன்மைத் தன்னம்பிக்கை பேச்சாளராகப் பங்கெடுத்து வருகிறார்.',
      summaryEnglish: "Television Journey: Gained widespread acclaim as Star Performer on Vijay TV's hit show 'Kalakka Povadhu Yaaru' (Season 2 - 2006, won 'Comedy King'). Participated in Sun TV's 'Asathap Povadhu Yaaru' (won 'Asathal Mannan'). Featured in numerous special programs on Vijay TV and Sun TV; currently a prominent motivational speaker across Sun Network.",
      shows: [
        { name: 'Kalakka Povadhu Yaaru (Season 2 - 2006)', network: 'Vijay TV', role: 'Star Performer & Comedy King' },
        { name: 'Asathap Povadhu Yaaru', network: 'Sun TV', role: 'Participant & Asathal Mannan' },
        { name: 'Special Motivational Programs', network: 'Sun Network', role: 'Motivational Speaker' }
      ]
    },

    // 7. International Speaking Engagements
    international: {
      id: 'international',
      titleTamil: 'சர்வதேச அரங்குகள் மற்றும் மேடைப் பேச்சுகள்',
      titleEnglish: 'International Speaking Engagements',
      summaryTamil: 'மலேசியா, இலங்கை, லண்டன், துபாய் உள்ளிட்ட பல நாடுகளுக்குச் சென்று, அங்குள்ள தமிழ் அமைப்புகளின் அழைப்பின் பேரில் சிறப்புரையாற்றியுள்ளார்.',
      summaryEnglish: 'Delivered featured motivational addresses upon special invitation by Tamil organizations across Malaysia, Sri Lanka, London (UK), and Dubai (UAE), among other nations.',
      countriesTamil: ['மலேசியா', 'இலங்கை', 'லண்டன்', 'துபாய்'],
      countriesEnglish: ['Malaysia', 'Sri Lanka', 'London (United Kingdom)', 'Dubai (United Arab Emirates)']
    },

    // 8. Books and Literary Works
    books: {
      id: 'books',
      titleTamil: 'வெளியான நூல்கள்',
      titleEnglish: 'Books & Literary Works',
      summaryTamil: 'எழுத்து மற்றும் இலக்கியத்தின் மீது கொண்ட ஆழ்ந்த ஈடுபாட்டால் இவர் எழுதியுள்ள நூல்கள்: 1. Oru Nimidak Kadhai (Paagam-1), 2. Oru Nimidak Kadhai (Paagam-2), 3. Oru Nimidak Kavithai, 4. Kaathirungal Kaadhalippom, 5. Kadhaippoma, 6. Vizhumun Ezhumin.',
      summaryEnglish: 'Authored books by Madurai V. Ramakrishnan: 1. Oru Nimidak Kadhai (Part 1), 2. Oru Nimidak Kadhai (Part 2), 3. Oru Nimidak Kavithai, 4. Kaathirungal Kaadhalippom, 5. Kadhaippoma, and 6. Vizhumun Ezhumin.',
      bookList: [
        'Oru Nimidak Kadhai (Paagam-1)',
        'Oru Nimidak Kadhai (Paagam-2)',
        'Oru Nimidak Kavithai',
        'Kaathirungal Kaadhalippom',
        'Kadhaippoma',
        'Vizhumun Ezhumin'
      ],
      bookListTamil: [
        'ஒரு நிமிடக் கதை (பாகம் 1)',
        'ஒரு நிமிடக் கதை (பாகம் 2)',
        'ஒரு நிமிடக் கவிதை',
        'காத்திருங்கள் காதலிப்போம்',
        'கதைப்போமா',
        'விழுமுன் எழுமின்'
      ]
    },

    // 9. Film Lyric-Writing Contributions
    film_lyrics: {
      id: 'film_lyrics',
      titleTamil: 'திரைத்துறைப் பாடலாசிரியர் பங்களிப்பு',
      titleEnglish: 'Film Lyric-Writing Contributions',
      summaryTamil: 'தனது இலக்கியத் திறனை விரிவுபடுத்தும் வகையில் தமிழ் திரையுலகின் முன்னணி இசையமைப்பாளர்களின் திரைப்படங்களுக்குப் பாடல்களை எழுதும் பாடலாசிரியராகவும் தனது கலைப்பயணத்தைத் தொடர்ந்து வருகிறார்.',
      summaryEnglish: 'Expanding his literary talents into Tamil cinema, he actively writes film lyrics for leading music composers in the Tamil film industry.'
    },

    // 10. Major Achievements
    achievements: {
      id: 'achievements',
      titleTamil: 'முக்கிய சாதனைகள்',
      titleEnglish: 'Major Achievements',
      summaryTamil: '1. 1,200-க்கும் மேற்பட்ட ஒரு நிமிடக் கதைகள் படைத்துள்ளார். 2. 500-க்கும் மேற்பட்ட தன்னம்பிக்கை மற்றும் ஊக்கமூட்டும் உரைகள் நிகழ்த்தியுள்ளார். 3. 100-க்கும் மேற்பட்ட பட்டிமன்றங்களில் நடுவராகச் செயல்பட்டுள்ளார்.',
      summaryEnglish: 'Key career milestones: 1. Created over 1,200 one-minute stories. 2. Delivered more than 500 motivational speeches. 3. Moderated and judged over 100 Pattimandram (debate shows).',
      milestones: [
        { count: '1,200+', labelTamil: 'ஒரு நிமிடக் கதைகள்', labelEnglish: 'One-Minute Stories Authored' },
        { count: '500+', labelTamil: 'தன்னம்பிக்கை மற்றும் ஊக்கமூட்டும் உரைகள்', labelEnglish: 'Motivational Speeches' },
        { count: '100+', labelTamil: 'பட்டிமன்ற நடுவர் நிகழ்வுகள்', labelEnglish: 'Pattimandram Debate Shows Judged' }
      ]
    },

    // 11. Social Service and Eedhal Foundation
    social_service: {
      id: 'social_service',
      titleTamil: 'சமூகப் பணிகள் மற்றும் ஈதல் அறக்கட்டளை',
      titleEnglish: 'Social Service & Eedhal Foundation',
      summaryTamil: 'ஈதல் அறக்கட்டளை மூலம் தினமும் ஊராட்சி ஒன்றிய தூய்மைப் பணியாளர்களுக்கு மதிய உணவு வழங்கி வருகிறார். மேலும் தமிழகத்தின் பழமையான திருக்கோயில்களின் பாதுகாப்பு மற்றும் மறுசீரமைப்புப் பணிகளில் தீவிரமாக ஈடுபட்டு வருகிறார்.',
      summaryEnglish: 'Through Eedhal Foundation, he provides daily noon meals to Panchayat union sanitation workers. He is also actively dedicated to the protection and restoration of ancient temples across Tamil Nadu.',
      foundationTamil: 'ஈதல் அறக்கட்டளை - ஊராட்சி ஒன்றிய தூய்மைப் பணியாளர்களுக்கு தினசரி மதிய உணவு',
      foundationEnglish: 'Eedhal Foundation - Daily midday meals provided to Panchayat union sanitation workers'
    },

    // 12. Temple Preservation Activities
    temple_preservation: {
      id: 'temple_preservation',
      titleTamil: 'பாரம்பரியக் காப்பு மற்றும் திருக்கோயில் திருப்பணி',
      titleEnglish: 'Temple Heritage & Preservation Activities',
      summaryTamil: 'பாரம்பரியக் காப்பு: தமிழகத்தின் பழமையான திருக்கோயில்களின் பாதுகாப்பு மற்றும் மறுசீரமைப்புப் பணிகளில் தொடர்ந்து தீவிரமாக ஈடுபட்டு வருகிறார்.',
      summaryEnglish: 'Heritage Preservation: Actively and continuously committed to the conservation, protection, and restoration of ancient historic temples across Tamil Nadu.'
    },

    // 13. Awards and Recognition
    awards: {
      id: 'awards',
      titleTamil: 'விருதுகளும் அங்கீகாரங்களும்',
      titleEnglish: 'Awards & Recognition',
      summaryTamil: 'விருதுகள்: தமிழ்மாமணி (தமிழ் வளர்ச்சித் துறை), காமெடி கிங் (விஜய் டிவி கலக்கப் போவது யாரு), அசத்தல் மன்னன் (சன் டிவி அசத்தப் போவது யாரு), தமிழ் இளவல் (சங்கரா டிவி நெட்வொர்க்), தமிழ்த் தென்றல் (துபாய் எமிட்டா - EMITAA), 60 நொடி அரசன் (மதுரை ஓம் சாதனா நிறுவனம்), இளைய பாரதி (சேலம் ஏ.வி.எஸ் கல்வி நிறுவனம்), தமிழ் நதி (அகமதாபாத் தமிழ்ச் சங்கம்), தமிழ்க் கற்பகத்தரு (திருப்பரங்குன்றம் முத்துத்தேவர் முக்குலத்தோர் பள்ளி).',
      summaryEnglish: 'Conferred awards: Tamil Maamani (Tamil Development Department), Comedy King (Vijay TV KPY), Asathal Mannan (Sun TV APY), Tamil Ilaval (Sankara TV Network), Tamil Thendral (EMITAA, Dubai), 60 Nodi Arasan (Om Sadhana, Madurai), Ilaya Bharathi (AVS Educational Institutions, Salem), Tamil Nadhi (Ahmedabad Tamil Sangam), and Tamil Karpagatharu (Muthu Thevar Mukkulathor School, Thirupparankundram).',
      awardsList: [
        {
          nameTamil: 'தமிழ்மாமணி',
          nameEnglish: 'Tamil Maamani',
          conferredByTamil: 'தமிழ் வளர்ச்சித் துறை',
          conferredByEnglish: 'Tamil Development Department, Government of Tamil Nadu'
        },
        {
          nameTamil: 'காமெடி கிங்',
          nameEnglish: 'Comedy King',
          conferredByTamil: 'விஜய் தொலைக்காட்சி (‘கலக்கப் போவது யாரு’ நிகழ்ச்சி)',
          conferredByEnglish: "Vijay TV ('Kalakka Povadhu Yaaru' Season 2)"
        },
        {
          nameTamil: 'அசத்தல் மன்னன்',
          nameEnglish: 'Asathal Mannan',
          conferredByTamil: 'சன் தொலைக்காட்சி (‘அசத்தப் போவது யாரு’ நிகழ்ச்சி)',
          conferredByEnglish: "Sun TV ('Asathap Povadhu Yaaru')"
        },
        {
          nameTamil: 'தமிழ் இளவல்',
          nameEnglish: 'Tamil Ilaval',
          conferredByTamil: 'சங்கரா டிவி நெட்வொர்க்',
          conferredByEnglish: 'Sankara TV Network'
        },
        {
          nameTamil: 'தமிழ்த் தென்றல்',
          nameEnglish: 'Tamil Thendral',
          conferredByTamil: 'துபாய் எமிட்டா (EMITAA) அமைப்பு',
          conferredByEnglish: 'EMITAA Organization, Dubai'
        },
        {
          nameTamil: '60 நொடி அரசன்',
          nameEnglish: '60 Nodi Arasan (King of 60 Seconds)',
          conferredByTamil: 'மதுரை ஓம் சாதனா நிறுவனம்',
          conferredByEnglish: 'Om Sadhana Institution, Madurai'
        },
        {
          nameTamil: 'இளைய பாரதி',
          nameEnglish: 'Ilaya Bharathi',
          conferredByTamil: 'சேலம் ஏ.வி.எஸ் (AVS) கல்வி நிறுவனம்',
          conferredByEnglish: 'AVS Educational Institutions, Salem'
        },
        {
          nameTamil: 'தமிழ் நதி',
          nameEnglish: 'Tamil Nadhi',
          conferredByTamil: 'அகமதாபாத் தமிழ்ச் சங்கம்',
          conferredByEnglish: 'Ahmedabad Tamil Sangam'
        },
        {
          nameTamil: 'தமிழ்க் கற்பகத்தரு',
          nameEnglish: 'Tamil Karpagatharu',
          conferredByTamil: 'திருப்பரங்குன்றம் முத்துத்தேவர் முக்குலத்தோர் கல்வி நிலையப் பள்ளி',
          conferredByEnglish: 'Muthu Thevar Mukkulathor Educational Institution School, Thirupparankundram'
        }
      ]
    }
  },

  contactForUnlistedInfo: {
    tamil: 'வழங்கப்பட்ட அதிகாரப்பூர்வ சுயவிவரத்தில் இந்தத் தகவல் இடம்பெறவில்லை. கூடுதல் தகவல்கள் அல்லது சிறப்பு நிகழ்வு ஒருங்கிணைப்புகளுக்கு, தயவுசெய்து எங்கள் அதிகாரப்பூர்வ ஒருங்கிணைப்பு அலுவலகத்தை (inquiry@inspireup.com / +91 (0) 44 2000 0000) தொடர்பு கொள்ளவும் அல்லது இணையதளத்தின் #contact பகுதிக்குச் செல்லவும்.',
    english: 'This information is not included in the supplied official profile of Madurai V. Ramakrishnan. For further inquiries or speaker coordination, please reach out to the official speaker desk via email (inquiry@inspireup.com), phone (+91 (0) 44 2000 0000), or visit the #contact section.'
  }
};

/**
 * Natural language intent matching and fact retrieval for MVR biography queries.
 * Supports Tamil, English, and Tanglish queries.
 *
 * @param {object} params
 * @param {string} params.query - User query text
 * @param {string} [params.category] - Explicit category if known
 * @param {string} [params.language] - 'ta-IN' or 'en-US'
 * @returns {object} Retrieved fact and conversational response
 */
export function queryMvrBiography({ query, category = null, language = 'ta-IN' }) {
  const text = (query || '').toLowerCase().trim();
  const cats = MVR_BIOGRAPHY_KNOWLEDGE.categories;

  // 1. Check if query is asking who to contact for information not in the profile
  if (
    text.includes('who should i contact') ||
    text.includes('who to contact') ||
    text.includes('contact for information not included') ||
    text.includes('contact for unlisted') ||
    text.includes('not included in this biography') ||
    text.includes('profile does not contain') ||
    text.includes('யாரைத் தொடர்பு கொள்வது') ||
    text.includes('தகவல் இல்லையென்றால் யாரை') ||
    text.includes('யாரை தொடர்பு கொள்ள வேண்டும்')
  ) {
    return {
      success: true,
      category: 'contact_unlisted',
      facts: MVR_BIOGRAPHY_KNOWLEDGE.contactForUnlistedInfo,
      replyTamil: MVR_BIOGRAPHY_KNOWLEDGE.contactForUnlistedInfo.tamil,
      replyEnglish: MVR_BIOGRAPHY_KNOWLEDGE.contactForUnlistedInfo.english,
      replyTanglish: 'Indha thagaval MVR official profile-la kidaikkavillai. Kooduthal thagavallukku inquiry@inspireup.com alladhu +91 44 2000 0000 moolam official coordination desk-ai contact seyyalam.',
      text: language === 'en-US' ? MVR_BIOGRAPHY_KNOWLEDGE.contactForUnlistedInfo.english : MVR_BIOGRAPHY_KNOWLEDGE.contactForUnlistedInfo.tamil
    };
  }

  // 2. Identify Category
  let detectedCategory = category;

  if (!detectedCategory) {
    // Education: school, college, BCA, Muthu Thevar, study, studied
    if (
      text.includes('கல்வி') ||
      text.includes('படித்த') ||
      text.includes('பள்ளி') ||
      text.includes('கல்லூரி') ||
      text.includes('படிப்பு') ||
      text.includes('education') ||
      text.includes('study') ||
      text.includes('studied') ||
      text.includes('qualification') ||
      text.includes('degree') ||
      text.includes('bca') ||
      text.includes('college') ||
      text.includes('school') ||
      text.includes('padich') ||
      text.includes('kalvi')
    ) {
      detectedCategory = 'education';
    }
    // Books: books, novel, published, ezhuthina, written, nimidak kadhai, vizhumun
    else if (
      text.includes('புத்தகம்') ||
      text.includes('புத்தகங்கள்') ||
      text.includes('நூல்') ||
      text.includes('நூல்கள்') ||
      text.includes('எழுதிய') ||
      text.includes('படைப்பு') ||
      text.includes('book') ||
      text.includes('books') ||
      text.includes('author') ||
      text.includes('written') ||
      text.includes('ezhuth') ||
      text.includes('oru nimidak') ||
      text.includes('vizhumun') ||
      text.includes('kadhaippoma')
    ) {
      detectedCategory = 'books';
    }
    // Awards: awards, recognition, virudhu, patta, honors, comedy king, tamil maamani
    else if (
      text.includes('விருது') ||
      text.includes('விருதுகள்') ||
      text.includes('பட்டம்') ||
      text.includes('பட்டங்கள்') ||
      text.includes('அங்கீகாரம்') ||
      text.includes('award') ||
      text.includes('awards') ||
      text.includes('honors') ||
      text.includes('recognition') ||
      text.includes('virudhu') ||
      text.includes('viruthu') ||
      text.includes('kidaich')
    ) {
      detectedCategory = 'awards';
    }
    // Social service / Eedhal Foundation
    else if (
      text.includes('சமூக சேவை') ||
      text.includes('சமூகப் பணி') ||
      text.includes('சமூகப் பணிகள்') ||
      text.includes('ஈதல்') ||
      text.includes('அறக்கட்டளை') ||
      text.includes('தூய்மைப் பணியாளர்') ||
      text.includes('மதிய உணவு') ||
      text.includes('social service') ||
      text.includes('social work') ||
      text.includes('eedhal') ||
      text.includes('foundation') ||
      text.includes('charity') ||
      text.includes('sanitation worker') ||
      text.includes('sevai')
    ) {
      detectedCategory = 'social_service';
    }
    // Temple preservation
    else if (
      text.includes('திருக்கோயில்') ||
      text.includes('கோயில்') ||
      text.includes('கோவில்') ||
      text.includes('மறுசீரமைப்பு') ||
      text.includes('பாரம்பரியக் காப்பு') ||
      text.includes('பாரம்பரியம்') ||
      text.includes('temple') ||
      text.includes('temples') ||
      text.includes('heritage') ||
      text.includes('preservation') ||
      text.includes('restoration') ||
      text.includes('koyil') ||
      text.includes('kovil')
    ) {
      detectedCategory = 'temple_preservation';
    }
    // Television appearances: KPY, Vijay TV, Sun TV, APY, TV shows
    else if (
      text.includes('தொலைக்காட்சி') ||
      text.includes('டிவி') ||
      text.includes('கலக்கப் போவது யாரு') ||
      text.includes('அசத்தப் போவது யாரு') ||
      text.includes('television') ||
      text.includes('tv') ||
      text.includes('show') ||
      text.includes('shows') ||
      text.includes('kpy') ||
      text.includes('apy') ||
      text.includes('vijay tv') ||
      text.includes('sun tv') ||
      text.includes('sun network')
    ) {
      detectedCategory = 'television';
    }
    // International speeches: foreign, abroad, Malaysia, London, Dubai, Sri Lanka
    else if (
      text.includes('சர்வதேச') ||
      text.includes('வெளிநாடு') ||
      text.includes('மலேசியா') ||
      text.includes('இலங்கை') ||
      text.includes('லண்டன்') ||
      text.includes('துபாய்') ||
      text.includes('international') ||
      text.includes('abroad') ||
      text.includes('countries') ||
      text.includes('malaysia') ||
      text.includes('sri lanka') ||
      text.includes('london') ||
      text.includes('dubai') ||
      text.includes('foreign')
    ) {
      detectedCategory = 'international';
    }
    // Film lyrics: lyricist, lyrics, song, songs, cinema, music, thirai
    else if (
      text.includes('திரை') ||
      text.includes('பாடலாசிரியர்') ||
      text.includes('பாடல்') ||
      text.includes('lyricist') ||
      text.includes('lyrics') ||
      text.includes('song') ||
      text.includes('songs') ||
      text.includes('cinema') ||
      text.includes('film') ||
      text.includes('music composer') ||
      text.includes('paadal')
    ) {
      detectedCategory = 'film_lyrics';
    }
    // Achievements / Records / Milestones
    else if (
      text.includes('சாதனை') ||
      text.includes('சாதனைகள்') ||
      text.includes('முக்கிய சாதனைகள்') ||
      text.includes('achievement') ||
      text.includes('achievements') ||
      text.includes('milestone') ||
      text.includes('milestones') ||
      text.includes('record') ||
      text.includes('records') ||
      text.includes('sadhana') ||
      text.includes('saadhanai')
    ) {
      detectedCategory = 'achievements';
    }
    // Date of birth / Hometown
    else if (
      text.includes('பிறந்த தேதி') ||
      text.includes('பிறந்தநாள்') ||
      text.includes('எப்போது பிறந்தார்') ||
      text.includes('சொந்த ஊர்') ||
      text.includes('ஊர்') ||
      text.includes('birthday') ||
      text.includes('birth date') ||
      text.includes('date of birth') ||
      text.includes('born') ||
      text.includes('dob') ||
      text.includes('hometown') ||
      text.includes('pirandha') ||
      text.includes('sontha ooru')
    ) {
      detectedCategory = 'birth_and_hometown';
    }
    // Career / Objectives / Speaking / Mission
    else if (
      text.includes('நோக்கம்') ||
      text.includes('பணி') ||
      text.includes('ஆளுமை') ||
      text.includes('career') ||
      text.includes('mission') ||
      text.includes('counselor') ||
      text.includes('counselling') ||
      text.includes('profession')
    ) {
      detectedCategory = 'career';
    }
    // General overview / Who is MVR / Personal profile
    else if (
      text.includes('who is mvr') ||
      text.includes('who is madurai v ramakrishnan') ||
      text.includes('who is') ||
      text.includes('mvr யார்') ||
      text.includes('யார் இவர்') ||
      text.includes('இராமகிருஷ்ணன் பற்றி') ||
      text.includes('mvr பற்றி') ||
      text.includes('mvr pathi') ||
      text.includes('mvr profile') ||
      text.includes('about mvr') ||
      text.includes('tell me about mvr') ||
      text.includes('tell me about madurai v. ramakrishnan') ||
      text.includes('tell me about madurai v ramakrishnan') ||
      text.includes('profile') ||
      text.includes('mvr')
    ) {
      detectedCategory = 'personal_profile';
    }
  }

  // If still unclassified and asking about unverified personal trivia (e.g. net worth, family, car, salary)
  if (!detectedCategory) {
    const unverifiedKeywords = ['salary', 'income', 'net worth', 'wife', 'family', 'children', 'வருமானம்', 'சொத்து', 'மனைவி', 'குடும்பம்'];
    const isUnverified = unverifiedKeywords.some((k) => text.includes(k)) || /\b(car|cars|vehicle|house)\b/i.test(text);
    if (isUnverified) {
      return {
        success: true,
        category: 'unverified_info',
        availableInProfile: false,
        replyTamil: 'மன்னிக்கவும், வழங்கப்பட்ட அதிகாரப்பூர்வ சுயவிவரத்தில் இந்தத் தகவல் இடம்பெறவில்லை. MVR அவர்களின் கல்வி, நூல்கள், உரைகள், தொலைக்காட்சிப் பயணம், விருதுகள் மற்றும் சமூகப் பணிகள் குறித்த அதிகாரப்பூர்வ விவரங்களை மட்டுமே நான் வழங்க முடியும்.',
        replyEnglish: 'I apologize, but this information is not available in the supplied official profile of Madurai V. Ramakrishnan. I can answer questions regarding his education, published books, keynote speeches, TV appearances, awards, and social services.',
        replyTanglish: 'Mannikkavum, indha thagaval supplied official MVR profile-la illa. MVR education, books, speeches, TV shows, awards mattrum social service pathi mattumae ennal thagaval thara mudiyum.',
        text: language === 'en-US'
          ? 'This information is not available in the supplied official profile of Madurai V. Ramakrishnan.'
          : 'மன்னிக்கவும், வழங்கப்பட்ட அதிகாரப்பூர்வ சுயவிவரத்தில் இந்தத் தகவல் இடம்பெறவில்லை.'
      };
    }

    // Default to concise personal profile overview
    detectedCategory = 'personal_profile';
  }

  const categoryData = cats[detectedCategory] || cats.personal_profile;

  // 3. Formulate conversational, natural responses
  let replyTamil = '';
  let replyEnglish = '';
  let replyTanglish = '';

  switch (detectedCategory) {
    case 'personal_profile': {
      replyTamil = 'மதுரை வெ. இராமகிருஷ்ணன் அவர்கள் மதுரையைச் சேர்ந்த முன்னணித் தன்னம்பிக்கைப் பேச்சாளர், வாழ்வியல் ஆலோசகர் (Life Counselor), எழுத்தாளர், தமிழ் ஆய்வாளர், திரைப்பாடலாசிரியர் மற்றும் சமூகச் செயல்பாட்டாளர் ஆவார். மாணவர்கள் மற்றும் இளைஞர்களின் ஆளுமை வளர்ச்சி, பேச்சுத்திறன் மேம்பாடு மற்றும் அறநெறி விழிப்புணர்வை ஏற்படுத்தி வருகிறார்.';
      replyEnglish = 'Madurai V. Ramakrishnan (MVR) from Madurai is a leading motivational speaker, life counselor, author, Tamil researcher, film lyricist, and social activist. He actively empowers students and youth through leadership, oratory excellence, and positive mindsets.';
      replyTanglish = 'Madurai V. Ramakrishnan (MVR) Madurai-ai serndha leading motivational speaker, life counselor, author, Tamil researcher, film lyricist mattrum social activist aavaar.';
      break;
    }

    case 'birth_and_hometown': {
      replyTamil = 'மதுரை வெ. இராமகிருஷ்ணன் அவர்கள் 1987-ஆம் ஆண்டு ஜூலை 29 அன்று பிறந்தார். இவரது சொந்த ஊர் மதுரை ஆகும்.';
      replyEnglish = 'Madurai V. Ramakrishnan was born on July 29, 1987, and his hometown is Madurai, Tamil Nadu.';
      replyTanglish = 'MVR 29 July 1987-il pirandhaar. Avaroda sontha ooru Madurai.';
      break;
    }

    case 'education': {
      replyTamil = 'MVR அவர்களின் பள்ளிப்படிப்பு மதுரை, திருப்பரங்குன்றத்தில் உள்ள முத்து தேவர் முக்குலத்தோர் மேல்நிலைப்பள்ளியில் அமைந்தது. கல்லூரிப்படிப்பாக, மதுரை கல்லூரியில் கணினிப் பயன்பாட்டியல் துறையில் இளங்கலைப் பட்டம் (BCA) பெற்றுள்ளார்.';
      replyEnglish = 'His educational background includes schooling at Muthu Thevar Mukkulathor Higher Secondary School in Thirupparankundram, Madurai, followed by a Bachelor of Computer Applications (BCA) degree from The Madura College, Madurai.';
      replyTanglish = 'MVR Thirupparankundram Muthu Thevar Mukkulathor Melnilaipalliyil school padithaar. Madurai College-il Computer Applications thuraiyil BCA pattap padippu mudithullaar.';
      break;
    }

    case 'career': {
      replyTamil = 'மாணவர்கள், இளைஞர்கள் மற்றும் பொதுமக்களின் ஆளுமை வளர்ச்சி, பேச்சுத்திறன் மேம்பாடு, அறநெறி விழிப்புணர்வு, வாசிப்புப் பழக்க வளர்ச்சி மற்றும் தமிழ்மொழி மேம்பாட்டிற்காகத் தொடர்ந்து அர்ப்பணிப்புடன் செயலாற்றி வருகிறார்.';
      replyEnglish = 'His career is dedicated to fostering personality development, public speaking skills, moral consciousness, reading habits, and Tamil language enrichment among students and youth, inspiring lasting life transformations.';
      replyTanglish = 'MVR students mattrum youth-oda personality development, speaking skills, moral awareness, reading habits mattrum Tamil mozhi valarchikaaga thodarnthu panipuriya koodiya dedicated motivational leader aavaar.';
      break;
    }

    case 'speaking_and_counselling': {
      replyTamil = 'தன்னம்பிக்கைப் பேச்சாளராகவும் வாழ்வியல் ஆலோசகராகவும் 500-க்கும் மேற்பட்ட ஊக்கமூட்டும் உரைகளை நிகழ்த்தியுள்ளார். மேலும் 100-க்கும் மேற்பட்ட பட்டிமன்றங்களில் நடுவராகச் செயல்பட்டுள்ளார்.';
      replyEnglish = 'As a premier motivational speaker and life counselor, he has delivered over 500 inspirational addresses and served as judge and moderator for more than 100 Pattimandram debate shows.';
      replyTanglish = 'Motivational speaker mattrum life counselor aana MVR 500-kkum merpatta speeches deliver pannirukkar, mattrum 100-kkum merpatta Pattimandram shows-la judge-a seyalpattullaar.';
      break;
    }

    case 'television': {
      replyTamil = 'விஜய் டிவியின் ‘கலக்கப் போவது யாரு’ (சீசன் 2 - 2006) நிகழ்ச்சியில் Star Performer-ஆகப் பங்கேற்று ‘காமெடி கிங்’ பட்டம் பெற்றார். சன் டிவியின் ‘அசத்தப் போவது யாரு’ மூலம் ‘அசத்தல் மன்னன்’ பட்டம் வென்றார். தற்போது சன் நெட்வொர்க்கில் முதன்மைத் தன்னம்பிக்கை பேச்சாளராகப் பங்கெடுத்து வருகிறார்.';
      replyEnglish = "On television, he rose to prominence on Vijay TV's 'Kalakka Povadhu Yaaru' (Season 2 - 2006) as Star Performer and Comedy King, and Sun TV's 'Asathap Povadhu Yaaru' winning Asathal Mannan. He currently appears as a primary motivational speaker on Sun Network.";
      replyTanglish = 'Vijay TV-in "Kalakka Povadhu Yaaru" (Season 2 - 2006) la Star Performer aagi "Comedy King" virudhu petraar. Sun TV "Asathap Povadhu Yaaru" la "Asathal Mannan" pattai petraar. Ippothu Sun Network-la leading motivational speaker-a irukkaar.';
      break;
    }

    case 'international': {
      replyTamil = 'மலேசியா, இலங்கை, லண்டன், மற்றும் துபாய் உள்ளிட்ட பல நாடுகளுக்குச் சென்று, அங்குள்ள தமிழ் அமைப்புகளின் அழைப்பின் பேரில் சிறப்புரையாற்றியுள்ளார்.';
      replyEnglish = 'He has traveled to and delivered featured speeches in several international countries including Malaysia, Sri Lanka, London (UK), and Dubai (UAE) upon invitation from Tamil community organizations.';
      replyTanglish = 'Malaysia, Sri Lanka, London, mattrum Dubai ulpada pala naadugalukku sendru Tamil amaippugalin azhaippin peril sirappurai aatriyullaar.';
      break;
    }

    case 'books': {
      replyTamil = 'MVR அவர்கள் எழுதியுள்ள நூல்கள்: 1. ஒரு நிமிடக் கதை (பாகம் 1), 2. ஒரு நிமிடக் கதை (பாகம் 2), 3. ஒரு நிமிடக் கவிதை, 4. காத்திருங்கள் காதலிப்போம், 5. கதைப்போமா, மற்றும் 6. விழுமுன் எழுமின்.';
      replyEnglish = 'According to the supplied MVR profile, his published books include: Oru Nimidak Kadhai (Parts 1 and 2), Oru Nimidak Kavithai, Kaathirungal Kaadhalippom, Kadhaippoma, and Vizhumun Ezhumin.';
      replyTanglish = 'MVR ezhuthiya nungall: Oru Nimidak Kadhai (Paagam 1 & 2), Oru Nimidak Kavithai, Kaathirungal Kaadhalippom, Kadhaippoma, mattrum Vizhumun Ezhumin.';
      break;
    }

    case 'film_lyrics': {
      replyTamil = 'தமிழ் திரையுலகின் முன்னணி இசையமைப்பாளர்களின் திரைப்படங்களுக்குப் பாடல்களை எழுதும் பாடலாசிரியராகவும் தனது இலக்கியப் பயணத்தைத் தொடர்ந்து வருகிறார்.';
      replyEnglish = 'Extending his literary craft into Tamil cinema, he writes film lyrics for songs composed by leading music directors in the Tamil film industry.';
      replyTanglish = 'Tamil cinema-vil leading music directors-in thiraip padangalukku paadalgal ezhuthum thiraippaadalaasiriyar-aagavum thagazhndhu varugiraar.';
      break;
    }

    case 'achievements': {
      replyTamil = 'முக்கிய சாதனைகள்: 1,200-க்கும் மேற்பட்ட ஒரு நிமிடக் கதைகள் படைத்துள்ளார், 500-க்கும் மேற்பட்ட தன்னம்பிக்கை மற்றும் ஊக்கமூட்டும் உரைகள் நிகழ்த்தியுள்ளார், மற்றும் 100-க்கும் மேற்பட்ட பட்டிமன்றங்களில் நடுவராகச் செயல்பட்டுள்ளார்.';
      replyEnglish = 'His major achievements include creating over 1,200 one-minute stories, delivering more than 500 motivational speeches, and judging over 100 Pattimandram debate sessions.';
      replyTanglish = 'Mukkiya saadhanaigal: 1,200-kkum merpatta oru nimidak kadhaigal ezhudhiyullaar, 500-kkum merpatta motivational speeches deliver pannirukkar, mattrum 100-kkum merpatta Pattimandram-la naduvaraaga irundhirukkar.';
      break;
    }

    case 'social_service': {
      replyTamil = 'ஈதல் அறக்கட்டளை மூலம் தினமும் ஊராட்சி ஒன்றிய தூய்மைப் பணியாளர்களுக்கு மதிய உணவு வழங்கி வருகிறார். மேலும் தமிழகத்தின் பழமையான திருக்கோயில்களின் பாதுகாப்பு மற்றும் மறுசீரமைப்புப் பணிகளில் தொடர்ந்து தீவிரமாக ஈடுபட்டு வருகிறார்.';
      replyEnglish = 'Through Eedhal Foundation, he provides daily lunch to Panchayat union sanitation workers. Additionally, he is actively engaged in the protection and restoration of ancient temples across Tamil Nadu.';
      replyTanglish = 'Eedhal Foundation moolam daily Panchayat union thuimai paniyalargalukku mathiya unavu vazhangi varugiraar, mattrum pazhamaiyaana kovilgalin paadhukaappu mattrum restoration panigalil eedupattu varugiraar.';
      break;
    }

    case 'temple_preservation': {
      replyTamil = 'பாரம்பரியக் காப்புப் பணிகளில் தீவிரமாக இயங்கும் இவர், தமிழகத்தின் பழமையான திருக்கோயில்களின் பாதுகாப்பு, தூய்மை மற்றும் மறுசீரமைப்புப் பணிகளில் தொடர்ந்து அர்ப்பணிப்புடன் ஈடுபட்டு வருகிறார்.';
      replyEnglish = 'Dedicated to heritage preservation, he actively and continuously participates in the conservation, protection, and restoration of ancient historic temples across Tamil Nadu.';
      replyTanglish = 'Tamilnattil ulla pazhamaiyaana thirukkovilgalin paadhukaappu mattrum maruseeramaippu panigalil theeviramaaga eedupattu varugiraar.';
      break;
    }

    case 'awards': {
      replyTamil = 'அவர் பெற்ற முக்கிய விருதுகள்: தமிழ்மாமணி (தமிழ் வளர்ச்சித் துறை), காமெடி கிங் (விஜய் டிவி), அசத்தல் மன்னன் (சன் டிவி), தமிழ் இளவல் (சங்கரா டிவி), தமிழ்த் தென்றல் (துபாய் எமிட்டா), 60 நொடி அரசன் (மதுரை ஓம் சாதனா), இளைய பாரதி (சேலம் ஏ.வி.எஸ்), தமிழ் நதி (அகமதாபாத் தமிழ்ச் சங்கம்), மற்றும் தமிழ்க் கற்பகத்தரு (திருப்பரங்குன்றம் பள்ளி).';
      replyEnglish = 'His honors and awards include: Tamil Maamani (Tamil Development Dept), Comedy King (Vijay TV KPY), Asathal Mannan (Sun TV APY), Tamil Ilaval (Sankara TV), Tamil Thendral (EMITAA Dubai), 60 Nodi Arasan (Om Sadhana Madurai), Ilaya Bharathi (AVS Salem), Tamil Nadhi (Ahmedabad Tamil Sangam), and Tamil Karpagatharu (Muthu Thevar Mukkulathor School).';
      replyTanglish = 'Avar petra mukkiya awards: Tamil Maamani (Tamil Valarchi Thurai), Comedy King (Vijay TV), Asathal Mannan (Sun TV), Tamil Ilaval (Sankara TV), Tamil Thendral (Dubai EMITAA), 60 Nodi Arasan (Madurai Om Sadhana), Ilaya Bharathi (Salem AVS), Tamil Nadhi (Ahmedabad), mattrum Tamil Karpagatharu.';
      break;
    }

    default: {
      replyTamil = categoryData.summaryTamil;
      replyEnglish = categoryData.summaryEnglish;
      replyTanglish = categoryData.summaryTamil;
      break;
    }
  }

  // Detect Tanglish query style
  const isTanglishQuery = /^[a-z0-9\s.,'?!-]+$/i.test(query || '') && (
    text.includes('pathi') ||
    text.includes('sollunga') ||
    text.includes('enna') ||
    text.includes('avar') ||
    text.includes('ezhuth') ||
    text.includes('padich') ||
    text.includes('kidaich') ||
    text.includes('ooru') ||
    text.includes('sevai')
  );

  let chosenText = replyTamil;
  if (language === 'en-US') {
    chosenText = replyEnglish;
  } else if (isTanglishQuery) {
    // If visitor asked in Tanglish, reply in Tanglish or Tamil
    chosenText = replyTanglish || replyTamil;
  }

  return {
    success: true,
    category: detectedCategory,
    categoryTitleTamil: categoryData.titleTamil,
    categoryTitleEnglish: categoryData.titleEnglish,
    facts: categoryData,
    replyTamil,
    replyEnglish,
    replyTanglish,
    text: chosenText,
    source: 'Official MVR Biography'
  };
}
