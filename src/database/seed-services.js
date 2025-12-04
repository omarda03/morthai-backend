import dotenv from 'dotenv';
import pool from '../config/database.js';
import { Service } from '../models/Service.js';
import { Categorie } from '../models/Categorie.js';

// Ensure environment variables are loaded
dotenv.config();

/**
 * Convert duration string to minutes
 * @param {string} duration - Duration string like "1h", "1h30", "30min", "2h"
 * @returns {number} Duration in minutes
 */
function parseDuration(duration) {
  if (!duration) return 60; // Default to 1 hour
  
  const durationLower = duration.toLowerCase().trim();
  
  // Handle hours like "1h", "2h"
  const hourMatch = durationLower.match(/^(\d+)h$/);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 60;
  }
  
  // Handle hours and minutes like "1h30", "2h15"
  const hourMinMatch = durationLower.match(/^(\d+)h(\d+)$/);
  if (hourMinMatch) {
    return parseInt(hourMinMatch[1], 10) * 60 + parseInt(hourMinMatch[2], 10);
  }
  
  // Handle minutes like "30min", "45min"
  const minMatch = durationLower.match(/^(\d+)min$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }
  
  // Fallback: try to extract number
  const numberMatch = durationLower.match(/(\d+)/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    // If less than 24, assume minutes, otherwise assume hours
    return num < 24 ? num : num * 60;
  }
  
  return 60; // Default
}

/**
 * Get or create category
 */
async function getOrCreateCategory(nomCategorieFr, nomCategorieEn, nomCategorie) {
  // Try to find existing category
  const existing = await pool.query(
    `SELECT cat_uuid FROM categorie 
     WHERE nomcategorie_fr = $1 OR nomcategorie_en = $2 OR nomcategorie = $3 
     LIMIT 1`,
    [nomCategorieFr, nomCategorieEn, nomCategorie]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].cat_uuid;
  }
  
  // Create new category
  const category = await Categorie.create({
    NomCategorie: nomCategorie,
    NomCategorieFr: nomCategorieFr,
    NomCategorieEn: nomCategorieEn,
  });
  
  return category.cat_uuid;
}

/**
 * Services data from frontend
 */

