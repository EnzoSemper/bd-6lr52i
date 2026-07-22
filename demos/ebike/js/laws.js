let cityLawsData = null;
'use strict';

/* =============================================================
   AEGLOS — eBike Laws By State
   Data reviewed March 2026. Informational only.
   classSystem: '3-class' | 'partial' | 'limited'
   license: bool
   registration: bool
   helmet: 'none' | 'under12' | 'under14' | 'under16' | 'under17' | 'under18' | 'class3-all' | 'all'
   bikePath: 'yes' | 'restricted' | 'varies'
   minAge: null | number (for Class 3)
   ============================================================= */

const STATE_LAWS = [
  {
    state: 'Alabama', abbr: 'AL', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'Helmets not required by state law (recommended under 16)',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'eBikes generally permitted on bike paths and lanes',
    notes: 'Alabama adopted the 3-class eBike framework in 2018. All classes are treated as bicycles for road and path purposes. No minimum rider age specified by state law.'
  },
  {
    state: 'Alaska', abbr: 'AK', classSystem: 'limited',
    license: false, licenseNote: 'No formal 3-class law; eBikes ≤750W and ≤20 mph treated as bicycles',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Under 18 must wear a helmet',
    minAge: null, speedCap: '20 mph (on paths)',
    bikePath: 'varies', bikePathNote: 'Municipal rules vary; no statewide eBike path policy',
    notes: 'Alaska has not adopted a formal 3-class eBike law. eBikes meeting federal definitions (≤750W, pedal assist, ≤20 mph) are generally treated as bicycles. Local municipalities may impose additional rules. Verify with city/borough rules where you ride.'
  },
  {
    state: 'Arizona', abbr: 'AZ', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required for riders under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'restricted', bikePathNote: 'Class 3 not allowed on bike paths unless posted or locally permitted',
    notes: 'Arizona adopted 3-class eBike law in 2018. Class 3 eBikes are restricted from bike paths not intended for motor vehicle traffic unless the authority having jurisdiction permits access.'
  },
  {
    state: 'Arkansas', abbr: 'AR', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide helmet requirement for eBike riders',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'eBikes allowed on bike paths',
    notes: 'Arkansas adopted 3-class eBike classification in 2019 (Act 1050). eBikes treated as bicycles. No mandatory helmet law or minimum age at the state level.'
  },
  {
    state: 'California', abbr: 'CA', classSystem: '3-class',
    license: false, licenseNote: 'No license required; must be 16+ to operate Class 3',
    registration: false, registrationNote: '',
    helmet: 'class3-all', helmetNote: 'Class 3: required all ages. Class 1/2: required under 18',
    minAge: 16, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'restricted', bikePathNote: 'Class 3 prohibited from bike paths unless local authority explicitly permits',
    notes: 'California has one of the strictest eBike frameworks. Class 3 requires riders to be 16+, wear a helmet at any age, and is restricted from bike paths by default. Class 1 and 2 follow standard bicycle rules. Local agencies (cities, parks, trail systems) may impose additional restrictions beyond state law.'
  },
  {
    state: 'Colorado', abbr: 'CO', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths; individual trail managers may restrict access',
    notes: 'Colorado was among the first states to adopt 3-class eBike law in 2017. eBikes treated as bicycles. Local land managers and trail authorities retain the right to restrict eBike access on specific trails, particularly singletrack.'
  },
  {
    state: 'Connecticut', abbr: 'CT', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Generally permitted on bike paths and multi-use paths',
    notes: 'Connecticut adopted 3-class eBike classification in 2017. eBikes are treated as bicycles under state law. No minimum age specified at state level.'
  },
  {
    state: 'Delaware', abbr: 'DE', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Delaware adopted 3-class eBike classification. eBikes treated as bicycles. Class 3 eBikes should operate on roads rather than sidewalks. Local rules may vary.'
  },
  {
    state: 'Florida', abbr: 'FL', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16 (state bicycle law)',
    minAge: 16, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'eBikes allowed on bike paths and greenways',
    notes: 'Florida adopted 3-class eBike framework in 2020. Minimum age of 16 to operate any eBike. Generally permissive — eBikes treated similarly to bicycles on roads and paths. No license or registration required for any class.'
  },
  {
    state: 'Georgia', abbr: 'GA', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: 15, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'restricted', bikePathNote: 'Class 3 restricted from bike paths unless locally permitted',
    notes: 'Georgia adopted 3-class eBike law in 2019. Minimum age 15 for Class 3. Class 3 eBikes may not operate on bike paths unless the local authority grants access.'
  },
  {
    state: 'Hawaii', abbr: 'HI', classSystem: 'limited',
    license: false, licenseNote: 'eBikes >750W may require moped or motorcycle registration',
    registration: false, registrationNote: 'Higher-powered eBikes may require registration',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph',
    bikePath: 'varies', bikePathNote: 'County-level rules vary widely; some paths restrict all eBikes',
    notes: 'Hawaii treats eBikes meeting federal definitions (≤750W, pedal assist, ≤20 mph) as bicycles. No formal 3-class law adopted statewide. Higher-powered units may require moped or motorcycle classification. County rules vary significantly — Maui and Oahu have restricted eBikes on certain trails. Check county rules before riding.'
  },
  {
    state: 'Idaho', abbr: 'ID', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (road) · 15 mph (shared paths)',
    bikePath: 'yes', bikePathNote: 'Allowed; 15 mph speed limit applies on multi-use paths',
    notes: 'Idaho adopted 3-class eBike classification. eBikes treated as bicycles. A 15 mph speed limit applies on multi-use paths shared with pedestrians. No minimum age specified.'
  },
  {
    state: 'Illinois', abbr: 'IL', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'restricted', bikePathNote: 'Class 3 prohibited from bike paths by default; local authority may permit',
    notes: 'Illinois adopted 3-class eBike law in 2018. Class 3 eBikes are excluded from bike paths and multi-use trails unless the local authority explicitly grants access. Class 1 and 2 follow standard bicycle rules.'
  },
  {
    state: 'Indiana', abbr: 'IN', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Class 3: required under 18',
    minAge: 15, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Indiana adopted 3-class eBike law in 2019. Minimum age 15 for Class 3 eBikes. Helmet required for Class 3 riders under 18.'
  },
  {
    state: 'Iowa', abbr: 'IA', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Iowa adopted 3-class eBike classification. eBikes treated as bicycles. No minimum age specified at state level.'
  },
  {
    state: 'Kansas', abbr: 'KS', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide helmet requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Kansas adopted 3-class eBike legislation. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'Kentucky', abbr: 'KY', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Kentucky adopted 3-class eBike classification. eBikes treated as bicycles under state law. Local jurisdictions may impose additional requirements.'
  },
  {
    state: 'Louisiana', abbr: 'LA', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide helmet requirement',
    minAge: 12, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Louisiana adopted 3-class eBike law. Minimum age 12 to operate a Class 3 eBike. No mandatory helmet requirement at the state level for any class.'
  },
  {
    state: 'Maine', abbr: 'ME', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Maine adopted 3-class eBike classification. eBikes are treated as bicycles. Local authorities may impose additional path restrictions.'
  },
  {
    state: 'Maryland', abbr: 'MD', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths and trails',
    notes: 'Maryland adopted 3-class eBike legislation in 2019. eBikes treated as bicycles. Local jurisdictions may restrict access on specific trails.'
  },
  {
    state: 'Massachusetts', abbr: 'MA', classSystem: 'partial',
    license: false, licenseNote: 'Class 3 classified as "motorized bicycle" — may require license in some interpretations; verify with RMV',
    registration: false, registrationNote: 'Class 3 may require registration; verify with RMV',
    helmet: 'under16', helmetNote: 'Required under 16 (bicycle law)',
    minAge: null, speedCap: '20 mph (Class 1/2) · 25 mph (Class 3 on road)',
    bikePath: 'restricted', bikePathNote: 'Class 3 not allowed on bike paths',
    notes: 'Massachusetts only recognizes Class 1 and Class 2 as standard bicycles. Class 3 (assist above 25 mph) is classified as a "motorized bicycle" and may be subject to license and registration requirements. Class 3 eBikes are not permitted on bike paths. Verify current requirements with the RMV as interpretations vary.'
  },
  {
    state: 'Michigan', abbr: 'MI', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Class 3: required under 18',
    minAge: 14, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3); Class 3 limited to 20 mph on paths',
    bikePath: 'yes', bikePathNote: 'Allowed; Class 3 must limit speed to 20 mph on shared paths',
    notes: 'Michigan adopted 3-class eBike law in 2018. Minimum age 14 for Class 3. When operating on a trail or linear path, Class 3 eBikes must slow to 20 mph. Helmet required for Class 3 riders under 18.'
  },
  {
    state: 'Minnesota', abbr: 'MN', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Class 3: required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'restricted', bikePathNote: 'Class 3 restricted from bike paths by default; local authority may permit',
    notes: 'Minnesota adopted 3-class eBike classification in 2019. Class 3 eBikes are excluded from bike paths unless the local authority explicitly permits access. Class 1 and 2 are treated as standard bicycles.'
  },
  {
    state: 'Mississippi', abbr: 'MS', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Mississippi adopted 3-class eBike framework. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'Missouri', abbr: 'MO', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Missouri adopted 3-class eBike legislation. eBikes treated as bicycles. Local jurisdictions may impose additional requirements or restrictions.'
  },
  {
    state: 'Montana', abbr: 'MT', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths; trail access may vary',
    notes: 'Montana adopted 3-class eBike classification. eBikes treated as bicycles. Local trail managers may restrict eBike access on specific natural surface trails.'
  },
  {
    state: 'Nebraska', abbr: 'NE', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Nebraska adopted 3-class eBike law. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'Nevada', abbr: 'NV', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Nevada adopted 3-class eBike law in 2019. eBikes treated as bicycles. Local trail authorities may impose additional restrictions, particularly in recreation areas around Las Vegas and Reno.'
  },
  {
    state: 'New Hampshire', abbr: 'NH', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'New Hampshire adopted 3-class eBike classification in 2022. Prior to this, some eBikes could be classified as mopeds. Under the current law, eBikes are treated as bicycles. No minimum age specified.'
  },
  {
    state: 'New Jersey', abbr: 'NJ', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under17', helmetNote: 'Required under 17',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'restricted', bikePathNote: 'Class 3 not allowed on bike paths or multi-use trails',
    notes: 'New Jersey adopted 3-class eBike law in 2019. Class 3 eBikes are prohibited from bike paths and multi-use trails by default — restricted to roadways. Class 1 and 2 follow standard bicycle rules.'
  },
  {
    state: 'New Mexico', abbr: 'NM', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'New Mexico adopted 3-class eBike classification. eBikes treated as bicycles. Local trail access may vary, particularly on trails managed by municipalities or state parks.'
  },
  {
    state: 'New York', abbr: 'NY', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 25 mph (Class 3, NY-specific cap)',
    bikePath: 'varies', bikePathNote: 'Generally allowed; NYC has additional local rules for delivery eBikes',
    notes: 'New York adopted 3-class eBike law in 2020 after years of throttle eBike bans in some cities. NY caps Class 3 at 25 mph (vs. 28 mph in most states). New York City has specific local regulations for delivery workers and throttle eBikes that continue to evolve — verify current NYC DOT rules if riding in the five boroughs.'
  },
  {
    state: 'North Carolina', abbr: 'NC', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'North Carolina adopted 3-class eBike classification. eBikes treated as bicycles. Local jurisdictions may impose additional path restrictions. No minimum age specified.'
  },
  {
    state: 'North Dakota', abbr: 'ND', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'North Dakota adopted 3-class eBike classification. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'Ohio', abbr: 'OH', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Ohio adopted 3-class eBike classification in 2020. eBikes treated as bicycles. Local trail authorities retain the right to restrict eBike access on specific paths.'
  },
  {
    state: 'Oklahoma', abbr: 'OK', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Oklahoma adopted 3-class eBike law. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'Oregon', abbr: 'OR', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths and trails',
    notes: 'Oregon adopted 3-class eBike classification in 2015 — one of the earliest adopters in the nation. eBikes treated as bicycles. No minimum age specified. Local trail managers may restrict access on specific natural surface trails.'
  },
  {
    state: 'Pennsylvania', abbr: 'PA', classSystem: '3-class',
    license: false, licenseNote: 'Updated ~2022; previously throttle eBikes required a moped license',
    registration: false, registrationNote: '',
    helmet: 'under12', helmetNote: 'Required under 12 (bicycle helmet law)',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Pennsylvania updated its eBike law around 2022 to adopt the 3-class bicycle framework. Prior to this, Class 2 throttle eBikes required a moped license and registration. eBikes are now treated as bicycles. The state helmet age applies the standard bicycle law (under 12), which is lower than most states.'
  },
  {
    state: 'Rhode Island', abbr: 'RI', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Rhode Island adopted 3-class eBike classification. eBikes treated as bicycles. No minimum age specified at the state level.'
  },
  {
    state: 'South Carolina', abbr: 'SC', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'South Carolina adopted 3-class eBike classification. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'South Dakota', abbr: 'SD', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'South Dakota adopted 3-class eBike classification. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'Tennessee', abbr: 'TN', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Tennessee adopted 3-class eBike classification. eBikes treated as bicycles. Local jurisdictions may restrict eBike access on specific trails and greenways.'
  },
  {
    state: 'Texas', abbr: 'TX', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement for riders 18+',
    minAge: 15, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths, lanes, and roads',
    notes: 'Texas adopted 3-class eBike law in 2019. Minimum age 15 for Class 3 eBikes. No mandatory helmet law for riders 18 and older. Generally permissive framework — eBikes treated as bicycles across roads, bike lanes, and paths.'
  },
  {
    state: 'Utah', abbr: 'UT', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths; federal land (USFS, BLM) access varies',
    notes: 'Utah adopted 3-class eBike classification in 2018. eBikes treated as bicycles. US Forest Service and BLM lands have their own access rules which may differ — check the specific land unit before riding trails on federal land.'
  },
  {
    state: 'Vermont', abbr: 'VT', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Vermont adopted 3-class eBike classification. eBikes treated as bicycles. Local trail managers may restrict access on specific natural surface trails. No minimum age specified.'
  },
  {
    state: 'Virginia', abbr: 'VA', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under14', helmetNote: 'Required under 14 (per bicycle law)',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on shared-use paths and bike lanes',
    notes: 'Virginia adopted 3-class eBike classification in 2018. eBikes treated as bicycles. The helmet age (under 14) reflects Virginia\'s existing bicycle helmet law. No minimum eBike age specified at state level.'
  },
  {
    state: 'Washington', abbr: 'WA', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'all', helmetNote: 'Required for ALL riders — Washington mandates helmets at any age',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Washington State requires helmets for ALL bicycle and eBike riders regardless of age — one of only a handful of states with this rule. Adopted 3-class eBike framework. eBikes treated as bicycles. Local trail managers may restrict Class 3 access on certain trails.'
  },
  {
    state: 'West Virginia', abbr: 'WV', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under18', helmetNote: 'Required under 18',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'West Virginia adopted 3-class eBike classification. eBikes treated as bicycles. No minimum age specified at state level.'
  },
  {
    state: 'Wisconsin', abbr: 'WI', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Wisconsin adopted 3-class eBike classification in 2018. eBikes treated as bicycles. Local jurisdictions may restrict eBike access on certain trails.'
  },
  {
    state: 'Wyoming', abbr: 'WY', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'none', helmetNote: 'No statewide requirement',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths',
    notes: 'Wyoming adopted 3-class eBike classification. eBikes treated as bicycles. No minimum age or helmet requirement at the state level.'
  },
  {
    state: 'Washington D.C.', abbr: 'DC', classSystem: '3-class',
    license: false, licenseNote: '',
    registration: false, registrationNote: '',
    helmet: 'under16', helmetNote: 'Required under 16',
    minAge: null, speedCap: '20 mph (Class 1/2) · 28 mph (Class 3)',
    bikePath: 'yes', bikePathNote: 'Allowed on bike paths and shared-use trails',
    notes: 'Washington DC adopted 3-class eBike classification. eBikes treated as bicycles. Standard share-the-road rules apply on DC streets and paths. No minimum age specified.'
  }
];

