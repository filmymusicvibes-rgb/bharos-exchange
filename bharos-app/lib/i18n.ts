import AsyncStorage from '@react-native-async-storage/async-storage'

export type Language = 'en' | 'te' | 'hi'

const LANGUAGE_KEY = 'bharos_language'

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    'app.name': 'Bharos Exchange',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.done': 'Done',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.skip': 'Skip',
    'common.seeAll': 'See All',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',

    // Tabs
    'tab.wallet': 'Wallet',
    'tab.exchange': 'Exchange',
    'tab.rewards': 'Rewards',
    'tab.staking': 'Staking',
    'tab.account': 'Account',

    // Wallet
    'wallet.greeting': 'Good Morning',
    'wallet.totalBalance': 'Total Balance',
    'wallet.send': 'Send',
    'wallet.receive': 'Receive',
    'wallet.trade': 'Trade',
    'wallet.earn': 'Earn',
    'wallet.marketOverview': 'Market Overview',
    'wallet.transactionHistory': 'Transaction History',

    // Send
    'send.title': 'Send BRS',
    'send.amountToSend': 'Amount to Send',
    'send.walletAddress': 'Wallet Address',
    'send.note': 'Note (Optional)',
    'send.review': 'Review Transaction',
    'send.confirm': 'Confirm & Send',
    'send.success': 'Transaction Sent!',
    'send.networkFee': 'Network Fee',
    'send.estimatedTime': 'Estimated Time',
    'send.recent': 'Recent',

    // Receive
    'receive.title': 'Receive BRS',
    'receive.scanQR': 'Scan QR Code to send BRS',
    'receive.yourAddress': 'Your Wallet Address',
    'receive.copyAddress': 'Copy Address',
    'receive.share': 'Share',
    'receive.saveQR': 'Save QR',
    'receive.important': 'Important',
    'receive.warning': 'Only send BRS to this address.',

    // Withdraw
    'withdraw.title': 'Withdraw',
    'withdraw.selectMethod': 'Select Method',
    'withdraw.amount': 'Amount (BRS)',
    'withdraw.minimum': 'Min',
    'withdraw.review': 'Review Withdrawal',
    'withdraw.confirm': 'Confirm Withdrawal',
    'withdraw.success': 'Withdrawal Initiated!',
    'withdraw.processing': 'Processing',
    'withdraw.fee': 'Fee',
    'withdraw.youReceive': 'You Receive',

    // Exchange
    'exchange.title': 'Exchange',
    'exchange.buy': 'Buy',
    'exchange.sell': 'Sell',
    'exchange.orderBook': 'Order Book',
    'exchange.price': 'Price',
    'exchange.amount': 'Amount',
    'exchange.total': 'Total',

    // Staking
    'staking.title': 'Staking',
    'staking.active': 'Active',
    'staking.options': 'Staking Options',
    'staking.myStakes': 'My Stakes',
    'staking.calculator': 'Calculator',
    'staking.stakeNow': 'Stake Now',

    // Profile
    'profile.title': 'Account',
    'profile.settings': 'Account Settings',
    'profile.security': 'Security',
    'profile.kyc': 'KYC Verification',
    'profile.language': 'Language',
    'profile.biometric': 'Biometric Login',
    'profile.notifications': 'Notifications',
    'profile.logout': 'Logout',
    'profile.version': 'Version',

    // Onboarding
    'onboard.welcome': 'Welcome to Bharos',
    'onboard.wallet.title': 'Your Premium\nCrypto Wallet',
    'onboard.wallet.desc': 'Store, manage, and grow your BRS tokens with a world-class exchange platform.',
    'onboard.trade.title': 'Advanced\nTrading Tools',
    'onboard.trade.desc': 'Professional charts, real-time order book, and instant swaps at your fingertips.',
    'onboard.secure.title': 'Bank-Grade\nSecurity',
    'onboard.secure.desc': 'Multi-layer encryption, real-time monitoring, and your keys — your crypto.',
    'onboard.getStarted': 'Get Started',
  },

  te: {
    // General
    'app.name': 'భారోస్ ఎక్స్ఛేంజ్',
    'common.cancel': 'రద్దు చేయి',
    'common.confirm': 'నిర్ధారించు',
    'common.done': 'పూర్తయింది',
    'common.back': 'వెనుకకు',
    'common.next': 'తర్వాత',
    'common.skip': 'దాటవేయి',
    'common.seeAll': 'అన్నీ చూడు',
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'లోపం',
    'common.success': 'విజయం',

    // Tabs
    'tab.wallet': 'వాలెట్',
    'tab.exchange': 'ఎక్స్ఛేంజ్',
    'tab.rewards': 'రివార్డ్స్',
    'tab.staking': 'స్టేకింగ్',
    'tab.account': 'ఖాతా',

    // Wallet
    'wallet.greeting': 'శుభోదయం',
    'wallet.totalBalance': 'మొత్తం బ్యాలెన్స్',
    'wallet.send': 'పంపు',
    'wallet.receive': 'అందుకో',
    'wallet.trade': 'ట్రేడ్',
    'wallet.earn': 'సంపాదించు',
    'wallet.marketOverview': 'మార్కెట్ వివరాలు',
    'wallet.transactionHistory': 'లావాదేవీల చరిత్ర',

    // Send
    'send.title': 'BRS పంపు',
    'send.amountToSend': 'పంపాల్సిన మొత్తం',
    'send.walletAddress': 'వాలెట్ అడ్రస్',
    'send.note': 'నోట్ (ఐచ్ఛికం)',
    'send.review': 'లావాదేవీ సమీక్ష',
    'send.confirm': 'నిర్ధారించి పంపు',
    'send.success': 'లావాదేవీ పంపబడింది!',
    'send.networkFee': 'నెట్‌వర్క్ ఫీజు',
    'send.estimatedTime': 'అంచనా సమయం',
    'send.recent': 'ఇటీవల',

    // Receive
    'receive.title': 'BRS అందుకో',
    'receive.scanQR': 'BRS పంపడానికి QR కోడ్ స్కాన్ చేయండి',
    'receive.yourAddress': 'మీ వాలెట్ అడ్రస్',
    'receive.copyAddress': 'అడ్రస్ కాపీ',
    'receive.share': 'షేర్',
    'receive.saveQR': 'QR సేవ్',
    'receive.important': 'ముఖ్యమైనది',
    'receive.warning': 'ఈ అడ్రస్‌కు BRS మాత్రమే పంపండి.',

    // Withdraw
    'withdraw.title': 'ఉపసంహరణ',
    'withdraw.selectMethod': 'పద్ధతిని ఎంచుకోండి',
    'withdraw.amount': 'మొత్తం (BRS)',
    'withdraw.minimum': 'కనిష్టం',
    'withdraw.review': 'ఉపసంహరణ సమీక్ష',
    'withdraw.confirm': 'ఉపసంహరణ నిర్ధారించు',
    'withdraw.success': 'ఉపసంహరణ ప్రారంభించబడింది!',
    'withdraw.processing': 'ప్రాసెస్ అవుతోంది',
    'withdraw.fee': 'ఫీజు',
    'withdraw.youReceive': 'మీరు అందుకుంటారు',

    // Exchange
    'exchange.title': 'ఎక్స్ఛేంజ్',
    'exchange.buy': 'కొనుగోలు',
    'exchange.sell': 'అమ్మకం',
    'exchange.orderBook': 'ఆర్డర్ బుక్',
    'exchange.price': 'ధర',
    'exchange.amount': 'మొత్తం',
    'exchange.total': 'టోటల్',

    // Staking
    'staking.title': 'స్టేకింగ్',
    'staking.active': 'సక్రియం',
    'staking.options': 'స్టేకింగ్ ఆప్షన్లు',
    'staking.myStakes': 'నా స్టేక్‌లు',
    'staking.calculator': 'కాల్క్యులేటర్',
    'staking.stakeNow': 'ఇప్పుడు స్టేక్ చేయి',

    // Profile
    'profile.title': 'ఖాతా',
    'profile.settings': 'ఖాతా సెట్టింగ్‌లు',
    'profile.security': 'భద్రత',
    'profile.kyc': 'KYC ధృవీకరణ',
    'profile.language': 'భాష',
    'profile.biometric': 'బయోమెట్రిక్ లాగిన్',
    'profile.notifications': 'నోటిఫికేషన్లు',
    'profile.logout': 'లాగ్అవుట్',
    'profile.version': 'వెర్షన్',

    // Onboarding
    'onboard.welcome': 'భారోస్‌కు స్వాగతం',
    'onboard.wallet.title': 'మీ ప్రీమియం\nక్రిప్టో వాలెట్',
    'onboard.wallet.desc': 'మీ BRS టోకెన్లను ప్రపంచ స్థాయి ఎక్స్ఛేంజ్ ప్లాట్‌ఫారం‌తో నిల్వ చేయండి, నిర్వహించండి మరియు పెంచుకోండి.',
    'onboard.trade.title': 'అధునాతన\nట్రేడింగ్ టూల్స్',
    'onboard.trade.desc': 'ప్రొఫెషనల్ చార్ట్‌లు, రియల్-టైం ఆర్డర్ బుక్ మరియు తక్షణ స్వాప్‌లు మీ చేతివేళ్ల చివరి వద్ద.',
    'onboard.secure.title': 'బ్యాంక్-గ్రేడ్\nభద్రత',
    'onboard.secure.desc': 'మల్టీ-లేయర్ ఎన్‌క్రిప్షన్, రియల్-టైం మానిటరింగ్ మరియు మీ కీలు — మీ క్రిప్టో.',
    'onboard.getStarted': 'ప్రారంభించండి',
  },

  hi: {
    // General
    'app.name': 'भारोस एक्सचेंज',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.done': 'पूर्ण',
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.skip': 'छोड़ें',
    'common.seeAll': 'सभी देखें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',

    // Tabs
    'tab.wallet': 'वॉलेट',
    'tab.exchange': 'एक्सचेंज',
    'tab.rewards': 'रिवॉर्ड्स',
    'tab.staking': 'स्टेकिंग',
    'tab.account': 'खाता',

    // Wallet
    'wallet.greeting': 'सुप्रभात',
    'wallet.totalBalance': 'कुल शेष',
    'wallet.send': 'भेजें',
    'wallet.receive': 'प्राप्त करें',
    'wallet.trade': 'ट्रेड',
    'wallet.earn': 'कमाएं',
    'wallet.marketOverview': 'बाजार अवलोकन',
    'wallet.transactionHistory': 'लेनदेन इतिहास',

    // Send
    'send.title': 'BRS भेजें',
    'send.amountToSend': 'भेजने की राशि',
    'send.walletAddress': 'वॉलेट पता',
    'send.note': 'नोट (वैकल्पिक)',
    'send.review': 'लेनदेन समीक्षा',
    'send.confirm': 'पुष्टि करें और भेजें',
    'send.success': 'लेनदेन भेजा गया!',
    'send.networkFee': 'नेटवर्क शुल्क',
    'send.estimatedTime': 'अनुमानित समय',
    'send.recent': 'हाल ही',

    // Receive
    'receive.title': 'BRS प्राप्त करें',
    'receive.scanQR': 'BRS भेजने के लिए QR कोड स्कैन करें',
    'receive.yourAddress': 'आपका वॉलेट पता',
    'receive.copyAddress': 'पता कॉपी करें',
    'receive.share': 'शेयर',
    'receive.saveQR': 'QR सेव करें',
    'receive.important': 'महत्वपूर्ण',
    'receive.warning': 'इस पते पर केवल BRS भेजें।',

    // Withdraw
    'withdraw.title': 'निकासी',
    'withdraw.selectMethod': 'विधि चुनें',
    'withdraw.amount': 'राशि (BRS)',
    'withdraw.minimum': 'न्यूनतम',
    'withdraw.review': 'निकासी समीक्षा',
    'withdraw.confirm': 'निकासी पुष्टि करें',
    'withdraw.success': 'निकासी शुरू हो गई!',
    'withdraw.processing': 'प्रोसेसिंग',
    'withdraw.fee': 'शुल्क',
    'withdraw.youReceive': 'आपको मिलेगा',

    // Exchange
    'exchange.title': 'एक्सचेंज',
    'exchange.buy': 'खरीदें',
    'exchange.sell': 'बेचें',
    'exchange.orderBook': 'ऑर्डर बुक',
    'exchange.price': 'मूल्य',
    'exchange.amount': 'राशि',
    'exchange.total': 'कुल',

    // Staking
    'staking.title': 'स्टेकिंग',
    'staking.active': 'सक्रिय',
    'staking.options': 'स्टेकिंग विकल्प',
    'staking.myStakes': 'मेरे स्टेक',
    'staking.calculator': 'कैलकुलेटर',
    'staking.stakeNow': 'अभी स्टेक करें',

    // Profile
    'profile.title': 'खाता',
    'profile.settings': 'खाता सेटिंग्स',
    'profile.security': 'सुरक्षा',
    'profile.kyc': 'KYC सत्यापन',
    'profile.language': 'भाषा',
    'profile.biometric': 'बायोमेट्रिक लॉगिन',
    'profile.notifications': 'सूचनाएं',
    'profile.logout': 'लॉगआउट',
    'profile.version': 'संस्करण',

    // Onboarding
    'onboard.welcome': 'भारोस में स्वागत है',
    'onboard.wallet.title': 'आपका प्रीमियम\nक्रिप्टो वॉलेट',
    'onboard.wallet.desc': 'अपने BRS टोकन को विश्व स्तरीय एक्सचेंज प्लेटफॉर्म के साथ स्टोर, प्रबंधित और बढ़ाएं।',
    'onboard.trade.title': 'उन्नत\nट्रेडिंग टूल्स',
    'onboard.trade.desc': 'प्रोफेशनल चार्ट, रियल-टाइम ऑर्डर बुक और इंस्टेंट स्वैप।',
    'onboard.secure.title': 'बैंक-ग्रेड\nसुरक्षा',
    'onboard.secure.desc': 'मल्टी-लेयर एन्क्रिप्शन, रियल-टाइम मॉनिटरिंग और आपकी कीज़ — आपका क्रिप्टो।',
    'onboard.getStarted': 'शुरू करें',
  },
}

// Current language state
let currentLanguage: Language = 'en'

// Get current language
export async function getLanguage(): Promise<Language> {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY)
  if (saved && (saved === 'en' || saved === 'te' || saved === 'hi')) {
    currentLanguage = saved
  }
  return currentLanguage
}

// Set language
export async function setLanguage(lang: Language): Promise<void> {
  currentLanguage = lang
  await AsyncStorage.setItem(LANGUAGE_KEY, lang)
}

// Translation function
export function t(key: string, lang?: Language): string {
  const l = lang || currentLanguage
  return translations[l]?.[key] || translations['en']?.[key] || key
}

// Get all available languages
export const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'te' as Language, name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
]
