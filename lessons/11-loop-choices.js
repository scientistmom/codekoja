// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "loop-choices",
  "label": [
    "Loop choices",
    "Döntés ciklusban"
  ],
  "title": [
    "Look again after every move",
    "Minden lépés után nézz körül újra"
  ],
  "summary": {
    "idea": [
      "Check what Koja sees each time through a loop. Use a `True`/`False` variable to decide when to stop.",
      "Minden cikluskörben nézd meg, mit lát Koja. Egy `True`/`False` változóval döntsd el, mikor álljon le."
    ],
    "vocabulary": [
      "if + while",
      "True",
      "False"
    ]
  },
  "tools": [
    "whats",
    "while",
    "if",
    "elif",
    "else",
    "flag"
  ],
  "practice": {
    "read": "while",
    "write": "hard"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "exploring = True",
        "while exploring:",
        "    if whats(\"ahead\") == \"obstacle\":",
        "        right()",
        "    elif whats(\"ahead\") == \"wall\":",
        "        exploring = False",
        "    else:",
        "        forward()",
        "left()"
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
            1,
            1
          ]
        ]
      },
      "focus": {
        "en": {
          "preview": [
            [
              2
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              2
            ]
          ]
        }
      },
      "revision": 4
    },
    {
      "kind": "predict",
      "program": [
        "exploring = True",
        "while exploring:",
        "    if whats(\"ahead\") in (\"wall\", \"obstacle\"):",
        "        exploring = False",
        "    else:",
        "        forward()",
        "right()",
        "forward()"
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
            0,
            1
          ]
        ]
      }
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "seen = whats(\"ahead\")",
        "for step in range(3):",
        "    ",
        "    if seen == \"obstacle\":",
        "        right()",
        "    forward()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 3,
          "column": 1,
          "direction": "up"
        },
        "goal": {
          "row": 2,
          "column": 3
        },
        "obstacles": [
          [
            1,
            1
          ]
        ],
        "coins": [
          [
            2,
            1
          ]
        ]
      },
      "solutions": [
        [
          "seen = whats(\"ahead\")",
          "for step in range(3):",
          "    seen = whats(\"ahead\")",
          "    if seen == \"obstacle\":",
          "        right()",
          "    forward()"
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
          "column": 1,
          "direction": "up"
        },
        "goal": {
          "row": 0,
          "column": 3
        },
        "obstacles": [
          [
            1,
            1
          ],
          [
            2,
            0
          ],
          [
            2,
            4
          ]
        ],
        "coins": [
          [
            2,
            1
          ],
          [
            2,
            3
          ]
        ]
      },
      "solutions": [
        [
          "exploring = True",
          "while exploring:",
          "    if whats(\"ahead\") == \"goal\":",
          "        exploring = False",
          "    elif whats(\"ahead\") == \"clear\":",
          "        forward()",
          "    elif whats(\"left\") == \"clear\":",
          "        left()",
          "    else:",
          "        right()",
          "forward()"
        ]
      ],
      "revision": 4,
      "commentTranslations": [
        [
          "# Set exploring = True; False when the goal is ahead.",
          "# exploring = True; legyen False, ha előtted a cél."
        ],
        [
          "# Loop: move or turn. After the loop, enter the goal.",
          "# Ciklus: lépj vagy fordulj. Utána lépj a célra."
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