// Massages
const massagesData = [
  {
    id: "ancestral-thai-kimono",
    title: { en: "Ancestral Thai in Kimono", fr: "Thaï Ancestral en Kimono" },
    description: {
      en: "Dating back more than 2500 years, traditional Thai massage has its roots in India, Ayurvedic medicine and yoga. Holistic, ancestral and energetic, traditional Thai massage is a source of serenity and inner peace. Practiced lying on a futon, dressed in a kimono and massaged from head to toe, the therapist alternates a sequence of deep pressure on different points and energy lines of your body, stretching postures of your muscles and Yoga techniques to release any form of tension accumulated by your body. The intensity of the moves adapts perfectly to your preferences to provide you with absolute relaxation. The benefits of Thai massage are felt almost immediately. It recovers the body's natural vitality, removes blockages and muscular tensions and improves blood circulation in your body.",
      fr: "Remontant à plus de 2500 ans, le massage thaïlandais traditionnel a ses racines en Inde, dans la médecine ayurvédique et le yoga. Holistique, ancestral et énergétique, le massage thaï traditionnel est une source de sérénité et de paix intérieure. Pratiqué allongé sur un futon, vêtu d'un kimono et massé de la tête aux pieds, le thérapeute alterne une séquence de pressions profondes sur différents points et lignes énergétiques de votre corps, des postures d'étirement de vos muscles et des techniques de yoga pour libérer toute forme de tension accumulée. L'intensité des mouvements s'adapte parfaitement à vos préférences pour vous offrir une relaxation absolue. Les bénéfices du massage thaï se font sentir presque immédiatement. Il récupère la vitalité naturelle du corps, supprime les blocages et tensions musculaires et améliore la circulation sanguine."
    },
    availability: [
      { duration: "1h", price: 530, priceEUR: 53 },
      { duration: "1h30", price: 730, priceEUR: 73 },
      { duration: "2h", price: 930, priceEUR: 93 },
    ],
    mainImage: "/massages/1.webp",
  },
  {
    id: "thai-energy-harmony",
    title: { en: "Thai Energy Harmony", fr: "Harmonie Énergétique Thaï" },
    description: {
      en: "Our Thai massage with organic aromatic oils involves direct contact with your skin. The therapist alternates fluid movements, deep pressures which stimulate your body's energy lines and points with gentle tapping and smooth muscle stretching. The oils used during the massage nourish, hydrate and tone your skin leaving a smooth and relaxing therapeutic effect. Our selection of oil differs depending on the season. To give you perfect comfort, hot oils are used during the cold season and normal oils are used in summer. The combination of scents in the essential oils with calming, purifying and therapeutic properties ensures the absolute relaxation and wellness created by your Thai massage.",
      fr: "Notre massage thaï avec des huiles aromatiques biologiques implique un contact direct avec votre peau. Le thérapeute alterne les mouvements fluides, les pressions profondes qui stimulent vos lignes énergétiques et vos points avec des tapotements doux et un étirement musculaire lisse. Les huiles utilisées pendant le massage nourrissent, hydratent et tonifient votre peau, laissant un effet thérapeutique lisse et relaxant. Notre sélection d'huile varie selon les saisons. Pour vous offrir un confort parfait, les huiles chaudes sont utilisées pendant la saison froide et les huiles normales en été. La combinaison des parfums dans les huiles essentielles aux propriétés apaisantes, purifiantes et thérapeutiques assure la relaxation absolue et le bien-être créés par votre massage thaï."
    },
    availability: [
      { duration: "1h", price: 580, priceEUR: 58 },
      { duration: "1h30", price: 820, priceEUR: 82 },
      { duration: "2h", price: 1020, priceEUR: 102 },
    ],
    mainImage: "/massages/2.jpg",
  },
  {
    id: "healing-anti-stress-signature",
    title: { en: "Healing Anti-Stress Touch | MorThai Signature", fr: "Toucher Anti-Stress Curatif | Signature MorThai" },
    description: {
      en: "For a unique sensory experience, we have created our Signature Massage. This Thai therapeutic treatment is practised with essential oils and homemade pain relief balm made from medicinal plants from Thailand. In this magical and therapeutic ritual, we invite you to experience a variety of aromatic and emotional sensation. From head to toe, the therapist will identify areas of tension, focussing on releasing them. She will also practice fluid and harmonious moves, helping you disconnect both physically and mentally. This massage relieves sore muscles and joint pains, improving blood circulation, bringing immediate muscle relaxation and well-being.",
      fr: "Pour une expérience sensorielle unique, nous avons créé notre Massage Signature. Ce traitement thérapeutique thaï est pratiqué avec des huiles essentielles et un baume antidouleur fait maison fabriqué à partir de plantes médicinales de Thaïlande. Dans ce rituel magique et thérapeutique, nous vous invitons à expérimenter une variété de sensations aromatiques et émotionnelles. De la tête aux pieds, le thérapeute identifiera les zones de tension, en se concentrant sur leur libération. Il pratiquera également des mouvements fluides et harmonieux, vous aidant à vous déconnecter physiquement et mentalement. Ce massage soulage les muscles endoloris et les douleurs articulaires, améliore la circulation sanguine, apportant une relaxation musculaire immédiate et un bien-être."
    },
    availability: [
      { duration: "1h", price: 630, priceEUR: 63 },
      { duration: "1h30", price: 870, priceEUR: 87 },
      { duration: "2h", price: 1070, priceEUR: 107 },
    ],
    mainImage: "/massages/3.jpg",
  },
  {
    id: "cradle-of-palms",
    title: { en: "Cradle of Palms", fr: "Berceau des Paumes" },
    description: {
      en: "During the anti-stress relaxing massage, the therapist's movements, music and aromas are harmoniously combined to offer a luxurious relaxation in a cloud of sensory natural oils! This massage combines celestial happiness, deep muscle relaxation, magical aromatherapy and nourishing skin care. It is a gentle and relaxing massage creating a complete harmony of body and mind.",
      fr: "Pendant le massage anti-stress relaxant, les mouvements du thérapeute, la musique et les arômes sont harmonieusement combinés pour offrir une relaxation luxueuse dans un nuage d'huiles naturelles sensorielles ! Ce massage combine le bonheur céleste, la relaxation musculaire profonde, l'aromathérapie magique et les soins de la peau nourrissants. C'est un massage doux et relaxant créant une harmonie complète du corps et de l'esprit."
    },
    availability: [
      { duration: "1h", price: 580, priceEUR: 58 },
      { duration: "1h30", price: 820, priceEUR: 82 },
      { duration: "2h", price: 1020, priceEUR: 102 },
    ],
    mainImage: "/massages/4.jpg",
  },
  {
    id: "secret-medicinal-herbs-kalasin",
    title: { en: "Secret of Medicinal Herbs from Kalasin", fr: "Secret des Herbes Médicinales de Kalasin" },
    description: {
      en: "The traditional Thai massage with hot herbal pads is an ancient therapy from Thailand. The miraculous pads contain a collection of Thai traditional herbs. Heated with steam and applied to the body, the medicinal herbs release their active ingredients and beneficial aromas. The combined effect of heat with the natural benefits of the herbs relieves your body's pain significantly, removes muscular tensions and improves blood circulation. This massage helps treat stress, those with health problems or painful muscles.",
      fr: "Le massage thaï traditionnel avec des coussinets aux herbes chaudes est une ancienne thérapie de Thaïlande. Les coussinets miraculeux contiennent une collection d'herbes thaïlandaises traditionnelles. Chauffées à la vapeur et appliquées sur le corps, les herbes médicinales libèrent leurs ingrédients actifs et arômes bénéfiques. L'effet combiné de la chaleur avec les bénéfices naturels des herbes soulage considérablement la douleur de votre corps, élimine les tensions musculaires et améliore la circulation sanguine. Ce massage aide à traiter le stress, les problèmes de santé ou les muscles douloureux."
    },
    availability: [
      { duration: "1h", price: 930, priceEUR: 93 },
      { duration: "1h30", price: 1150, priceEUR: 115 },
    ],
    mainImage: "/massages/5.jpg",
  },
  {
    id: "mum-to-be-sacred-moment",
    title: { en: "Mum to be Sacred Moment", fr: "Moment Sacré Maman à Venir" },
    description: {
      en: "During pregnancy, you look forward to experience the joy of being a MUM. But the pain and discomfort worries you. Our pregnancy massage will help you minimize these feelings during this time, relieving back, ankle and leg tension. For this massage, we use natural, odourless and hypoallergenic oils to saturate your skin with nutrients, alleviating the appearance of stretch marks.",
      fr: "Pendant la grossesse, vous attendez avec impatience d'expérimenter la joie d'être MAMAN. Mais la douleur et l'inconfort vous préoccupent. Notre massage pour la grossesse vous aidera à minimiser ces sentiments pendant cette période, soulageant les tensions du dos, des chevilles et des jambes. Pour ce massage, nous utilisons des huiles naturelles, inodores et hypoallergéniques pour saturer votre peau de nutriments, réduisant l'apparence des vergetures."
    },
    availability: [
      { duration: "1h", price: 620, priceEUR: 62 },
      { duration: "1h30", price: 870, priceEUR: 87 },
    ],
    mainImage: "/massages/6.jpg",
  },
  {
    id: "balinese-escape",
    title: { en: "Balinese Escape", fr: "Échappée Balinaise" },
    description: {
      en: "Dive into a unique sensory journey with our Balinese massage in Marrakech, an ancestral ritual blending gentleness and energy. Inspired by traditions from Bali, it combines deep pressure, gentle stretches, and fluid movements to restore balance to both body and mind. Perfect for releasing muscle tension, stimulating blood circulation and achieving deep relaxation, this treatment transports you to an exotic and revitalizing experience in the heart of Marrakech.",
      fr: "Plongez dans un voyage sensoriel unique avec notre massage balinais à Marrakech, un rituel ancestral mélangeant douceur et énergie. Inspiré par les traditions de Bali, il combine pression profonde, étirements doux et mouvements fluides pour restaurer l'équilibre du corps et de l'esprit. Parfait pour libérer les tensions musculaires, stimuler la circulation sanguine et atteindre une relaxation profonde, ce traitement vous transporte vers une expérience exotique et revitalisante au cœur de Marrakech."
    },
    availability: [
      { duration: "1h", price: 580, priceEUR: 58 },
      { duration: "1h30", price: 820, priceEUR: 82 },
      { duration: "2h", price: 1020, priceEUR: 102 },
    ],
    mainImage: "/massages/7.jpg",
  },
  {
    id: "sculpted-silhouette",
    title: { en: "Sculpted Silhouette", fr: "Silhouette Sculptée" },
    description: {
      en: "At Mor Thai Marrakech, not only can you immerse yourself in an atmosphere of relaxation and pleasure, you can also benefit from a corrective massage to maintain an ideal body shape and a sculpted, smooth silhouette. Furthermore, with the therapist's deep palpating, rolling movement, together with a mixture of natural oils will help to drain fat, stimulate lymphatic circulation, eliminate toxins, improve skin elasticity and reduce cellulite significantly. At the end of this treatment you will feel an incredible sensation of lightness and a pleasant relaxation.",
      fr: "Chez Mor Thai Marrakech, non seulement vous pouvez vous immerger dans une atmosphère de relaxation et de plaisir, mais vous pouvez également bénéficier d'un massage correctif pour maintenir une forme corporelle idéale et une silhouette sculptée et lisse. De plus, avec les mouvements profonds de palpation et de roulement du thérapeute, associés à un mélange d'huiles naturelles, cela aidera à drainer la graisse, stimuler la circulation lymphatique, éliminer les toxines, améliorer l'élasticité de la peau et réduire considérablement la cellulite. À la fin de ce traitement, vous ressentirez une sensation incroyable de légèreté et une agréable relaxation."
    },
    availability: [
      { duration: "30min", price: 400, priceEUR: 40 },
      { duration: "1h", price: 680, priceEUR: 68 },
    ],
    mainImage: "/massages/8.jpg",
  },
  {
    id: "sports-muscle-revival",
    title: { en: "Sports Muscle Revival", fr: "Revitalisation Musculaire Sportive" },
    description: {
      en: "After a sports session, a long walk or intense physical effort, muscle pain is inevitable. Mor Thai Marrakech offers you a magical ritual which can help rejuvenate your muscles. This massage is practiced by working the muscles deeply, it quickly restores muscle performance, relieve pain and significantly increase your physical endurance. This treatment is relaxing, energizing and detoxifying. The effects of this massage can be beneficial before, during or after a competition to prepare the muscles, to prevent injuries, to reduce muscular tension and relax your body to recover more quickly. After pampering your body, the desire to aim for new victories will be irresistible!",
      fr: "Après une séance de sport, une longue marche ou un effort physique intense, la douleur musculaire est inévitable. Mor Thai Marrakech vous offre un rituel magique qui peut aider à rajeunir vos muscles. Ce massage est pratiqué en travaillant les muscles en profondeur, il restaure rapidement la performance musculaire, soulage la douleur et augmente considérablement votre endurance physique. Ce traitement est relaxant, énergisant et détoxifiant. Les effets de ce massage peuvent être bénéfiques avant, pendant ou après une compétition pour préparer les muscles, prévenir les blessures, réduire les tensions musculaires et détendre votre corps pour une récupération plus rapide. Après avoir dorloté votre corps, l'envie de viser de nouvelles victoires sera irrésistible !"
    },
    availability: [
      { duration: "1h", price: 600, priceEUR: 60 },
      { duration: "1h30", price: 850, priceEUR: 85 },
    ],
    mainImage: "/massages/9.jpg",
  },
  {
    id: "thai-four-hands-symphony",
    title: { en: "Thai Four Hands Symphony", fr: "Symphonie Thaï à Quatre Mains" },
    description: {
      en: "Pamper yourself and get the most out of the Thai massage experience by choosing the Four-hands massage. Two expert therapists, trained and experienced in performing this massage, carry out perfectly synchronized movements with identical pressure. A magical multi-sensory massage combining the properties of essential oils, relaxing music and the deep harmonized movements, take you on a journey of absolute serenity and ultimate freedom.",
      fr: "Dorlotez-vous et profitez au maximum de l'expérience du massage thaï en choisissant le massage à quatre mains. Deux thérapeutes experts, formés et expérimentés dans la pratique de ce massage, effectuent des mouvements parfaitement synchronisés avec une pression identique. Un massage multisensoriel magique combinant les propriétés des huiles essentielles, la musique relaxante et les mouvements profonds harmonisés, vous emmène dans un voyage de sérénité absolue et de liberté ultime."
    },
    availability: [{ duration: "1h", price: 1020, priceEUR: 102 }],
    mainImage: "/massages/10.jpg",
  },
  {
    id: "foot-reflexology",
    title: { en: "Foot Reflexology", fr: "Réflexologie Plantaire" },
    description: {
      en: "Inspired by an ancestral therapy originating from oriental medicine, foot reflexology involves stimulating reflex zones on the soles of the feet, which correspond to the main organs of the body. With an extremely careful touch, our therapist locates the areas of tension and helps to restore balance to the corresponding area of body. This magical technique helps to release stress, eliminates nervous tension and improve blood circulation, providing you with complete relaxation of body and mind.",
      fr: "Inspirée par une thérapie ancestrale originaire de la médecine orientale, la réflexologie plantaire implique de stimuler les zones réflexes sur la plante des pieds, qui correspondent aux principaux organes du corps. Avec un toucher extrêmement attentif, notre thérapeute localise les zones de tension et aide à rétablir l'équilibre dans la zone correspondante du corps. Cette technique magique aide à libérer le stress, élimine les tensions nerveuses et améliore la circulation sanguine, vous offrant une relaxation complète du corps et de l'esprit."
    },
    availability: [
      { duration: "30min", price: 350, priceEUR: 35 },
      { duration: "1h", price: 580, priceEUR: 58 },
    ],
    mainImage: "/massages/11.jpg",
  },
  {
    id: "head-neck-tension-release",
    title: { en: "Head & Neck Tension Release", fr: "Libération des Tensions Tête & Cou" },
    description: {
      en: "At Mor Thai, we offer you the ideal head massage. Our aim is to provide you with the much-needed break with intense pleasure you deserve. Our therapist's expert hands perform a set of smooth and harmonious moves to the head to give you a feeling of deep, inner relaxation. Beyond its effectiveness for people who suffer from migraine or headaches, this massage guarantees good blood stimulation, helping release accumulated tension and providing therapeutic pain relief.",
      fr: "Chez Mor Thai, nous vous offrons le massage de tête idéal. Notre objectif est de vous fournir la pause tant attendue avec le plaisir intense que vous méritez. Les mains expertes de notre thérapeute effectuent une série de mouvements lisses et harmonieux sur la tête pour vous donner une sensation de relaxation profonde et intérieure. Au-delà de son efficacité pour les personnes souffrant de migraines ou de maux de tête, ce massage garantit une bonne stimulation du sang, aide à libérer les tensions accumulées et fournit un soulagement douloureux thérapeutique."
    },
    availability: [
      { duration: "30min", price: 350, priceEUR: 35 },
      { duration: "1h", price: 580, priceEUR: 58 },
    ],
    mainImage: "/massages/12.jpg",
  },
  {
    id: "back-shoulders-therapy",
    title: { en: "Back & Shoulders Therapy", fr: "Thérapie Dos & Épaules" },
    description: {
      en: "Because of our accelerated lifestyle, the back becomes knotted and the shoulders become heavy. We suggest you experience an ultimate unrivalled moment with our specialist Back and Shoulder massage, relieving accumulated tension along the vertebral axis. An extremely relaxing massage to remove Back and Shoulder pain, specially relieving the discomfort experienced by those often sitting at desk, thus boosting the body's energy.",
      fr: "En raison de notre mode de vie accéléré, le dos devient noué et les épaules deviennent lourdes. Nous vous suggérons de vivre un moment ultime sans égal avec notre massage spécialisé du dos et des épaules, soulagant les tensions accumulées le long de l'axe vertébral. Un massage extrêmement relaxant pour éliminer la douleur du dos et des épaules, soulageant spécialement l'inconfort ressenti par ceux qui sont souvent assis à un bureau, renforçant ainsi l'énergie du corps."
    },
    availability: [
      { duration: "30min", price: 380, priceEUR: 38 },
      { duration: "1h", price: 630, priceEUR: 63 },
    ],
    mainImage: "/massages/13.jpg",
  },
  {
    id: "little-angel",
    title: { en: "Little Angel (2-10 years)", fr: "Petit Ange (2-10 ans)" },
    description: {
      en: "At Mor Thai, we never stop thinking about the well-being of each of our guests, even the youngest ones! This is why we have created a massage specially dedicated for kids until 12 years old. The benefits of this massage are countless, ideal to help children to overcome the difficulties they may face. This can be especially helpful during stressful and tense exam periods, offering them moments of relaxation and well-being in a Zen and wonderful environment. The pressure of the therapist's hands are adjusted, the aromatic oils adapted perfectly to their taste, will offer them joy and pleasure. During this massage, the child must be accompanied by a parent. The parent can choose to be pampered too with a pleasant massage or just wait their child while enjoying peace and calm in our lounge. For an unforgettable and intimate experience for the whole family, we have dual or triple cabins where everyone can be massaged next to each other.",
      fr: "Chez Mor Thai, nous ne cessons jamais de penser au bien-être de chacun de nos invités, même les plus jeunes ! C'est pourquoi nous avons créé un massage spécialement dédié aux enfants jusqu'à 12 ans. Les bénéfices de ce massage sont innombrables, idéaux pour aider les enfants à surmonter les difficultés auxquelles ils peuvent être confrontés. Cela peut être particulièrement utile pendant les périodes d'examen stressantes et tendues, leur offrant des moments de relaxation et de bien-être dans un environnement zen et merveilleux. La pression des mains du thérapeute est ajustée, les huiles aromatiques adaptées parfaitement à leur goût, leur offriront de la joie et du plaisir. Pendant ce massage, l'enfant doit être accompagné d'un parent. Le parent peut choisir d'être également dorloté avec un agréable massage ou simplement attendre son enfant en profitant de la paix et du calme dans notre salon. Pour une expérience inoubliable et intime pour toute la famille, nous avons des cabines doubles ou triples où tout le monde peut être massé l'un à côté de l'autre."
    },
    availability: [{ duration: "1h", price: 430, priceEUR: 43 }],
    mainImage: "/massages/14.jpg",
  },
];