/* =============================================================
   HELPERS
   ============================================================= */

function helmetLabel(h) {
  switch (h) {
    case 'all':        return 'Helmet — All Ages';
    case 'class3-all': return 'Helmet — Class 3 All Ages';
    case 'under18':    return 'Helmet — Under 18';
    case 'under17':    return 'Helmet — Under 17';
    case 'under16':    return 'Helmet — Under 16';
    case 'under14':    return 'Helmet — Under 14';
    case 'under12':    return 'Helmet — Under 12';
    case 'none':       return 'No Helmet Req';
    default:           return h;
  }
}

function helmetClass(h) {
  if (h === 'all')        return 'sb-amber';
  if (h === 'class3-all') return 'sb-amber';
  if (h === 'none')       return 'sb-dim';
  return 'sb-dim'; // under-xx are just informational
}

function classSystemLabel(cs) {
  if (cs === '3-class') return '3-Class System';
  if (cs === 'partial') return 'Partial (Class 1/2 only)';
  if (cs === 'limited') return 'No Formal Class Law';
  return cs;
}

function classSystemClass(cs) {
  if (cs === '3-class') return 'sb-green';
  if (cs === 'partial') return 'sb-amber';
  return 'sb-red';
}

function bikePathLabel(bp) {
  if (bp === 'yes')        return 'Paths ✓';
  if (bp === 'restricted') return 'Class 3 Restricted';
  if (bp === 'varies')     return 'Paths Vary';
  return bp;
}

