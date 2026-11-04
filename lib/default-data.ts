import {
  INITIAL_STATES,
  INITIAL_DISTRICTS,
  INITIAL_MANDALS,
  StateRecord,
  DistrictRecord,
  MandalRecord,
} from './india-locations';
import { ReporterAccountStatus } from './business-rules';

export interface NewsCategoryRecord {
  id: string;
  slug: string;
  nameEn: string;
  nameTe: string;
  order: number;
  active: boolean;
}

export interface ReporterRecord {
  id: string;
  uid: string;
  reporterId?: string;
  username: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  mandalId: string;
  mandalName: string;
  villageTown: string;
  photoUrl: string;
  status: ReporterAccountStatus;
  rejectionRemarks?: string;
  approvedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ReporterPrivateDocRecord {
  reporterDocId: string;
  uid: string;
  fatherSpouseName: string;
  dob: string;
  whatsappNumber: string;
  email: string;
  residentialAddress: string;
  pinCode: string;
  experience: string;
  previousOrganization: string;
  aadhaarDocUrl: string;
  termsConsent: boolean;
  passwordHash?: string;
  updatedAt: string;
}

export interface NewsRevisionEntry {
  timestamp: string;
  editorName: string;
  action: string;
}

export interface NewsArticleRecord {
  id: string;
  slug: string;
  headline: string;
  subheadline: string;
  content: string;
  categoryId: string;
  categoryName: string;
  scope: 'NATIONAL' | 'INTERNATIONAL' | 'STATE' | 'DISTRICT' | 'MANDAL';
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  mandalId: string;
  mandalName: string;
  villageTown: string;
  featuredImage: string;
  galleryImages: string[];
  imageCaption: string;
  videoUrl: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  language: 'te' | 'en';
  isBreaking: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  views: number;
  reporterId: string;
  reporterName: string;
  authorUid: string;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'UNPUBLISHED';
  rejectionRemarks?: string;
  revisions: NewsRevisionEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisementRecord {
  id: string;
  title: string;
  businessName: string;
  contactNumber: string;
  description: string;
  image1: string;
  image2: string;
  linkUrl: string;
  targetStateId: string;
  targetStateName: string;
  targetDistrictId: string;
  targetDistrictName: string;
  targetMandalId: string;
  targetMandalName: string;
  startDate: string;
  expiryDate: string;
  position: 'HEADER' | 'HOMEPAGE_BANNER' | 'SIDEBAR' | 'ARTICLE_INLINE' | 'FOOTER';
  priceAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'WAIVED';
  reporterId: string;
  reporterName: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';
  createdAt: string;
}

export interface WebsiteSettingsRecord {
  id: string;
  siteNameEn: string;
  siteNameTe: string;
  taglineTe: string;
  domain: string;
  contactEmail: string;
  location: string;
  emergencyContact: string;
  logoUrl: string;
  secondaryLogoUrl?: string;
  logoTextEn: string;
  logoTextTe: string;
  bannerImageUrl: string;
  bannerTitle: string;
  bannerLinkUrl: string;
  bannerEnabled: boolean;
  breakingTickerText: string;
  primaryColor: string;
  secondaryColor: string;
  socialLinks: {
    youtube: string;
    facebook: string;
    twitter: string;
    instagram: string;
    whatsappChannel: string;
    telegram: string;
  };
  aboutUsContent: string;
  contactUsContent: string;
  privacyPolicyContent: string;
  termsContent: string;
  disclaimerContent: string;
  updatedAt: string;
}

export interface AdSenseSettingsRecord {
  id: string;
  enabled: boolean;
  publisherId: string;
  adClientId: string;
  headerSlotId: string;
  homepageSlotId: string;
  articleSlotId: string;
  sidebarSlotId: string;
  footerSlotId: string;
  mobilePlacementEnabled: boolean;
  desktopPlacementEnabled: boolean;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'APPROVAL' | 'REJECTION' | 'EXPIRY_REMINDER' | 'RENEWAL' | 'SYSTEM';
  read: boolean;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorRole: 'SUPER_ADMIN' | 'REPORTER' | 'SYSTEM';
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface MembershipRenewalRecord {
  id: string;
  reporterId: string;
  reporterName: string;
  previousExpiry: string;
  newExpiry: string;
  renewedBy: string;
  remarks: string;
  renewedAt: string;
}

// All 29 Default Categories from Master Project Prompt Section 8
export const INITIAL_CATEGORIES: NewsCategoryRecord[] = [
  { id: 'cat-breaking', slug: 'breaking-news', nameEn: 'Breaking News', nameTe: 'బ్రేకింగ్ న్యూస్', order: 1, active: true },
  { id: 'cat-national', slug: 'national-news', nameEn: 'National News', nameTe: 'జాతీయ వార్తలు', order: 2, active: true },
  { id: 'cat-international', slug: 'international-news', nameEn: 'International News', nameTe: 'అంతర్జాతీయ వార్తలు', order: 3, active: true },
  { id: 'cat-state', slug: 'state-news', nameEn: 'State News', nameTe: 'రాష్ట్ర వార్తలు', order: 4, active: true },
  { id: 'cat-politics', slug: 'politics', nameEn: 'Politics', nameTe: 'రాజకీయాలు', order: 5, active: true },
  { id: 'cat-government', slug: 'government', nameEn: 'Government', nameTe: 'ప్రభుత్వం & పాలన', order: 6, active: true },
  { id: 'cat-district', slug: 'district-news', nameEn: 'District News', nameTe: 'జిల్లా వార్తలు', order: 7, active: true },
  { id: 'cat-mandal', slug: 'mandal-news', nameEn: 'Mandal News', nameTe: 'మండల వార్తలు', order: 8, active: true },
  { id: 'cat-crime', slug: 'crime', nameEn: 'Crime', nameTe: 'క్రైమ్', order: 9, active: true },
  { id: 'cat-education', slug: 'education', nameEn: 'Education', nameTe: 'విద్య', order: 10, active: true },
  { id: 'cat-employment', slug: 'employment', nameEn: 'Employment & Jobs', nameTe: 'ఉద్యోగాలు & ఉపాధి', order: 11, active: true },
  { id: 'cat-business', slug: 'business', nameEn: 'Business', nameTe: 'వాణిజ్యం & వ్యాపారం', order: 12, active: true },
  { id: 'cat-agriculture', slug: 'agriculture', nameEn: 'Agriculture', nameTe: 'వ్యవసాయం', order: 13, active: true },
  { id: 'cat-farmers', slug: 'farmers', nameEn: 'Farmers', nameTe: 'రైతు సమాచారం', order: 14, active: true },
  { id: 'cat-health', slug: 'health', nameEn: 'Health', nameTe: 'ఆరోగ్యం', order: 15, active: true },
  { id: 'cat-technology', slug: 'technology', nameEn: 'Technology', nameTe: 'టెక్నాలజీ', order: 16, active: true },
  { id: 'cat-cinema', slug: 'cinema', nameEn: 'Cinema', nameTe: 'సినిమా', order: 17, active: true },
  { id: 'cat-entertainment', slug: 'entertainment', nameEn: 'Entertainment', nameTe: 'వినోదం', order: 18, active: true },
  { id: 'cat-sports', slug: 'sports', nameEn: 'Sports', nameTe: 'క్రీడలు', order: 19, active: true },
  { id: 'cat-women', slug: 'women', nameEn: 'Women', nameTe: 'మహిళా శక్తి', order: 20, active: true },
  { id: 'cat-youth', slug: 'youth', nameEn: 'Youth', nameTe: 'యువత', order: 21, active: true },
  { id: 'cat-devotional', slug: 'devotional', nameEn: 'Devotional', nameTe: 'భక్తి సమాచారం', order: 22, active: true },
  { id: 'cat-spiritual', slug: 'spiritual', nameEn: 'Spiritual', nameTe: 'ఆధ్యాత్మికం', order: 23, active: true },
  { id: 'cat-social', slug: 'social-issues', nameEn: 'Social Issues', nameTe: 'సామాజిక అంశాలు', order: 24, active: true },
  { id: 'cat-lifestyle', slug: 'lifestyle', nameEn: 'Lifestyle', nameTe: 'జీవనశైలి', order: 25, active: true },
  { id: 'cat-special', slug: 'special-stories', nameEn: 'Special Stories', nameTe: 'ప్రత్యేక కథనాలు', order: 26, active: true },
  { id: 'cat-interviews', slug: 'interviews', nameEn: 'Interviews', nameTe: 'ఇంటర్వ్యూలు', order: 27, active: true },
  { id: 'cat-local', slug: 'local-news', nameEn: 'Local News', nameTe: 'స్థానిక వార్తలు', order: 28, active: true },
  { id: 'cat-other', slug: 'other-news', nameEn: 'Other News', nameTe: 'ఇతర వార్తలు', order: 29, active: true },
];

export const INITIAL_WEBSITE_SETTINGS: WebsiteSettingsRecord = {
  id: 'global',
  siteNameEn: 'NETI BHARATHAM',
  siteNameTe: 'నేటి భారతం',
  taglineTe: 'నిజం నిర్భయంగా • ప్రజల పక్షాన నిరంతర వార్తా ప్రవాహం',
  domain: 'https://netibhaaratham.com',
  contactEmail: 'netibhaarathamtelugu@gmail.com',
  location: 'Hyderabad, Telangana, India',
  emergencyContact: '+91-40-23456789 | Press Desk: netibhaarathamtelugu@gmail.com',
  logoUrl: '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png',
  secondaryLogoUrl: '/assets/aistudio/Gemini_Generated_Image_qkr1reqkr1reqkr1_459f1767.png',
  logoTextEn: 'NETI BHARATHAM',
  logoTextTe: 'నేటి భారతం',
  bannerImageUrl: '/assets/aistudio/Gemini_Generated_Image_ei76ftei76ftei76_1e454e87.png',
  bannerTitle: 'నేటి భారతం (NETI BHARATHAM) – వార్తా తరంగిణి • ఏది నిజం చానెల్',
  bannerLinkUrl: 'https://netibhaaratham.com',
  bannerEnabled: false,
  breakingTickerText:
    'తెలంగాణ సచివాలయంలో కీలక మంత్రివర్గ సమావేశం: రైతు భరోసా, మౌలిక సదుపాయాల ప్రాజెక్టులపై సమీక్ష • హైదరాబాద్ మెట్రో రైల్ రెండో దశ విస్తరణకు కేంద్ర-రాష్ట్ర సమన్వయ కమిటీ ఆమోదం • ఆంధ్రప్రదేశ్, తెలంగాణ జిల్లాల్లో ధాన్యం కొనుగోలు కేంద్రాల వేగవంతం • నేటి భారతం ప్రెస్ రిపోర్టర్ గుర్తింపు కార్డుల ఆన్‌లైన్ క్యూఆర్ వెరిఫికేషన్ సేవలు అందుబాటులో',
  primaryColor: '#B91C1C',
  secondaryColor: '#0F172A',
  socialLinks: {
    youtube: 'https://youtube.com/@netibhaaratham',
    facebook: 'https://facebook.com/netibhaaratham',
    twitter: 'https://x.com/netibhaaratham',
    instagram: 'https://instagram.com/netibhaaratham',
    whatsappChannel: 'https://whatsapp.com/channel/netibhaaratham',
    telegram: 'https://t.me/netibhaaratham',
  },
  aboutUsContent:
    'నేటి భారతం (NETI BHARATHAM - https://netibhaaratham.com) హైదరాబాద్ కేంద్రంగా పనిచేస్తున్న ప్రముఖ తెలుగు డిజిటల్ వార్తా నెట్‌వర్క్. జాతీయ, రాష్ట్ర, జిల్లా మరియు మండల స్థాయి వార్తలను ప్రజలకు నిష్పక్షపాతంగా, వేగంగా అందించడమే మా లక్ష్యం. భారతదేశంలోని అన్ని రాష్ట్రాలు, జిల్లాలు మరియు మండలాల నుండి ధృవీకరించబడిన రిపోర్టర్ల నెట్‌వర్క్ ద్వారా వాస్తవ సమాచారాన్ని ప్రజల ముందుకు తీసుకువస్తున్నాము.',
  contactUsContent:
    'ప్రధాన కార్యాలయం: నేటి భారతం డిజిటల్ మీడియా నెట్‌వర్క్, హైదరాబాద్, తెలంగాణ, ఇండియా. అధికారిక ఈమెయిల్: netibhaarathamtelugu@gmail.com | వెబ్‌సైట్: https://netibhaaratham.com',
  privacyPolicyContent:
    'నేటి భారతం పోర్టల్ పాఠకుల మరియు రిపోర్టర్ల వ్యక్తిగత సమాచార గోప్యతకు అత్యంత ప్రాధాన్యత ఇస్తుంది. రిపోర్టర్ల ఆధార్ పత్రాలు, వ్యక్తిగత చిరునామాలు అత్యంత భద్రమైన ప్రైవేట్ ఎన్‌క్రిప్టెడ్ డేటాబేస్‌లో నిల్వ చేయబడతాయి మరియు పబ్లిక్ క్యూఆర్ వెరిఫికేషన్‌లో ఎన్నడూ బహిర్గతం చేయబడవు.',
  termsContent:
    'నేటి భారతం ప్రెస్ రిపోర్టర్ గుర్తింపు కార్డు ఆమోదం పొందిన తేదీ నుండి ఖచ్చితంగా 6 నెలల కాలానికి చెల్లుబాటు అవుతుంది. రిపోర్టర్లు సమర్పించే ప్రతి వార్త మరియు ప్రకటన ఎడిటోరియల్ మరియు సూపర్ అడ్మిన్ ఆమోదం తర్వాతే ప్రచురించబడుతుంది.',
  disclaimerContent:
    'నేటి భారతం పోర్టల్‌లో ప్రచురితమయ్యే వార్తలు ధృవీకరించబడిన రిపోర్టర్ల నివేదికలు మరియు అధికారిక సమాచార వనరుల ఆధారంగా ఉంటాయి. ఎటువంటి చట్టవిరుద్ధ కార్యకలాపాలకు ప్రెస్ గుర్తింపు కార్డును దుర్వినియోగం చేసినా తక్షణమే సభ్యత్వం రద్దు చేయబడుతుంది.',
  updatedAt: '2026-11-04T00:00:00.000Z',
};

export const INITIAL_ADSENSE_SETTINGS: AdSenseSettingsRecord = {
  id: 'global',
  enabled: false,
  publisherId: '',
  adClientId: '',
  headerSlotId: '',
  homepageSlotId: '',
  articleSlotId: '',
  sidebarSlotId: '',
  footerSlotId: '',
  mobilePlacementEnabled: true,
  desktopPlacementEnabled: true,
  updatedAt: '2026-11-04T00:00:00.000Z',
};

export const INITIAL_REPORTERS: ReporterRecord[] = [
  {
    id: 'rep-approved-1',
    uid: 'uid-rep-1',
    reporterId: 'NB-TG-HYD-2026-0001',
    username: 'venkat_hyd',
    fullName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    gender: 'Male',
    mobile: '9848011223',
    stateId: 'st-tg',
    stateName: 'Telangana (తెలంగాణ)',
    districtId: 'dt-tg-hyd',
    districtName: 'Hyderabad (హైదరాబాద్)',
    mandalId: 'mn-hyd-khairatabad',
    mandalName: 'Khairatabad (ఖైరతాబాద్)',
    villageTown: 'Somajiguda, Hyderabad',
    photoUrl: '/icon.svg',
    status: 'APPROVED',
    approvedAt: '2026-08-10',
    expiresAt: '2027-02-10',
    createdAt: '2026-08-08T10:00:00.000Z',
  },
  {
    id: 'rep-approved-2',
    uid: 'uid-rep-2',
    reporterId: 'NB-AP-VSP-2026-0002',
    username: 'padma_vizag',
    fullName: 'పి. పద్మావతి (P. Padmavathi)',
    gender: 'Female',
    mobile: '9440122334',
    stateId: 'st-ap',
    stateName: 'Andhra Pradesh (ఆంధ్రప్రదేశ్)',
    districtId: 'dt-ap-vsp',
    districtName: 'Visakhapatnam (విశాఖపట్నం)',
    mandalId: 'mn-vsp-seethammadhara',
    mandalName: 'Seethammadhara (సీతమ్మధార)',
    villageTown: 'MVP Colony, Visakhapatnam',
    photoUrl: '/icon.svg',
    status: 'APPROVED',
    approvedAt: '2026-09-15',
    expiresAt: '2027-03-15',
    createdAt: '2026-09-12T09:30:00.000Z',
  },
  {
    id: 'rep-pending-1',
    uid: 'uid-rep-3',
    username: 'suresh_wgl',
    fullName: 'ఎం. సురేష్ కుమార్ (M. Suresh Kumar)',
    gender: 'Male',
    mobile: '9989044556',
    stateId: 'st-tg',
    stateName: 'Telangana (తెలంగాణ)',
    districtId: 'dt-tg-hnk',
    districtName: 'Hanumakonda (హనుమకొండ)',
    mandalId: 'mn-hnk-kazipet',
    mandalName: 'Kazipet (కాజీపేట)',
    villageTown: 'Subedari, Hanumakonda',
    photoUrl: '/icon.svg',
    status: 'PENDING',
    createdAt: '2026-11-02T14:15:00.000Z',
  },
  {
    id: 'rep-expired-1',
    uid: 'uid-rep-4',
    reporterId: 'NB-TG-KNR-2026-0003',
    username: 'raju_knr',
    fullName: 'బి. రాజేశ్వర్ రావు (B. Rajeshwar Rao)',
    gender: 'Male',
    mobile: '9866077889',
    stateId: 'st-tg',
    stateName: 'Telangana (తెలంగాణ)',
    districtId: 'dt-tg-knr',
    districtName: 'Karimnagar (కరీంనగర్)',
    mandalId: 'mn-knr-karimnagar',
    mandalName: 'Karimnagar Urban (కరీంనగర్ అర్బన్)',
    villageTown: 'Mankamma Thota, Karimnagar',
    photoUrl: '/icon.svg',
    status: 'EXPIRED',
    approvedAt: '2026-01-10',
    expiresAt: '2026-07-10',
    createdAt: '2026-01-08T11:00:00.000Z',
  },
];

export const INITIAL_PRIVATE_DOCS: ReporterPrivateDocRecord[] = [
  {
    reporterDocId: 'rep-approved-1',
    uid: 'uid-rep-1',
    fatherSpouseName: 'K. Narasimha Rao',
    dob: '1986-04-18',
    whatsappNumber: '9848011223',
    email: 'venkat.reporter@netibhaaratham.com',
    residentialAddress: 'H.No. 6-3-1092, Raj Bhavan Road, Somajiguda, Khairatabad, Hyderabad, Telangana',
    pinCode: '500082',
    experience: '8 Years in Electronic & Print Media',
    previousOrganization: 'Telangana Patrika Daily',
    aadhaarDocUrl: '/icon.svg',
    termsConsent: true,
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    reporterDocId: 'rep-approved-2',
    uid: 'uid-rep-2',
    fatherSpouseName: 'P. Suryanarayana',
    dob: '1990-11-22',
    whatsappNumber: '9440122334',
    email: 'padma.reporter@netibhaaratham.com',
    residentialAddress: 'Plot 42, Sector 7, MVP Colony, Seethammadhara, Visakhapatnam, Andhra Pradesh',
    pinCode: '530017',
    experience: '5 Years District Bureau Reporter',
    previousOrganization: 'Uttharandhra News Network',
    aadhaarDocUrl: '/icon.svg',
    termsConsent: true,
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
  {
    reporterDocId: 'rep-pending-1',
    uid: 'uid-rep-3',
    fatherSpouseName: 'M. Komuraiah',
    dob: '1993-07-05',
    whatsappNumber: '9989044556',
    email: 'suresh.wgl@example.com',
    residentialAddress: 'H.No. 2-4-88, Near NIT Kazipet, Subedari, Hanumakonda, Telangana',
    pinCode: '506001',
    experience: '3 Years Local News Contributor',
    previousOrganization: 'Kakatiya Vaartha',
    aadhaarDocUrl: '/icon.svg',
    termsConsent: true,
    updatedAt: '2026-11-02T14:15:00.000Z',
  },
  {
    reporterDocId: 'rep-expired-1',
    uid: 'uid-rep-4',
    fatherSpouseName: 'B. Mallesham',
    dob: '1984-02-14',
    whatsappNumber: '9866077889',
    email: 'raju.knr@example.com',
    residentialAddress: 'H.No. 8-2-114, Mankamma Thota, Karimnagar Urban, Telangana',
    pinCode: '505001',
    experience: '6 Years Field Reporter',
    previousOrganization: 'Satavahana Express',
    aadhaarDocUrl: '/icon.svg',
    termsConsent: true,
    updatedAt: '2026-01-10T11:00:00.000Z',
  },
];

export const INITIAL_NEWS: NewsArticleRecord[] = [
  {
    id: 'news-1',
    slug: 'telangana-hyderabad-secretariat-infrastructure-farmer-welfare-cabinet-review',
    headline: 'తెలంగాణ సచివాలయంలో కీలక సమీక్ష: సాగునీటి ప్రాజెక్టులు, మెట్రో రెండో దశ విస్తరణకు ప్రాధాన్యత',
    subheadline: 'రాష్ట్రవ్యాప్తంగా జిల్లా, మండల స్థాయిలో మౌలిక సదుపాయాల బలోపేతానికి కార్యాచరణ ప్రణాళిక విడుదల',
    content: `హైదరాబాద్ (నేటి భారతం బ్యూరో): డాక్టర్ బి.ఆర్. అంబేద్కర్ తెలంగాణ రాష్ట్ర సచివాలయంలో జరిగిన ఉన్నతస్థాయి సమీక్షా సమావేశంలో సాగునీటి ప్రాజెక్టుల పూర్తి, హైదరాబాద్ మెట్రో రైల్ రెండో దశ విస్తరణ మరియు గ్రామీణ రహదారుల అభివృద్ధిపై కీలక నిర్ణయాలు తీసుకున్నారు.

రాష్ట్రంలోని అన్ని జిల్లాల కలెక్టర్లు, నీటిపారుదల మరియు రవాణా శాఖ ఉన్నతాధికారులతో నిర్వహించిన ఈ సమావేశంలో రైతులకు సకాలంలో సాగునీరు, విత్తనాలు మరియు ధాన్యం కొనుగోలు కేంద్రాల వద్ద మద్దతు ధర అందేలా చూడాలని ఆదేశించారు. ఖైరతాబాద్, శేరిలింగంపల్లి, ఉప్పల్, శంషాబాద్ తదితర ప్రాంతాలను అనుసంధానిస్తూ మెట్రో రెండో దశ డీపీఆర్‌పై కేంద్ర పట్టణాభివృద్ధి శాఖతో సమన్వయం వేగవంతం చేశారు.

మండల స్థాయిలో ప్రజల సమస్యలను తక్షణమే పరిష్కరించేందుకు ప్రజావాణి విభాగాన్ని డిజిటలైజ్ చేస్తున్నట్లు అధికారులు వెల్లడించారు.`,
    categoryId: 'cat-state',
    categoryName: 'State News (రాష్ట్ర వార్తలు)',
    scope: 'STATE',
    stateId: 'st-tg',
    stateName: 'Telangana',
    districtId: 'dt-tg-hyd',
    districtName: 'Hyderabad',
    mandalId: 'mn-hyd-khairatabad',
    mandalName: 'Khairatabad',
    villageTown: 'Secretariat, Hyderabad',
    featuredImage: '/images/hero-secretariat.svg',
    galleryImages: ['/images/hero-secretariat.svg', '/images/news-technology.svg'],
    imageCaption: 'హైదరాబాద్‌లోని డా. బి.ఆర్. అంబేద్కర్ తెలంగాణ రాష్ట్ర సచివాలయ భవన సముదాయం',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags: ['Telangana', 'Hyderabad', 'Secretariat', 'Infrastructure', 'MetroRail'],
    seoTitle: 'Telangana Secretariat Cabinet Review on Irrigation & Hyderabad Metro Phase 2 | NETI BHARATHAM',
    seoDescription: 'High-level governance review at Telangana State Secretariat in Hyderabad focusing on irrigation projects, paddy procurement, and Metro Phase 2.',
    language: 'te',
    isBreaking: true,
    isFeatured: true,
    isTrending: true,
    views: 4820,
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    authorUid: 'uid-rep-1',
    status: 'PUBLISHED',
    revisions: [
      { timestamp: '2026-11-04T06:00:00.000Z', editorName: 'K. Venkata Ramana', action: 'Submitted by Reporter' },
      { timestamp: '2026-11-04T06:15:00.000Z', editorName: 'Super Admin', action: 'Approved & Published' },
    ],
    createdAt: '2026-11-04T06:00:00.000Z',
    updatedAt: '2026-11-04T06:15:00.000Z',
  },
  {
    id: 'news-2',
    slug: 'andhra-pradesh-visakhapatnam-agriculture-paddy-procurement-minimum-support-price',
    headline: 'తెలుగు రాష్ట్రాల్లో జోరుగా ఖరీఫ్ ధాన్యం సేకరణ: రైతు సేవా కేంద్రాల ద్వారా నేరుగా ఖాతాల్లోకి మద్దతు ధర',
    subheadline: 'విశాఖపట్నం, తూర్పు గోదావరి, నల్గొండ, కరీంనగర్ జిల్లాల్లో ప్రత్యేక కొనుగోలు కేంద్రాలు ఏర్పాటు',
    content: `విశాఖపట్నం / హైదరాబాద్ (నేటి భారతం అగ్రికల్చర్ డెస్క్): ఖరీఫ్ సీజన్ పంట కోతలు ఊపందుకోవడంతో ఆంధ్రప్రదేశ్ మరియు తెలంగాణ రాష్ట్రాల్లోని అన్ని ప్రధాన వ్యవసాయ మండలాల్లో ధాన్యం కొనుగోలు కేంద్రాలను పూర్తిస్థాయిలో అందుబాటులోకి తెచ్చారు.

గ్రేడ్-ఏ రకం ధాన్యానికి కనీస మద్దతు ధరతో పాటు తేమ శాతం నిర్ధారణ యంత్రాలను ప్రతి మండల కేంద్రంలో ఏర్పాటు చేశారు. ధాన్యం విక్రయించిన 48 గంటల్లోనే రైతుల బ్యాంకు ఖాతాల్లో నేరుగా నగదు జమయ్యేలా ఆన్‌లైన్ చెల్లింపుల విధానాన్ని అమలు చేస్తున్నారు. గన్నీ బ్యాగులు, రవాణా వాహనాల కొరత లేకుండా జిల్లాల జాయింట్ కలెక్టర్లు పర్యవేక్షిస్తున్నారు.`,
    categoryId: 'cat-agriculture',
    categoryName: 'Agriculture (వ్యవసాయం)',
    scope: 'STATE',
    stateId: 'st-ap',
    stateName: 'Andhra Pradesh',
    districtId: 'dt-ap-vsp',
    districtName: 'Visakhapatnam',
    mandalId: 'mn-vsp-seethammadhara',
    mandalName: 'Seethammadhara',
    villageTown: 'Visakhapatnam',
    featuredImage: '/images/news-agriculture.svg',
    galleryImages: ['/images/news-agriculture.svg'],
    imageCaption: 'గ్రామీణ మండలాల్లో ధాన్యం సేకరణ మరియు రైతు సేవా కేంద్రాల కార్యకలాపాలు',
    videoUrl: '',
    tags: ['Agriculture', 'Farmers', 'PaddyProcurement', 'AndhraPradesh', 'Telangana'],
    seoTitle: 'Kharif Paddy Procurement & MSP Direct Benefit Transfer in Telugu States | NETI BHARATHAM',
    seoDescription: 'Fast-track Kharif paddy procurement centers opened across Andhra Pradesh and Telangana mandals with direct bank transfer for farmers.',
    language: 'te',
    isBreaking: true,
    isFeatured: true,
    isTrending: true,
    views: 3690,
    reporterId: 'NB-AP-VSP-2026-0002',
    reporterName: 'పి. పద్మావతి (P. Padmavathi)',
    authorUid: 'uid-rep-2',
    status: 'PUBLISHED',
    revisions: [
      { timestamp: '2026-11-03T16:30:00.000Z', editorName: 'P. Padmavathi', action: 'Submitted by Reporter' },
      { timestamp: '2026-11-03T17:00:00.000Z', editorName: 'Super Admin', action: 'Approved & Published' },
    ],
    createdAt: '2026-11-03T16:30:00.000Z',
    updatedAt: '2026-11-03T17:00:00.000Z',
  },
  {
    id: 'news-3',
    slug: 'telangana-rangareddy-serilingampally-hitec-city-it-investment-youth-employment-drive',
    headline: 'హైదరాబాద్ ఐటీ కారిడార్‌లో నూతన గ్లోబల్ కెపాబిలిటీ సెంటర్లు: 25,000 మంది యువతకు నూతన ఉద్యోగావకాశాలు',
    subheadline: 'శేరిలింగంపల్లి, గచ్చిబౌలి, కూకట్‌పల్లి క్లస్టర్లలో విస్తరిస్తున్న టెక్నాలజీ మరియు ఏఐ పరిశోధనా కేంద్రాలు',
    content: `హైదరాబాద్ / రంగారెడ్డి (నేటి భారతం టెక్నాలజీ & ఉద్యోగ విభాగం): హైదరాబాద్ ఐటీ కారిడార్‌లోని శేరిలింగంపల్లి, హైటెక్ సిటీ, ఫైనాన్షియల్ డిస్ట్రిక్ట్ పరిధిలో అంతర్జాతీయ టెక్నాలజీ సంస్థలు తమ గ్లోబల్ కెపాబిలిటీ సెంటర్లను (GCC) విస్తరిస్తున్నాయి.

రాబోయే ఆరు నెలల్లో సాఫ్ట్‌వేర్ ఇంజనీరింగ్, డేటా సైన్స్, సెమీకండక్టర్ డిజైన్ మరియు సైబర్ సెక్యూరిటీ విభాగాల్లో సుమారు 25,000 మంది ఇంజనీరింగ్, డిగ్రీ పట్టభద్రులకు ఉద్యోగావకాశాలు లభించనున్నాయి. గ్రామీణ జిల్లాల విద్యార్థులకు కూడా నైపుణ్య శిక్షణ అందించేందుకు టాస్క్ (TASK) ద్వారా ప్రత్యేక క్యాంపస్ డ్రైవ్‌లు నిర్వహిస్తున్నారు.`,
    categoryId: 'cat-employment',
    categoryName: 'Employment & Jobs (ఉద్యోగాలు & ఉపాధి)',
    scope: 'DISTRICT',
    stateId: 'st-tg',
    stateName: 'Telangana',
    districtId: 'dt-tg-rr',
    districtName: 'Rangareddy',
    mandalId: 'mn-rr-serilingampally',
    mandalName: 'Serilingampally',
    villageTown: 'HITEC City, Madhapur',
    featuredImage: '/images/news-technology.svg',
    galleryImages: ['/images/news-technology.svg'],
    imageCaption: 'హైదరాబాద్ ఐటీ కారిడార్‌లోని ఆధునిక టెక్నాలజీ క్యాంపస్‌లు',
    videoUrl: '',
    tags: ['Jobs', 'HyderabadIT', 'Serilingampally', 'TelanganaYouth', 'Technology'],
    seoTitle: 'Hyderabad IT Corridor GCC Expansion Creates 25,000 New Jobs | NETI BHARATHAM',
    seoDescription: 'New Global Capability Centers in Serilingampally and HITEC City announce 25,000 fresh technology and engineering jobs.',
    language: 'te',
    isBreaking: false,
    isFeatured: true,
    isTrending: true,
    views: 5210,
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    authorUid: 'uid-rep-1',
    status: 'PUBLISHED',
    revisions: [
      { timestamp: '2026-11-03T11:00:00.000Z', editorName: 'K. Venkata Ramana', action: 'Submitted by Reporter' },
      { timestamp: '2026-11-03T11:45:00.000Z', editorName: 'Super Admin', action: 'Approved & Published' },
    ],
    createdAt: '2026-11-03T11:00:00.000Z',
    updatedAt: '2026-11-03T11:45:00.000Z',
  },
  {
    id: 'news-4',
    slug: 'india-new-delhi-national-digital-public-infrastructure-expressway-corridors',
    headline: 'జాతీయ రహదారుల ఆధునీకరణ మరియు డిజిటల్ భారత్ మిషన్‌కు కేంద్ర కేబినెట్ భారీ బడ్జెట్ కేటాయింపు',
    subheadline: 'దక్షిణాది రాష్ట్రాల పారిశ్రామిక కారిడార్లను అనుసంధానిస్తూ నూతన గ్రీన్‌ఫీల్డ్ ఎక్స్‌ప్రెస్‌వేల నిర్మాణం',
    content: `న్యూఢిల్లీ (నేటి భారతం నేషనల్ బ్యూరో): దేశవ్యాప్తంగా రవాణా, లాజిస్టిక్స్ మరియు గ్రామీణ బ్రాడ్‌బ్యాండ్ కనెక్టివిటీని మరింత బలోపేతం చేసేందుకు కేంద్ర మంత్రివర్గం నూతన మౌలిక సదుపాయాల ప్రాజెక్టులకు ఆమోదం తెలిపింది.

ఇందులో భాగంగా హైదరాబాద్ - విశాఖపట్నం, నాగ్‌పూర్ - విజయవాడ, బెంగళూరు - చెన్నై పారిశ్రామిక కారిడార్ల పరిధిలో హైస్పీడ్ రహదారుల నిర్మాణం వేగవంతం కానుంది. అలాగే దేశంలోని అన్ని గ్రామ పంచాయతీలకు భారత్‌నెట్ ఆప్టికల్ ఫైబర్ సేవలను విస్తరిస్తున్నారు.`,
    categoryId: 'cat-national',
    categoryName: 'National News (జాతీయ వార్తలు)',
    scope: 'NATIONAL',
    stateId: 'st-dl',
    stateName: 'Delhi (NCT)',
    districtId: 'dt-dl-nd',
    districtName: 'New Delhi',
    mandalId: 'mn-dl-parliament',
    mandalName: 'Parliament Street',
    villageTown: 'New Delhi',
    featuredImage: '/images/news-national.svg',
    galleryImages: ['/images/news-national.svg'],
    imageCaption: 'న్యూఢిల్లీలోని కేంద్ర సచివాలయం మరియు పార్లమెంట్ భవన ప్రాంగణం',
    videoUrl: '',
    tags: ['NationalNews', 'NewDelhi', 'Infrastructure', 'Expressways', 'DigitalIndia'],
    seoTitle: 'Union Cabinet Approves National Expressway Corridors & Digital Bharat Expansion | NETI BHARATHAM',
    seoDescription: 'Major national infrastructure investment connecting southern industrial corridors and rural optical fiber broadband across India.',
    language: 'te',
    isBreaking: true,
    isFeatured: false,
    isTrending: true,
    views: 3140,
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    authorUid: 'uid-rep-1',
    status: 'PUBLISHED',
    revisions: [
      { timestamp: '2026-11-02T09:15:00.000Z', editorName: 'Super Admin', action: 'Published National Desk Report' },
    ],
    createdAt: '2026-11-02T09:15:00.000Z',
    updatedAt: '2026-11-02T09:15:00.000Z',
  },
  {
    id: 'news-5',
    slug: 'telangana-medchal-malkajgiri-uppal-mandal-civic-water-supply-road-works',
    headline: 'ఉప్పల్, మల్కాజిగిరి మండలాల్లో నూతన మంచినీటి పైప్‌లైన్ మరియు అండర్‌గ్రౌండ్ డ్రైనేజీ పనులు ప్రారంభం',
    subheadline: 'కాలనీ సంక్షేమ సంఘాల విజ్ఞప్తి మేరకు రూ. 45 కోట్ల అంచనా వ్యయంతో అభివృద్ధి పనులకు శంకుస్థాపన',
    content: `మేడ్చల్-మల్కాజిగిరి / ఉప్పల్ (నేటి భారతం మండల డెస్క్): మేడ్చల్-మల్కాజిగిరి జిల్లా ఉప్పల్ మరియు మల్కాజిగిరి మండలాల పరిధిలోని ప్రధాన కాలనీల్లో వేసవికి ముందే తాగునీటి సమస్యను శాశ్వతంగా పరిష్కరించేందుకు జలమండలి అధికారులు రూ. 45 కోట్ల వ్యయంతో నూతన రిజర్వాయర్, పైప్‌లైన్ పనులను ప్రారంభించారు.

స్థానిక ప్రజలు, కాలనీ వెల్ఫేర్ అసోసియేషన్ ప్రతినిధులు పాల్గొన్న ఈ కార్యక్రమంలో అంతర్గత సిమెంట్ రోడ్లు, ఎల్ఈడీ వీధి దీపాలు మరియు వర్షపు నీటి కాలువల నిర్మాణాన్ని నిర్ణీత గడువులోగా పూర్తి చేస్తామని అధికారులు తెలిపారు.`,
    categoryId: 'cat-mandal',
    categoryName: 'Mandal News (మండల వార్తలు)',
    scope: 'MANDAL',
    stateId: 'st-tg',
    stateName: 'Telangana',
    districtId: 'dt-tg-mm',
    districtName: 'Medchal-Malkajgiri',
    mandalId: 'mn-mm-uppal',
    mandalName: 'Uppal',
    villageTown: 'Uppal Kalan',
    featuredImage: '/images/hero-secretariat.svg',
    galleryImages: ['/images/hero-secretariat.svg'],
    imageCaption: 'ఉప్పల్ మండల పరిధిలో ప్రారంభమైన మౌలిక సదుపాయాల అభివృద్ధి పనులు',
    videoUrl: '',
    tags: ['Uppal', 'MedchalMalkajgiri', 'MandalNews', 'HyderabadCivic'],
    seoTitle: 'Uppal & Malkajgiri Mandal Water Supply and Civic Infrastructure Works Launched | NETI BHARATHAM',
    seoDescription: 'Rs 45 Crore drinking water pipeline and civic road works initiated across Uppal and Malkajgiri mandals in Medchal-Malkajgiri district.',
    language: 'te',
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    views: 1890,
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    authorUid: 'uid-rep-1',
    status: 'PUBLISHED',
    revisions: [
      { timestamp: '2026-11-01T15:00:00.000Z', editorName: 'K. Venkata Ramana', action: 'Submitted & Approved' },
    ],
    createdAt: '2026-11-01T15:00:00.000Z',
    updatedAt: '2026-11-01T15:00:00.000Z',
  },
  {
    id: 'news-pending-1',
    slug: 'telangana-hyderabad-ameerpet-metro-station-commuter-parking-facility-report',
    headline: 'అమీర్‌పేట మెట్రో స్టేషన్ వద్ద ప్రయాణికుల కోసం మల్టీ-లెవల్ స్మార్ట్ పార్కింగ్ సదుపాయం ఏర్పాటుకు ప్రతిపాదన',
    subheadline: 'రద్దీ వేళల్లో ట్రాఫిక్ నియంత్రణకు జిహెచ్ఎంసి మరియు మెట్రో అధికారుల ఉమ్మడి సర్వే',
    content: `హైదరాబాద్ (నేటి భారతం స్థానిక రిపోర్ట్): నగరంలోని అత్యంత రద్దీగా ఉండే అమీర్‌పేట ఇంటర్‌చేంజ్ మెట్రో స్టేషన్ పరిసరాల్లో ద్విచక్ర వాహనాలు, కార్ల పార్కింగ్ సమస్యను పరిష్కరించేందుకు మల్టీ-లెవల్ స్మార్ట్ పార్కింగ్ కాంప్లెక్స్ నిర్మించాలని అధికారులు ప్రతిపాదనలు సిద్ధం చేశారు.`,
    categoryId: 'cat-district',
    categoryName: 'District News (జిల్లా వార్తలు)',
    scope: 'DISTRICT',
    stateId: 'st-tg',
    stateName: 'Telangana',
    districtId: 'dt-tg-hyd',
    districtName: 'Hyderabad',
    mandalId: 'mn-hyd-ameerpet',
    mandalName: 'Ameerpet',
    villageTown: 'Ameerpet, Hyderabad',
    featuredImage: '/images/news-technology.svg',
    galleryImages: ['/images/news-technology.svg'],
    imageCaption: 'అమీర్‌పేట మెట్రో కారిడార్ పరిసర ప్రాంతం',
    videoUrl: '',
    tags: ['Ameerpet', 'HyderabadMetro', 'SmartParking'],
    seoTitle: 'Multi-Level Smart Parking Proposed at Ameerpet Metro Station | NETI BHARATHAM',
    seoDescription: 'Joint survey by GHMC and Metro officials for multi-level commuter parking at Ameerpet in Hyderabad.',
    language: 'te',
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    views: 0,
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    authorUid: 'uid-rep-1',
    status: 'PUBLISHED',
    revisions: [
      { timestamp: '2026-11-04T07:30:00.000Z', editorName: 'K. Venkata Ramana', action: 'Published directly by Accredited Reporter' },
    ],
    createdAt: '2026-11-04T07:30:00.000Z',
    updatedAt: '2026-11-04T07:30:00.000Z',
  },
];

export const INITIAL_ADVERTISEMENTS: AdvertisementRecord[] = [
  {
    id: 'ad-1',
    title: 'భాగ్యనగర్ ఆర్గానిక్ ఫార్మ్స్ & రైతు బజార్ – 100% సహజ వ్యవసాయ ఉత్పత్తులు',
    businessName: 'Bhagyanagar Organic Agri Mart Pvt Ltd',
    contactNumber: '+91-9848055667',
    description: 'తెలంగాణ మరియు ఆంధ్రప్రదేశ్ రైతుల నుండి నేరుగా సేకరించిన కల్తీ లేని ఆర్గానిక్ బియ్యం, చిరుధాన్యాలు, గానుగ నూనెలు. హైదరాబాద్ అంతటా ఉచిత హోమ్ డెలివరీ.',
    image1: '/images/news-agriculture.svg',
    image2: '/images/hero-secretariat.svg',
    linkUrl: 'https://netibhaaratham.com',
    targetStateId: 'st-tg',
    targetStateName: 'Telangana',
    targetDistrictId: 'dt-tg-hyd',
    targetDistrictName: 'Hyderabad',
    targetMandalId: 'mn-hyd-khairatabad',
    targetMandalName: 'Khairatabad',
    startDate: '2026-10-01',
    expiryDate: '2027-03-31',
    position: 'HOMEPAGE_BANNER',
    priceAmount: 15000,
    paymentStatus: 'PAID',
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    status: 'ACTIVE',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'ad-pending-1',
    title: 'కాకతీయ టెక్నాలజీ అకాడమీ – జావా, పైథాన్ & ఏఐ ఫుల్-స్టాక్ శిక్షణ',
    businessName: 'Kakatiya Tech Academy',
    contactNumber: '+91-9440188990',
    description: 'అమీర్‌పేట మరియు మాధాపూర్ బ్రాంచీలలో నూతన బ్యాచ్‌లు ప్రారంభం. 100% ప్లేస్‌మెంట్ అసిస్టెన్స్.',
    image1: '/images/news-technology.svg',
    image2: '',
    linkUrl: 'https://netibhaaratham.com',
    targetStateId: 'st-tg',
    targetStateName: 'Telangana',
    targetDistrictId: 'dt-tg-hyd',
    targetDistrictName: 'Hyderabad',
    targetMandalId: 'mn-hyd-ameerpet',
    targetMandalName: 'Ameerpet',
    startDate: '2026-11-05',
    expiryDate: '2027-01-05',
    position: 'SIDEBAR',
    priceAmount: 8500,
    paymentStatus: 'PAID',
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    status: 'ACTIVE',
    createdAt: '2026-11-03T12:00:00.000Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif-1',
    recipientId: 'rep-approved-1',
    title: 'ప్రెస్ రిపోర్టర్ అప్లికేషన్ ఆమోదించబడింది (Approved)',
    message: 'మీ నేటి భారతం ప్రెస్ రిపోర్టర్ గుర్తింపు కార్డు (ID: NB-TG-HYD-2026-0001) ఆమోదించబడింది. చెల్లుబాటు: 2027-02-10 వరకు.',
    type: 'APPROVAL',
    read: false,
    createdAt: '2026-08-10T10:05:00.000Z',
  },
  {
    id: 'notif-2',
    recipientId: 'rep-expired-1',
    title: 'రిపోర్టర్ సభ్యత్వ గడువు ముగిసింది (Membership Expired)',
    message: 'మీ 6 నెలల రిపోర్టర్ గుర్తింపు కార్డు (NB-TG-KNR-2026-0003) గడువు 2026-07-10న ముగిసింది. వార్తలు అప్‌లోడ్ చేసేందుకు సూపర్ అడ్మిన్ ద్వారా రెన్యువల్ చేసుకోగలరు.',
    type: 'EXPIRY_REMINDER',
    read: false,
    createdAt: '2026-07-11T09:00:00.000Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'audit-1',
    actorId: 'Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'APPROVE_REPORTER',
    targetType: 'REPORTER',
    targetId: 'NB-TG-HYD-2026-0001',
    details: 'Approved reporter K. Venkata Ramana (Khairatabad, Hyderabad) with 6-month validity until 2027-02-10.',
    createdAt: '2026-08-10T10:05:00.000Z',
  },
  {
    id: 'audit-2',
    actorId: 'Admin',
    actorRole: 'SUPER_ADMIN',
    action: 'PUBLISH_NEWS',
    targetType: 'NEWS',
    targetId: 'news-1',
    details: 'Approved and published lead story: తెలంగాణ సచివాలయంలో కీలక సమీక్ష',
    createdAt: '2026-11-04T06:15:00.000Z',
  },
];

export const INITIAL_RENEWALS: MembershipRenewalRecord[] = [
  {
    id: 'ren-1',
    reporterId: 'NB-TG-HYD-2026-0001',
    reporterName: 'కె. వెంకట రమణ (K. Venkata Ramana)',
    previousExpiry: '2026-08-10',
    newExpiry: '2027-02-10',
    renewedBy: 'Admin',
    remarks: 'Active Hyderabad Bureau reporting performance verified; renewed for 6 calendar months.',
    renewedAt: '2026-08-10T10:05:00.000Z',
  },
];

export interface PortalDatabaseState {
  adminAccount: {
    username: string;
    email: string;
    bootstrapped: boolean;
    passwordSalt: string;
    passwordHash: string;
    updatedAt: string;
  };
  states: StateRecord[];
  districts: DistrictRecord[];
  mandals: MandalRecord[];
  categories: NewsCategoryRecord[];
  reporters: ReporterRecord[];
  reporterPrivateDocs: ReporterPrivateDocRecord[];
  news: NewsArticleRecord[];
  advertisements: AdvertisementRecord[];
  websiteSettings: WebsiteSettingsRecord;
  adSenseSettings: AdSenseSettingsRecord;
  notifications: NotificationRecord[];
  auditLogs: AuditLogRecord[];
  membershipRenewals: MembershipRenewalRecord[];
}

export function createInitialPortalDatabase(
  adminSalt: string,
  adminHash: string,
  defaultReporterHashes: Record<string, { salt: string; hash: string }>
): PortalDatabaseState {
  return {
    adminAccount: {
      username: 'chakri',
      email: 'brkr1042@gmail.com',
      bootstrapped: true,
      passwordSalt: adminSalt,
      passwordHash: adminHash,
      updatedAt: '2026-11-04T00:00:00.000Z',
    },
    states: INITIAL_STATES,
    districts: INITIAL_DISTRICTS,
    mandals: INITIAL_MANDALS,
    categories: INITIAL_CATEGORIES,
    reporters: INITIAL_REPORTERS,
    reporterPrivateDocs: INITIAL_PRIVATE_DOCS.map((doc) => {
      const cred = defaultReporterHashes[doc.reporterDocId];
      return {
        ...doc,
        passwordHash: cred ? `${cred.salt}:${cred.hash}` : undefined,
      };
    }),
    news: INITIAL_NEWS,
    advertisements: INITIAL_ADVERTISEMENTS,
    websiteSettings: INITIAL_WEBSITE_SETTINGS,
    adSenseSettings: INITIAL_ADSENSE_SETTINGS,
    notifications: INITIAL_NOTIFICATIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    membershipRenewals: INITIAL_RENEWALS,
  };
}
