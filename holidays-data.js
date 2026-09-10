// Bangladesh National Holidays & Observances and Islamic Significant Days

// Gregorian key format: "month-day" (e.g. "2-21" for 21st February)
const bangladeshNationalHolidays = {
    "1-1": { title: "ইংরেজি নববর্ষ", type: "national", holiday: false },
    "2-21": { title: "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস", type: "national", holiday: true },
    "3-17": { title: "জাতীয় শিশু দিবস", type: "national", holiday: true },
    "3-26": { title: "স্বাধীনতা ও জাতীয় দিবস", type: "national", holiday: true },
    "4-14": { title: "পহেলা বৈশাখ (বাংলা নববর্ষ)", type: "national", holiday: true },
    "5-1": { title: "মে দিবস (শ্রমিক দিবস)", type: "national", holiday: true },
    "8-15": { title: "জাতীয় শোক দিবস", type: "national", holiday: true },
    "11-7": { title: "জাতীয় বিপ্লব ও সংহতি দিবস", type: "national", holiday: false },
    "12-14": { title: "শহীদ বুদ্ধিজীবী দিবস", type: "national", holiday: false },
    "12-16": { title: "মহান বিজয় দিবস", type: "national", holiday: true },
    "12-25": { title: "যিশু খ্রিস্টের জন্মদিন (বড়দিন)", type: "religious", holiday: true }
};

// Hijri key format: "month-day" (1-indexed month, 1-indexed day)
const islamicHolidays = {
    "1-1": { title: "পবিত্র হিজরি নববর্ষ", type: "islamic", holiday: false },
    "1-9": { title: "পবিত্র তাসুআ (আশুরার পূর্বের দিন)", type: "islamic", holiday: false },
    "1-10": { title: "পবিত্র আশুরা", type: "islamic", holiday: true },
    "3-12": { title: "পবিত্র ঈদে মিলাদুন্নবী (সা.)", type: "islamic", holiday: true },
    "7-27": { title: "পবিত্র শবে মেরাজ", type: "islamic", holiday: true },
    "8-15": { title: "পবিত্র শবে বরাত", type: "islamic", holiday: true },
    "9-1": { title: "পবিত্র রমজান মাস শুরু", type: "islamic", holiday: false },
    "9-17": { title: "ঐতিহাসিক বদর দিবস", type: "islamic", holiday: false },
    "9-20": { title: "ঐতিহাসিক মক্কা বিজয় দিবস", type: "islamic", holiday: false },
    "9-27": { title: "পবিত্র শবে কদর (লাইলাতুল কদর)", type: "islamic", holiday: true },
    "9-30": { title: "রমজানের সম্ভাব্য শেষ দিন / চাঁদ রাত", type: "islamic", holiday: false },
    "10-1": { title: "পবিত্র ঈদুল ফিতর", type: "islamic", holiday: true },
    "10-2": { title: "ঈদুল ফিতরের ২য় দিন", type: "islamic", holiday: true },
    "10-3": { title: "ঈদুল ফিতরের ৩য় দিন", type: "islamic", holiday: true },
    "12-8": { title: "পবিত্র হজ পালন শুরু", type: "islamic", holiday: false },
    "12-9": { title: "পবিত্র আরাফাত দিবস / হজের মূল দিন", type: "islamic", holiday: false },
    "12-10": { title: "পবিত্র ঈদুল আযহা (কোরবানি ঈদ)", type: "islamic", holiday: true },
    "12-11": { title: "ঈদুল আযহার ২য় দিন", type: "islamic", holiday: true },
    "12-12": { title: "ঈদুল আযহার ৩য় দিন", type: "islamic", holiday: true }
};