// Hammam
const hammamData = [
  {
    id: "hammam-secret-ghassoul",
    title: { en: "Hammam Secret Ghassoul", fr: "Hammam Secret Ghassoul" },
    description: {
      en: "Inspired from the pure Moroccan tradition, it is an authentic ritual of well-being with multiple benefits. It starts with a gentle application of black eucalyptus soap followed by a pleasant body scrub for perfectly cleansed and smooth skin, then the rhassoul enriched with seven aromatic plants making the skin soft and silky, followed by the application of a Thai herbal face mask ideal for refining and brightening the skin texture, afterwards nourishing shampoo and mask with wheat germs is applied, and finally, a soothing shower with a refreshing scent of aloe vera. This ritual brings muscular relaxation and a detoxifying effect which releases the body from its tensions.",
      fr: "Inspiré de la pure tradition marocaine, c'est un rituel authentique de bien-être aux multiples bénéfices. Cela commence par une application douce de savon noir à l'eucalyptus suivie d'un agréable gommage du corps pour une peau parfaitement nettoyée et lisse, puis le rhassoul enrichi de sept plantes aromatiques rendant la peau douce et soyeuse, suivi de l'application d'un masque facial aux herbes thaïlandaises idéal pour affiner et illuminer la texture de la peau, ensuite un shampooing nourrissant et un masque aux germes de blé sont appliqués, et enfin, une douche apaisante au parfum rafraîchissant d'aloe vera. Ce rituel apporte une relaxation musculaire et un effet détoxifiant qui libère le corps de ses tensions."
    },
    options: [
      { optionName: "En Solo", price: 450, priceEUR: 45 },
      { optionName: "En Couple/Amis", price: 800, priceEUR: 80 },
      { optionName: "Parent et Enfant", price: 700, priceEUR: 70 },
    ],
    mainImage: "/hammam/1.webp",
  },
  {
    id: "hammam-atlas-majesty",
    title: { en: "Hammam Atlas Majesty", fr: "Hammam Atlas Majesty" },
    description: {
      en: "A ritual of ultimate well-being, which combines the relaxation of the hammam with the pleasure of a massage. This ritual begins with applying hydrating eucalyptus black soap, followed by a body scrub leaving perfectly cleaned skin, then the rhassoul wrap enriched with seven aromatic plants for soft and smooth skin, after comes the application of nourishing shampoo and mask with wheat germ, then a revitalizing soaping with a mixture of honey and salt. Afterwards this ritual is completed by a relaxing shower.",
      fr: "Un rituel de bien-être ultime, qui combine la relaxation du hammam avec le plaisir d'un massage. Ce rituel commence par l'application du savon noir eucalyptus hydratant, suivi d'un gommage du corps laissant une peau parfaitement propre et hydratée, puis l'enveloppe rhassoul enrichie de sept plantes aromatiques pour une peau douce et lisse, vient ensuite l'application d'un shampooing nourrissant et d'un masque au germe de blé, puis un savonnage revitalisant avec un mélange de miel et de sel. Après cela, ce rituel est complété par une douche relaxante."
    },
    options: [
      { optionName: "En Solo", price: 530, priceEUR: 53 },
      { optionName: "En Couple/Amis", price: 1000, priceEUR: 100 },
      { optionName: "Parent et Enfant", price: 900, priceEUR: 90 },
    ],
    mainImage: "/hammam/2.jpg",
  },
];

