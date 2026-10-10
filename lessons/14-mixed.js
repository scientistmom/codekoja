// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "mixed",
  "label": [
    "Mix it all",
    "Mindent együtt"
  ],
  "title": [
    "Read, debug, and build in small parts",
    "Olvass, javíts, és építkezz kis részekből"
  ],
  "summary": {
    "idea": [
      "Combine functions, loops and choices to build a route, then find and fix a wrong condition.",
      "Rakj össze útvonalat függvényekből, ciklusokból és feltételekből, és javítsd ki a hibás feltételt."
    ],
    "vocabulary": [
      "def",
      "loops",
      "conditions"
    ]
  },
  "tools": [
    "whats",
    "parameter",
    "call",
    "return",
    "while",
    "if",
    "elif",
    "else",
    "and",
    "or",
    "not",
    "break"
  ],
  "practice": {
    "read": "mixed",
    "write": "mastery"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "def walk_corridor():",
        "    while whats(\"ahead\") == \"clear\":",
        "        forward()",
        "",
        "for section in range(3):",
        "    walk_corridor()",
        "    if whats(\"left\") == \"clear\":",
        "        left()",
        "    else:",
        "        right()",
        "walk_corridor()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 0,
          "direction": "up"
        },
        "goal": null,
        "obstacles": [
          [
            0,
            1
          ],
          [
            1,
            0
          ],
          [
            2,
            3
          ]
        ]
      },
      "focus": {
        "en": {
          "preview": [
            [
              1
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              1
            ]
          ]
        }
      },
      "revision": 3
    },
    {
      "kind": "predict",
      "program": [
        "def main():",
        "    for section in range(2):",
        "        while whats(\"ahead\") == \"clear\":",
        "            forward()",
        "            if whats(\"left\") == \"obstacle\":",
        "                right()",
        "        left()",
        "",
        "main()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 2,
          "direction": "up"
        },
        "goal": null,
        "obstacles": [
          [
            3,
            1
          ],
          [
            2,
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
        "while steps < 4 or whats(\"ahead\") == \"clear\":",
        "    forward()",
        "    steps += 1",
        "right()",
        "for step in range(steps):",
        "    forward()",
        "left()",
        "forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 4,
          "column": 0,
          "direction": "up"
        },
        "goal": {
          "row": 0,
          "column": 3
        },
        "obstacles": [
          [
            0,
            0
          ]
        ],
        "coins": [
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
      "solutions": [
        [
          "steps = 0",
          "while steps < 4 and whats(\"ahead\") == \"clear\":",
          "    forward()",
          "    steps += 1",
          "right()",
          "for step in range(steps):",
          "    forward()",
          "left()",
          "forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              2,
              2,
              17,
              19
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              2,
              2,
              17,
              19
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          2,
          17,
          19
        ],
        "hu": [
          2,
          17,
          19
        ]
      },
      "revision": 3
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
          "column": 0,
          "direction": "up"
        },
        "goal": {
          "row": 0,
          "column": 1
        },
        "obstacles": [
          [
            1,
            0
          ]
        ],
        "coins": [
          [
            2,
            0
          ],
          [
            2,
            4
          ],
          [
            0,
            4
          ]
        ]
      },
      "solutions": [
        [
          "def walk_section():",
          "    while whats(\"ahead\") == \"clear\":",
          "        forward()",
          "",
          "for section in range(3):",
          "    walk_section()",
          "    if whats(\"left\") == \"clear\":",
          "        left()",
          "    else:",
          "        right()",
          "walk_section()",
          "forward()"
        ]
      ],
      "revision": 4,
      "commentTranslations": [
        [
          "# Define walk_section(): stop at a turn or goal.",
          "# Írd meg: walk_section(), a fordulóig vagy célig."
        ],
        [
          "# Reuse it; look around at each of the three turns.",
          "# Használd újra; nézz körül a három fordulásnál."
        ]
      ],
      "legacyCoins": [
        [
          2,
          0
        ],
        [
          2,
          2
        ],
        [
          0,
          2
        ]
      ]
    }
  ]
});
