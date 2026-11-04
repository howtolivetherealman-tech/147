export interface StateRecord {
  id: string;
  code: string;
  nameEn: string;
  nameTe: string;
  type: 'STATE' | 'UT';
  subdivisionTerm: 'Mandal' | 'Tehsil' | 'Taluk' | 'Block' | 'Sub-Division';
  active: boolean;
}

export interface DistrictRecord {
  id: string;
  stateId: string;
  nameEn: string;
  nameTe: string;
  active: boolean;
}

export interface MandalRecord {
  id: string;
  stateId: string;
  districtId: string;
  nameEn: string;
  nameTe: string;
  divisionType: string;
  active: boolean;
}

export const INITIAL_STATES: StateRecord[] = [
  // Primary Telugu States listed first for fast access, followed by all Indian States & UTs
  { id: 'st-tg', code: 'TG', nameEn: 'Telangana', nameTe: 'తెలంగాణ', type: 'STATE', subdivisionTerm: 'Mandal', active: true },
  { id: 'st-ap', code: 'AP', nameEn: 'Andhra Pradesh', nameTe: 'ఆంధ్రప్రదేశ్', type: 'STATE', subdivisionTerm: 'Mandal', active: true },
  { id: 'st-an', code: 'AN', nameEn: 'Andaman and Nicobar Islands', nameTe: 'అండమాన్ నికోబార్ దీవులు', type: 'UT', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-ar', code: 'AR', nameEn: 'Arunachal Pradesh', nameTe: 'అరుణాచల్ ప్రదేశ్', type: 'STATE', subdivisionTerm: 'Block', active: true },
  { id: 'st-as', code: 'AS', nameEn: 'Assam', nameTe: 'అస్సాం', type: 'STATE', subdivisionTerm: 'Sub-Division', active: true },
  { id: 'st-br', code: 'BR', nameEn: 'Bihar', nameTe: 'బీహార్', type: 'STATE', subdivisionTerm: 'Block', active: true },
  { id: 'st-ch', code: 'CH', nameEn: 'Chandigarh', nameTe: 'చండీగఢ్', type: 'UT', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-ct', code: 'CT', nameEn: 'Chhattisgarh', nameTe: 'ఛత్తీస్‌గఢ్', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-dn', code: 'DN', nameEn: 'Dadra and Nagar Haveli and Daman and Diu', nameTe: 'దాద్రా నగర్ హవేలీ & డామన్ డయ్యూ', type: 'UT', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-dl', code: 'DL', nameEn: 'Delhi (NCT)', nameTe: 'ఢిల్లీ', type: 'UT', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-ga', code: 'GA', nameEn: 'Goa', nameTe: 'గోవా', type: 'STATE', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-gj', code: 'GJ', nameEn: 'Gujarat', nameTe: 'గుజరాత్', type: 'STATE', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-hr', code: 'HR', nameEn: 'Haryana', nameTe: 'హర్యానా', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-hp', code: 'HP', nameEn: 'Himachal Pradesh', nameTe: 'హిమాచల్ ప్రదేశ్', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-jk', code: 'JK', nameEn: 'Jammu and Kashmir', nameTe: 'జమ్మూ కాశ్మీర్', type: 'UT', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-jh', code: 'JH', nameEn: 'Jharkhand', nameTe: 'జార్ఖండ్', type: 'STATE', subdivisionTerm: 'Block', active: true },
  { id: 'st-ka', code: 'KA', nameEn: 'Karnataka', nameTe: 'కర్ణాటక', type: 'STATE', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-kl', code: 'KL', nameEn: 'Kerala', nameTe: 'కేరళ', type: 'STATE', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-la', code: 'LA', nameEn: 'Ladakh', nameTe: 'లడఖ్', type: 'UT', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-ld', code: 'LD', nameEn: 'Lakshadweep', nameTe: 'లక్షద్వీప్', type: 'UT', subdivisionTerm: 'Sub-Division', active: true },
  { id: 'st-mp', code: 'MP', nameEn: 'Madhya Pradesh', nameTe: 'మధ్యప్రదేశ్', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-mh', code: 'MH', nameEn: 'Maharashtra', nameTe: 'మహారాష్ట్ర', type: 'STATE', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-mn', code: 'MN', nameEn: 'Manipur', nameTe: 'మణిపూర్', type: 'STATE', subdivisionTerm: 'Sub-Division', active: true },
  { id: 'st-ml', code: 'ML', nameEn: 'Meghalaya', nameTe: 'మేఘాలయ', type: 'STATE', subdivisionTerm: 'Block', active: true },
  { id: 'st-mz', code: 'MZ', nameEn: 'Mizoram', nameTe: 'మిజోరం', type: 'STATE', subdivisionTerm: 'Block', active: true },
  { id: 'st-nl', code: 'NL', nameEn: 'Nagaland', nameTe: 'నాగాలాండ్', type: 'STATE', subdivisionTerm: 'Block', active: true },
  { id: 'st-od', code: 'OD', nameEn: 'Odisha', nameTe: 'ఒడిశా', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-py', code: 'PY', nameEn: 'Puducherry', nameTe: 'పుదుచ్చేరి', type: 'UT', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-pb', code: 'PB', nameEn: 'Punjab', nameTe: 'పంజాబ్', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-rj', code: 'RJ', nameEn: 'Rajasthan', nameTe: 'రాజస్థాన్', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-sk', code: 'SK', nameEn: 'Sikkim', nameTe: 'సిక్కిం', type: 'STATE', subdivisionTerm: 'Sub-Division', active: true },
  { id: 'st-tn', code: 'TN', nameEn: 'Tamil Nadu', nameTe: 'తమిళనాడు', type: 'STATE', subdivisionTerm: 'Taluk', active: true },
  { id: 'st-tr', code: 'TR', nameEn: 'Tripura', nameTe: 'త్రిపుర', type: 'STATE', subdivisionTerm: 'Block', active: true },
  { id: 'st-up', code: 'UP', nameEn: 'Uttar Pradesh', nameTe: 'ఉత్తరప్రదేశ్', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-uk', code: 'UK', nameEn: 'Uttarakhand', nameTe: 'ఉత్తరాఖండ్', type: 'STATE', subdivisionTerm: 'Tehsil', active: true },
  { id: 'st-wb', code: 'WB', nameEn: 'West Bengal', nameTe: 'పశ్చిమ బెంగాల్', type: 'STATE', subdivisionTerm: 'Block', active: true },
];

export const INITIAL_DISTRICTS: DistrictRecord[] = [
  // All 33 Districts of Telangana
  { id: 'dt-tg-hyd', stateId: 'st-tg', nameEn: 'Hyderabad', nameTe: 'హైదరాబాద్', active: true },
  { id: 'dt-tg-rr', stateId: 'st-tg', nameEn: 'Rangareddy', nameTe: 'రంగారెడ్డి', active: true },
  { id: 'dt-tg-mm', stateId: 'st-tg', nameEn: 'Medchal-Malkajgiri', nameTe: 'మేడ్చల్-మల్కాజిగిరి', active: true },
  { id: 'dt-tg-sr', stateId: 'st-tg', nameEn: 'Sangareddy', nameTe: 'సంగారెడ్డి', active: true },
  { id: 'dt-tg-hnk', stateId: 'st-tg', nameEn: 'Hanumakonda', nameTe: 'హనుమకొండ', active: true },
  { id: 'dt-tg-wgl', stateId: 'st-tg', nameEn: 'Warangal', nameTe: 'వరంగల్', active: true },
  { id: 'dt-tg-knr', stateId: 'st-tg', nameEn: 'Karimnagar', nameTe: 'కరీంనగర్', active: true },
  { id: 'dt-tg-nzb', stateId: 'st-tg', nameEn: 'Nizamabad', nameTe: 'నిజామాబాద్', active: true },
  { id: 'dt-tg-kmm', stateId: 'st-tg', nameEn: 'Khammam', nameTe: 'ఖమ్మం', active: true },
  { id: 'dt-tg-nlg', stateId: 'st-tg', nameEn: 'Nalgonda', nameTe: 'నల్గొండ', active: true },
  { id: 'dt-tg-mbn', stateId: 'st-tg', nameEn: 'Mahabubnagar', nameTe: 'మహబూబ్‌నగర్', active: true },
  { id: 'dt-tg-adb', stateId: 'st-tg', nameEn: 'Adilabad', nameTe: 'ఆదిలాబాద్', active: true },
  { id: 'dt-tg-sdp', stateId: 'st-tg', nameEn: 'Siddipet', nameTe: 'సిద్దిపేట', active: true },
  { id: 'dt-tg-sry', stateId: 'st-tg', nameEn: 'Suryapet', nameTe: 'సూర్యాపేట', active: true },
  { id: 'dt-tg-mdk', stateId: 'st-tg', nameEn: 'Medak', nameTe: 'మెదక్', active: true },
  { id: 'dt-tg-vkb', stateId: 'st-tg', nameEn: 'Vikarabad', nameTe: 'వికారాబాద్', active: true },
  { id: 'dt-tg-ydb', stateId: 'st-tg', nameEn: 'Yadadri Bhuvanagiri', nameTe: 'యాదాద్రి భువనగిరి', active: true },
  { id: 'dt-tg-bdk', stateId: 'st-tg', nameEn: 'Bhadradri Kothagudem', nameTe: 'భద్రాద్రి కొత్తగూడెం', active: true },
  { id: 'dt-tg-jgt', stateId: 'st-tg', nameEn: 'Jagtial', nameTe: 'జగిత్యాల', active: true },
  { id: 'dt-tg-jng', stateId: 'st-tg', nameEn: 'Jangaon', nameTe: 'జనగామ', active: true },
  { id: 'dt-tg-jbp', stateId: 'st-tg', nameEn: 'Jayashankar Bhupalpally', nameTe: 'జయశంకర్ భూపాలపల్లి', active: true },
  { id: 'dt-tg-jgw', stateId: 'st-tg', nameEn: 'Jogulamba Gadwal', nameTe: 'జోగులాంబ గద్వాల', active: true },
  { id: 'dt-tg-kmr', stateId: 'st-tg', nameEn: 'Kamareddy', nameTe: 'కామారెడ్డి', active: true },
  { id: 'dt-tg-kba', stateId: 'st-tg', nameEn: 'Kumuram Bheem Asifabad', nameTe: 'కుమురం భీమ్ ఆసిఫాబాద్', active: true },
  { id: 'dt-tg-mhb', stateId: 'st-tg', nameEn: 'Mahabubabad', nameTe: 'మహబూబాబాద్', active: true },
  { id: 'dt-tg-mcl', stateId: 'st-tg', nameEn: 'Mancherial', nameTe: 'మంచిర్యాల', active: true },
  { id: 'dt-tg-mlg', stateId: 'st-tg', nameEn: 'Mulugu', nameTe: 'ములుగు', active: true },
  { id: 'dt-tg-ngk', stateId: 'st-tg', nameEn: 'Nagarkurnool', nameTe: 'నాగర్‌కర్నూల్', active: true },
  { id: 'dt-tg-nrp', stateId: 'st-tg', nameEn: 'Narayanpet', nameTe: 'నారాయణపేట', active: true },
  { id: 'dt-tg-nrm', stateId: 'st-tg', nameEn: 'Nirmal', nameTe: 'నిర్మల్', active: true },
  { id: 'dt-tg-pdp', stateId: 'st-tg', nameEn: 'Peddapalli', nameTe: 'పెద్దపల్లి', active: true },
  { id: 'dt-tg-rjs', stateId: 'st-tg', nameEn: 'Rajanna Sircilla', nameTe: 'రాజన్న సిరిసిల్ల', active: true },
  { id: 'dt-tg-wnp', stateId: 'st-tg', nameEn: 'Wanaparthy', nameTe: 'వనపర్తి', active: true },

  // All 26 Districts of Andhra Pradesh
  { id: 'dt-ap-vsp', stateId: 'st-ap', nameEn: 'Visakhapatnam', nameTe: 'విశాఖపట్నం', active: true },
  { id: 'dt-ap-ntr', stateId: 'st-ap', nameEn: 'NTR (Vijayawada)', nameTe: 'ఎన్టీఆర్ (విజయవాడ)', active: true },
  { id: 'dt-ap-gnt', stateId: 'st-ap', nameEn: 'Guntur', nameTe: 'గుంటూరు', active: true },
  { id: 'dt-ap-tpt', stateId: 'st-ap', nameEn: 'Tirupati', nameTe: 'తిరుపతి', active: true },
  { id: 'dt-ap-eg', stateId: 'st-ap', nameEn: 'East Godavari', nameTe: 'తూర్పు గోదావరి', active: true },
  { id: 'dt-ap-wg', stateId: 'st-ap', nameEn: 'West Godavari', nameTe: 'పశ్చిమ గోదావరి', active: true },
  { id: 'dt-ap-krs', stateId: 'st-ap', nameEn: 'Krishna', nameTe: 'కృష్ణా', active: true },
  { id: 'dt-ap-knl', stateId: 'st-ap', nameEn: 'Kurnool', nameTe: 'కర్నూలు', active: true },
  { id: 'dt-ap-nlr', stateId: 'st-ap', nameEn: 'SPSR Nellore', nameTe: 'శ్రీ పొట్టి శ్రీరాములు నెల్లూరు', active: true },
  { id: 'dt-ap-atp', stateId: 'st-ap', nameEn: 'Anantapur', nameTe: 'అనంతపురం', active: true },
  { id: 'dt-ap-ctr', stateId: 'st-ap', nameEn: 'Chittoor', nameTe: 'చిత్తూరు', active: true },
  { id: 'dt-ap-kdp', stateId: 'st-ap', nameEn: 'YSR Kadapa', nameTe: 'వైఎస్ఆర్ కడప', active: true },
  { id: 'dt-ap-kkd', stateId: 'st-ap', nameEn: 'Kakinada', nameTe: 'కాకినాడ', active: true },
  { id: 'dt-ap-elr', stateId: 'st-ap', nameEn: 'Eluru', nameTe: 'ఏలూరు', active: true },
  { id: 'dt-ap-pkm', stateId: 'st-ap', nameEn: 'Prakasam', nameTe: 'ప్రకాశం', active: true },
  { id: 'dt-ap-skl', stateId: 'st-ap', nameEn: 'Srikakulam', nameTe: 'శ్రీకాకుళం', active: true },
  { id: 'dt-ap-vzm', stateId: 'st-ap', nameEn: 'Vizianagaram', nameTe: 'విజయనగరం', active: true },
  { id: 'dt-ap-akp', stateId: 'st-ap', nameEn: 'Anakapalli', nameTe: 'అనకాపల్లి', active: true },
  { id: 'dt-ap-asr', stateId: 'st-ap', nameEn: 'Alluri Sitharama Raju', nameTe: 'అల్లూరి సీతారామరాజు', active: true },
  { id: 'dt-ap-kns', stateId: 'st-ap', nameEn: 'Dr. B.R. Ambedkar Konaseema', nameTe: 'డా. బి.ఆర్. అంబేద్కర్ కోనసీమ', active: true },
  { id: 'dt-ap-bpt', stateId: 'st-ap', nameEn: 'Bapatla', nameTe: 'బాపట్ల', active: true },
  { id: 'dt-ap-pln', stateId: 'st-ap', nameEn: 'Palnadu', nameTe: 'పల్నాడు', active: true },
  { id: 'dt-ap-ndl', stateId: 'st-ap', nameEn: 'Nandyal', nameTe: 'నంద్యాల', active: true },
  { id: 'dt-ap-sss', stateId: 'st-ap', nameEn: 'Sri Sathya Sai', nameTe: 'శ్రీ సత్యసాయి', active: true },
  { id: 'dt-ap-anm', stateId: 'st-ap', nameEn: 'Annamayya', nameTe: 'అన్నమయ్య', active: true },
  { id: 'dt-ap-pvm', stateId: 'st-ap', nameEn: 'Parvathipuram Manyam', nameTe: 'పార్వతీపురం మన్యం', active: true },

  // Major Districts across all other Indian States & Union Territories
  { id: 'dt-dl-nd', stateId: 'st-dl', nameEn: 'New Delhi', nameTe: 'న్యూఢిల్లీ', active: true },
  { id: 'dt-dl-cd', stateId: 'st-dl', nameEn: 'Central Delhi', nameTe: 'సెంట్రల్ ఢిల్లీ', active: true },
  { id: 'dt-ka-blr', stateId: 'st-ka', nameEn: 'Bengaluru Urban', nameTe: 'బెంగళూరు అర్బన్', active: true },
  { id: 'dt-ka-mys', stateId: 'st-ka', nameEn: 'Mysuru', nameTe: 'మైసూరు', active: true },
  { id: 'dt-ka-blry', stateId: 'st-ka', nameEn: 'Ballari', nameTe: 'బళ్లారి', active: true },
  { id: 'dt-tn-chn', stateId: 'st-tn', nameEn: 'Chennai', nameTe: 'చెన్నై', active: true },
  { id: 'dt-tn-cbe', stateId: 'st-tn', nameEn: 'Coimbatore', nameTe: 'కోయంబత్తూరు', active: true },
  { id: 'dt-mh-mum', stateId: 'st-mh', nameEn: 'Mumbai City', nameTe: 'ముంబై సిటీ', active: true },
  { id: 'dt-mh-pun', stateId: 'st-mh', nameEn: 'Pune', nameTe: 'పుణె', active: true },
  { id: 'dt-mh-ngp', stateId: 'st-mh', nameEn: 'Nagpur', nameTe: 'నాగ్‌పూర్', active: true },
  { id: 'dt-kl-tvm', stateId: 'st-kl', nameEn: 'Thiruvananthapuram', nameTe: 'తిరువనంతపురం', active: true },
  { id: 'dt-kl-ekm', stateId: 'st-kl', nameEn: 'Ernakulam (Kochi)', nameTe: 'ఎర్నాకుళం (కొచ్చి)', active: true },
  { id: 'dt-od-khd', stateId: 'st-od', nameEn: 'Khordha (Bhubaneswar)', nameTe: 'ఖోర్ధా (భువనేశ్వర్)', active: true },
  { id: 'dt-od-gnj', stateId: 'st-od', nameEn: 'Ganjam', nameTe: 'గంజాం', active: true },
  { id: 'dt-wb-kol', stateId: 'st-wb', nameEn: 'Kolkata', nameTe: 'కోల్‌కతా', active: true },
  { id: 'dt-up-lko', stateId: 'st-up', nameEn: 'Lucknow', nameTe: 'లక్నో', active: true },
  { id: 'dt-up-vns', stateId: 'st-up', nameEn: 'Varanasi', nameTe: 'వారణాసి', active: true },
  { id: 'dt-gj-amd', stateId: 'st-gj', nameEn: 'Ahmedabad', nameTe: 'అహ్మదాబాద్', active: true },
  { id: 'dt-gj-srt', stateId: 'st-gj', nameEn: 'Surat', nameTe: 'సూరత్', active: true },
  { id: 'dt-rj-jpr', stateId: 'st-rj', nameEn: 'Jaipur', nameTe: 'జైపూర్', active: true },
  { id: 'dt-mp-bhp', stateId: 'st-mp', nameEn: 'Bhopal', nameTe: 'భోపాల్', active: true },
  { id: 'dt-br-ptn', stateId: 'st-br', nameEn: 'Patna', nameTe: 'పాట్నా', active: true },
  { id: 'dt-pb-ldh', stateId: 'st-pb', nameEn: 'Ludhiana', nameTe: 'లూధియానా', active: true },
  { id: 'dt-hr-ggn', stateId: 'st-hr', nameEn: 'Gurugram', nameTe: 'గురుగ్రామ్', active: true },
  { id: 'dt-as-kmr', stateId: 'st-as', nameEn: 'Kamrup Metropolitan (Guwahati)', nameTe: 'కామరూప్ మెట్రో (గౌహతి)', active: true },
  { id: 'dt-ct-rpr', stateId: 'st-ct', nameEn: 'Raipur', nameTe: 'రాయ్‌పూర్', active: true },
  { id: 'dt-jh-rnc', stateId: 'st-jh', nameEn: 'Ranchi', nameTe: 'రాంచీ', active: true },
  { id: 'dt-uk-ddn', stateId: 'st-uk', nameEn: 'Dehradun', nameTe: 'డెహ్రాడూన్', active: true },
  { id: 'dt-hp-sml', stateId: 'st-hp', nameEn: 'Shimla', nameTe: 'సిమ్లా', active: true },
  { id: 'dt-ga-ng', stateId: 'st-ga', nameEn: 'North Goa (Panaji)', nameTe: 'ఉత్తర గోవా (పనాజీ)', active: true },
  { id: 'dt-py-py', stateId: 'st-py', nameEn: 'Puducherry', nameTe: 'పుదుచ్చేరి', active: true },
  { id: 'dt-py-ynm', stateId: 'st-py', nameEn: 'Yanam', nameTe: 'యానాం', active: true },
  { id: 'dt-jk-sgr', stateId: 'st-jk', nameEn: 'Srinagar', nameTe: 'శ్రీనగర్', active: true },
  { id: 'dt-la-leh', stateId: 'st-la', nameEn: 'Leh', nameTe: 'లేహ్', active: true },
  { id: 'dt-ch-chd', stateId: 'st-ch', nameEn: 'Chandigarh', nameTe: 'చండీగఢ్', active: true },
  { id: 'dt-an-sa', stateId: 'st-an', nameEn: 'South Andaman (Port Blair)', nameTe: 'దక్షిణ అండమాన్', active: true },
  { id: 'dt-ar-pp', stateId: 'st-ar', nameEn: 'Papum Pare (Itanagar)', nameTe: 'పాపుమ్ పారే (ఇటానగర్)', active: true },
  { id: 'dt-mn-iw', stateId: 'st-mn', nameEn: 'Imphal West', nameTe: 'ఇంఫాల్ వెస్ట్', active: true },
  { id: 'dt-ml-ekh', stateId: 'st-ml', nameEn: 'East Khasi Hills (Shillong)', nameTe: 'ఈస్ట్ ఖాసీ హిల్స్', active: true },
  { id: 'dt-mz-azl', stateId: 'st-mz', nameEn: 'Aizawl', nameTe: 'ఐజ్వాల్', active: true },
  { id: 'dt-nl-khm', stateId: 'st-nl', nameEn: 'Kohima', nameTe: 'కోహిమా', active: true },
  { id: 'dt-sk-gtk', stateId: 'st-sk', nameEn: 'Gangtok', nameTe: 'గ్యాంగ్‌టక్', active: true },
  { id: 'dt-tr-wt', stateId: 'st-tr', nameEn: 'West Tripura (Agartala)', nameTe: 'వెస్ట్ త్రిపుర (అగర్తలా)', active: true },
  { id: 'dt-dn-dmn', stateId: 'st-dn', nameEn: 'Daman', nameTe: 'డామన్', active: true },
  { id: 'dt-ld-kvt', stateId: 'st-ld', nameEn: 'Lakshadweep (Kavaratti)', nameTe: 'లక్షద్వీప్ (కవరత్తి)', active: true },
];

import {
  TELANGANA_DISTRICT_MANDALS,
  ANDHRA_PRADESH_DISTRICT_MANDALS,
} from './tg-ap-mandals';

function slugifyMandalId(prefix: string, nameEn: string): string {
  const clean = nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${prefix}-${clean}`;
}

function buildStateMandals(
  stateId: string,
  districtMap: Record<string, Array<[string, string, string?]>>
): MandalRecord[] {
  const list: MandalRecord[] = [];
  for (const [districtId, tuples] of Object.entries(districtMap)) {
    const distShort = districtId.replace(/^dt-(tg|ap)-/, '');
    for (const [nameEn, nameTe, customId] of tuples) {
      list.push({
        id: customId || slugifyMandalId(`mn-${distShort}`, nameEn),
        stateId,
        districtId,
        nameEn,
        nameTe,
        divisionType: 'Mandal',
        active: true,
      });
    }
  }
  return list;
}

export const INITIAL_MANDALS: MandalRecord[] = [
  ...buildStateMandals('st-tg', TELANGANA_DISTRICT_MANDALS),
  ...buildStateMandals('st-ap', ANDHRA_PRADESH_DISTRICT_MANDALS),

  // National / Other States Tehsils, Taluks & Blocks
  { id: 'mn-dl-chanakyapuri', stateId: 'st-dl', districtId: 'dt-dl-nd', nameEn: 'Chanakyapuri', nameTe: 'చాణక్యపురి', divisionType: 'Tehsil', active: true },
  { id: 'mn-dl-parliament', stateId: 'st-dl', districtId: 'dt-dl-nd', nameEn: 'Parliament Street', nameTe: 'పార్లమెంట్ స్ట్రీట్', divisionType: 'Tehsil', active: true },
  { id: 'mn-ka-blr-north', stateId: 'st-ka', districtId: 'dt-ka-blr', nameEn: 'Bengaluru North', nameTe: 'బెంగళూరు నార్త్', divisionType: 'Taluk', active: true },
  { id: 'mn-ka-blr-south', stateId: 'st-ka', districtId: 'dt-ka-blr', nameEn: 'Bengaluru South', nameTe: 'బెంగళూరు సౌత్', divisionType: 'Taluk', active: true },
  { id: 'mn-tn-egmore', stateId: 'st-tn', districtId: 'dt-tn-chn', nameEn: 'Egmore', nameTe: 'ఎగ్మోర్', divisionType: 'Taluk', active: true },
  { id: 'mn-mh-fort', stateId: 'st-mh', districtId: 'dt-mh-mum', nameEn: 'Fort / Colaba', nameTe: 'ఫోర్ట్ / కొలాబా', divisionType: 'Taluk', active: true },
];

/**
 * Ensures every district in India has accessible Mandals/Tehsils/Taluks/Blocks,
 * combining explicitly stored mandals with headquarters/urban/rural divisions when needed.
 */
export function getMandalsForDistrict(
  districtId: string,
  allMandals: MandalRecord[],
  allDistricts: DistrictRecord[],
  allStates: StateRecord[]
): MandalRecord[] {
  const explicit = allMandals.filter((m) => m.districtId === districtId && m.active);
  if (explicit.length > 0) {
    return explicit;
  }

  const district = allDistricts.find((d) => d.id === districtId);
  if (!district) return [];
  const state = allStates.find((s) => s.id === district.stateId);
  const term = state?.subdivisionTerm || 'Mandal';

  return [
    {
      id: `mn-${district.id}-hq`,
      stateId: district.stateId,
      districtId: district.id,
      nameEn: `${district.nameEn} Urban (${term})`,
      nameTe: `${district.nameTe} అర్బన్`,
      divisionType: term,
      active: true,
    },
    {
      id: `mn-${district.id}-rural`,
      stateId: district.stateId,
      districtId: district.id,
      nameEn: `${district.nameEn} Rural (${term})`,
      nameTe: `${district.nameTe} రూరల్`,
      divisionType: term,
      active: true,
    },
  ];
}
