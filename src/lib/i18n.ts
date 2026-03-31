// Language Translations — 10 Languages
// India: Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali
// International: English, Spanish, Arabic, Chinese

export type LangCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'bn' | 'es' | 'ar' | 'zh'

export interface Language {
  code: LangCode
  name: string
  native: string
  flag: string
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
]

type TranslationKeys = {
  // Navbar
  home: string
  about: string
  features: string
  tokenomics: string
  roadmap: string
  community: string
  joinNow: string
  dashboard: string
  wallet: string
  network: string
  profile: string
  logout: string

  // Hero
  heroTitle: string
  heroSubtitle: string
  heroDesc: string
  exploreFeatures: string

  // Dashboard
  welcomeBack: string
  totalBalance: string
  brsBalance: string
  usdtBalance: string
  referralLink: string
  shareInvite: string
  copyLink: string
  copied: string
  teamSize: string
  activeMembers: string
  totalEarnings: string
  quickActions: string
  transfer: string
  withdraw: string
  earnings: string
  transactions: string
  leaderboard: string
  activate: string

  // Auth
  signIn: string
  signUp: string
  createAccount: string
  forgotPassword: string
  resetPassword: string
  email: string
  password: string
  username: string
  fullName: string
  phoneNumber: string
  referralCode: string
  sendResetLink: string
  backToSignIn: string
  dontHaveAccount: string
  alreadyHaveAccount: string

  // Profile
  myProfile: string
  saveProfile: string
  changePassword: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  updatePassword: string
  walletAddress: string
  joinedDate: string

  // Staking
  stakingComingSoon: string
  comingPhase4: string

  // General
  loading: string
  error: string
  success: string
  cancel: string
  confirm: string
  save: string
  close: string
  viewAll: string
  comingSoon: string
  active: string
  inactive: string
}