// Facial Care
const facialCareData = [
  {
    id: "purity-radiance-facial",
    title: { en: "Purity Radiance Facial", fr: "Facial Pureté Éclat" },
    description: {
      en: "Are you looking for a hydrating and deep cleansing treatment for your face? This purifying face care, combined with the quality of natural cosmetic products from Thailand and the expertise of traditional modeling practiced manually, eliminates effectively dead cells, energizes and hydrates the skin deeply. It all starts with the application of warm compresses to open the pores, then a deep cleansing with virgin coconut oil and rose water to revitalize the skin, followed by a regenerating scrub using a Thai herbal hydrating mask, and to finish peacefully, a relaxing facial massage with a hydrating cream to bring you a soft, smooth and radiant skin and a perfectly relaxed mind.",
      fr: "Recherchez-vous un traitement hydratant et nettoyant en profondeur pour votre visage? Ce soin facial purifiant, associé à la qualité des produits cosmétiques naturels de Thaïlande et à l'expertise du modelage traditionnel pratiqué manuellement, élimine efficacement les cellules mortes, dynamise et hydrate la peau en profondeur. Cela commence par l'application de compresses chaudes pour ouvrir les pores, suivie d'un nettoyage profond à l'huile de noix de coco vierge et à l'eau de rose pour revitaliser la peau, suivi d'un gommage régénérant utilisant un masque hydratant aux herbes thaïlandaises, et pour finir tranquillement, un massage facial relaxant avec une crème hydratante pour vous apporter une peau douce, lisse et radieuse et un esprit parfaitement détendu."
    },
    availability: [
      { duration: "30min", price: 400, priceEUR: 40 },
      { duration: "1h", price: 550, priceEUR: 55 },
    ],
    mainImage: "/facial-care/1.jpg",
  },
  {
    id: "anti-aging-prestige-facial",
    title: { en: "Anti-Aging Prestige Facial", fr: "Facial Anti-Âge Prestige" },
    description: {
      en: "Inspired from Thai beauty rituals, this soothing facial treatment will let yourself be invaded by the delicate fragrances from Thailand's natural cosmetics.It begins with a gentle application of warm compresses on the face to open the pores, followed by a deep cleansing with virgin coconut oil and rose water for perfectly cleansed and hydrated skin, then a gentle exfoliation using a moisturizing and nourishing mask made from Thai cosmetic herbs.Finally an excellent anti-aging facial massage is practiced to target the facial muscles in depth to lift and firm the skin.",
      fr: "Inspiré des rituels de beauté thaïlandais, ce soin du visage apaisant vous transportera au cœur des délicates fragrances des cosmétiques naturels de Thaïlande. Il débute par l'application de compresses chaudes pour ouvrir les pores, suivie d'un nettoyage en profondeur à l'huile de coco vierge et à l'eau de rose pour une peau parfaitement propre et hydratée. Vient ensuite une exfoliation douce grâce à un masque hydratant et nourrissant à base d'herbes médicinales thaïlandaises. Enfin, un excellent massage anti-âge cible les muscles du visage en profondeur pour lifter et raffermir la peau."
    },
    availability: [
      { duration: "1h30", price: 650, priceEUR: 62 },
      { duration: "2h", price: 900, priceEUR: 86 },
      { duration: "2h30", price: 1100, priceEUR: 105 },
    ],
    mainImage: "/facial-care/2.jpg",
  },
];

