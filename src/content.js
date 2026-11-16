// Fluxline — site facts used by the pages, the prerender step and the tests.
// A proposed product: pricing is illustrative and the LinkedIn page is not yet linked.
const site = {
  name: 'Fluxline',
  slug: 'fluxline',
  tagline: 'Plan production around costly changeovers.',
  about: 'Fluxline helps small manufacturers sequence production orders to cut cleaning, tooling and setup time between jobs. Machine learning estimates changeover durations from production records; an optimisation engine recommends schedules that respect deadlines and machine availability — for planners to approve.',
  url: 'https://fluxline.space',
  email: 'augustina@fluxline.space',
  team: [
    {name: 'Augustina Oyetade', role: 'Founder', initials: 'AO', bio: 'Augustina founded Fluxline after watching small plants lose hours a day to changeovers that a better job order would have avoided — planned on a whiteboard because scheduling software was built for factories ten times their size. Augustina leads product, customers and every pilot.', focus: ['Product', 'Plant pilots', 'Production planning']},
  ],
  stats: [
    {value: '74%', label: 'Share of US manufacturing firms with fewer than 20 employees — plants that usually plan production by hand.', source: 'National Association of Manufacturers, Facts About Manufacturing', url: 'https://nam.org/facts-about-manufacturing/'},
    {value: '239K+', label: 'Manufacturers in the United States, employing 12.6 million people.', source: 'National Association of Manufacturers, Facts About Manufacturing', url: 'https://nam.org/facts-about-manufacturing/'},
    {value: '2.5%', label: 'Shigeo Shingo, creator of SMED, reported that the setups he worked on fell on average to 2.5% of their original time — changeover time is far from fixed.', source: 'Wikipedia, “Single-minute exchange of die”', url: 'https://en.wikipedia.org/wiki/Single-minute_exchange_of_die'},
  ],
  app: {
    title: 'Schedule board',
    subtitle: 'Sequence tomorrow’s jobs on a fictional flexo press, test an urgent order or downtime, and approve the daily schedule.',
  },
};
export default site;