function bikePathClass(bp) {
  if (bp === 'yes')        return 'sb-green';
  if (bp === 'restricted') return 'sb-amber';
  return 'sb-dim';
}

let selectedState = null;

function renderStateListItem(s) {
  const isActive = selectedState && selectedState.abbr === s.abbr;
  return `
    <div class="state-list-item ${isActive ? 'active' : ''}" data-abbr="${s.abbr}">
      <div class="state-list-abbr">${s.abbr}</div>
      <div class="state-list-name">${s.state}</div>
    </div>
  `;
}

function selectState(abbr) {
  selectedState = STATE_LAWS.find(s => s.abbr === abbr);
  applyFilters(); // Re-renders the list to update active highlight
  renderDashboard();
  if (window.innerWidth <= 900) {
    document.getElementById('lawsDashboard').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
}

let hoveredAbbr = null;


function renderCityDashboard(stateToRender) {
  const wrapper = document.getElementById('lawsCityWrapper');
  const container = document.getElementById('cityDashboard');
  
  if (!wrapper || !container) return;
  
  if (!stateToRender || !cityLawsData || !cityLawsData.states || !cityLawsData.states[stateToRender.abbr]) {
    container.innerHTML = `<div class="dash-empty" style="padding-top:150px">No local ordinances documented for this state.</div>`;
    wrapper.classList.remove('active');
    return;
  }

  const stateCities = cityLawsData.states[stateToRender.abbr].cities;
  if (!stateCities || stateCities.length === 0) {
    container.innerHTML = `<div class="dash-empty" style="padding-top:150px">No local ordinances documented for this state.</div>`;
    wrapper.classList.remove('active');
    return;
  }
  
  let cityHtml = `
    <div class="dash-hero" style="padding:0px 0px 16px 0px; margin-bottom:0px; background:none; border:none;">
      <h2 style="font-size:24px; color:var(--gold);">Local Ordinances</h2>
      <p style="font-size:11px; text-transform:none; color:var(--text-dim); letter-spacing:0;">Local laws supersede state laws. Official sources verified.</p>
    </div>
  `;
  
  stateCities.forEach(city => {
    cityHtml += `<div class="dash-card" style="padding:16px; background: rgba(255,255,255,0.02);">
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items:center;">
        <span style="color:var(--text);">${city.name}</span>
        <a href="${city.source_url}" target="_blank" style="color:var(--gold); font-size: 11px; text-decoration: none; padding:4px 8px; background:rgba(201,168,76,0.1); border-radius:4px;">Source ↗</a>
      </div>
      <div style="font-size: 13px; color:var(--text-dim); margin-bottom: 12px; line-height:1.5;">${city.summary}</div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">`;
    
    if (city.provisions) {
      for (const [key, val] of Object.entries(city.provisions)) {
        if (key === 'speed_limit_notes' || key === 'restrictions') continue;
        let displayVal = val;
        if (val === true) displayVal = 'Yes';
        if (val === false) displayVal = 'No';
        let badgeColor = 'sb-dim';
        if (val === true) badgeColor = 'sb-amber';
        if (val === false) badgeColor = 'sb-green';
        if (key.includes('allowed') && val === false) badgeColor = 'sb-red';
        if (key.includes('required') && val === true) badgeColor = 'sb-red';

        cityHtml += `<span class="sbadge ${badgeColor}">
          ${key.replace(/_/g, ' ')}: ${displayVal}
        </span>`;
      }
    }
    cityHtml += `</div></div>`;
  });
  
  container.innerHTML = cityHtml;
  wrapper.classList.add('active');
}

function renderDashboard(s) {
  const stateToRender = s || selectedState;
  const container = document.getElementById('lawsDashboard');
  
  if (!stateToRender) {
    container.innerHTML = `<div class="dash-empty" style="padding-top:150px">Hover or select a state on the map to view detailed eBike laws.</div>`;
    return;
  }
  
  container.innerHTML = `
    <div class="dash-hero" style="padding:24px; margin-bottom:16px;">
      <h2 style="font-size:32px">${stateToRender.state}</h2>
      <p style="font-size:11px">eBike Classification Profile</p>
    </div>
    
    <div class="dash-grid" style="grid-template-columns: 1fr;">
      <div class="dash-card" style="padding:16px">
        <div class="dash-card-title">Classification</div>
        <div class="dash-card-value" style="color:var(--gold); font-size:16px;">${classSystemLabel(stateToRender.classSystem)}</div>
      </div>
      
      <div class="dash-card" style="padding:16px">
        <div class="dash-card-title">Licensure & Reg</div>
        <div class="dash-card-row">
          <span class="sbadge ${stateToRender.license ? 'sb-red' : 'sb-green'}">${stateToRender.license ? 'License Req' : 'No License'}</span>
          <span class="sbadge ${stateToRender.registration ? 'sb-amber' : 'sb-green'}">${stateToRender.registration ? 'Reg Req' : 'No Reg'}</span>
        </div>
        ${(stateToRender.licenseNote || stateToRender.registrationNote) ? `<div class="dash-card-sub" style="margin-top:8px;">${stateToRender.licenseNote} ${stateToRender.registrationNote}</div>` : ''}
      </div>

      <div class="dash-card" style="padding:16px">
        <div class="dash-card-title">Helmet Laws</div>
        <div class="dash-card-row">
          <span class="sbadge ${helmetClass(stateToRender.helmet)}">${helmetLabel(stateToRender.helmet)}</span>
        </div>
        <div class="dash-card-sub" style="margin-top:8px;">${stateToRender.helmetNote}</div>
      </div>

      <div class="dash-card" style="padding:16px">
        <div class="dash-card-title">Speed & Access</div>
        <div class="dash-card-value" style="font-size: 14px; margin-bottom:6px">${stateToRender.speedCap}</div>
        <span class="sbadge ${bikePathClass(stateToRender.bikePath)}">${bikePathLabel(stateToRender.bikePath)}</span>
        <div class="dash-card-sub" style="margin-top:8px;">${stateToRender.bikePathNote}</div>
      </div>

      <div class="dash-card" style="background: rgba(255,255,255,0.02); padding:16px">
        <div class="dash-card-title">Detailed Legal Notes</div>
        <div class="dash-card-sub" style="line-height:1.6;">${stateToRender.notes}</div>
      </div>
      
      
    </div>
  `;
  renderCityDashboard(stateToRender);
}


/* =============================================================
   FILTER + SEARCH
   ============================================================= */

let activeFilter = 'all';
let searchQuery  = '';

function applyFilters() {
  const q = searchQuery.toLowerCase();

  const visible = STATE_LAWS.filter(s => {
    // Text search
    if (q && !s.state.toLowerCase().includes(q) && !s.abbr.toLowerCase().includes(q)) return false;

    if (q && !s.state.toLowerCase().includes(q) && !s.abbr.toLowerCase().includes(q)) return false;
    return true;
  });

  const list = document.getElementById('stateList');
  if (list) {
    if (visible.length === 0) {
      list.innerHTML = '<div class="dash-empty" style="padding:40px 10px;">No states match</div>';
    } else {
      list.innerHTML = visible.map(renderStateListItem).join('');
    }
  }

  const countElem = document.getElementById('lawsCount');
  if (countElem) { countElem.textContent = `${visible.length} of ${STATE_LAWS.length} states`; }
  
  if (visible.length > 0 && !selectedState) {
    selectedState = visible[0];
    renderDashboard();
  }
}

function setupMap() {
  document.querySelectorAll('.map-state').forEach(path => {
    const abbr = path.id.replace('path-', '').toUpperCase();
    const stateData = STATE_LAWS.find(s => s.abbr === abbr);
    
    if (stateData) {
      if (stateData.license || stateData.helmet === 'all') {
        path.classList.add('strict');
      } else if (stateData.helmet === 'under18' || stateData.bikePath === 'restricted' || stateData.classSystem === 'limited') {
        path.classList.add('moderate');
      } else {
        path.classList.add('lenient');
      }
      
      path.addEventListener('mouseenter', () => { if (!selectedState) renderDashboard(stateData); });
      path.addEventListener('mouseleave', () => { if (!selectedState) renderDashboard(null); });
      path.addEventListener('click', () => { 
        document.querySelectorAll('.map-state').forEach(p => p.classList.remove('active'));
        path.classList.add('active');
        selectState(stateData.abbr);
      });
    }
  });
}

/* =============================================================
   INIT
   ============================================================= */

document.addEventListener('DOMContentLoaded', async () => {

  try {
    const res = await fetch('/data/city-laws.json');
    cityLawsData = await res.json();
  } catch (e) {
    console.error('Could not load city laws:', e);
  }

  setupMap();
  applyFilters();

  // State list selection — delegated (CSP blocks inline onclick handlers)
  const stateListEl = document.getElementById('stateList');
  if (stateListEl) {
    stateListEl.addEventListener('click', e => {
      const item = e.target.closest('.state-list-item');
      if (item && item.dataset.abbr) selectState(item.dataset.abbr);
    });
  }

  // Local Ordinances drawer close button (CSP blocks inline onclick handlers)
  const cityCloseBtn = document.getElementById('cityDrawerCloseBtn');
  if (cityCloseBtn) {
    cityCloseBtn.addEventListener('click', () => {
      document.getElementById('lawsCityWrapper').classList.remove('active');
    });
  }

  // Search Input
  document.getElementById('lawsSearch').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    selectedState = null; // reset selection on search to auto-select top result
    applyFilters();
  });
});