// Packages
const hammamMassagePackagesData = [
  {
    id: "evasion-journey-senses",
    title: { en: "Evasion - Journey of the Senses Ritual", fr: "Evasion - Rituel du Voyage des Sens" },
    description: {
      en: "30 to 40 minutes of Hammam: Application of moisturizing eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and smoothed skin, then the application of nourishing shampoo and mask with wheat germ, and finally a relaxing shower. Followed by: 60 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).",
      fr: "30 à 40 minutes de Hammam: Application de savon noir eucalyptus hydratant suivi d'un agréable gommage du corps pour une peau parfaitement nettoyée et lissée, puis l'application d'un shampooing nourrissant et d'un masque au germe de blé, et enfin une douche relaxante. Suivi de: 60 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes)."
    },
    options: [
      { optionName: "En Solo", price: 830, priceEUR: 83 },
      { optionName: "Duo", price: 1600, priceEUR: 160 },
    ],
    mainImage: null,
  },
  {
    id: "beyond-time-ritual",
    title: { en: "Beyond Time Ritual", fr: "Rituel Au-Delà du Temps" },
    description: {
      en: "30 to 40 minutes of Hammam: Application of moisturizing eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and smoothed skin, then the application of nourishing shampoo and mask with wheat germ, and finally a relaxing shower. Followed by: 90 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).",
      fr: "30 à 40 minutes de Hammam: Application de savon noir eucalyptus hydratant suivi d'un agréable gommage du corps pour une peau parfaitement nettoyée et lissée, puis l'application d'un shampooing nourrissant et d'un masque au germe de blé, et enfin une douche relaxante. Suivi de: 90 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes)."
    },
    options: [
      { optionName: "En Solo", price: 1030, priceEUR: 103 },
      { optionName: "Duo", price: 2000, priceEUR: 200 },
    ],
    mainImage: null,
  },
  {
    id: "ritual-eternity-within",
    title: { en: "Ritual Eternity Within", fr: "Rituel L'Éternité en Soi" },
    description: {
      en: "45 to 55 minutes of Beldi Hammam: Soft application of eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and soothed skin, then on the body application of rhassoul enriched with seven aromatic plants making the skin soft and silky, on the face a Thai herbal mask is applied—ideal for refining and brightening the skin tone, afterwards nourishing shampoo and mask with wheat germs is gently applied, and finally a relaxing shower with the refreshing scent of aloe vera. Followed by: 60 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).",
      fr: "45 à 55 minutes de Hammam Beldi: Application douce du savon noir eucalyptus suivie d'un agréable gommage du corps pour une peau parfaitement nettoyée et apaisée, puis sur le corps application de rhassoul enrichi de sept plantes aromatiques rendant la peau douce et soyeuse, sur le visage un masque facial aux herbes thaïlandaises est appliqué—idéal pour affiner et illuminer le teint de la peau, ensuite un shampooing nourrissant et un masque aux germes de blé sont doucement appliqués, et enfin une douche relaxante au parfum rafraîchissant d'aloe vera. Suivi de: 60 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes)."
    },
    options: [
      { optionName: "En Solo", price: 930, priceEUR: 93 },
      { optionName: "Duo", price: 1800, priceEUR: 180 },
    ],
    mainImage: null,
  },
  {
    id: "majestic-rebirth-ritual",
    title: { en: "Majestic Rebirth Ritual", fr: "Rituel de la Renaissance Majestueuse" },
    description: {
      en: "45 to 55 minutes of Beldi Hammam: Soft application of eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and soothed skin, then on the body application of rhassoul enriched with seven aromatic plants making the skin soft and silky, on the face a Thai herbal mask is applied—ideal for refining and brightening the skin tone, afterwards nourishing shampoo and mask with wheat germs is gently applied, and finally a relaxing shower with the refreshing scent of aloe vera. Followed by: 90 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).",
      fr: "45 à 55 minutes de Hammam Beldi: Application douce du savon noir eucalyptus suivie d'un agréable gommage du corps pour une peau parfaitement nettoyée et apaisée, puis sur le corps application de rhassoul enrichi de sept plantes aromatiques rendant la peau douce et soyeuse, sur le visage un masque facial aux herbes thaïlandaises est appliqué—idéal pour affiner et illuminer le teint de la peau, ensuite un shampooing nourrissant et un masque aux germes de blé sont doucement appliqués, et enfin une douche relaxante au parfum rafraîchissant d'aloe vera. Suivi de: 90 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes)."
    },
    options: [
      { optionName: "En Solo", price: 1030, priceEUR: 103 },
      { optionName: "Duo", price: 2000, priceEUR: 200 },
    ],
    mainImage: null,
  },
];

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Please make sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database credentials are correct in .env file');
    console.error('3. Database exists and is accessible');
    console.error('\nError details:', error.message);
    return false;
  }
}