const translations: Record<LangCode, TranslationKeys> = {
  en: {
    home: 'Home', about: 'About', features: 'Features', tokenomics: 'Tokenomics',
    roadmap: 'Roadmap', community: 'Community', joinNow: 'Join Now',
    dashboard: 'Dashboard', wallet: 'Wallet', network: 'Network', profile: 'Profile', logout: 'Logout',
    heroTitle: 'Bharos Exchange', heroSubtitle: 'Trustworthy Crypto for Everyone',
    heroDesc: 'A community-driven digital finance ecosystem powered by BRS Coin',
    exploreFeatures: 'Explore Features',
    welcomeBack: 'Welcome Back', totalBalance: 'Total Balance', brsBalance: 'BRS Balance',
    usdtBalance: 'USDT Balance', referralLink: 'Your Referral Link', shareInvite: 'Share & Invite Friends',
    copyLink: 'Copy', copied: 'Copied!', teamSize: 'Team Size', activeMembers: 'Active Members',
    totalEarnings: 'Total Earnings', quickActions: 'Quick Actions', transfer: 'Transfer',
    withdraw: 'Withdraw', earnings: 'Earnings', transactions: 'Transactions',
    leaderboard: 'Leaderboard', activate: 'Activate',
    signIn: 'Sign In', signUp: 'Sign up', createAccount: 'Create Account',
    forgotPassword: 'Forgot Password?', resetPassword: 'Reset Password',
    email: 'Enter your email', password: 'Enter password', username: 'Username',
    fullName: 'Full Name', phoneNumber: 'Phone Number', referralCode: 'Referral Code (Required)',
    sendResetLink: 'Send Reset Link', backToSignIn: 'Back to Sign In',
    dontHaveAccount: "Don't have an account?", alreadyHaveAccount: 'Already have an account?',
    myProfile: 'My Profile', saveProfile: 'Save Profile', changePassword: 'Change Password',
    currentPassword: 'Current Password', newPassword: 'New Password',
    confirmPassword: 'Confirm New Password', updatePassword: 'Update Password',
    walletAddress: 'BEP20 Wallet Address', joinedDate: 'Joined Date',
    stakingComingSoon: 'Staking — Coming Soon', comingPhase4: 'Coming in Phase 4',
    loading: 'Loading...', error: 'Error', success: 'Success', cancel: 'Cancel',
    confirm: 'Confirm', save: 'Save', close: 'Close', viewAll: 'View All',
    comingSoon: 'Coming Soon', active: 'Active', inactive: 'Inactive',
  },

  te: {
    home: 'హోమ్', about: 'గురించి', features: 'ఫీచర్లు', tokenomics: 'టోకెనోమిక్స్',
    roadmap: 'రోడ్‌మ్యాప్', community: 'కమ్యూనిటీ', joinNow: 'చేరండి',
    dashboard: 'డాష్‌బోర్డ్', wallet: 'వాలెట్', network: 'నెట్‌వర్క్', profile: 'ప్రొఫైల్', logout: 'లాగ్‌అవుట్',
    heroTitle: 'భరోస్ ఎక్స్ఛేంజ్', heroSubtitle: 'అందరి కోసం నమ్మకమైన క్రిప్టో',
    heroDesc: 'BRS కాయిన్ ద్వారా నడిచే కమ్యూనిటీ ఆధారిత డిజిటల్ ఫైనాన్స్',
    exploreFeatures: 'ఫీచర్లు చూడండి',
    welcomeBack: 'తిరిగి స్వాగతం', totalBalance: 'మొత్తం బ్యాలెన్స్', brsBalance: 'BRS బ్యాలెన్స్',
    usdtBalance: 'USDT బ్యాలెన్స్', referralLink: 'మీ రిఫరల్ లింక్', shareInvite: 'షేర్ చేయండి & స్నేహితులను ఆహ్వానించండి',
    copyLink: 'కాపీ', copied: 'కాపీ అయింది!', teamSize: 'టీమ్ సైజ్', activeMembers: 'యాక్టివ్ సభ్యులు',
    totalEarnings: 'మొత్తం ఆదాయాలు', quickActions: 'త్వరిత చర్యలు', transfer: 'ట్రాన్స్‌ఫర్',
    withdraw: 'విత్‌డ్రా', earnings: 'ఆదాయాలు', transactions: 'లావాదేవీలు',
    leaderboard: 'లీడర్‌బోర్డ్', activate: 'యాక్టివేట్',
    signIn: 'సైన్ ఇన్', signUp: 'సైన్ అప్', createAccount: 'ఖాతా సృష్టించండి',
    forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?', resetPassword: 'పాస్‌వర్డ్ రీసెట్',
    email: 'మీ ఇమెయిల్ ఎంటర్ చేయండి', password: 'పాస్‌వర్డ్ ఎంటర్ చేయండి', username: 'యూజర్‌నేమ్',
    fullName: 'పూర్తి పేరు', phoneNumber: 'ఫోన్ నంబర్', referralCode: 'రిఫరల్ కోడ్ (తప్పనిసరి)',
    sendResetLink: 'రీసెట్ లింక్ పంపండి', backToSignIn: 'సైన్ ఇన్‌కి తిరిగి',
    dontHaveAccount: 'ఖాతా లేదా?', alreadyHaveAccount: 'ఖాతా ఉందా?',
    myProfile: 'నా ప్రొఫైల్', saveProfile: 'ప్రొఫైల్ సేవ్', changePassword: 'పాస్‌వర్డ్ మార్చండి',
    currentPassword: 'ప్రస్తుత పాస్‌వర్డ్', newPassword: 'కొత్త పాస్‌వర్డ్',
    confirmPassword: 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి', updatePassword: 'పాస్‌వర్డ్ అప్‌డేట్',
    walletAddress: 'BEP20 వాలెట్ అడ్రస్', joinedDate: 'చేరిన తేదీ',
    stakingComingSoon: 'స్టేకింగ్ — త్వరలో', comingPhase4: 'ఫేజ్ 4 లో వస్తుంది',
    loading: 'లోడ్ అవుతోంది...', error: 'ఎర్రర్', success: 'విజయం', cancel: 'రద్దు',
    confirm: 'నిర్ధారించు', save: 'సేవ్', close: 'మూసివేయి', viewAll: 'అన్నీ చూడండి',
    comingSoon: 'త్వరలో', active: 'యాక్టివ్', inactive: 'ఇన్‌యాక్టివ్',
  },

  hi: {
    home: 'होम', about: 'जानकारी', features: 'फीचर्स', tokenomics: 'टोकनोमिक्स',
    roadmap: 'रोडमैप', community: 'कम्युनिटी', joinNow: 'अभी जुड़ें',
    dashboard: 'डैशबोर्ड', wallet: 'वॉलेट', network: 'नेटवर्क', profile: 'प्रोफ़ाइल', logout: 'लॉगआउट',
    heroTitle: 'भरोस एक्सचेंज', heroSubtitle: 'सभी के लिए भरोसेमंद क्रिप्टो',
    heroDesc: 'BRS कॉइन द्वारा संचालित कम्युनिटी-ड्रिवन डिजिटल फाइनेंस',
    exploreFeatures: 'फीचर्स देखें',
    welcomeBack: 'वापसी पर स्वागत', totalBalance: 'कुल बैलेंस', brsBalance: 'BRS बैलेंस',
    usdtBalance: 'USDT बैलेंस', referralLink: 'आपका रेफरल लिंक', shareInvite: 'शेयर करें और दोस्तों को आमंत्रित करें',
    copyLink: 'कॉपी', copied: 'कॉपी हुआ!', teamSize: 'टीम साइज़', activeMembers: 'एक्टिव सदस्य',
    totalEarnings: 'कुल कमाई', quickActions: 'क्विक एक्शन', transfer: 'ट्रांसफर',
    withdraw: 'निकासी', earnings: 'कमाई', transactions: 'लेनदेन',
    leaderboard: 'लीडरबोर्ड', activate: 'एक्टिवेट',
    signIn: 'साइन इन', signUp: 'साइन अप', createAccount: 'खाता बनाएं',
    forgotPassword: 'पासवर्ड भूल गए?', resetPassword: 'पासवर्ड रीसेट',
    email: 'ईमेल दर्ज करें', password: 'पासवर्ड दर्ज करें', username: 'यूजरनेम',
    fullName: 'पूरा नाम', phoneNumber: 'फोन नंबर', referralCode: 'रेफरल कोड (अनिवार्य)',
    sendResetLink: 'रीसेट लिंक भेजें', backToSignIn: 'साइन इन पर वापस',
    dontHaveAccount: 'खाता नहीं है?', alreadyHaveAccount: 'पहले से खाता है?',
    myProfile: 'मेरी प्रोफ़ाइल', saveProfile: 'प्रोफ़ाइल सेव', changePassword: 'पासवर्ड बदलें',
    currentPassword: 'मौजूदा पासवर्ड', newPassword: 'नया पासवर्ड',
    confirmPassword: 'नया पासवर्ड पुष्टि करें', updatePassword: 'पासवर्ड अपडेट',
    walletAddress: 'BEP20 वॉलेट एड्रेस', joinedDate: 'जुड़ने की तारीख',
    stakingComingSoon: 'स्टेकिंग — जल्द आ रहा', comingPhase4: 'फेज़ 4 में आएगा',
    loading: 'लोड हो रहा...', error: 'त्रुटि', success: 'सफल', cancel: 'रद्द',
    confirm: 'पुष्टि', save: 'सेव', close: 'बंद', viewAll: 'सभी देखें',
    comingSoon: 'जल्द आ रहा', active: 'एक्टिव', inactive: 'इनएक्टिव',
  },

  ta: {
    home: 'முகப்பு', about: 'பற்றி', features: 'அம்சங்கள்', tokenomics: 'டோக்கனோமிக்ஸ்',
    roadmap: 'ரோட்மேப்', community: 'சமூகம்', joinNow: 'இப்போது சேரு',
    dashboard: 'டாஷ்போர்ட்', wallet: 'வாலட்', network: 'நெட்வொர்க்', profile: 'சுயவிவரம்', logout: 'வெளியேறு',
    heroTitle: 'பரோஸ் எக்ஸ்சேஞ்ச்', heroSubtitle: 'அனைவருக்கும் நம்பகமான கிரிப்டோ',
    heroDesc: 'BRS காயின் மூலம் இயங்கும் சமூக அடிப்படையிலான டிஜிட்டல் நிதி',
    exploreFeatures: 'அம்சங்களை காண',
    welcomeBack: 'மீண்டும் வருக', totalBalance: 'மொத்த இருப்பு', brsBalance: 'BRS இருப்பு',
    usdtBalance: 'USDT இருப்பு', referralLink: 'உங்கள் ரெஃபரல் இணைப்பு', shareInvite: 'பகிர்ந்து நண்பர்களை அழை',
    copyLink: 'நகலெடு', copied: 'நகல் ஆனது!', teamSize: 'குழு அளவு', activeMembers: 'செயலில் உறுப்பினர்கள்',
    totalEarnings: 'மொத்த வருமானம்', quickActions: 'விரைவு செயல்கள்', transfer: 'பரிமாற்றம்',
    withdraw: 'திரும்பப்பெறு', earnings: 'வருமானம்', transactions: 'பரிவர்த்தனைகள்',
    leaderboard: 'லீடர்போர்ட்', activate: 'செயல்படுத்து',
    signIn: 'உள்நுழை', signUp: 'பதிவு செய்', createAccount: 'கணக்கு உருவாக்கு',
    forgotPassword: 'கடவுச்சொல் மறந்தீர்களா?', resetPassword: 'கடவுச்சொல் மீட்டமை',
    email: 'மின்னஞ்சல் உள்ளிடு', password: 'கடவுச்சொல் உள்ளிடு', username: 'பயனர் பெயர்',
    fullName: 'முழு பெயர்', phoneNumber: 'தொலைபேசி எண்', referralCode: 'ரெஃபரல் குறியீடு (கட்டாயம்)',
    sendResetLink: 'மீட்டமைப்பு இணைப்பு அனுப்பு', backToSignIn: 'உள்நுழைவுக்கு திரும்பு',
    dontHaveAccount: 'கணக்கு இல்லையா?', alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    myProfile: 'என் சுயவிவரம்', saveProfile: 'சுயவிவரம் சேமி', changePassword: 'கடவுச்சொல் மாற்று',
    currentPassword: 'தற்போதைய கடவுச்சொல்', newPassword: 'புதிய கடவுச்சொல்',
    confirmPassword: 'புதிய கடவுச்சொல் உறுதிப்படுத்து', updatePassword: 'கடவுச்சொல் புதுப்பி',
    walletAddress: 'BEP20 வாலட் முகவரி', joinedDate: 'சேர்ந்த தேதி',
    stakingComingSoon: 'ஸ்டேக்கிங் — விரைவில்', comingPhase4: 'பேஸ் 4 இல் வருகிறது',
    loading: 'ஏற்றுகிறது...', error: 'பிழை', success: 'வெற்றி', cancel: 'ரத்து',
    confirm: 'உறுதிப்படுத்து', save: 'சேமி', close: 'மூடு', viewAll: 'அனைத்தும் காண',
    comingSoon: 'விரைவில்', active: 'செயலில்', inactive: 'செயலற்ற',
  },

  kn: {
    home: 'ಮುಖಪುಟ', about: 'ಬಗ್ಗೆ', features: 'ವೈಶಿಷ್ಟ್ಯಗಳು', tokenomics: 'ಟೋಕೆನೋಮಿಕ್ಸ್',
    roadmap: 'ರೋಡ್‌ಮ್ಯಾಪ್', community: 'ಸಮುದಾಯ', joinNow: 'ಈಗ ಸೇರಿ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', wallet: 'ವಾಲೆಟ್', network: 'ನೆಟ್‌ವರ್ಕ್', profile: 'ಪ್ರೊಫೈಲ್', logout: 'ಲಾಗ್‌ಔಟ್',
    heroTitle: 'ಭರೋಸ್ ಎಕ್ಸ್‌ಚೇಂಜ್', heroSubtitle: 'ಎಲ್ಲರಿಗೂ ನಂಬಿಕಸ್ಥ ಕ್ರಿಪ್ಟೋ',
    heroDesc: 'BRS ಕಾಯಿನ್ ಮೂಲಕ ನಡೆಯುವ ಸಮುದಾಯ ಆಧಾರಿತ ಡಿಜಿಟಲ್ ಹಣಕಾಸು',
    exploreFeatures: 'ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ನೋಡಿ',
    welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ', totalBalance: 'ಒಟ್ಟು ಬ್ಯಾಲೆನ್ಸ್', brsBalance: 'BRS ಬ್ಯಾಲೆನ್ಸ್',
    usdtBalance: 'USDT ಬ್ಯಾಲೆನ್ಸ್', referralLink: 'ನಿಮ್ಮ ರೆಫರಲ್ ಲಿಂಕ್', shareInvite: 'ಹಂಚಿಕೊಳ್ಳಿ & ಸ್ನೇಹಿತರನ್ನು ಆಹ್ವಾನಿಸಿ',
    copyLink: 'ನಕಲಿಸಿ', copied: 'ನಕಲಾಯಿತು!', teamSize: 'ತಂಡ ಗಾತ್ರ', activeMembers: 'ಸಕ್ರಿಯ ಸದಸ್ಯರು',
    totalEarnings: 'ಒಟ್ಟು ಗಳಿಕೆ', quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು', transfer: 'ವರ್ಗಾವಣೆ',
    withdraw: 'ಹಿಂಪಡೆಯಿರಿ', earnings: 'ಗಳಿಕೆ', transactions: 'ವಹಿವಾಟುಗಳು',
    leaderboard: 'ಲೀಡರ್‌ಬೋರ್ಡ್', activate: 'ಸಕ್ರಿಯಗೊಳಿಸಿ',
    signIn: 'ಸೈನ್ ಇನ್', signUp: 'ಸೈನ್ ಅಪ್', createAccount: 'ಖಾತೆ ರಚಿಸಿ',
    forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ?', resetPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ',
    email: 'ಇಮೇಲ್ ನಮೂದಿಸಿ', password: 'ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ', username: 'ಬಳಕೆದಾರ ಹೆಸರು',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು', phoneNumber: 'ಫೋನ್ ನಂಬರ್', referralCode: 'ರೆಫರಲ್ ಕೋಡ್ (ಕಡ್ಡಾಯ)',
    sendResetLink: 'ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಿ', backToSignIn: 'ಸೈನ್ ಇನ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    dontHaveAccount: 'ಖಾತೆ ಇಲ್ಲವೇ?', alreadyHaveAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
    myProfile: 'ನನ್ನ ಪ್ರೊಫೈಲ್', saveProfile: 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ', changePassword: 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ',
    currentPassword: 'ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್', newPassword: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್',
    confirmPassword: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಖಚಿತಪಡಿಸಿ', updatePassword: 'ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ',
    walletAddress: 'BEP20 ವಾಲೆಟ್ ವಿಳಾಸ', joinedDate: 'ಸೇರಿದ ದಿನಾಂಕ',
    stakingComingSoon: 'ಸ್ಟೇಕಿಂಗ್ — ಶೀಘ್ರದಲ್ಲಿ', comingPhase4: 'ಹಂತ 4 ರಲ್ಲಿ ಬರುತ್ತದೆ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', error: 'ದೋಷ', success: 'ಯಶಸ್ಸು', cancel: 'ರದ್ದುಮಾಡಿ',
    confirm: 'ಖಚಿತಪಡಿಸಿ', save: 'ಉಳಿಸಿ', close: 'ಮುಚ್ಚಿ', viewAll: 'ಎಲ್ಲಾ ನೋಡಿ',
    comingSoon: 'ಶೀಘ್ರದಲ್ಲಿ', active: 'ಸಕ್ರಿಯ', inactive: 'ನಿಷ್ಕ್ರಿಯ',
  },

  ml: {
    home: 'ഹോം', about: 'കുറിച്ച്', features: 'ഫീച്ചറുകൾ', tokenomics: 'ടോക്കണോമിക്സ്',
    roadmap: 'റോഡ്‌മാപ്പ്', community: 'കമ്മ്യൂണിറ്റി', joinNow: 'ഇപ്പോൾ ചേരൂ',
    dashboard: 'ഡാഷ്‌ബോർഡ്', wallet: 'വാലറ്റ്', network: 'നെറ്റ്‌വർക്ക്', profile: 'പ്രൊഫൈൽ', logout: 'ലോഗൌട്ട്',
    heroTitle: 'ഭരോസ് എക്സ്ചേഞ്ച്', heroSubtitle: 'എല്ലാവർക്കും വിശ്വസനീയ ക്രിപ്‌റ്റോ',
    heroDesc: 'BRS കോയിൻ മുഖേന പ്രവർത്തിക്കുന്ന കമ്മ്യൂണിറ്റി ഡിജിറ്റൽ ഫിനാൻസ്',
    exploreFeatures: 'ഫീച്ചറുകൾ കാണുക',
    welcomeBack: 'തിരികെ സ്വാഗതം', totalBalance: 'ആകെ ബാലൻസ്', brsBalance: 'BRS ബാലൻസ്',
    usdtBalance: 'USDT ബാലൻസ്', referralLink: 'നിങ്ങളുടെ റഫറൽ ലിങ്ക്', shareInvite: 'പങ്കിടുക & സുഹൃത്തുക്കളെ ക്ഷണിക്കുക',
    copyLink: 'പകർത്തുക', copied: 'പകർത്തി!', teamSize: 'ടീം വലിപ്പം', activeMembers: 'ആക്ടീവ് അംഗങ്ങൾ',
    totalEarnings: 'ആകെ വരുമാനം', quickActions: 'ദ്രുത പ്രവർത്തനങ്ങൾ', transfer: 'ട്രാൻസ്ഫർ',
    withdraw: 'പിൻവലിക്കുക', earnings: 'വരുമാനം', transactions: 'ഇടപാടുകൾ',
    leaderboard: 'ലീഡർബോർഡ്', activate: 'ആക്ടിവേറ്റ്',
    signIn: 'സൈൻ ഇൻ', signUp: 'സൈൻ അപ്പ്', createAccount: 'അക്കൗണ്ട് ഉണ്ടാക്കുക',
    forgotPassword: 'പാസ്‌വേഡ് മറന്നോ?', resetPassword: 'പാസ്‌വേഡ് റീസെറ്റ്',
    email: 'ഇമെയിൽ നൽകുക', password: 'പാസ്‌വേഡ് നൽകുക', username: 'ഉപയോക്തൃനാമം',
    fullName: 'മുഴുവൻ പേര്', phoneNumber: 'ഫോൺ നമ്പർ', referralCode: 'റഫറൽ കോഡ് (നിർബന്ധം)',
    sendResetLink: 'റീസെറ്റ് ലിങ്ക് അയയ്ക്കുക', backToSignIn: 'സൈൻ ഇൻ-ലേക്ക് മടങ്ങുക',
    dontHaveAccount: 'അക്കൗണ്ട് ഇല്ലേ?', alreadyHaveAccount: 'ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?',
    myProfile: 'എന്റെ പ്രൊഫൈൽ', saveProfile: 'പ്രൊഫൈൽ സേവ്', changePassword: 'പാസ്‌വേഡ് മാറ്റുക',
    currentPassword: 'നിലവിലെ പാസ്‌വേഡ്', newPassword: 'പുതിയ പാസ്‌വേഡ്',
    confirmPassword: 'പുതിയ പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക', updatePassword: 'പാസ്‌വേഡ് അപ്‌ഡേറ്റ്',
    walletAddress: 'BEP20 വാലറ്റ് വിലാസം', joinedDate: 'ചേർന്ന തീയതി',
    stakingComingSoon: 'സ്റ്റേക്കിംഗ് — ഉടൻ', comingPhase4: 'ഫേസ് 4-ൽ വരും',
    loading: 'ലോഡ് ചെയ്യുന്നു...', error: 'പിശക്', success: 'വിജയം', cancel: 'റദ്ദാക്കുക',
    confirm: 'സ്ഥിരീകരിക്കുക', save: 'സേവ്', close: 'അടയ്ക്കുക', viewAll: 'എല്ലാം കാണുക',
    comingSoon: 'ഉടൻ', active: 'ആക്ടീവ്', inactive: 'ഇൻആക്ടീവ്',
  },

  bn: {
    home: 'হোম', about: 'সম্পর্কে', features: 'বৈশিষ্ট্য', tokenomics: 'টোকেনোমিক্স',
    roadmap: 'রোডম্যাপ', community: 'কমিউনিটি', joinNow: 'এখন যোগ দিন',
    dashboard: 'ড্যাশবোর্ড', wallet: 'ওয়ালেট', network: 'নেটওয়ার্ক', profile: 'প্রোফাইল', logout: 'লগআউট',
    heroTitle: 'ভারোস এক্সচেঞ্জ', heroSubtitle: 'সবার জন্য বিশ্বস্ত ক্রিপ্টো',
    heroDesc: 'BRS কয়েন দ্বারা চালিত কমিউনিটি ভিত্তিক ডিজিটাল ফাইন্যান্স',
    exploreFeatures: 'বৈশিষ্ট্য দেখুন',
    welcomeBack: 'ফিরে আসার স্বাগত', totalBalance: 'মোট ব্যালেন্স', brsBalance: 'BRS ব্যালেন্স',
    usdtBalance: 'USDT ব্যালেন্স', referralLink: 'আপনার রেফারেল লিংক', shareInvite: 'শেয়ার করুন ও বন্ধুদের আমন্ত্রণ জানান',
    copyLink: 'কপি', copied: 'কপি হয়েছে!', teamSize: 'টিম সাইজ', activeMembers: 'সক্রিয় সদস্য',
    totalEarnings: 'মোট আয়', quickActions: 'দ্রুত কার্য', transfer: 'ট্রান্সফার',
    withdraw: 'উত্তোলন', earnings: 'আয়', transactions: 'লেনদেন',
    leaderboard: 'লিডারবোর্ড', activate: 'সক্রিয় করুন',
    signIn: 'সাইন ইন', signUp: 'সাইন আপ', createAccount: 'অ্যাকাউন্ট তৈরি করুন',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?', resetPassword: 'পাসওয়ার্ড রিসেট',
    email: 'ইমেইল দিন', password: 'পাসওয়ার্ড দিন', username: 'ইউজারনেম',
    fullName: 'পূর্ণ নাম', phoneNumber: 'ফোন নম্বর', referralCode: 'রেফারেল কোড (বাধ্যতামূলক)',
    sendResetLink: 'রিসেট লিংক পাঠান', backToSignIn: 'সাইন ইন-এ ফিরে যান',
    dontHaveAccount: 'অ্যাকাউন্ট নেই?', alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    myProfile: 'আমার প্রোফাইল', saveProfile: 'প্রোফাইল সেভ', changePassword: 'পাসওয়ার্ড পরিবর্তন',
    currentPassword: 'বর্তমান পাসওয়ার্ড', newPassword: 'নতুন পাসওয়ার্ড',
    confirmPassword: 'নতুন পাসওয়ার্ড নিশ্চিত করুন', updatePassword: 'পাসওয়ার্ড আপডেট',
    walletAddress: 'BEP20 ওয়ালেট ঠিকানা', joinedDate: 'যোগদানের তারিখ',
    stakingComingSoon: 'স্টেকিং — শীঘ্রই', comingPhase4: 'ফেজ ৪-এ আসবে',
    loading: 'লোড হচ্ছে...', error: 'ত্রুটি', success: 'সফল', cancel: 'বাতিল',
    confirm: 'নিশ্চিত', save: 'সেভ', close: 'বন্ধ', viewAll: 'সব দেখুন',
    comingSoon: 'শীঘ্রই', active: 'সক্রিয়', inactive: 'নিষ্ক্রিয়',
  },

  es: {
    home: 'Inicio', about: 'Acerca de', features: 'Características', tokenomics: 'Tokenomics',
    roadmap: 'Hoja de Ruta', community: 'Comunidad', joinNow: 'Únete Ahora',
    dashboard: 'Panel', wallet: 'Billetera', network: 'Red', profile: 'Perfil', logout: 'Cerrar Sesión',
    heroTitle: 'Bharos Exchange', heroSubtitle: 'Cripto Confiable para Todos',
    heroDesc: 'Ecosistema financiero digital impulsado por BRS Coin',
    exploreFeatures: 'Explorar Funciones',
    welcomeBack: 'Bienvenido de Nuevo', totalBalance: 'Balance Total', brsBalance: 'Balance BRS',
    usdtBalance: 'Balance USDT', referralLink: 'Tu Enlace de Referencia', shareInvite: 'Comparte e Invita Amigos',
    copyLink: 'Copiar', copied: '¡Copiado!', teamSize: 'Tamaño del Equipo', activeMembers: 'Miembros Activos',
    totalEarnings: 'Ganancias Totales', quickActions: 'Acciones Rápidas', transfer: 'Transferir',
    withdraw: 'Retirar', earnings: 'Ganancias', transactions: 'Transacciones',
    leaderboard: 'Tabla de Líderes', activate: 'Activar',
    signIn: 'Iniciar Sesión', signUp: 'Registrarse', createAccount: 'Crear Cuenta',
    forgotPassword: '¿Olvidaste tu contraseña?', resetPassword: 'Restablecer Contraseña',
    email: 'Ingresa tu email', password: 'Ingresa contraseña', username: 'Nombre de usuario',
    fullName: 'Nombre Completo', phoneNumber: 'Número de Teléfono', referralCode: 'Código de Referencia (Obligatorio)',
    sendResetLink: 'Enviar Enlace', backToSignIn: 'Volver a Iniciar Sesión',
    dontHaveAccount: '¿No tienes cuenta?', alreadyHaveAccount: '¿Ya tienes cuenta?',
    myProfile: 'Mi Perfil', saveProfile: 'Guardar Perfil', changePassword: 'Cambiar Contraseña',
    currentPassword: 'Contraseña Actual', newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Nueva Contraseña', updatePassword: 'Actualizar Contraseña',
    walletAddress: 'Dirección de Billetera BEP20', joinedDate: 'Fecha de Registro',
    stakingComingSoon: 'Staking — Próximamente', comingPhase4: 'Viene en Fase 4',
    loading: 'Cargando...', error: 'Error', success: 'Éxito', cancel: 'Cancelar',
    confirm: 'Confirmar', save: 'Guardar', close: 'Cerrar', viewAll: 'Ver Todo',
    comingSoon: 'Próximamente', active: 'Activo', inactive: 'Inactivo',
  },

  ar: {
    home: 'الرئيسية', about: 'حول', features: 'الميزات', tokenomics: 'اقتصاد التوكن',
    roadmap: 'خريطة الطريق', community: 'المجتمع', joinNow: 'انضم الآن',
    dashboard: 'لوحة التحكم', wallet: 'المحفظة', network: 'الشبكة', profile: 'الملف الشخصي', logout: 'تسجيل الخروج',
    heroTitle: 'بهاروس اكستشينج', heroSubtitle: 'تشفير موثوق للجميع',
    heroDesc: 'نظام مالي رقمي مدعوم بعملة BRS',
    exploreFeatures: 'استكشف الميزات',
    welcomeBack: 'مرحباً بعودتك', totalBalance: 'الرصيد الإجمالي', brsBalance: 'رصيد BRS',
    usdtBalance: 'رصيد USDT', referralLink: 'رابط الإحالة', shareInvite: 'شارك وادعُ أصدقاءك',
    copyLink: 'نسخ', copied: 'تم النسخ!', teamSize: 'حجم الفريق', activeMembers: 'الأعضاء النشطون',
    totalEarnings: 'إجمالي الأرباح', quickActions: 'إجراءات سريعة', transfer: 'تحويل',
    withdraw: 'سحب', earnings: 'الأرباح', transactions: 'المعاملات',
    leaderboard: 'لوحة المتصدرين', activate: 'تفعيل',
    signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب', createAccount: 'إنشاء حساب',
    forgotPassword: 'نسيت كلمة المرور؟', resetPassword: 'إعادة تعيين كلمة المرور',
    email: 'أدخل بريدك الإلكتروني', password: 'أدخل كلمة المرور', username: 'اسم المستخدم',
    fullName: 'الاسم الكامل', phoneNumber: 'رقم الهاتف', referralCode: 'رمز الإحالة (مطلوب)',
    sendResetLink: 'إرسال رابط الإعادة', backToSignIn: 'العودة لتسجيل الدخول',
    dontHaveAccount: 'ليس لديك حساب؟', alreadyHaveAccount: 'لديك حساب بالفعل؟',
    myProfile: 'ملفي الشخصي', saveProfile: 'حفظ الملف', changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور الجديدة', updatePassword: 'تحديث كلمة المرور',
    walletAddress: 'عنوان محفظة BEP20', joinedDate: 'تاريخ الانضمام',
    stakingComingSoon: 'التخزين — قريباً', comingPhase4: 'قادم في المرحلة 4',
    loading: 'جاري التحميل...', error: 'خطأ', success: 'نجاح', cancel: 'إلغاء',
    confirm: 'تأكيد', save: 'حفظ', close: 'إغلاق', viewAll: 'مشاهدة الكل',
    comingSoon: 'قريباً', active: 'نشط', inactive: 'غير نشط',
  },

  zh: {
    home: '首页', about: '关于', features: '功能', tokenomics: '代币经济学',
    roadmap: '路线图', community: '社区', joinNow: '立即加入',
    dashboard: '仪表板', wallet: '钱包', network: '网络', profile: '个人资料', logout: '退出登录',
    heroTitle: 'Bharos Exchange', heroSubtitle: '值得信赖的加密货币',
    heroDesc: '由BRS币驱动的社区数字金融生态系统',
    exploreFeatures: '探索功能',
    welcomeBack: '欢迎回来', totalBalance: '总余额', brsBalance: 'BRS余额',
    usdtBalance: 'USDT余额', referralLink: '您的推荐链接', shareInvite: '分享并邀请朋友',
    copyLink: '复制', copied: '已复制！', teamSize: '团队规模', activeMembers: '活跃成员',
    totalEarnings: '总收益', quickActions: '快捷操作', transfer: '转账',
    withdraw: '提现', earnings: '收益', transactions: '交易记录',
    leaderboard: '排行榜', activate: '激活',
    signIn: '登录', signUp: '注册', createAccount: '创建账户',
    forgotPassword: '忘记密码？', resetPassword: '重置密码',
    email: '输入邮箱', password: '输入密码', username: '用户名',
    fullName: '全名', phoneNumber: '电话号码', referralCode: '推荐码（必填）',
    sendResetLink: '发送重置链接', backToSignIn: '返回登录',
    dontHaveAccount: '没有账户？', alreadyHaveAccount: '已有账户？',
    myProfile: '我的资料', saveProfile: '保存资料', changePassword: '修改密码',
    currentPassword: '当前密码', newPassword: '新密码',
    confirmPassword: '确认新密码', updatePassword: '更新密码',
    walletAddress: 'BEP20钱包地址', joinedDate: '注册日期',
    stakingComingSoon: '质押 — 即将推出', comingPhase4: '第4阶段推出',
    loading: '加载中...', error: '错误', success: '成功', cancel: '取消',
    confirm: '确认', save: '保存', close: '关闭', viewAll: '查看全部',
    comingSoon: '即将推出', active: '活跃', inactive: '未活跃',
  },
}

// Get saved language or default to English
export function getLang(): LangCode {
  const saved = localStorage.getItem('bharos_lang')
  if (saved && translations[saved as LangCode]) return saved as LangCode
  return 'en'
}

export function setLang(code: LangCode) {
  localStorage.setItem('bharos_lang', code)
  window.dispatchEvent(new Event('langchange'))
}

export function t(key: keyof TranslationKeys): string {
  const lang = getLang()
  return translations[lang]?.[key] || translations.en[key] || key
}

export default translations
