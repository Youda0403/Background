/* Device presets — grouped, in native pixel resolution. */
(function (W) {
  'use strict';

  var PRESETS = [
    {
      group: 'iPhone',
      items: [
        { id: 'ip-se3', label: 'iPhone SE (2/3)', w: 750, h: 1334 },
        { id: 'ip-mini', label: 'iPhone 12/13 mini', w: 1080, h: 2340 },
        { id: 'ip-13', label: 'iPhone 12/13/14', w: 1170, h: 2532 },
        { id: 'ip-15', label: 'iPhone 14 Pro / 15 / 16', w: 1179, h: 2556 },
        { id: 'ip-16pro', label: 'iPhone 16/17 Pro', w: 1206, h: 2622 },
        { id: 'ip-plus', label: 'iPhone Plus / Pro Max', w: 1290, h: 2796 },
        { id: 'ip-16pm', label: 'iPhone 16/17 Pro Max', w: 1320, h: 2868 },
        { id: 'ip-air', label: 'iPhone Air', w: 1260, h: 2736 }
      ]
    },
    {
      group: 'Galaxy',
      items: [
        { id: 'gx-s-fe', label: 'Galaxy S FE / A', w: 1080, h: 2340 },
        { id: 'gx-s24', label: 'Galaxy S24 / S25', w: 1080, h: 2340 },
        { id: 'gx-s24p', label: 'Galaxy S24+ / S25+', w: 1440, h: 3120 },
        { id: 'gx-ultra', label: 'Galaxy S Ultra', w: 1440, h: 3120 },
        { id: 'gx-flip-main', label: 'Z Flip (main)', w: 1080, h: 2640 },
        { id: 'gx-flip-cover', label: 'Z Flip (cover)', w: 720, h: 748 },
        { id: 'gx-fold-cover', label: 'Z Fold (cover)', w: 968, h: 2376 },
        { id: 'gx-fold-main', label: 'Z Fold (main)', w: 1856, h: 2160 }
      ]
    },
    {
      group: 'iPad / Tablet',
      items: [
        { id: 'pad-mini', label: 'iPad mini', w: 1488, h: 2266 },
        { id: 'pad-11', label: 'iPad / Air 11"', w: 1640, h: 2360 },
        { id: 'pad-air13', label: 'iPad Air 13"', w: 2064, h: 2752 },
        { id: 'pad-pro11', label: 'iPad Pro 11"', w: 1668, h: 2388 },
        { id: 'pad-pro13', label: 'iPad Pro 13"', w: 2064, h: 2752 },
        { id: 'pad-pro129', label: 'iPad Pro 12.9"', w: 2048, h: 2732 },
        { id: 'tab-s9', label: 'Galaxy Tab S9', w: 1600, h: 2560 },
        { id: 'tab-s9u', label: 'Galaxy Tab S9 Ultra', w: 1848, h: 2960 }
      ]
    },
    {
      group: 'Desktop / Watch',
      items: [
        { id: 'dt-fhd', label: 'Desktop FHD', w: 1920, h: 1080 },
        { id: 'dt-qhd', label: 'Desktop QHD', w: 2560, h: 1440 },
        { id: 'dt-mbp14', label: 'MacBook Pro 14"', w: 3024, h: 1964 },
        { id: 'dt-mbp16', label: 'MacBook Pro 16"', w: 3456, h: 2234 },
        { id: 'wt-41', label: 'Apple Watch 41/42mm', w: 396, h: 484 },
        { id: 'wt-45', label: 'Apple Watch 45/46mm', w: 416, h: 496 },
        { id: 'wt-ultra', label: 'Apple Watch Ultra', w: 410, h: 502 }
      ]
    },
    {
      group: 'Share',
      items: [
        { id: 'sh-story', label: 'Story / Reels 9:16', w: 1080, h: 1920 },
        { id: 'sh-square', label: 'Square 1:1', w: 1440, h: 1440 },
        { id: 'sh-post', label: 'Post 4:5', w: 1440, h: 1800 },
        { id: 'sh-kakao', label: 'Kakao profile', w: 1080, h: 1440 },
        { id: 'sh-twt', label: 'X header 3:1', w: 1500, h: 500 }
      ]
    }
  ];

  var BY_ID = {};
  PRESETS.forEach(function (g) {
    g.items.forEach(function (it) {
      it.group = g.group;
      BY_ID[it.id] = it;
    });
  });

  /* Lock-screen safe areas, as fractions of canvas height.
     Used both for the optional on-screen guide and for the
     "keep the clock area clear" composition nudge. */
  var SAFE = {
    phone: { clock: [0.05, 0.24], widget: [0.24, 0.32], dock: [0.84, 1.0] },
    tablet: { clock: [0.04, 0.16], widget: [0.16, 0.22], dock: [0.88, 1.0] },
    wide: { clock: [0.0, 0.0], widget: [0.0, 0.0], dock: [0.93, 1.0] }
  };

  W.presets = { groups: PRESETS, byId: BY_ID, safe: SAFE };
})(window.PT = window.PT || {});