/**
 * Seed all services
 */
async function seedServices() {
  try {
    console.log('🌱 Starting services seeding...\n');
    
    // Test database connection first
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      await pool.end().catch(() => {});
      process.exit(1);
    }
    
    console.log('');

    // Create categories
    console.log('📁 Creating categories...');
    const categoryMassages = await getOrCreateCategory(
      'Massages',
      'Massages',
      'Massages'
    );
    console.log('✅ Massages category ready');

    const categoryHammam = await getOrCreateCategory(
      'Hammam',
      'Hammam',
      'Hammam'
    );
    console.log('✅ Hammam category ready');

    const categoryFacial = await getOrCreateCategory(
      'Soin du Visage',
      'Facial Care',
      'Facial Care'
    );
    console.log('✅ Facial Care category ready');

    const categoryPackages = await getOrCreateCategory(
      'Packages',
      'Packages',
      'Packages'
    );
    console.log('✅ Packages category ready\n');

    let createdCount = 0;
    let skippedCount = 0;

    // Seed Massages
    console.log('💆 Seeding Massages...');
    for (const massage of massagesData) {
      try {
        // Check if service already exists
        const existing = await pool.query(
          `SELECT service_uuid FROM service 
           WHERE nomservice_fr = $1 OR nomservice_en = $2`,
          [massage.title.fr, massage.title.en]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipped: ${massage.title.fr} (already exists)`);
          skippedCount++;
          continue;
        }

        // Convert availability to offers format
        const offers = massage.availability.map((avail, index) => ({
          durée: parseDuration(avail.duration),
          prix_mad: avail.price,
          prix_eur: avail.priceEUR || Math.round(avail.price / 10),
        }));

        await Service.create({
          NomServiceFr: massage.title.fr,
          NomServiceEn: massage.title.en,
          DescriptionFr: massage.description.fr,
          DescriptionEn: massage.description.en,
          Images: massage.mainImage ? [massage.mainImage] : [],
          CAT_UUID: categoryMassages,
          Offers: offers,
        });

        console.log(`✅ Created: ${massage.title.fr}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating ${massage.title.fr}:`, error.message);
      }
    }

    // Seed Hammam
    console.log('\n🛁 Seeding Hammam...');
    for (const hammam of hammamData) {
      try {
        const existing = await pool.query(
          `SELECT service_uuid FROM service 
           WHERE nomservice_fr = $1 OR nomservice_en = $2`,
          [hammam.title.fr, hammam.title.en]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipped: ${hammam.title.fr} (already exists)`);
          skippedCount++;
          continue;
        }

        // Convert options to offers format
        // Hammam services: estimate duration based on description
        // "30 to 40 minutes" mentioned in description, use 45min as average
        let hammamDuration = 45; // Average of 30-40 minutes
        
        const offers = hammam.options.map((opt, index) => ({
          durée: hammamDuration,
          prix_mad: opt.price,
          prix_eur: opt.priceEUR || Math.round(opt.price / 10),
        }));

        await Service.create({
          NomServiceFr: hammam.title.fr,
          NomServiceEn: hammam.title.en,
          DescriptionFr: hammam.description.fr,
          DescriptionEn: hammam.description.en,
          Images: hammam.mainImage ? [hammam.mainImage] : [],
          CAT_UUID: categoryHammam,
          Offers: offers,
        });

        console.log(`✅ Created: ${hammam.title.fr}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating ${hammam.title.fr}:`, error.message);
      }
    }

    // Seed Facial Care
    console.log('\n✨ Seeding Facial Care...');
    for (const facial of facialCareData) {
      try {
        const existing = await pool.query(
          `SELECT service_uuid FROM service 
           WHERE nomservice_fr = $1 OR nomservice_en = $2`,
          [facial.title.fr, facial.title.en]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipped: ${facial.title.fr} (already exists)`);
          skippedCount++;
          continue;
        }

        const offers = facial.availability.map((avail, index) => ({
          durée: parseDuration(avail.duration),
          prix_mad: avail.price,
          prix_eur: avail.priceEUR || Math.round(avail.price / 10),
        }));

        await Service.create({
          NomServiceFr: facial.title.fr,
          NomServiceEn: facial.title.en,
          DescriptionFr: facial.description.fr,
          DescriptionEn: facial.description.en,
          Images: facial.mainImage ? [facial.mainImage] : [],
          CAT_UUID: categoryFacial,
          Offers: offers,
        });

        console.log(`✅ Created: ${facial.title.fr}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating ${facial.title.fr}:`, error.message);
      }
    }

    // Seed Packages
    console.log('\n🎁 Seeding Packages...');
    for (const pkg of hammamMassagePackagesData) {
      try {
        const existing = await pool.query(
          `SELECT service_uuid FROM service 
           WHERE nomservice_fr = $1 OR nomservice_en = $2`,
          [pkg.title.fr, pkg.title.en]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipped: ${pkg.title.fr} (already exists)`);
          skippedCount++;
          continue;
        }

        // Packages have options with prices but no explicit duration
        // Extract duration from description: "30 to 40 minutes of Hammam" + "60 min" or "90 min Massage"
        let massageDuration = 60; // Default
        if (pkg.description.en.includes('90 min Massage') || pkg.description.fr.includes('90 min')) {
          massageDuration = 90;
        } else if (pkg.description.en.includes('60 min Massage') || pkg.description.fr.includes('60 min')) {
          massageDuration = 60;
        }
        
        const hammamDuration = 40; // Average from "30 to 40 minutes"
        const totalDuration = hammamDuration + massageDuration;
        
        const offers = pkg.options.map((opt, index) => ({
          durée: totalDuration, // Total package duration (hammam + massage)
          prix_mad: opt.price,
          prix_eur: opt.priceEUR || Math.round(opt.price / 10),
        }));

        await Service.create({
          NomServiceFr: pkg.title.fr,
          NomServiceEn: pkg.title.en,
          DescriptionFr: pkg.description.fr,
          DescriptionEn: pkg.description.en,
          Images: pkg.mainImage ? [pkg.mainImage] : [],
          CAT_UUID: categoryPackages,
          Offers: offers,
        });

        console.log(`✅ Created: ${pkg.title.fr}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating ${pkg.title.fr}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Seeding completed!`);
    console.log(`✅ Created: ${createdCount} services`);
    console.log(`⏭️  Skipped: ${skippedCount} services (already exist)`);
    console.log('='.repeat(50) + '\n');

    // Close database connection
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

// Run seeding
seedServices();

