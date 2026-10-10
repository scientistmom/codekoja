// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "directions",
  "label": [
    "Choices",
    "Elágazások"
  ],
  "title": [
    "Look around and choose",
    "Nézz körül, és dönts"
  ],
  "summary": {
    "idea": [
      "Look around relative to where Koja faces. `if` and `elif` choose the first matching branch.",
      "Koja nézési irányához képest nézz körül. Az `if` és az `elif` az első igaz feltétel ágát választja."
    ],
    "vocabulary": [
      "whats",
      "elif",
      "in"
    ]
  },
  "tools": [
    "whats",
    "if",
    "elif",
    "else",
    "in"
  ],
  "practice": {
    "read": "while",
    "write": "medium"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "for step in range(4):",
        "    if whats(\"ahead\") in (\"clear\", \"goal\"):",
        "        forward()",
        "    elif whats(\"left\") == \"clear\":",
        "        left()",
        "    else:",
        "        right()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 1,
          "direction": "up"
        },
        "goal": null,
        "obstacles": [
          [
            2,
            1
          ],
          [
            4,
            0
          ]
        ]
      },
      "focus": {
        "en": {
          "preview": [
            [
              2,
              7,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              2,
              7,
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
        "seen = whats(\"behind\")",
        "right()",
        "if seen == \"wall\":",
        "    forward()",
        "elif whats(\"right\") == \"obstacle\":",
        "    left()",
        "else:",
        "    right()",
        "forward()"
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
        "obstacles": []
      }
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "if whats(\"ahead\") in (\"clear\", \"goal\"):",
        "    forward()",
        "elif whats(\"\") == \"clear\":",
        "    left()",
        "else:",
        "    right()",
        "for step in range(2):",
        "    forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 2,
          "column": 2,
          "direction": "down"
        },
        "goal": {
          "row": 2,
          "column": 4
        },
        "obstacles": [
          [
            3,
            2
          ],
          [
            1,
            2
          ],
          [
            2,
            1
          ]
        ],
        "coins": []
      },
      "solutions": [
        [
          "if whats(\"ahead\") in (\"clear\", \"goal\"):",
          "    forward()",
          "elif whats(\"left\") == \"clear\":",
          "    left()",
          "else:",
          "    right()",
          "for step in range(2):",
          "    forward()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              3,
              3,
              13,
              14
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              3,
              3,
              15,
              16
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          3,
          13,
          13
        ],
        "hu": [
          3,
          15,
          15
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
          "row": 0,
          "column": 4
        },
        "obstacles": [
          [
            1,
            0
          ],
          [
            2,
            3
          ],
          [
            0,
            1
          ]
        ],
        "coins": [
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
      },
      "solutions": [
        [
          "while whats(\"ahead\") != \"goal\":",
          "    if whats(\"ahead\") == \"clear\":",
          "        forward()",
          "    elif whats(\"left\") == \"clear\":",
          "        left()",
          "    else:",
          "        right()",
          "forward()"
        ]
      ],
      "revision": 3,
      "commentTranslations": [
        [
          "# Keep moving until the goal is ahead.",
          "# Haladj addig, amíg a cél nem kerül eléd."
        ],
        [
          "# If blocked, look left and right to choose a turn.",
          "# Ha előtted zárt az út, nézz balra és jobbra."
        ]
      ]
    }
  ]
});
