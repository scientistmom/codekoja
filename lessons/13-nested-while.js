// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "nested-while",
  "label": [
    "Nested while",
    "while a while-ban"
  ],
  "title": [
    "Two loops, two stopping rules",
    "Két ciklus, két megállási feltétel"
  ],
  "summary": {
    "idea": [
      "Use an outer loop for the sides and an inner loop for the steps. Restart the step count on each side.",
      "A külső ciklus az oldalakat, a belső a lépéseket ismétli. Minden új oldalon kezdd újra a lépések számolását."
    ],
    "vocabulary": [
      "while + while",
      "for + while",
      "counter"
    ]
  },
  "tools": [
    "while",
    "for",
    "variable",
    "update"
  ],
  "practice": {
    "read": "while",
    "write": "hard"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "corridors = 0",
        "while corridors < 2:",
        "    steps = 0",
        "    while steps < 2 and whats(\"ahead\") == \"clear\":",
        "        forward()",
        "        steps += 1",
        "    right()",
        "    corridors += 1"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 1,
          "direction": "up"
        },
        "goal": null,
        "obstacles": [
          [
            2,
            1
          ]
        ]
      },
      "focus": {
        "en": {
          "preview": [
            [
              3
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              3
            ]
          ]
        }
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "for side in range(3):",
        "    steps = 0",
        "    while steps < 2 and whats(\"ahead\") == \"clear\":",
        "        forward()",
        "        steps += 1",
        "    left()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 3,
          "direction": "up"
        },
        "goal": null,
        "obstacles": [
          [
            1,
            3
          ]
        ]
      },
      "revision": 4
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "steps = 0",
        "for side in range(3):",
        "    ",
        "    while steps < 3 and whats(\"ahead\") == \"clear\":",
        "        forward()",
        "        steps += 1",
        "    right()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 4,
          "direction": "left"
        },
        "goal": {
          "row": 2,
          "column": 4
        },
        "obstacles": [
          [
            4,
            1
          ]
        ],
        "coins": [
          [
            4,
            2
          ],
          [
            1,
            2
          ],
          [
            1,
            4
          ]
        ]
      },
      "solutions": [
        [
          "steps = 0",
          "for side in range(3):",
          "    steps = 0",
          "    while steps < 3 and whats(\"ahead\") == \"clear\":",
          "        forward()",
          "        steps += 1",
          "    right()",
          "forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              3,
              3,
              5,
              6
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              3,
              3,
              5,
              6
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          3,
          5,
          5
        ],
        "hu": [
          3,
          5,
          5
        ]
      },
      "revision": 4,
      "legacyCoins": [
        [
          1,
          0
        ],
        [
          1,
          3
        ]
      ]
    },
    {
      "kind": "create",
      "editable": true,
      "program": [],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 1,
          "direction": "up"
        },
        "goal": {
          "row": 2,
          "column": 3
        },
        "obstacles": [
          [
            3,
            4
          ]
        ],
        "coins": [
          [
            0,
            1
          ],
          [
            0,
            4
          ],
          [
            2,
            4
          ]
        ]
      },
      "solutions": [
        [
          "sides = 0",
          "while sides < 3:",
          "    while whats(\"ahead\") == \"clear\":",
          "        forward()",
          "    right()",
          "    sides += 1",
          "forward()"
        ]
      ],
      "revision": 3,
      "commentTranslations": [
        [
          "# Inner while: walk until an edge or obstacle.",
          "# Belső while: haladj a falig vagy akadályig."
        ],
        [
          "# Outer loop: three sides; turn right after each.",
          "# Külső ciklus: három oldal, mindegyik után jobbra."
        ]
      ]
    }
  ]
});
