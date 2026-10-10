// One complete lesson. Text pairs are [English, Hungarian].
window.PipLessonRegistry.register({
  "schemaVersion": 1,
  "id": "functions",
  "label": [
    "Functions",
    "Függvények"
  ],
  "title": [
    "Create and reuse a command",
    "Készíts saját, újrahasználható parancsot"
  ],
  "summary": {
    "idea": [
      "Define a group of commands with `def`, then call its name whenever you need those commands.",
      "A `def` segítségével nevezz el egy parancscsoportot, majd hívd meg, amikor szükséged van rá."
    ],
    "vocabulary": [
      "def",
      "call",
      "reuse"
    ]
  },
  "tools": [
    "for",
    "def",
    "call"
  ],
  "practice": {
    "read": "while",
    "write": "medium"
  },
  "stages": [
    {
      "kind": "watch",
      "program": [
        "def hop():",
        "    forward()",
        "    right()",
        "",
        "hop()",
        "hop()"
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
        "obstacles": []
      },
      "focus": {
        "en": {
          "preview": [
            [
              5,
              5,
              1,
              null
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              5,
              5,
              1,
              null
            ]
          ]
        }
      }
    },
    {
      "kind": "predict",
      "program": [
        "def hop():",
        "    forward()",
        "    left()",
        "",
        "hop()",
        "right()",
        "hop()"
      ],
      "scenario": {
        "width": 5,
        "height": 5,
        "start": {
          "row": 2,
          "column": 3,
          "direction": "left"
        },
        "goal": null,
        "obstacles": []
      }
    },
    {
      "kind": "complete",
      "editable": true,
      "program": [
        "def climb():",
        "    for n in range(3):",
        "        forward()",
        "",
        "climb()",
        "right()",
        ""
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
          "row": 1,
          "column": 3
        },
        "obstacles": [],
        "coins": [
          [
            1,
            0
          ]
        ]
      },
      "solutions": [
        [
          "def climb():",
          "    for n in range(3):",
          "        forward()",
          "",
          "climb()",
          "right()",
          "climb()"
        ]
      ],
      "focus": {
        "en": {
          "preview": [
            [
              7,
              7,
              1,
              2
            ]
          ]
        },
        "hu": {
          "preview": [
            [
              7,
              7,
              1,
              2
            ]
          ]
        }
      },
      "editSelection": {
        "en": [
          7,
          1,
          1
        ],
        "hu": [
          7,
          1,
          1
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
          "column": 4
        },
        "obstacles": [],
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
          "def stair():",
          "    forward()",
          "    forward()",
          "    right()",
          "    forward()",
          "    forward()",
          "    left()",
          "",
          "stair()",
          "stair()"
        ]
      ],
      "revision": 3,
      "commentTranslations": [
        [
          "# Define stair() for one stair in the coin route.",
          "# A stair() járjon végig egy lépcsőfokot."
        ],
        [
          "# Call it twice for the coins and the star.",
          "# Hívd meg kétszer az érmékért és a csillagért."
        ]
      ]
    }
  ]
});
