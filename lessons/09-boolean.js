// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "boolean",
  "label": [
    "and / or",
    "and / or"
  ],
  "title": [
    "Combine tests without guessing",
    "Kapcsolj össze feltételeket"
  ],
  "summary": {
    "idea": [
      "`and` needs both conditions to be true, `or` needs at least one, and `not` reverses true and false.",
      "Az `and` akkor igaz, ha mindkét feltétel igaz; az `or`-hoz egy is elég, a `not` pedig megfordítja a választ."
    ],
    "vocabulary": [
      "and",
      "or",
      "not"
    ]
  },
  "tools": [
    "whats",
    "if",
    "and",
    "or",
    "not",
    "while"
  ],
  "practice": {
    "read": "while",
    "write": "hard"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "steps = 0",
        "while steps < 3 and whats(\"ahead\") == \"clear\":",
        "    forward()",
        "    steps += 1",
        "if whats(\"ahead\") == \"wall\" or whats(\"ahead\") == \"obstacle\":",
        "    right()",
        "if not (whats(\"ahead\") == \"obstacle\"):",
        "    forward()"
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
            1,
            1
          ]
        ]
      },
      "focus": {
        "en": {
          "preview": [
            [
              2,
              2,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              2,
              2,
              1,
              null
            ]
          ]
        }
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "steps = 0",
        "while steps < 1 or whats(\"ahead\") == \"clear\":",
        "    forward()",
        "    steps += 1",
        "left()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 2,
          "column": 3,
          "direction": "up"
        },
        "goal": null,
        "obstacles": []
      }
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "for step in range(4):",
        "    if whats(\"ahead\") == \"wall\"     whats(\"left\") == \"wall\":",
        "        right()",
        "    forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 0,
          "column": 2,
          "direction": "right"
        },
        "goal": {
          "row": 2,
          "column": 4
        },
        "obstacles": [],
        "coins": []
      },
      "solutions": [
        [
          "for step in range(4):",
          "    if whats(\"ahead\") == \"wall\" and whats(\"left\") == \"wall\":",
          "        right()",
          "    forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              2,
              2,
              33,
              36
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              2,
              2,
              34,
              37
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          2,
          33,
          36
        ],
        "hu": [
          2,
          34,
          37
        ]
      },
      "revision": 4
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
          "row": 4,
          "column": 2
        },
        "obstacles": [
          [
            1,
            3
          ]
        ],
        "coins": [
          [
            1,
            0
          ],
          [
            1,
            2
          ]
        ]
      },
      "solutions": [
        [
          "def side():",
          "    steps = 0",
          "    while steps < 3 and whats(\"ahead\") in (\"clear\", \"goal\"):",
          "        forward()",
          "        steps += 1",
          "    right()",
          "",
          "side()",
          "side()",
          "side()"
        ]
      ],
      "revision": 4,
      "commentTranslations": [
        [
          "# Each side: at most 3 steps; stop if blocked.",
          "# Egy oldal legfeljebb 3 lépés. Akadálynál is állj meg."
        ],
        [
          "# Turn right between the three coin-route sides.",
          "# A három oldal között fordulj jobbra az érmékhez."
        ]
      ]
    }
  ]
});
